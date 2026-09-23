import { tool } from "@langchain/core/tools";
import { sendUserGmail } from "../gmail.service.js";
import { sendEmail } from "../mail.service.js";
import * as z from "zod";

/**
 * Creates an email tool bound to the requesting user's identity
 * Prioritizes sending directly from the user's personal Gmail account
 */
export function createEmailTool(userContext) {
  const userId = userContext?.userId;

  return tool(
    async ({ to, subject, html }) => {
      // 1. If we have a user context, send via their personal Gmail API connection
      if (userId) {
        const gmailResult = await sendUserGmail({ userId, to, subject, html });

        if (gmailResult.success) {
          return `✅ Email successfully sent to ${to} from your personal Gmail (${gmailResult.sender})! Message ID: ${gmailResult.messageId}`;
        }

        // If user has not connected Gmail or lacks permission, inform them clearly
        if (gmailResult.needsAuth) {
          return `⚠️ ${gmailResult.message}`;
        }
      }

      // 2. Fallback: if no user Google connection is available but system email is configured
      if (!userId) {
        return `⚠️ Please log in and connect your Google/Gmail account in Social Hub (/social-connections) so I can send emails on your behalf.`;
      }

      const fallbackResult = await sendEmail({ to, subject, html });
      if (fallbackResult.error) {
        return `Failed to send email: ${fallbackResult.message}. Please connect your personal Gmail account in Social Hub.`;
      }
      return `Email sent to ${to}. (Note: Connect your personal Gmail account in Social Hub to send from your own address)`;
    },
    {
      name: "emailTool",
      description: "Send an email to any recipient directly from the user's personal connected Gmail account.",
      schema: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Subject of the email"),
        html: z.string().describe("HTML or text body of the email")
      })
    }
  );
}

// Default export for backward compatibility
export const emailTool = createEmailTool({});
