import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text = "" }) {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not defined in environment variables.");
        }

        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev', // Replace with your verified domain in production (e.g., 'Your Name <hello@yourdomain.com>')
            to,
            subject,
            html,
            text
        });

        if (error) {
            console.error("❌ Resend Email Error:", error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Email sent successfully to ${to}. ID: ${data?.id}`);
        return { success: true, message: "Email sent successfully", data };
    } catch (error) {
        console.error("❌ Unexpected Email Service Error:", error.message);
        return { success: false, error: error.message };
    }
}