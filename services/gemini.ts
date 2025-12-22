import {GoogleGenAI} from "@google/genai";

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

/**
 * Fetches real-time weather using Google Search grounding.
 * Required for queries about recent/real-time events like current weather.
 */
export const getRealWeather = async (city: string) => {
  try {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    // Use Search Grounding for current weather as it is real-time information.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What is the current weather in ${city}? Provide city name, temperature in Celsius, condition, humidity, and wind speed.`,
      config: {
        tools: [{googleSearch: {}}],
      }
    });

    const text = response.text || "";
    
    // Extract grounding sources as required by Google GenAI guidelines.
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri,
      title: chunk.web?.title
    })).filter((s: any) => s.uri) || [];

    // Simple text parsing since JSON response is not guaranteed when using search grounding.
    const tempMatch = text.match(/(-?\d+(\.\d+)?)\s*°?C/i);
    const humidityMatch = text.match(/(\d+)\s*%/);
    const conditionMatch = text.match(/condition[:\s]+([^\n.,]+)/i);
    const windMatch = text.match(/wind[:\s]+([^\n.,]+)/i);
    
    return {
      city: city,
      temp: tempMatch ? parseFloat(tempMatch[1]) : 20,
      condition: conditionMatch ? conditionMatch[1].trim() : "Clear",
      humidity: humidityMatch ? `${humidityMatch[1]}%` : "45%",
      windSpeed: windMatch ? windMatch[1].trim() : "10 km/h",
      sources
    };
  } catch (error) {
    console.error("Weather Fetch Error:", error);
    return null;
  }
};

/**
 * Generates an AI insight for weather based on current atmospheric parameters.
 */
export const getAIWeatherInsight = async (city: string, condition: string, temp: number) => {
  try {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The weather in ${city} is ${condition} at ${temp}°C. Give a futuristic orbital station commander's report. Max 15 words.`,
      config: {
        systemInstruction: "You are the commander of the orbital weather station SKYCAST. Your tone is futuristic, robotic, and professional.",
      }
    });
    return response.text || "Synchronizing with orbital sensors...";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Atmospheric data synchronization complete.";
  }
};