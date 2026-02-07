import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { CampaignBuilder } from './pages/CampaignBuilder';
import { CampaignView } from './pages/CampaignView';
import { ApiKeySetup } from './pages/ApiKeySetup';
import { FullContext, Campaign, UserState } from './types';
import { buildAudienceDescription } from './utils';

function migrateContext(ctx: any): FullContext {
  return {
    brand: {
      name: ctx.brand?.name || "",
      tagline: ctx.brand?.tagline || "",
      mission: ctx.brand?.mission || "",
      voiceCharacteristics: ctx.brand?.voiceCharacteristics ||
        (ctx.brand?.voice ? ctx.brand.voice.split(", ").filter(Boolean) : []),
      toneScale: ctx.brand?.toneScale || { formalCasual: 5, seriousHumorous: 5, respectfulIrreverent: 5 },
      dos: ctx.brand?.dos || [],
      donts: ctx.brand?.donts || [],
      keywords: ctx.brand?.keywords || [],
      avoidWords: ctx.brand?.avoidWords || [],
      voice: ctx.brand?.voice || (ctx.brand?.voiceCharacteristics || []).join(", ") || "",
    },
    audience: {
      jobTitles: ctx.audience?.jobTitles || [],
      industries: ctx.audience?.industries || [],
      companySize: ctx.audience?.companySize || "",
      revenueRange: ctx.audience?.revenueRange || "",
      goals: ctx.audience?.goals || ctx.audience?.desires || [],
      values: ctx.audience?.values || [],
      fears: ctx.audience?.fears || [],
      objections: ctx.audience?.objections || [],
      painPoints: ctx.audience?.painPoints || [],
      desiredTransformation: ctx.audience?.desiredTransformation || "",
      buyingTriggers: ctx.audience?.buyingTriggers || [],
      description: ctx.audience?.description || "",
      desires: ctx.audience?.desires || ctx.audience?.goals || [],
    },
    offer: {
      name: ctx.offer?.name || "",
      pitch: ctx.offer?.pitch || "",
      featuresBenefits: ctx.offer?.featuresBenefits || [],
      usp: ctx.offer?.usp || ctx.offer?.details || "",
      pricing: ctx.offer?.pricing || "",
      guarantees: ctx.offer?.guarantees || "",
      bonuses: ctx.offer?.bonuses || [],
      caseStudies: ctx.offer?.caseStudies || [],
      testimonials: ctx.offer?.testimonials || [],
      brandStory: ctx.offer?.brandStory || "",
      socialProofStats: ctx.offer?.socialProofStats || [],
      personaTypes: ctx.offer?.personaTypes || [],
      details: ctx.offer?.details || ctx.offer?.usp || "",
    },
    isComplete: ctx.isComplete ?? true,
  };
}

// --- State Management ---
interface AppContextType extends UserState {
  setContext: (context: FullContext) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  apiKey: string | null;
  apiProvider: 'openai' | 'anthropic' | null;
  setApiKey: (provider: 'openai' | 'anthropic', key: string) => void;
  clearApiKey: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [context, setContextState] = useState<FullContext | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [apiProvider, setApiProviderState] = useState<'openai' | 'anthropic' | null>(null);

  // Load from local storage on mount (with migration for old format)
  useEffect(() => {
    const saved = localStorage.getItem('emailAgentState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.context) setContextState(migrateContext(parsed.context));
      if (parsed.campaigns) setCampaigns(parsed.campaigns);
    }
    // Load API key separately (more secure than bundling with other state)
    const savedKey = localStorage.getItem('emailAgentApiKey');
    const savedProvider = localStorage.getItem('emailAgentApiProvider') as 'openai' | 'anthropic' | null;
    if (savedKey) setApiKeyState(savedKey);
    if (savedProvider) setApiProviderState(savedProvider);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('emailAgentState', JSON.stringify({ context, campaigns }));
  }, [context, campaigns]);

  const setContext = (newContext: FullContext) => {
    setContextState(newContext);
  };

  const addCampaign = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const setApiKey = (provider: 'openai' | 'anthropic', key: string) => {
    setApiKeyState(key);
    setApiProviderState(provider);
    localStorage.setItem('emailAgentApiKey', key);
    localStorage.setItem('emailAgentApiProvider', provider);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    setApiProviderState(null);
    localStorage.removeItem('emailAgentApiKey');
    localStorage.removeItem('emailAgentApiProvider');
  };

  const hasApiKey = !!apiKey;

  return (
    <AppContext.Provider value={{
      context: context!,
      userContext: context!,
      campaigns,
      setContext,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      apiKey,
      apiProvider,
      setApiKey,
      clearApiKey,
    } as any}>
      <HashRouter>
        <Routes>
          <Route path="/setup" element={
            <ApiKeySetup
              onSave={(provider, key) => setApiKey(provider, key)}
              existingProvider={apiProvider}
              existingKey={apiKey}
            />
          } />
          <Route path="/" element={
            context ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />
          } />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={
            !hasApiKey ? <Navigate to="/setup" /> :
            context ? <Dashboard /> : <Navigate to="/onboarding" />
          } />
          <Route path="/campaigns/new" element={
            !hasApiKey ? <Navigate to="/setup" /> :
            context ? <CampaignBuilder /> : <Navigate to="/onboarding" />
          } />
          <Route path="/campaigns/:id" element={
            !hasApiKey ? <Navigate to="/setup" /> :
            context ? <CampaignView /> : <Navigate to="/onboarding" />
          } />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
