import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { CampaignBuilder } from './pages/CampaignBuilder';
import { CampaignView } from './pages/CampaignView';
import { Login } from './pages/Login';
import { UpgradeSuccess } from './pages/UpgradeSuccess';
import { AuthProvider, useAuthContext } from './hooks/useAuth';
import { FullContext, Campaign, UserState } from './types';
import { buildAudienceDescription } from './utils';
import {
  getOrCreateDefaultWorkspace,
  cleanupDuplicateDefaultWorkspaces,
  saveWorkspaceContext,
  workspaceToContext,
  loadCampaigns,
  saveCampaign,
  deleteCampaignFromDb,
  listWorkspaces,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  Workspace,
} from './services/supabaseService';
import { setApiAuth } from './services/apiService';

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
  dataLoading: boolean;
  // Workspace management
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  switchWorkspace: (workspaceId: string) => void;
  handleCreateWorkspace: (name: string) => void;
  handleRenameWorkspace: (workspaceId: string, name: string) => void;
  handleDeleteWorkspace: (workspaceId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};

const LoadingScreen = () => {
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
      {showHint && (
        <p className="text-sm text-gray-400">Taking longer than expected...</p>
      )}
    </div>
  );
};

// Inner component that has access to auth context
const AppInner: React.FC = () => {
  const { user, session, loading: authLoading } = useAuthContext();
  const [context, setContextState] = useState<FullContext | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const loadedForUserId = useRef<string | null>(null);
  const userId = user?.id || null;

  // Hard safety timeout — never stay loading forever (independent of effect lifecycle)
  useEffect(() => {
    if (!dataLoading) return;
    const timer = setTimeout(() => {
      console.warn('[App] Force-ending loading after 10s. authLoading:', authLoading, 'userId:', userId);
      setDataLoading(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [dataLoading, authLoading, userId]);

  // Keep apiService auth state in sync with current session + workspace
  useEffect(() => {
    setApiAuth(session?.access_token || null, activeWorkspaceId);
  }, [session, activeWorkspaceId]);

  // Load workspace data for a specific workspace
  const loadWorkspaceData = useCallback(async (userId: string, workspace: Workspace) => {
    const ctx = workspaceToContext(workspace);
    if (ctx) {
      setContextState(migrateContext(ctx));
    } else {
      setContextState(null);
    }
    const camps = await loadCampaigns(userId, workspace.id);
    setCampaigns(camps);
    setActiveWorkspaceId(workspace.id);
  }, []);

  // Load data: from Supabase if logged in, from sessionStorage if anonymous
  useEffect(() => {
    console.log('[App] Data effect:', { authLoading, userId, loadedFor: loadedForUserId.current });
    if (authLoading) {
      console.log('[App] Auth still loading, skipping data load');
      return;
    }

    if (userId) {
      // Already loaded for this user — skip
      if (loadedForUserId.current === userId) {
        console.log('[App] Already loaded for this user, skipping');
        return;
      }
      loadedForUserId.current = userId;

      setDataLoading(true);
      console.log('[App] Starting Supabase data load for user:', userId);

      (async () => {
        try {
          console.log('[App] Creating/getting default workspace...');
          await getOrCreateDefaultWorkspace(userId);
          console.log('[App] Cleaning up duplicate defaults...');
          await cleanupDuplicateDefaultWorkspaces(userId);
          console.log('[App] Loading workspaces...');
          const allWorkspaces = await listWorkspaces(userId);
          console.log('[App] Got workspaces:', allWorkspaces.length);
          setWorkspaces(allWorkspaces);

          const defaultWs = allWorkspaces.find(w => w.is_default) || allWorkspaces[0];
          if (defaultWs) {
            console.log('[App] Loading workspace data for:', defaultWs.name);
            await loadWorkspaceData(userId, defaultWs);
          }
        } catch (err) {
          console.error('[App] Failed to load from Supabase:', err);
        }
        console.log('[App] Data loading complete');
        setDataLoading(false);
      })();
    } else {
      // Anonymous: load from sessionStorage
      loadedForUserId.current = null;
      localStorage.removeItem('emailAgentApiKey');
      localStorage.removeItem('emailAgentApiProvider');
      localStorage.removeItem('emailAgentState');

      const saved = sessionStorage.getItem('emailAgentState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.context) setContextState(migrateContext(parsed.context));
          if (parsed.campaigns) setCampaigns(parsed.campaigns);
        } catch (e) {
          console.error('Failed to parse session state:', e);
        }
      }
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      setDataLoading(false);
    }
  }, [userId, authLoading, loadWorkspaceData]);

  // Save to sessionStorage for anonymous users
  useEffect(() => {
    if (!loadedForUserId.current && !userId) {
      sessionStorage.setItem('emailAgentState', JSON.stringify({ context, campaigns }));
    }
  }, [context, campaigns, userId]);

  // --- Workspace actions ---

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user || workspaceId === activeWorkspaceId) return;
    setDataLoading(true);
    try {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        await loadWorkspaceData(user.id, ws);
      }
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
    setDataLoading(false);
  }, [user, activeWorkspaceId, workspaces, loadWorkspaceData]);

  const handleCreateWorkspace = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const newWs = await createWorkspace(user.id, name);
      setWorkspaces(prev => [...prev, newWs]);
      // Switch to the new workspace
      setDataLoading(true);
      await loadWorkspaceData(user.id, newWs);
      setDataLoading(false);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  }, [user, loadWorkspaceData]);

  const handleRenameWorkspace = useCallback(async (workspaceId: string, name: string) => {
    try {
      await renameWorkspace(workspaceId, name);
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, name } : w));
    } catch (err) {
      console.error('Failed to rename workspace:', err);
    }
  }, []);

  const handleDeleteWorkspace = useCallback(async (workspaceId: string) => {
    if (!user) return;
    try {
      await deleteWorkspace(workspaceId);
      const remaining = workspaces.filter(w => w.id !== workspaceId);
      setWorkspaces(remaining);

      // If we deleted the active workspace, switch to default
      if (workspaceId === activeWorkspaceId && remaining.length > 0) {
        const defaultWs = remaining.find(w => w.is_default) || remaining[0];
        setDataLoading(true);
        await loadWorkspaceData(user.id, defaultWs);
        setDataLoading(false);
      }
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  }, [user, workspaces, activeWorkspaceId, loadWorkspaceData]);

  // --- Data actions ---

  const setContext = useCallback((newContext: FullContext) => {
    setContextState(newContext);

    if (user && activeWorkspaceId) {
      saveWorkspaceContext(activeWorkspaceId, newContext).catch((err) =>
        console.error('Failed to save context to Supabase:', err)
      );
      // Keep local workspaces array in sync so switchWorkspace uses fresh data
      setWorkspaces(prev => prev.map(w =>
        w.id === activeWorkspaceId
          ? { ...w, brand_context: newContext.brand, audience_context: newContext.audience, offer_context: newContext.offer }
          : w
      ));
    }
  }, [user, activeWorkspaceId]);

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);

    if (user && activeWorkspaceId) {
      saveCampaign(user.id, activeWorkspaceId, campaign).catch((err) =>
        console.error('Failed to save campaign to Supabase:', err)
      );
    }
  }, [user, activeWorkspaceId]);

  const updateCampaign = useCallback((id: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      const updatedCampaign = updated.find(c => c.id === id);

      if (user && activeWorkspaceId && updatedCampaign) {
        saveCampaign(user.id, activeWorkspaceId, updatedCampaign).catch((err) =>
          console.error('Failed to update campaign in Supabase:', err)
        );
      }

      return updated;
    });
  }, [user, activeWorkspaceId]);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));

    if (user) {
      deleteCampaignFromDb(id).catch((err) =>
        console.error('Failed to delete campaign from Supabase:', err)
      );
    }
  }, [user]);

  return (
    <AppContext.Provider value={{
      context: context!,
      userContext: context!,
      campaigns,
      setContext,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      dataLoading,
      workspaces,
      activeWorkspaceId,
      switchWorkspace,
      handleCreateWorkspace,
      handleRenameWorkspace,
      handleDeleteWorkspace,
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            dataLoading ? <LoadingScreen /> :
            (context || workspaces.length > 0) ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/upgrade-success" element={<UpgradeSuccess />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={
            dataLoading ? <LoadingScreen /> :
            (context || workspaces.length > 0) ? <Dashboard /> : <Navigate to="/onboarding" />
          } />
          <Route path="/campaigns/new" element={
            dataLoading ? <LoadingScreen /> :
            context ? <CampaignBuilder /> :
            workspaces.length > 0 ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />
          } />
          <Route path="/campaigns/:id" element={
            dataLoading ? <LoadingScreen /> :
            context ? <CampaignView /> :
            workspaces.length > 0 ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />
          } />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
};

export default App;
