import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Define response type
export interface GeminiResponse {
  text: string;
  error?: string;
}

/**
 * Send a prompt to Google's Gemini API and get a response
 * 
 * @param prompt The user prompt to send to Gemini
 * @param systemInstructions Optional system instructions to guide the model's behavior
 * @returns Promise with the text response or error
 */
export async function getGeminiResponse(
  prompt: string,
): Promise<GeminiResponse> {
  try {
    console.log("Sending prompt to Gemini API:", prompt);
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      return {
        text: "",
        error: "Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.",
      };
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Get the generative model (using Gemini Pro)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Directly generate a response without starting a new chat session
    const result = await model.generateContent(prompt);
    
    const text = result.response.text();
    console.log("Received response from Gemini API:", text);
    
    return { text };
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    
    // Return formatted error
    return {
      text: "",
      error: `Failed to get response from Gemini API: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}