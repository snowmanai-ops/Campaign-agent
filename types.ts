export interface ToneScale {
  formalCasual: number;        // 1-10
  seriousHumorous: number;     // 1-10
  respectfulIrreverent: number; // 1-10
}

export interface FeatureBenefit {
  feature: string;
  benefit: string;
  outcome: string;
}

export interface CaseStudy {
  company: string;
  challenge: string;
  result: string;
  metric: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface PersonaType {
  label: string;
  description: string;
}

export interface BrandContext {
  // Core Identity
  name: string;
  tagline: string;
  mission: string;

  // Voice
  voiceCharacteristics: string[];
  toneScale: ToneScale;

  // Style Guidelines
  dos: string[];
  donts: string[];

  // Vocabulary
  keywords: string[];
  avoidWords: string[];

  // Backward compat (computed from voiceCharacteristics)
  voice: string;
}

export interface AudienceContext {
  // Demographics
  jobTitles: string[];
  industries: string[];
  companySize: string;
  revenueRange: string;

  // Psychographics
  goals: string[];
  values: string[];
  fears: string[];
  objections: string[];

  // Before/After
  painPoints: string[];
  desiredTransformation: string;

  // Buying
  buyingTriggers: string[];

  // Backward compat (computed from jobTitles + industries)
  description: string;
  desires: string[];
}

export interface OfferContext {
  // Core
  name: string;
  pitch: string;

  // Features
  featuresBenefits: FeatureBenefit[];

  // USP
  usp: string;

  // Pricing & Guarantee
  pricing: string;
  guarantees: string;
  bonuses: string[];

  // Social Proof
  caseStudies: CaseStudy[];
  testimonials: Testimonial[];
  brandStory: string;
  socialProofStats: string[];

  // Persona Types
  personaTypes: PersonaType[];

  // Backward compat (alias for usp)
  details: string;
}

export interface FullContext {
  brand: BrandContext;
  audience: AudienceContext;
  offer: OfferContext;
  isComplete: boolean;
}

export interface Email {
  id: string;
  dayOffset: number; // 0 = Immediately, 1 = Day 1, etc.
  type: string; // "Welcome", "Value", "Sales"
  subject: string;
  previewText: string;
  body: string;
  status: 'draft' | 'ready';
}

export interface Campaign {
  id: string;
  name: string;
  goal: string; // e.g., "Welcome", "Nurture"
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  lastEditedAt: string;
  emails: Email[];
}

export type CampaignGoal =
  | 'welcome'
  | 'reengagement'
  | 'launch'
  | 'nurture'
  | 'onboarding'
  | 'custom';

export interface UserState {
  context: FullContext;
  campaigns: Campaign[];
}
