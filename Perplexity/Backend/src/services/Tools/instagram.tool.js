import { tool } from "@langchain/core/tools";
import { postImageToInstagram } from "../instagram.service.js";
import messageModel from "../../models/message.model.js";
import * as z from "zod";

/**
 * Instagram Posting Tool
 */
export const postToInstagramTool = (userContext) => tool(
    async ({ imageUrl, caption }) => {
      try {
        let finalImageUrl = imageUrl;

        // 1. URL AUTO-HEALING: Agar Gemini ne URL nahi diya, toh chat history se uthao
        if (!finalImageUrl) {
          console.log("🔍 Tool: No imageUrl provided by AI. Searching in chat history...");
          // User messages mein se sabse latest ik.imagekit.io URL dhoondo
          const lastMsgWithImage = await messageModel.findOne({ 
            "file.url": { $regex: "ik.imagekit.io" } 
          }).sort({ createdAt: -1 });

          if (lastMsgWithImage?.file?.url) {
            finalImageUrl = lastMsgWithImage.file.url;
            console.log("✅ Tool: Found image in DB:", finalImageUrl);
          }
        }

        // 2. Final URL Validation
        if (!finalImageUrl || !finalImageUrl.includes("ik.imagekit.io")) {
          return "ERROR: No valid ImageKit URL found. Please provide an image first.";
        }
  
        // 3. User Authentication
        const ig = userContext?.instagram;
        if (!ig?.accessToken || !ig?.userId) {
          return "ERROR: Instagram account not connected. Please connect in settings.";
        }
  
        // 4. Rate Limiting (25/day)
        const userIdKey = userContext._id?.toString() || "system";
        global.ig_usage = global.ig_usage || {};
        const userUsage = global.ig_usage[userIdKey] || { count: 0, lastReset: Date.now() };
  
        if (Date.now() - userUsage.lastReset > 24 * 60 * 60 * 1000) {
          userUsage.count = 0;
          userUsage.lastReset = Date.now();
        }
  
        if (userUsage.count >= 25) {
           return "WARNING: Daily Instagram limit (25) reached.";
        }
  
        // 5. Caption Polish
        let finalCaption = caption || "Posted via AI Assistant";
        if (!finalCaption.includes("#")) {
          finalCaption += "\n\n#AI #Automation #SmartPost #Perplexity";
        }
  
        console.log("📸 Posting media to user's Instagram...");
        const mediaId = await postImageToInstagram(finalImageUrl, finalCaption, {
            accessToken: ig.accessToken,
            userId: ig.userId
        });
  
        // 6. DB Tracking
        try {
          const msgWithFile = await messageModel.findOne({ "file.url": finalImageUrl });
          if (msgWithFile) {
            msgWithFile.socialPosts.push({ platform: 'instagram', mediaId });
            await msgWithFile.save();
          }
        } catch (e) {}
  
        userUsage.count += 1;
        global.ig_usage[userIdKey] = userUsage;
        return `SUCCESS: Posted successfully! media_id: ${mediaId}`;

      } catch (error) {
        console.error("❌ Instagram Tool Error:", error.message);
        return `FAILED: ${error.message}`;
      }
    },
    {
      name: "post_to_instagram",
      description: "Posts an image to Instagram. IMPORTANT: You MUST provide the imageUrl from the chat history (it must be an ik.imagekit.io URL).",
      schema: z.object({
        imageUrl: z.string().optional().describe("The full URL of the image to post (must be from ik.imagekit.io)"),
        caption: z.string().optional().describe("A short caption with hashtags")
      })
    }
  );
