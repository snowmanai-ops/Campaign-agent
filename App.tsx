import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { CampaignBuilder } from './pages/CampaignBuilder';
import { CampaignView } from './pages/CampaignView';
import { FullContext, Campaign, UserState } from './types';

// --- State Management ---
interface AppContextType extends UserState {
  setContext: (context: FullContext) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
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

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('emailAgentState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.context) setContextState(parsed.context);
      if (parsed.campaigns) setCampaigns(parsed.campaigns);
    }
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

  return (
    <AppContext.Provider value={{ 
      context: context!, 
      userContext: context!, 
      campaigns, 
      setContext, 
      addCampaign, 
      updateCampaign,
      deleteCampaign
    } as any}>
      <HashRouter>
        <Routes>
          <Route path="/" element={context ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={context ? <Dashboard /> : <Navigate to="/onboarding" />} />
          <Route path="/campaigns/new" element={context ? <CampaignBuilder /> : <Navigate to="/onboarding" />} />
          <Route path="/campaigns/:id" element={context ? <CampaignView /> : <Navigate to="/onboarding" />} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
