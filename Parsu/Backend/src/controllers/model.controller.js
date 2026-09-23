import userModel from "../models/user.model.js";
import {
  DEFAULT_MODELS,
  PROVIDER_CONFIGS,
  fetchModelsForProvider
} from "../services/model.service.js";
import { encryptKey, maskApiKey } from "../utils/encryption.utils.js";

/**
 * GET /api/models
 * Fetch all available models (built-in + user's custom unlocked models)
 */
export async function getAvailableModels(req, res) {
  try {
    let customKeys = [];
    let selectedModel = {
      provider: "gemini",
      modelId: "gemini-2.5-flash",
      modelName: "Gemini 2.5 Flash"
    };

    if (req.user?.id) {
      const user = await userModel.findById(req.user.id).select("+customApiKeys.apiKey");
      if (user) {
        if (user.selectedModel?.modelId) {
          selectedModel = user.selectedModel;
        }
        if (user.customApiKeys && user.customApiKeys.length > 0) {
          customKeys = user.customApiKeys.map(k => ({
            _id: k._id,
            provider: k.provider,
            name: k.name || PROVIDER_CONFIGS[k.provider]?.name || k.provider,
            maskedKey: k.maskedKey,
            baseUrl: k.baseUrl,
            models: k.models,
            isActive: k.isActive,
            lastTested: k.lastTested
          }));
        }
      }
    }

    // Build flattened list of custom models for selector
    const customModelsList = [];
    for (const key of customKeys) {
      if (key.models && key.models.length > 0) {
        for (const m of key.models) {
          customModelsList.push({
            id: m.id,
            name: m.name || m.id,
            provider: key.provider,
            providerName: key.name,
            keyId: key._id,
            badge: "Custom Key",
            description: m.description || `Unlocked via ${key.name}`,
            isCustom: true,
            baseUrl: key.baseUrl
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      defaultModels: DEFAULT_MODELS,
      customModels: customModelsList,
      customKeys,
      selectedModel,
      providerConfigs: PROVIDER_CONFIGS
    });
  } catch (error) {
    console.error("Error in getAvailableModels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load models",
      error: error.message
    });
  }
}

/**
 * POST /api/models/test
 * Test an API key and fetch its available models without saving yet
 */
export async function testApiKey(req, res) {
  try {
    const { provider, apiKey, baseUrl } = req.body;
    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: "Provider and API Key are required"
      });
    }

    const models = await fetchModelsForProvider(provider, apiKey, baseUrl);

    res.status(200).json({
      success: true,
      message: `Connection successful! Found ${models.length} accessible models.`,
      modelsCount: models.length,
      models
    });
  } catch (error) {
    console.error("Test API Key failed:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to connect with provided API key"
    });
  }
}

/**
 * POST /api/models/keys
 * Add or update an API key for a provider, securely encrypted in DB
 */
export async function saveCustomApiKey(req, res) {
  try {
    const { provider, apiKey, name, baseUrl } = req.body;
    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: "Provider and API Key are required"
      });
    }

    const cleanKey = apiKey.trim();
    // 1. Validate key and dynamically fetch all available models for it
    const models = await fetchModelsForProvider(provider, cleanKey, baseUrl);

    // 2. Encrypt key for secret storage in DB
    const encryptedKey = encryptKey(cleanKey);
    const masked = maskApiKey(cleanKey);

    const user = await userModel.findById(req.user.id).select("+customApiKeys.apiKey");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if key for same provider or custom name already exists
    const existingIndex = user.customApiKeys.findIndex(k => 
      k.provider === provider && (!name || k.name === name)
    );

    const keyData = {
      provider,
      name: name || PROVIDER_CONFIGS[provider]?.name || provider,
      apiKey: encryptedKey,
      maskedKey: masked,
      baseUrl: baseUrl || "",
      models,
      isActive: true,
      lastTested: new Date()
    };

    if (existingIndex > -1) {
      user.customApiKeys[existingIndex] = {
        ...user.customApiKeys[existingIndex].toObject(),
        ...keyData
      };
    } else {
      user.customApiKeys.push(keyData);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully connected ${provider}! Unlocked ${models.length} models.`,
      key: {
        provider,
        name: keyData.name,
        maskedKey: masked,
        baseUrl: keyData.baseUrl,
        modelsCount: models.length,
        models
      }
    });
  } catch (error) {
    console.error("Save API Key failed:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to validate and save API key"
    });
  }
}

/**
 * DELETE /api/models/keys/:keyId
 * Remove a custom API key
 */
export async function deleteCustomApiKey(req, res) {
  try {
    const { keyId } = req.params;
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.customApiKeys = user.customApiKeys.filter(k => k._id.toString() !== keyId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "API Key deleted successfully"
    });
  } catch (error) {
    console.error("Delete API Key failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete API key",
      error: error.message
    });
  }
}

/**
 * PUT /api/models/selected
 * Update user's currently selected default model
 */
export async function setSelectedModel(req, res) {
  try {
    const { provider, modelId, modelName } = req.body;
    if (!modelId) {
      return res.status(400).json({ success: false, message: "modelId is required" });
    }

    if (req.user?.id) {
      await userModel.findByIdAndUpdate(req.user.id, {
        selectedModel: {
          provider: provider || "gemini",
          modelId,
          modelName: modelName || modelId
        }
      });
    }

    res.status(200).json({
      success: true,
      selectedModel: {
        provider: provider || "gemini",
        modelId,
        modelName: modelName || modelId
      }
    });
  } catch (error) {
    console.error("Set selected model failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set selected model",
      error: error.message
    });
  }
}
