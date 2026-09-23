/**
 * Legacy Instagram Tool Proxy
 * Forwards calls to the new Universal Social Media Tool (socialMedia.tool.js)
 */
import { postToSocialMediaTool } from "./socialMedia.tool.js";

export const postToInstagramTool = (userContext) => {
  return postToSocialMediaTool(userContext);
};

export default postToInstagramTool;
