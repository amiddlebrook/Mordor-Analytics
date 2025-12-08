
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are the Barad-dûr Analytics Engine, a sophisticated AI for stock market analysis residing in a volcanic, high-tech fortress.
Your tone is authoritative, precise, and slightly dark/industrial.

You have three main modules:
1. SDA (Stock Divergence Analyzer): Tracks price divergence from weekly/monthly MAs.
2. GPA (Ghost Pattern Analyzer): Detects hidden correlations ("ghosts").
3. Condor Builder: Suggests options strategies (Iron Condors, Butterflies).

When asked for data, generating realistic MOCK data for demonstration purposes is acceptable and required since we are in a demo environment.
Format your responses to potentially include structured JSON data if the user asks for analysis, charts, or strategies.
`;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    textResponse: { type: Type.STRING, description: "The conversational response to the user." },
    hasData: { type: Type.BOOLEAN, description: "Whether specific visualization data is included." },
    dataType: { type: Type.STRING, enum: ["chart", "ghost", "strategy", "none"] },
    chartData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING },
          price: { type: Type.NUMBER },
          maWeekly: { type: Type.NUMBER },
          divergence: { type: Type.NUMBER },
        }
      }
    },
    ghostData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          symbol: { type: Type.STRING },
          score: { type: Type.NUMBER },
          description: { type: Type.STRING },
          correlatedSymbol: { type: Type.STRING },
        }
      }
    },
    strategyData: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        symbol: { type: Type.STRING },
        profitProb: { type: Type.NUMBER },
        maxProfit: { type: Type.NUMBER },
        maxLoss: { type: Type.NUMBER },
        breakevenLow: { type: Type.NUMBER },
        breakevenHigh: { type: Type.NUMBER },
      }
    }
  }
};

export const sendMessageToGemini = async (history: ChatMessage[], newMessage: string): Promise<any> => {
  try {
    // Convert history to Gemini format
    const contents = [
        ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: newMessage }] }
    ];

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    // Correctly access text from the result object directly
    const responseText = result.text;
    if (!responseText) throw new Error("No response from Gemini");
    
    return JSON.parse(responseText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      textResponse: "The Eye is clouded. I cannot access the market streams at this moment.",
      hasData: false,
      dataType: "none"
    };
  }
};

export const generateVolcanicBackground = async (): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: "A hyperrealistic wide-angle panoramic matte painting of Mordor from the Isenmouthe. Composition: In the absolute center is the colossal Dark Tower of Barad-dûr with the flaming Eye. To the FAR RIGHT is Mount Doom (Orodruin) erupting with magma. To the FAR LEFT are the misty, greenish Dead Marshes and the Ash Mountains. In the foreground, jagged obsidian rocks. Atmosphere: Dark, smoky, oppressive, red and black volcanic lighting. 16:9 cinematic ratio."
                    }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9" 
                }
            }
        });

        const candidates = response.candidates;
        if (candidates && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Failed to generate background image:", error);
        return null;
    }
};
