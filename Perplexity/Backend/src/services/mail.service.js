import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: (process.env.GOOGLE_USER || "").trim(),
        pass: (process.env.GOOGLE_APP_PASSWORD || "").trim()
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000,
    pool: true 
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
        // Error object return kar rahe hain taaki server 500 na ho
        return { error: true, message: error.message };
    }
}