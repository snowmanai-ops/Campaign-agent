import { FullContext, Campaign, Email, CampaignGoal } from "../types";
import { buildAudienceDescription } from "../utils";

/** Safely coerce a value to an array — handles null, undefined, strings, and non-arrays from AI responses */
const toArray = (val: any): any[] => Array.isArray(val) ? val : [];

// API base URL - change this for production
declare const process: { env: { API_URL?: string } };
const API_BASE = process.env.API_URL || "http://localhost:8000";

// --- Auth state for premium users (set by React app) ---
let _authToken: string | null = null;
let _workspaceId: string | null = null;

/** Called by App.tsx to keep API service in sync with current session + workspace */
export function setApiAuth(token: string | null, workspaceId: string | null) {
  _authToken = token;
  _workspaceId = workspaceId;
}

/** Thrown when the backend returns 429 (daily usage limit reached) */
export class RateLimitError extends Error {
  constructor(message = "Daily usage limit reached. Add your own API key or try again tomorrow.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Parse email body from API response — handles string, sectioned object, or missing body */
function parseEmailBody(body: any): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (typeof body === "object") {
    const sections = [body.hook, body.context, body.value, body.cta, body.signoff || body.signOff];
    const joined = sections.filter(Boolean).join("\n\n");
    if (joined) return joined;
  }
  return "";
}

/** Build common headers for API requests — includes auth + workspace headers when available */
function getHeaders(contentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = "application/json";
  if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;
  if (_workspaceId) headers["X-Workspace-Id"] = _workspaceId;
  return headers;
}

/** Check response for rate limiting before returning */
async function checkResponse(response: Response): Promise<Response> {
  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    throw new RateLimitError(data.detail || undefined);
  }
  return response;
}

/**
 * Analyze raw text input and extract structured context (brand, audience, offer)
 */
export const analyzeContext = async (inputText: string): Promise<FullContext> => {
  try {
    const rawResponse = await fetch(`${API_BASE}/api/context/process`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        raw_text: inputText,
        input_type: "text",
        template_fields: {
          brand: ["name", "tagline", "mission", "voice_characteristics", "tone_scale", "dos", "donts", "vocabulary"],
          audience: ["job_titles", "industries", "company_size", "revenue_range", "goals", "values", "fears", "objections", "pain_points", "desired_transformation", "buying_triggers"],
          offer: ["product_name", "one_liner", "features_benefits", "usp", "pricing", "guarantees", "bonuses", "case_studies", "testimonials", "brand_story", "social_proof_stats", "persona_types"]
        }
      }),
    });
    const response = await checkResponse(rawResponse);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to analyze context");
    }

    const data = await response.json();

    const voiceCharacteristics = toArray(data.brand?.voice_characteristics);
    const jobTitles = toArray(data.audience?.job_titles);
    const industries = toArray(data.audience?.industries);
    const goals = toArray(data.audience?.goals);
    const usp = data.offer?.usp || "";

    return {
      brand: {
        name: data.brand?.name || "Unknown Brand",
        tagline: data.brand?.tagline || "",
        mission: data.brand?.mission || "",
        voiceCharacteristics,
        toneScale: {
          formalCasual: data.brand?.tone_scale?.formal_casual ?? 5,
          seriousHumorous: data.brand?.tone_scale?.serious_humorous ?? 5,
          respectfulIrreverent: data.brand?.tone_scale?.respectful_irreverent ?? 5,
        },
        dos: toArray(data.brand?.dos),
        donts: toArray(data.brand?.donts),
        keywords: toArray(data.brand?.vocabulary?.preferred),
        avoidWords: toArray(data.brand?.vocabulary?.avoid),
        voice: voiceCharacteristics.join(", ") || "Professional",
      },
      audience: {
        jobTitles,
        industries,
        companySize: data.audience?.company_size || "",
        revenueRange: data.audience?.revenue_range || "",
        goals,
        values: toArray(data.audience?.values),
        fears: toArray(data.audience?.fears),
        objections: toArray(data.audience?.objections),
        painPoints: toArray(data.audience?.pain_points),
        desiredTransformation: data.audience?.desired_transformation || "",
        buyingTriggers: toArray(data.audience?.buying_triggers),
        description: buildAudienceDescription({ jobTitles, industries }),
        desires: goals,
      },
      offer: {
        name: data.offer?.product_name || "Product",
        pitch: data.offer?.one_liner || "",
        featuresBenefits: toArray(data.offer?.features_benefits).map((fb: any) => ({
          feature: fb.feature || "",
          benefit: fb.benefit || "",
          outcome: fb.outcome || "",
        })),
        usp,
        pricing: data.offer?.pricing || "",
        guarantees: data.offer?.guarantees || "",
        bonuses: toArray(data.offer?.bonuses),
        caseStudies: toArray(data.offer?.case_studies).map((cs: any) => ({
          company: cs.company || "",
          challenge: cs.challenge || "",
          result: cs.result || "",
          metric: cs.metric || "",
        })),
        testimonials: toArray(data.offer?.testimonials).map((t: any) => ({
          quote: t.quote || "",
          author: t.author || "",
          role: t.role || "",
          company: t.company || "",
        })),
        brandStory: typeof data.offer?.brand_story === "string" ? data.offer.brand_story : "",
        socialProofStats: toArray(data.offer?.social_proof_stats),
        personaTypes: toArray(data.offer?.persona_types).map((p: any) => ({
          label: p.label || "",
          description: p.description || "",
        })),
        details: usp,
      },
      isComplete: true,
    };
  } catch (error) {
    console.error("Context analysis failed:", error);
    throw new Error("Failed to analyze context. Make sure the API server is running.");
  }
};

