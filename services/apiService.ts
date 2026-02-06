import { FullContext, Campaign, Email, CampaignGoal } from "../types";

// API base URL - change this for production
declare const process: { env: { API_URL?: string } };
const API_BASE = process.env.API_URL || "http://localhost:8000";

/**
 * Analyze raw text input and extract structured context (brand, audience, offer)
 */
export const analyzeContext = async (inputText: string): Promise<FullContext> => {
  try {
    const response = await fetch(`${API_BASE}/api/context/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw_text: inputText,
        input_type: "text"
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to analyze context");
    }

    const data = await response.json();

    // Transform API response to match frontend FullContext type
    return {
      brand: {
        name: data.brand?.name || "Unknown Brand",
        voice: data.brand?.voice_characteristics?.join(", ") || "Professional",
        mission: data.brand?.mission || "",
        keywords: data.brand?.vocabulary?.preferred || [],
      },
      audience: {
        description: data.audience?.job_titles?.join(", ") + " in " + data.audience?.industries?.join(", ") || "Target audience",
        painPoints: data.audience?.pain_points || [],
        desires: data.audience?.goals || [],
      },
      offer: {
        name: data.offer?.product_name || "Product",
        pitch: data.offer?.one_liner || "",
        details: data.offer?.usp || "",
      },
      isComplete: true,
    };
  } catch (error) {
    console.error("Context analysis failed:", error);
    throw new Error("Failed to analyze context. Make sure the API server is running.");
  }
};

/**
 * Save context to the backend (persists to .agent/context/*.md files)
 */
export const saveContext = async (context: FullContext): Promise<void> => {
  try {
    // Transform frontend context to API format
    const apiContext = {
      brand: {
        name: context.brand.name,
        tagline: "",
        mission: context.brand.mission,
        voice_characteristics: context.brand.voice.split(", "),
        tone_scale: { formal_casual: 5, serious_humorous: 5, respectful_irreverent: 5 },
        dos: [],
        donts: [],
        vocabulary: { preferred: context.brand.keywords, avoid: [] },
        example_copy: [],
      },
      audience: {
        job_titles: [context.audience.description],
        industries: [],
        company_size: "",
        revenue_range: "",
        goals: context.audience.desires,
        values: [],
        fears: [],
        objections: [],
        pain_points: context.audience.painPoints,
        desired_transformation: "",
        buying_triggers: [],
      },
      offer: {
        product_name: context.offer.name,
        one_liner: context.offer.pitch,
        features_benefits: [],
        usp: context.offer.details,
        pricing: "",
        guarantees: "",
        bonuses: [],
      },
    };

    const response = await fetch(`${API_BASE}/api/context/save-processed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiContext),
    });

    if (!response.ok) {
      throw new Error("Failed to save context");
    }
  } catch (error) {
    console.error("Failed to save context:", error);
    // Non-critical - don't throw, just log
  }
};

/**
 * Generate a campaign using the AI agent
 */
export const generateCampaign = async (
  goal: CampaignGoal,
  context: FullContext,
  additionalDetails?: string
): Promise<Partial<Campaign>> => {
  try {
    // First, save the context to the backend so the agent can use it
    await saveContext(context);

    // Then generate the campaign
    const response = await fetch(`${API_BASE}/api/campaigns/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaign_type: goal,
        additional_details: additionalDetails || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to generate campaign");
    }

    const data = await response.json();

    // Transform API response to match frontend Campaign type
    const emails: Email[] = (data.emails || []).map((e: any, index: number) => ({
      id: e.id || `email-${Date.now()}-${index}`,
      dayOffset: parseDayOffset(e.send_timing),
      type: e.type || "Email",
      subject: e.subject_line || "",
      previewText: e.preview_text || "",
      body: {
        hook: e.body?.hook || "",
        context: e.body?.context || "",
        value: e.body?.value || "",
        cta: e.body?.cta || "",
        signOff: e.body?.signoff || "",
      },
      status: "draft" as const,
    }));

    return {
      id: data.id,
      name: data.campaign?.name || `${goal} Campaign`,
      goal: goal,
      emails: emails,
      status: "draft",
      createdAt: data.created_at || new Date().toISOString(),
      lastEditedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Campaign generation failed:", error);
    throw new Error("Failed to generate campaign. Make sure the API server is running and has API credits.");
  }
};

/**
 * Get a campaign by ID
 */
export const getCampaign = async (campaignId: string): Promise<Campaign | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const emails: Email[] = (data.emails || []).map((e: any, index: number) => ({
      id: e.id || `email-${index}`,
      dayOffset: parseDayOffset(e.send_timing),
      type: e.type || "Email",
      subject: e.subject_line || "",
      previewText: e.preview_text || "",
      body: {
        hook: e.body?.hook || "",
        context: e.body?.context || "",
        value: e.body?.value || "",
        cta: e.body?.cta || "",
        signOff: e.body?.signoff || "",
      },
      status: "draft" as const,
    }));

    return {
      id: data.id,
      name: data.campaign?.name || "Campaign",
      goal: data.campaign?.type || "custom",
      emails: emails,
      status: data.status || "draft",
      createdAt: data.created_at || new Date().toISOString(),
      lastEditedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return null;
  }
};

/**
 * Update a single email in a campaign
 */
export const updateEmail = async (
  campaignId: string,
  emailId: string,
  updates: Partial<Email>
): Promise<void> => {
  try {
    const apiUpdates: any = {};

    if (updates.subject) apiUpdates.subject_line = updates.subject;
    if (updates.previewText) apiUpdates.preview_text = updates.previewText;
    if (updates.body) {
      apiUpdates.body = {
        hook: updates.body.hook,
        context: updates.body.context,
        value: updates.body.value,
        cta: updates.body.cta,
        signoff: updates.body.signOff,
      };
    }

    const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/emails/${emailId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiUpdates),
    });

    if (!response.ok) {
      throw new Error("Failed to update email");
    }
  } catch (error) {
    console.error("Failed to update email:", error);
    throw error;
  }
};

/**
 * Export a campaign in various formats
 */
export const exportCampaign = async (
  campaignId: string,
  format: "json" | "txt" | "csv" = "txt"
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/export?format=${format}`);

    if (!response.ok) {
      throw new Error("Failed to export campaign");
    }

    if (format === "json") {
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error("Failed to export campaign:", error);
    throw error;
  }
};

/**
 * Helper to parse send timing strings like "Day 1", "Immediately" to day offset numbers
 */
function parseDayOffset(timing: string | undefined): number {
  if (!timing) return 0;
  if (timing.toLowerCase() === "immediately") return 0;

  const match = timing.match(/day\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}
