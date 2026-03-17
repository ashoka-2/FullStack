import { generateChatTitle, generateResponse, generateSuggestions } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { uploadFile } from "../services/imagekit.service.js";

export async function sendMessage(req, res) {
    try {
        const { message, chat: chatId } = req.body;
        const file = req.file;

        let fileDetails = null;

        if (file) {
            try {
                fileDetails = await uploadFile({
                    buffer: file.buffer,
                    filename: file.originalname,
                    folder: "perplexity/chats"
                });
            } catch (error) {
                console.error("Image upload failed:", error);
                if (!message) {
                    return res.status(500).json({ message: "Image upload failed" });
                }
            }
        }

        let title = null, chat = null;

        if (!chatId) {
            title = await generateChatTitle(message || "Image Upload");
            chat = await chatModel.create({
                user: req.user.id,
                title
            })
        }

        const userMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: message || "Sent an image",
            role: "user",
            file: fileDetails
        })

        const messages = await messageModel.find({ chat: chatId || chat._id });
    
        const result = await generateResponse(messages);

        const aiMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: result,
            role: "ai"
        })

        res.status(201).json({
            title: title,
            chat: chat || await chatModel.findById(chatId),
            userMessage,
            aiMessage
        })
    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}



export async function getChats(req,res){
    const user = req.user;

    const chats = await chatModel.find({user: user.id}).sort({ updatedAt: -1 })

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats
    });
}


export async function getMessages(req,res){
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
        _id:chatId,
        user:req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({ 
        chat: chatId 
    });

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages
    });

}

export async function deleteChat(req,res){
    const { chatId } = req.params;

    const chat = await chatModel.findOneAndDelete({
        _id:chatId,
        user:req.user.id
    })
    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })

    res.status(200).json({
        message: "Chat deleted successfully",
    });
}

export async function getSuggestions(req, res) {
    try {
        const suggestions = await generateSuggestions();
        res.status(200).json({
            message: "Suggestions generated successfully",
            suggestions
        });
    } catch (error) {
        console.error("Error in getSuggestions controller:", error);
        res.status(500).json({
            message: "Failed to generate suggestions",
            error: error.message
        });
    }
}