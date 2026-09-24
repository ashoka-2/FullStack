import {Router} from 'express';
import { getChats, getMessages, sendMessage, deleteChat, getSuggestions, searchMessages, rateMessageFeedback, renameChat, togglePinChat } from '../controllers/chat.controller.js';
import { authUser, optionalAuthUser } from '../middlewares/auth.middleware.js';
import { chatLimiter } from '../middlewares/rateLimiter.middleware.js';


import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const chatRouter = Router();

chatRouter.post("/message", authUser, chatLimiter, upload.any(), sendMessage)
chatRouter.post("/message/:messageId/feedback", authUser, rateMessageFeedback)
chatRouter.get("/", authUser, getChats)
// Naya global search endpoint jisme query '?q=' aayega
chatRouter.get("/search", authUser, searchMessages)
chatRouter.get("/:chatId/messages", authUser, getMessages)

chatRouter.delete("/delete/:chatId", authUser, deleteChat)
chatRouter.put("/:chatId/rename", authUser, renameChat)
chatRouter.put("/:chatId/pin", authUser, togglePinChat)
chatRouter.get("/suggestions", optionalAuthUser, getSuggestions)


export default chatRouter;