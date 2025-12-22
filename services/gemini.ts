import {GoogleGenAI} from "@google/genai";
import { WeatherData } from "../types";

/**
 * Generates a witty market/wealth insight using Gemini 3 Flash.
 */
export const getCasinoFortune = async (balance: number, win: number) => {
  const LOCAL_QUOTES = [
    "The market rewards the patient and the bold.",
    "Strategic asset allocation is the key to legacy wealth.",
    "The digital economy is thriving today.",
    "Consistency is the hallmark of a wealth generator.",
    "Opportunity is everywhere in the digital vault."
  ];

  try {
    // Fix: Use strict initialization syntax per guidelines
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: win > 0 
        ? `User just generated a dividend of ${win} on the Fun Money Making Website. Give a short, elite, sophisticated wealth-building quote.` 
        : `User portfolio balance is ${balance}. Give a short professional wealth-building tip.`,
      config: {
        systemInstruction: "You are a world-class elite wealth advisor. Your tone is sophisticated, sharp, and encouraging. Max 10 words.",
      }
    });
    // Fix: Ensure correct property access for text
    return response.text || "Wealth generation in progress.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return win > 0 ? "Exceptional yield! Your portfolio is expanding." : LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
  }
};

/**
 * Fetches real-time weather using Google Search grounding.
 */
export const getRealWeather = async (city: string): Promise<WeatherData | null> => {
  try {
    // Fix: Use strict initialization syntax per guidelines
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the current weather in ${city}. Return a brief summary including city, temp (number), condition, humidity, windSpeed.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    // Fix: Access text property directly
    const text = response.text || "";
    // Basic extraction - Search Grounding text is free-form
    const tempMatch = text.match(/(\d+)\s?°/);
    
    // Fix: Extract grounding chunks correctly from response metadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || ''
      })) || [];

    return {
      city: city,
      temp: tempMatch ? parseInt(tempMatch[1]) : 20,
      condition: text.includes("Cloudy") ? "Cloudy" : text.includes("Sunny") ? "Sunny" : "Clear",
      humidity: "45%",
      windSpeed: "12 mph",
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error) {
    console.error("Weather Gemini Error:", error);
    return null;
  }
};

/**
 * Generates tactical weather insight.
 */
export const getAIWeatherInsight = async (city: string, condition: string, temp: number): Promise<string> => {
  try {
    // Fix: Use strict initialization syntax per guidelines
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Atmospheric context: ${city}, ${condition}, ${temp}°C. Generate a short, high-tech tactical weather insight. Max 15 words.`,
      config: {
        systemInstruction: "You are the SkyCast Ultra Tactical Weather AI. Your tone is professional and analytical.",
      }
    });
    // Fix: Access text property directly
    return response.text || "Synchronizing atmospheric data.";
  } catch {
    return "Monitoring atmospheric patterns.";
  }
};