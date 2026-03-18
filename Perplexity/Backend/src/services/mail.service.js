import nodemailer from "nodemailer";

console.log("👉 Mail service file start ho gayi hai...");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,         
    auth: {
        type: 'OAuth2',
        user: (process.env.GOOGLE_USER || "").trim(),
        clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
        clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        refreshToken: (process.env.GOOGLE_REFRESH_TOKEN || "").trim()
    },
    family: 4, 
    connectionTimeout: 10000
});

console.log("👉 Transporter ban gaya, ab verify kar rahe hain...");

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email Transporter Failed:", error);
    } else {
        console.log("✅ Email service is online and ready (OAuth2 + IPv4)");
    }
});

export async function sendEmail({ to, subject, html, text = "" }) {
    try {
        const mailOptions = {
            from: process.env.GOOGLE_USER,
            to,
            subject,
            html,
            text
        };
        const details = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully to :", details.accepted);
        return { success: true, message: "Email sent" };
    } catch (error) {
        console.error("❌ Detailed Email Error:", error);
        return { error: true, message: error.message };
    }
}