import {GoogleGenAI} from "@google/genai";

/**
 * Fetches real-time weather data using Gemini's search grounding capability.
 */
export const getRealWeather = async (city: string) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the current weather in ${city}. Provide the data as a JSON object with keys: city, temp (as a number in Celsius), condition, humidity, windSpeed.`,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    // The guideline warns that text might not be pure JSON when using search grounding.
    // We use a regex to extract the JSON block safely.
    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      city: city,
      temp: 20,
      condition: "Atmospheric sync active",
      humidity: "50%",
      windSpeed: "10 km/h"
    };

    // Extract grounding sources for UI display as required by Search Grounding rules
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({
        uri: chunk.web!.uri,
        title: chunk.web!.title || "Weather Source"
      })) || [];

    return { ...data, sources };
  } catch (error) {
    console.error("Failed to fetch orbital weather data:", error);
    return null;
  }
};

/**
 * Generates futuristic AI insight for weather conditions.
 */
export const getAIWeatherInsight = async (city: string, condition: string, temp: number) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The weather in ${city} is currently ${condition} at ${temp}°C. Generate a witty, short futuristic survival advice.`,
      config: {
        systemInstruction: "You are a cybernetic orbital weather station. Tone: Sharp, futuristic, brief. Max 10 words.",
      },
    });
    return response.text || "Scanning atmospheric patterns...";
  } catch (error) {
    return "Orbital data link unstable.";
  }
};

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
    return response.text || "Wealth generation in progress.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return win > 0 ? "Exceptional yield! Your portfolio is expanding." : LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
  }
};