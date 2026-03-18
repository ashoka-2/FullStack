import { google } from 'googleapis';

console.log("👉 Mail service (HTTP API Version) start ho gayi hai...");

const OAuth2 = google.auth.OAuth2;

// Ye function har email bhejne par fresh connection banayega
const createGmailClient = () => {
    const oauth2Client = new OAuth2(
        (process.env.GOOGLE_CLIENT_ID || "").trim(),
        (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: (process.env.GOOGLE_REFRESH_TOKEN || "").trim()
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Gmail API ko email ka data base64url format mein chahiye hota hai
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

    // Convert to base64url format
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export async function sendEmail({ to, subject, html, text = "" }) {
    try {
        console.log(`⏳ Bhejne ki koshish kar rahe hain: ${to}`);
        
        const gmail = createGmailClient();
        const rawMessage = makeBody(to, process.env.GOOGLE_USER, subject, html || text);

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage
            }
        });

        console.log("✅ BOOM! Email sent successfully via Gmail HTTP API! ID:", res.data.id);
        return { success: true, message: "Email sent" };
    } catch (error) {
        console.error("❌ Gmail HTTP API Error:", error.message);
        return { error: true, message: error.message };
    }
}