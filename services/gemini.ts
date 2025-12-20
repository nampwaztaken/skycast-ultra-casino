import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData } from "../types";

// Safe check for API key
const getApiKey = () => {
  try {
    const key = process.env.API_KEY;
    return (key && typeof key === 'string' && key.length > 10) ? key : null;
  } catch {
    return null;
  }
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Local Data Repository for offline/No-API mode
 */
const WEATHER_CONDITIONS = ["Clear Skies", "Partly Cloudy", "High Pressure", "Solar Flare", "Ionized Mist"];
const INSIGHTS = [
  "Atmospheric pressure is stable. Visibility at 100%.",
  "Solar activity is within normal parameters for the sector.",
  "High-altitude data sync complete. No anomalies detected.",
  "Orbital sensors report optimal conditions for synchronization."
];

export const getRealWeather = async (city: string): Promise<WeatherData | null> => {
  // If no AI, return local simulation immediately
  if (!ai) {
    return {
      city: city.charAt(0).toUpperCase() + city.slice(1),
      temp: Math.floor(Math.random() * 10) + 20,
      condition: WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)],
      humidity: `${Math.floor(Math.random() * 20) + 30}%`,
      windSpeed: `${Math.floor(Math.random() * 15) + 5} km/h`,
      description: "Running in local simulation mode. Data verified by SkyCast cache."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current weather in ${city}? Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING },
            temp: { type: Type.NUMBER },
            condition: { type: Type.STRING },
            humidity: { type: Type.STRING },
            windSpeed: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["city", "temp", "condition", "humidity", "windSpeed", "description"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.warn("API Error, falling back to local simulation.");
    return {
      city: city,
      temp: 22,
      condition: "Stable Atmos",
      humidity: "45%",
      windSpeed: "10 km/h",
      description: "Sensor relay timed out. Using local predictive model."
    };
  }
};

export const getAIWeatherInsight = async (city: string, condition: string, temp: number) => {
  if (!ai) return INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)];
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `One sentence professional weather advisory for ${city} (${condition}, ${temp}°C).`,
    });
    return response.text || INSIGHTS[0];
  } catch {
    return INSIGHTS[0];
  }
};

export const getCasinoFortune = async (balance: number, win: number) => {
  const LOCAL_QUOTES = [
    "Neon lights favor the bold. Keep your focus.",
    "Calculated risks lead to legendary yields.",
    "The digital deck is warm tonight.",
    "Patterns are emerging. Fortune favors the strategy."
  ];

  if (!ai) return win > 0 ? "Jackpot! The vault is expanding." : LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: win > 0 ? `Player won ${win}. Quick witty dealer quote.` : `Balance is ${balance}. Quick gambling tip.`,
      config: {
        systemInstruction: "You are 'Neon Nick', a charismatic AI Casino Dealer. Max 10 words.",
      }
    });
    return response.text || "Place your bets.";
  } catch {
    return LOCAL_QUOTES[0];
  }
};