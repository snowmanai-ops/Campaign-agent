import { supabase } from '@/lib/supabase';
import type { FullContext, Campaign } from '@/types';

// --- Workspace ---

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  brand_context: any;
  audience_context: any;
  offer_context: any;
  is_default: boolean;
  created_at: string;
}

export async function getOrCreateDefaultWorkspace(userId: string): Promise<Workspace> {
  // Try to find existing default workspace
  const { data: existing, error: fetchErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (existing) return existing as Workspace;

  // Create default workspace
  const { data: created, error: createErr } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      name: 'My Brand',
      is_default: true,
      brand_context: {},
      audience_context: {},
      offer_context: {},
    })
    .select()
    .single();

  if (createErr) throw new Error(`Failed to create workspace: ${createErr.message}`);
  return created as Workspace;
}

export async function saveWorkspaceContext(
  workspaceId: string,
  context: FullContext
): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .update({
      brand_context: context.brand,
      audience_context: context.audience,
      offer_context: context.offer,
    })
    .eq('id', workspaceId);

  if (error) throw new Error(`Failed to save context: ${error.message}`);
}

export function workspaceToContext(workspace: Workspace): FullContext | null {
  // If workspace has no context data yet, return null
  if (!workspace.brand_context?.name && !workspace.audience_context?.jobTitles?.length) {
    return null;
  }

  return {
    brand: workspace.brand_context || {},
    audience: workspace.audience_context || {},
    offer: workspace.offer_context || {},
    isComplete: true,
  };
}

// --- Campaigns ---

export async function loadCampaigns(
  userId: string,
  workspaceId: string
): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load campaigns: ${error.message}`);

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    goal: row.goal,
    status: row.status,
    emails: row.emails || [],
    createdAt: row.created_at,
    lastEditedAt: row.updated_at,
  }));
}

export async function saveCampaign(
  userId: string,
  workspaceId: string,
  campaign: Campaign
): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .upsert({
      id: campaign.id,
      user_id: userId,
      workspace_id: workspaceId,
      name: campaign.name,
      goal: campaign.goal,
      status: campaign.status,
      emails: campaign.emails,
      created_at: campaign.createdAt,
      updated_at: campaign.lastEditedAt || new Date().toISOString(),
    });

  if (error) throw new Error(`Failed to save campaign: ${error.message}`);
}

export async function deleteCampaignFromDb(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
}

// --- Workspace Management ---

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to list workspaces: ${error.message}`);
  return (data || []) as Workspace[];
}

export async function createWorkspace(
  userId: string,
  name: string
): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      name,
      is_default: false,
      brand_context: {},
      audience_context: {},
      offer_context: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create workspace: ${error.message}`);
  return data as Workspace;
}

export async function renameWorkspace(
  workspaceId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', workspaceId);

  if (error) throw new Error(`Failed to rename workspace: ${error.message}`);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw new Error(`Failed to delete workspace: ${error.message}`);
}
