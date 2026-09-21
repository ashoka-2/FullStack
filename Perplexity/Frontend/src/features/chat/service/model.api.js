import { api } from "./chat.api.js";

/**
 * Fetch all available models (built-in + user's custom models)
 */
export async function getModels() {
  const response = await api.get("/api/models");
  return response.data;
}

/**
 * Test an API key before saving (fetches live model list)
 */
export async function testApiKey({ provider, apiKey, baseUrl }) {
  const response = await api.post("/api/models/test", {
    provider,
    apiKey,
    baseUrl
  });
  return response.data;
}

/**
 * Save custom API key (encrypted in database)
 */
export async function saveCustomApiKey({ provider, apiKey, name, baseUrl }) {
  const response = await api.post("/api/models/keys", {
    provider,
    apiKey,
    name,
    baseUrl
  });
  return response.data;
}

/**
 * Delete custom API key
 */
export async function deleteCustomApiKey(keyId) {
  const response = await api.delete(`/api/models/keys/${keyId}`);
  return response.data;
}

/**
 * Update selected model preference
 */
export async function setSelectedModel({ provider, modelId, modelName }) {
  const response = await api.put("/api/models/selected", {
    provider,
    modelId,
    modelName
  });
  return response.data;
}
