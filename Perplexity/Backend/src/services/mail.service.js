import nodemailer from "nodemailer";

// Using App Password for better stability on hosted platforms like Render
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_APP_PASSWORD // 16-digit App Password
    },
    tls: {
        rejectUnauthorized: false // Connectivity issues fix karne ke liye
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email Transporter Failed (Check Render Logs):", error);
    } else {
        console.log("✅ Email service is online and ready");
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
        console.log("Email sent :", details);
        return "emails sent successfully to " + to;
    } catch (error) {
        console.error("Detailed Email Error:", error);
        // Return a localized error instead of throwing to prevent 500 crash
        return { error: true, message: error.message };
    }
}