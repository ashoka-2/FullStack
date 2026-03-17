import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email transporter failed to verify:", error.message);
    } else {
        console.log("✅ Email transporter is ready to send messages");
    }
});

export async function sendEmail({ to, subject, html, text = "" }) {
    const mailOptions = {
        from: process.env.GOOGLE_USER,
        to,
        subject,
        html,
        text
    }
    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent :", details);
    return "emails sent successfully to " + to;

}