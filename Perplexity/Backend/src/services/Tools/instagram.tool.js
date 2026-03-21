import { tool } from "@langchain/core/tools";
import { postImageToInstagram } from "../instagram.service.js";
import messageModel from "../../models/message.model.js";
import * as z from "zod";

/**
 * Snap2Bill Instagram Posting Tool
 */
export const postToInstagramTool = (userContext) => tool(
  async ({ imageUrl, caption }) => {
    try {
      let finalImageUrl = imageUrl;

      // 1. URL AUTO-HEALING & ANTI-HALLUCINATION
      // AI sometimes hallucinates fake 'ik.imagekit.io/ai_images/...' URLs. 
      // We ALWAYS fetch the latest verified image from the database to be 100% sure.
      console.log("🔍 [IG-Tool] Verifying image URL logic...");
      const lastMsgWithImage = await messageModel.findOne({
        "file.url": { $regex: "ik.imagekit.io" }
      }).sort({ createdAt: -1 });

      if (lastMsgWithImage && lastMsgWithImage.file && lastMsgWithImage.file.url) {
        finalImageUrl = lastMsgWithImage.file.url;
        console.log("🛡️ [IG-Tool] Anti-Hallucination Active: Enforced REAL DB Image ->", finalImageUrl);
      }

      // 2. Final URL Validation
      // instagram.tool.js ke andar (line 30 ke aas paas)
      // instagram.tool.js ke andar transformation logic fix:

      // instagram.tool.js ke andar transformation fix:

      if (finalImageUrl.includes("ik.imagekit.io")) {
        if (!finalImageUrl.includes("/tr:")) {
          const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;

          const filePath = finalImageUrl.replace(endpoint, "");

          const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

          finalImageUrl = `${endpoint}/tr:w-1080,f-jpg${cleanPath}`;
        }
      }

      if (finalImageUrl.startsWith("http://")) {
        finalImageUrl = finalImageUrl.replace("http://", "https://");
      } else if (!finalImageUrl.startsWith("https://")) {
        finalImageUrl = "https://" + finalImageUrl;
      }

      // 3. User Authentication (Fully Dynamic)
      const ig = userContext?.instagram;

      if (!ig?.accessToken || !ig?.userId) {
        return "ERROR: Instagram account not connected. Please ask the user to connect in settings.";
      }

      // 4. Rate Limiting Check (Max 25/day per FB rules)
      const userIdKey = userContext._id?.toString() || "system";
      global.ig_usage = global.ig_usage || {};
      const userUsage = global.ig_usage[userIdKey] || { count: 0, lastReset: Date.now() };

      if (Date.now() - userUsage.lastReset > 24 * 60 * 60 * 1000) {
        userUsage.count = 0;
        userUsage.lastReset = Date.now();
      }

      if (userUsage.count >= 25) {
        return "WARNING: Instagram API limit reached (25/day) for this account.";
      }

      // 5. Finalize the Viral Caption from the AI
      let finalCaption = caption || "Posted via Snap2Bill AI";
      if (!finalCaption.includes("#")) {
        finalCaption += "\n\n#Snap2Bill #AIAutomation #SmartAgent";
      }

      // 6. Execute Two-Step API Publication (via instagram.service.js)
      console.log("📸 Posting media to user's Instagram...");
      const mediaId = await postImageToInstagram(finalImageUrl, finalCaption, {
        accessToken: ig.accessToken,
        userId: ig.userId
      });

      // 7. Success! Save to DB History.
      try {
        const msgWithFile = await messageModel.findOne({ "file.url": finalImageUrl });
        if (msgWithFile) {
          msgWithFile.socialPosts.push({ platform: 'instagram', mediaId });
          await msgWithFile.save();
        }
      } catch (e) { } // Silent fail on DB logging

      userUsage.count += 1;
      global.ig_usage[userIdKey] = userUsage;

      return `SUCCESS: Posted successfully to Instagram! The media_id is: ${mediaId}. Let the user know the viral post is live!`;

    } catch (error) {
      console.error("❌ Instagram Tool Error:", error.message);
      return `FAILED: ${error.message}`;
    }
  },
  {
    name: "post_to_instagram",
    description: "Posts an image to Instagram. IMPORTANT: You MUST provide the imageUrl from the chat history (it must be an ik.imagekit.io URL). Prioritize generating a highly viral caption before invoking this tool.",
    schema: z.object({
      imageUrl: z.string().optional().describe("The full URL of the image to post (must be from ik.imagekit.io)"),
      caption: z.string().optional().describe("A highly engaging, viral text caption containing 3 to 5 trending hashtags.")
    })
  }
);
