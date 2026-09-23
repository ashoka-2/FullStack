import axios from "axios";
import SocialConnection from "../models/social.model.js";

/**
 * Send an email using the user's personal Gmail account via Google Gmail API
 * Requires https://www.googleapis.com/auth/gmail.send scope on Google OAuth
 */
export async function sendUserGmail({ userId, to, subject, html, text }) {
    if (!userId) {
        return {
            error: true,
            needsAuth: true,
            message: "User ID is required to identify the sender's Gmail connection."
        };
    }

    // 1. Fetch user's Google or YouTube connection (contains Google OAuth tokens)
    const connection = await SocialConnection.findOne({
        user: userId,
        platform: { $in: ["google", "gmail", "youtube"] },
        isConnected: true
    }).select("+accessToken +refreshToken");

    if (!connection || !connection.accessToken) {
        return {
            error: true,
            needsAuth: true,
            message: "Your personal Gmail account is not connected. Please connect your Google account with Gmail permissions in Social Hub (/social-connections) so I can send emails directly from your personal address."
        };
    }

    let accessToken = connection.accessToken.trim();

    // 2. Check if token needs refresh
    if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) <= new Date()) {
        if (connection.refreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            try {
                const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    refresh_token: connection.refreshToken,
                    grant_type: "refresh_token"
                });

                if (refreshRes.data?.access_token) {
                    accessToken = refreshRes.data.access_token;
                    connection.accessToken = accessToken;
                    if (refreshRes.data.expires_in) {
                        connection.tokenExpiresAt = new Date(Date.now() + refreshRes.data.expires_in * 1000);
                    }
                    await connection.save();
                }
            } catch (refreshErr) {
                console.warn("[Gmail Service] Token refresh failed:", refreshErr.message);
            }
        }
    }

    // 3. Construct RFC 2822 compliant MIME message
    try {
        const bodyContent = html || text || "(No content)";
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject || "Message from Parsu AI").toString('base64')}?=`;
        
        const messageParts = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            bodyContent
        ];

        const rawMessage = messageParts.join('\r\n');
        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 4. Dispatch through Google's Gmail API
        const gmailRes = await axios.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            { raw: encodedMessage },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return {
            success: true,
            messageId: gmailRes.data.id,
            threadId: gmailRes.data.threadId,
            sender: connection.platformUsername || "Your Connected Google Account"
        };
    } catch (apiErr) {
        const status = apiErr.response?.status;
        const errDetails = apiErr.response?.data?.error?.message || apiErr.message;

        if (status === 403 || status === 401 || errDetails.includes("insufficientPermissions") || errDetails.includes("Invalid Credentials")) {
            return {
                error: true,
                needsAuth: true,
                message: `Gmail API permission missing. Please ensure 'https://www.googleapis.com/auth/gmail.send' scope is enabled in your Google Cloud Console and re-connect your Google account in Social Hub.`
            };
        }

        return {
            error: true,
            message: `Failed to send email via Gmail API: ${errDetails}`
        };
    }
}
