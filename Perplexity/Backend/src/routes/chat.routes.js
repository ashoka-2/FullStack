import {Router} from 'express';
import { getChats, getMessages, sendMessage, deleteChat, getSuggestions, searchMessages } from '../controllers/chat.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';


import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const chatRouter = Router();

chatRouter.post("/message", authUser, upload.single('file'), sendMessage)
chatRouter.get("/", authUser, getChats)
// Naya global search endpoint jisme query '?q=' aayega
chatRouter.get("/search", authUser, searchMessages)
chatRouter.get("/:chatId/messages", authUser, getMessages)

chatRouter.delete("/delete/:chatId", authUser, deleteChat)
chatRouter.get("/suggestions", authUser, getSuggestions)


export default chatRouter;