/**
 * Extract text from an uploaded file (PDF, DOCX, TXT, MD, CSV)
 */
export const extractTextFromFile = async (file: File): Promise<{ text: string; filename: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("extract_only", "true");

  const rawResponse = await fetch(`${API_BASE}/api/context/process/file`, {
    method: "POST",
    headers: getHeaders(false),
    body: formData,
  });
  const response = await checkResponse(rawResponse);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to extract text from file" }));
    throw new Error(error.detail || "Failed to extract text from file");
  }

  return response.json();
};

/**
 * Scrape a URL and extract visible text content
 */
export const extractTextFromUrl = async (url: string): Promise<{ text: string; url: string; title: string }> => {
  const rawResponse = await fetch(`${API_BASE}/api/context/process/url`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ url }),
  });
  const response = await checkResponse(rawResponse);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to extract text from URL" }));
    throw new Error(error.detail || "Failed to extract text from URL");
  }

  return response.json();
};

/**
 * Save context to the backend (persists to .agent/context/*.md files)
 */
export const saveContext = async (context: FullContext): Promise<void> => {
  try {
    const apiContext = {
      brand: {
        name: context.brand.name,
        tagline: context.brand.tagline,
        mission: context.brand.mission,
        voice_characteristics: context.brand.voiceCharacteristics,
        tone_scale: {
          formal_casual: context.brand.toneScale.formalCasual,
          serious_humorous: context.brand.toneScale.seriousHumorous,
          respectful_irreverent: context.brand.toneScale.respectfulIrreverent,
        },
        dos: context.brand.dos,
        donts: context.brand.donts,
        vocabulary: {
          preferred: context.brand.keywords,
          avoid: context.brand.avoidWords,
        },
        example_copy: [],
      },
      audience: {
        job_titles: context.audience.jobTitles,
        industries: context.audience.industries,
        company_size: context.audience.companySize,
        revenue_range: context.audience.revenueRange,
        goals: context.audience.goals,
        values: context.audience.values,
        fears: context.audience.fears,
        objections: context.audience.objections,
        pain_points: context.audience.painPoints,
        desired_transformation: context.audience.desiredTransformation,
        buying_triggers: context.audience.buyingTriggers,
      },
      offer: {
        product_name: context.offer.name,
        one_liner: context.offer.pitch,
        features_benefits: context.offer.featuresBenefits.map(fb => ({
          feature: fb.feature,
          benefit: fb.benefit,
          outcome: fb.outcome,
        })),
        usp: context.offer.usp,
        pricing: context.offer.pricing,
        guarantees: context.offer.guarantees,
        bonuses: context.offer.bonuses,
        case_studies: (context.offer.caseStudies || []).map(cs => ({
          company: cs.company,
          challenge: cs.challenge,
          result: cs.result,
          metric: cs.metric,
        })),
        testimonials: (context.offer.testimonials || []).map(t => ({
          quote: t.quote,
          author: t.author,
          role: t.role,
          company: t.company,
        })),
        brand_story: context.offer.brandStory || "",
        social_proof_stats: context.offer.socialProofStats || [],
        persona_types: (context.offer.personaTypes || []).map(p => ({
          label: p.label,
          description: p.description,
        })),
      },
    };

    const rawResponse = await fetch(`${API_BASE}/api/context/save-processed`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(apiContext),
    });
    const response = await checkResponse(rawResponse);

    if (!response.ok) {
      throw new Error("Failed to save context");
    }
  } catch (error) {
    console.error("Failed to save context:", error);
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
    const rawCampaignResponse = await fetch(`${API_BASE}/api/campaigns/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        campaign_type: goal,
        additional_details: additionalDetails || null,
      }),
    });
    const response = await checkResponse(rawCampaignResponse);

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
      body: parseEmailBody(e.body),
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
    const rawResponse = await fetch(`${API_BASE}/api/campaigns/${campaignId}`, {
      headers: getHeaders(false),
    });
    const response = await checkResponse(rawResponse);

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
      body: parseEmailBody(e.body),
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
      apiUpdates.body = updates.body;
    }

    const rawResponse = await fetch(`${API_BASE}/api/campaigns/${campaignId}/emails/${emailId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(apiUpdates),
    });
    const response = await checkResponse(rawResponse);

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
    const rawResponse = await fetch(`${API_BASE}/api/campaigns/${campaignId}/export?format=${format}`, {
      headers: getHeaders(false),
    });
    const response = await checkResponse(rawResponse);

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
 * Get current usage stats for the authenticated user
 */
export const getUsage = async (): Promise<{
  campaigns_today: number;
  daily_limit: number;
  has_own_key: boolean;
}> => {
  const response = await fetch(`${API_BASE}/api/usage/`, {
    headers: getHeaders(false),
  });
  await checkResponse(response);
  if (!response.ok) throw new Error("Failed to fetch usage");
  return response.json();
};

/**
 * Save or remove the user's own API key
 */
export const setUserApiKey = async (apiKey: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/usage/api-key`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ api_key: apiKey }),
  });
  await checkResponse(response);
  if (!response.ok) throw new Error("Failed to save API key");
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
