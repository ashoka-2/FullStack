import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import {ChatMistralAI} from "@langchain/mistralai";

import {HumanMessage, SystemMessage,AIMessage} from "langchain";


const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});


export async function generateResponse(messages) {
  const response = await geminiModel.invoke(
    messages.map(msg => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "ai") {
        return new AIMessage(msg.content);
      }
      return new HumanMessage(msg.content);
    })
  );
  return response.content;
}

export async function generateChatTitle(message){
  const response = await mistralModel.invoke([
    new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversations.
      
      User will provide you with a message from a chat conversation, and your task is to create a title that captures the essence of the conversation in a 2-4 words. The title should be clear, informative, and engaging, giving users a quick understanding of the chat's content.
      
      `),

      new HumanMessage(`
          Generate a title for a chat conversation based on the following first message:
          "${message}"
        `)
    
  ])
  return response.content;
}