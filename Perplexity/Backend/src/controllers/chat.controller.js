import { generateChatTitle, generateResponse, generateSuggestions } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import userModel from "../models/user.model.js";
import messageModel from "../models/message.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import { getIO } from "../sockets/server.socket.js";

export async function sendMessage(req, res) {
    try {
        const { message, chat: chatId } = req.body;
        const file = req.file;

        // Security Check: Agar response kisi existing chat me jana hai
        // toh pehle check karo ki kya ye usi user ka chat hai jisne banya tha.
        // Dusre log sirf shared link dekh sakte hain, reply nahi kar sakte.
        if (chatId) {
            const existingChat = await chatModel.findById(chatId);
            if (!existingChat || existingChat.user.toString() !== req.user.id) {
                return res.status(403).json({ 
                    message: "You can only view this shared chat. Sending follow-ups is restricted for guests." 
                });
            }
        }

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
        
        const io = getIO();
        const socketId = req.body.socketId;

        const fullUser = await userModel.findById(req.user.id).select("instagram.accessToken instagram.userId instagram.isConnected");
        
        // Ensure accessToken is included if it was select:false
        if (!fullUser.instagram?.accessToken) {
            const userWithToken = await userModel.findById(req.user.id).select("+instagram.accessToken");
            if (userWithToken.instagram?.accessToken) {
                fullUser.instagram.accessToken = userWithToken.instagram.accessToken;
            }
        }

        const result = await generateResponse(messages, (chunk) => {
            if (socketId) {
                io.to(socketId).emit("chunk", chunk);
            }
        }, fullUser);

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

    // Yahan pehle hum "user: req.user.id" check kar rahe the.
    // Use nikal diya taki agar koi valid link ('chatId') laata hai, toh wo messages padh sake chahe login kisi aur id se ho.
    const chat = await chatModel.findById(chatId);

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
        messages,
        // Frontend ko batane ke liye ki kya dekhne wala hi asli owner hai?
        isOwner: chat.user.toString() === req.user.id
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
        const { chatId } = req.query;
        let messages = [];

        // Agar chatId query context mein hai, toh wahan se messages nikalo
        if (chatId) {
            messages = await messageModel.find({ chat: chatId });
        }

        const suggestions = await generateSuggestions(messages);
        
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

// Ye naya controller library/search page ke liye hai jisse hum chat ke andar ke specifically words dhundh payenge
// Performance achhi rakhne ke liye hum query text pe limit laga kar (Sirf 20 results) aur sirf active user ke chats me hi dhoondh rahe hain.
export async function searchMessages(req, res) {
    try {
        const { q } = req.query; // 'q' matlab query string jo user ne input me dali hai
        if (!q) {
            return res.status(200).json({ results: [] });
        }

        // 1. Pehle user ke saare chats ki IDs fetch karte hain
        const userChats = await chatModel.find({ user: req.user.id }).select('_id title');
        const chatMap = {};
        const chatIds = userChats.map(c => {
            chatMap[c._id.toString()] = c.title;
            return c._id;
        });

        if (chatIds.length === 0) {
            return res.status(200).json({ results: [] });
        }

        // 2. Ab messageModel me regex laga ke vo messages uthayenge jisme matching keyword hai 
        // regex mein 'i' ka matlab case-insensitive (chota bada font dono mach karega)
        const matchedMessages = await messageModel.find({
            chat: { $in: chatIds },
            content: { $regex: q, $options: 'i' }
        })
        .sort({ createdAt: -1 }) // Naye messages upar aayeinge
        .limit(20) // Sirf top 20 taaki app ya DB slow na ho (Performance bachane ke liye)
        .lean(); // Faster JSON object 

        // Response format karte hain, chat ka title bhi daalte hain taaki frontend per UI achi dhikhe
        const results = matchedMessages.map(msg => ({
            ...msg,
            chatTitle: chatMap[msg.chat.toString()] || "Untitled Chat"
        }));

        res.status(200).json({
            message: "Search completed successfully",
            results
        });

    } catch (error) {
        console.error("Error in searchMessages controller:", error);
        res.status(500).json({
            message: "Global search failed",
            error: error.message
        });
    }
}