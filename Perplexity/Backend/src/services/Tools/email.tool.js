import { tool } from "@langchain/core/tools";
import { sendEmail } from "../mail.service.js";
import * as z from "zod";

// LangChain email tool jo AI ko email bhejne ki capability deta hai
export const emailTool = tool(
    async ({ to, subject, html }) => {
      // mail.service.js ka use karke email bhej rahe hain
      const result = await sendEmail({ to, subject, html });
      if (result.error) {
        return `Failed to send email: ${result.message}`;
      }
      return `Email successfully sent to ${to}.`;
    },
    {
      name: "emailTool",
      description: "Send an email on behalf of the user.",
      schema: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Subject of the email"),
        html: z.string().describe("HTML content")
      })
    }
  );
