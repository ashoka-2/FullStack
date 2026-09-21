import { google } from 'googleapis';


const OAuth2 = google.auth.OAuth2;

// Initialize Gmail API client with OAuth2 credentials
const createGmailClient = () => {
    const oauth2Client = new OAuth2(
        (process.env.GOOGLE_CLIENT_ID || "").trim(),
        (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        "https://developers.google.com/oauthplayground"
    );

    // Set refresh token for persistent authentication without repeated login prompts
    oauth2Client.setCredentials({
        refresh_token: (process.env.GOOGLE_REFRESH_TOKEN || "").trim()
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Build email body in URL-safe base64 format for the Gmail API
const makeBody = (to, from, subject, message) => {
    const str = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        message
    ].join('\n');

    // Gmail API requires base64url-encoded data
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export async function sendEmail({ to, subject, html, text = "" }) {
    try {
        console.log(`⏳ Attempting to send email to: ${to}`);
        
        const gmail = createGmailClient();
        const rawMessage = makeBody(to, process.env.GOOGLE_USER, subject, html || text);

        // Send message using the Gmail API
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage
            }
        });

        console.log("✅ Email sent successfully via Gmail API! ID:", res.data.id);
        return { success: true, message: "Email sent" };
    } catch (error) {
        // Handle expired refresh token or insufficient permissions
        console.error("❌ Gmail HTTP API Error:", error.message);
        return { error: true, message: error.message };
    }
}