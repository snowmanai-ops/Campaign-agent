export interface BrandContext {
  name: string;
  voice: string;
  mission: string;
  keywords: string[];
}

export interface AudienceContext {
  description: string;
  painPoints: string[];
  desires: string[];
}

export interface OfferContext {
  name: string;
  pitch: string;
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