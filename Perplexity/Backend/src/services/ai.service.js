import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});


export async function generateResponse() {
  const response = await model.invoke("How to make AI?");
//   return response.text;
console.log(response.text);

}