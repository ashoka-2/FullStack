import { tool } from "@langchain/core/tools";
import { publishToSocialPlatforms } from "../socialPublisher.service.js";
import messageModel from "../../models/message.model.js";
import SocialConnection from "../../models/social.model.js";
import * as z from "zod";

export const postToSocialMediaTool = (userContext) => tool(
  async ({ platforms, mediaUrls, postMode = "together", caption }) => {
    try {
      const userId = userContext?._id?.toString() || userContext?.id;
      if (!userId) {
        return "ERROR: User context missing. Cannot identify the user.";
      }

      // Resolve platforms (can be string or array)
      let targetPlatforms = [];
      if (typeof platforms === "string") {
        targetPlatforms = platforms.toLowerCase().split(/[\s,]+/).filter(Boolean);
      } else if (Array.isArray(platforms)) {
        targetPlatforms = platforms.map(p => p.toLowerCase());
      } else {
        targetPlatforms = ["instagram"];
      }

      // Anti-hallucination & multi-image extraction:
      // Fetch latest messages from DB to get the real uploaded images/videos
      let resolvedMediaItems = [];

      if (mediaUrls && mediaUrls.length > 0) {
        resolvedMediaItems = mediaUrls.map(url => ({ url }));
      } else {
        const lastMsg = await messageModel.findOne({
          $or: [
            { "file.url": { $regex: "ik.imagekit.io" } },
            { "files.url": { $regex: "ik.imagekit.io" } }
          ]
        }).sort({ createdAt: -1 });

        if (lastMsg) {
          if (lastMsg.files && lastMsg.files.length > 0) {
            resolvedMediaItems = lastMsg.files.filter(f => f.url).map(f => ({
              url: f.url,
              name: f.name,
              fileType: f.fileType,
              mimetype: f.mimetype
            }));
          } else if (lastMsg.file?.url) {
            resolvedMediaItems = [{
              url: lastMsg.file.url,
              name: lastMsg.file.name,
              fileType: lastMsg.file.fileType,
              mimetype: lastMsg.file.mimetype
            }];
          }
        }
      }

      console.log(`🚀 [Social-Tool] Invoked for platforms: [${targetPlatforms.join(", ")}], Mode: ${postMode}, Media Count: ${resolvedMediaItems.length}`);

      // Finalize caption with relevant tags if missing
      let finalCaption = caption || "Posted via Parsu AI 🚀";
      if (!finalCaption.includes("#")) {
        const platformTags = targetPlatforms.includes("instagram") ? "#Reels #Trending #Viral" 
          : targetPlatforms.includes("twitter") ? "#AI #Trending" 
          : "#SocialMedia #Update";
        finalCaption += `\n\n${platformTags} #Parsu`;
      }

      // Execute Universal Publishing Orchestrator
      const results = await publishToSocialPlatforms({
        platforms: targetPlatforms,
        mediaItems: resolvedMediaItems,
        caption: finalCaption,
        postMode: postMode || "together",
        userId,
        messageId: null
      });

      // Build structured, clear response for the user
      const outputLines = [];

      if (results.successful?.length > 0) {
        results.successful.forEach(s => {
          outputLines.push(`✅ SUCCESS: The content was successfully posted to **${s.platform.toUpperCase()}**! (ID: \`${s.mediaId}\` - Mode: ${s.postType})`);
        });
      }

      if (results.notConnected?.length > 0) {
        results.notConnected.forEach(nc => {
          outputLines.push(`⚠️ NOT CONNECTED: ${nc.message}`);
        });
      }

      if (results.failed?.length > 0) {
        results.failed.forEach(f => {
          outputLines.push(`❌ FAILED (${f.platform}): ${f.error}`);
        });
      }

      if (outputLines.length === 0) {
        return "No action taken. Please make sure your social accounts are connected.";
      }

      return outputLines.join("\n\n");

    } catch (error) {
      console.error("❌ Social Media Tool Error:", error);
      return `FAILED: ${error.message}`;
    }
  },
  {
    name: "post_to_social_media",
    description: "Publishes photos, videos, or carousel albums to one or multiple connected social media platforms (Instagram, Facebook, Twitter/X, LinkedIn, Pinterest, TikTok, YouTube). Automatically detects uploaded images/videos from the chat. Supports posting together as a Carousel/Album or separately one-by-one. Informs the user clearly if any requested platform is not connected.",
    schema: z.object({
      platforms: z.array(z.string()).describe("List of target platforms (e.g. ['instagram', 'facebook'], ['twitter'], or ['all_connected'])"),
      mediaUrls: z.array(z.string()).optional().describe("Array of media URLs to publish. If omitted, automatically uses all uploaded photos/videos in the chat."),
      postMode: z.enum(["together", "separately"]).default("together").describe("Whether to post images together as a Carousel/Album ('together') or upload them separately one-by-one ('separately')."),
      caption: z.string().describe("A captivating, viral caption with relevant trending hashtags (either user's caption or AI-crafted based on image contents).")
    })
  }
);

// Backward compatibility alias for any existing code
export const postToInstagramTool = postToSocialMediaTool;
