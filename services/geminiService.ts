import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FullContext, Campaign, Email, CampaignGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schemas
const contextSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    brand: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        voice: { type: Type.STRING, description: "Adjectives describing the tone (e.g. Friendly, Professional)" },
        mission: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["name", "voice", "mission", "keywords"]
    },
    audience: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Who is the target audience?" },
        painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        desires: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["description", "painPoints", "desires"]
    },
    offer: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        pitch: { type: Type.STRING },
        details: { type: Type.STRING }
      },
      required: ["name", "pitch", "details"]
    }
  },
  required: ["brand", "audience", "offer"]
};

const emailSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dayOffset: { type: Type.INTEGER, description: "Day number to send (0 is immediately)" },
    type: { type: Type.STRING, description: "Type of email (e.g., Welcome, Value, Soft Sell)" },
    subject: { type: Type.STRING },
    previewText: { type: Type.STRING },
    body: { type: Type.STRING, description: "The complete email body content, including the hook, main value, call to action, and sign-off." }
  },
  required: ["dayOffset", "type", "subject", "previewText", "body"]
};

const campaignSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    campaignName: { type: Type.STRING },
    emails: {
      type: Type.ARRAY,
      items: emailSchema
    }
  },
  required: ["campaignName", "emails"]
};

export const analyzeContext = async (inputText: string): Promise<FullContext> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following business text and extract the Brand profile, Audience profile, and Offer details. 
      
      Text to analyze:
      ${inputText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: contextSchema
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      ...data,
      isComplete: true
    };
  } catch (error) {
    console.error("Context analysis failed:", error);
    throw new Error("Failed to analyze context.");
  }
};

export const generateCampaign = async (
  goal: CampaignGoal, 
  context: FullContext, 
  additionalDetails?: string
): Promise<Partial<Campaign>> => {
  try {
    const prompt = `
      Act as a world-class email marketing copywriter.
      Create an email sequence for a campaign with the goal: "${goal}".
      
      Context:
      Brand: ${context.brand.name} (${context.brand.voice})
      Mission: ${context.brand.mission}
      Audience: ${context.audience.description}
      Pain Points: ${context.audience.painPoints.join(", ")}
      Offer: ${context.offer.name} - ${context.offer.pitch}
      
      Additional Details: ${additionalDetails || "None"}
      
      Requirements:
      - Create between 3 to 7 emails depending on the goal.
      - Ensure the tone matches the brand voice.
      - Use psychological triggers relevant to the audience.
      - The body of each email should be a single coherent text field, formatted with newlines.
      - Return a JSON object with the campaign name and list of emails.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: campaignSchema
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Map response to our internal structure adding IDs
    const emails: Email[] = (data.emails || []).map((e: any, index: number) => ({
      ...e,
      id: `email-${Date.now()}-${index}`,
      status: 'draft'
    }));

    return {
      name: data.campaignName || `${goal} Campaign`,
      goal: goal,
      emails: emails,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Campaign generation failed:", error);
    throw new Error("Failed to generate campaign.");
  }
};