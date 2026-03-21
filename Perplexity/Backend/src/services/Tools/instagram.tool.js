import { tool } from "@langchain/core/tools";
import { postImageToInstagram } from "../instagram.service.js";
import messageModel from "../../models/message.model.js";
import * as z from "zod";

/**
 * Instagram Posting Tool
 */
// LangChain Instagram tool jo AI ko posts karne ki power deta hai
export const postToInstagramTool = (userContext) => tool(
    async ({ imageUrl, caption, aiCaptionRequested }) => {
      try {
        // 1. Validation - check kar rahe hain image ImageKit pe hai ya nahi
        if (!imageUrl || !imageUrl.includes("ik.imagekit.io")) {
          return "ERROR: media must be first uploaded to our CDN (imagekit.io).";
        }
  
        // 2. User Authentication Check - kya user ne account connect kiya hai?
        const ig = userContext?.instagram;
        const hasCredentials = ig?.accessToken && ig?.userId;
        if (!hasCredentials && !ig?.isConnected) {
          return "ERROR: You haven't connected your Instagram account yet. Please connect your account in settings.";
        }
  
        // 3. Quota Check - ek din mein sirf 25 posts allowed hain (Instagram limits)
        const userIdKey = userContext._id?.toString() || "system";
        global.ig_usage = global.ig_usage || {};
        const userUsage = global.ig_usage[userIdKey] || { count: 0, lastReset: Date.now() };
  
        // 24 ghante baad limit reset kar rahe hain
        if (Date.now() - userUsage.lastReset > 24 * 60 * 60 * 1000) {
          userUsage.count = 0;
          userUsage.lastReset = Date.now();
        }
  
        const MAX_POSTS_24H = 25;
        if (userUsage.count >= MAX_POSTS_24H) {
           return `WARNING: Instagram API limit reached (25/day) for your account.`;
        }
  
        // 4. Caption Optimization - hashtags auto-add kar rahe hain agar missing ho
        let finalCaption = caption || "";
        if (!finalCaption.includes("#")) {
          const hashtags = ["#AI", "#Perplexity", "#SheryiansCodingSchool", "#Automation", "#SmartAi"];
          finalCaption += "\n\n" + hashtags.slice(0, 5).join(" ");
        }
  
        console.log("📸 Posting media to user's Instagram...");
        const mediaId = await postImageToInstagram(imageUrl, finalCaption, {
            accessToken: ig.accessToken,
            userId: ig.userId
        });
  
        // Database mein post record save kar rahe hain chat message tracking ke liye
        try {
          const msgWithFile = await messageModel.findOne({ "file.url": imageUrl });
          if (msgWithFile) {
            msgWithFile.socialPosts.push({ platform: 'instagram', mediaId });
            await msgWithFile.save();
          }
        } catch (cleanupErr) {
          console.error("Cleanup failed:", cleanupErr.message);
        }
  
        // Quota update kar rahe hain
        userUsage.count += 1;
        global.ig_usage[userIdKey] = userUsage;
        return `SUCCESS: Media successfully posted to your Instagram. media_id: ${mediaId}. Image preserved in chat.`;
      } catch (error) {
        return `FAILED: ${error.message}`;
      }
    },
    {
      name: "post_to_instagram",
      description: "Post to the user's connected Instagram account.",
      schema: z.object({
        imageUrl: z.string(),
        caption: z.string().optional(),
        aiCaptionRequested: z.boolean().optional()
      })
    }
  );
