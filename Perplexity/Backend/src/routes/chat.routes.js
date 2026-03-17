import {Router} from 'express';
import { getChats, getMessages, sendMessage,deleteChat } from '../controllers/chat.controller.js';
import { authUser } from '../middlewares/auth.middleware.js';


const chatRouter = Router();


chatRouter.post("/message",authUser,sendMessage)
chatRouter.get("/",authUser,getChats)
chatRouter.get("/:chatId/messages",authUser,getMessages)

chatRouter.delete("/delete:chatId",authUser,deleteChat)


export default chatRouter;