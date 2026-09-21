import { Router } from "express";
import {
  getAvailableModels,
  saveCustomApiKey,
  testApiKey,
  deleteCustomApiKey,
  setSelectedModel
} from "../controllers/model.controller.js";
import { authUser, optionalAuthUser } from "../middlewares/auth.middleware.js";

const modelRouter = Router();

// Get models list — public/optionalAuth (guests see built-in models, logged in users see custom keys too)
modelRouter.get("/", optionalAuthUser, getAvailableModels);

// Test API Key before saving
modelRouter.post("/test", authUser, testApiKey);

// Add or update custom API key (encrypted in DB)
modelRouter.post("/keys", authUser, saveCustomApiKey);

// Delete custom API key
modelRouter.delete("/keys/:keyId", authUser, deleteCustomApiKey);

// Update user's active/selected model
modelRouter.put("/selected", optionalAuthUser, setSelectedModel);

export default modelRouter;
