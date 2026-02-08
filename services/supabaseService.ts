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

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Premium features are unavailable.');
  return supabase;
}

export async function getOrCreateDefaultWorkspace(userId: string): Promise<Workspace> {
  const client = requireSupabase();
  // Use limit(1) instead of single() to handle 0, 1, or multiple defaults gracefully
  const { data: rows } = await client
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .order('created_at', { ascending: true })
    .limit(1);

  if (rows && rows.length > 0) return rows[0] as Workspace;

  // Create default workspace
  const { data: created, error: createErr } = await client
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

export async function cleanupDuplicateDefaultWorkspaces(userId: string): Promise<void> {
  const client = requireSupabase();

  const { data: defaults, error } = await client
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .order('created_at', { ascending: true });

  if (error || !defaults || defaults.length <= 1) return;

  const canonical = defaults[0];
  const duplicates = defaults.slice(1);

  for (const dup of duplicates) {
    const hasData = dup.brand_context?.name || dup.audience_context?.jobTitles?.length;

    if (hasData) {
      // Keep workspace but demote from default
      await client
        .from('workspaces')
        .update({
          is_default: false,
          name: dup.name === 'My Brand'
            ? `My Brand (${new Date(dup.created_at).toLocaleDateString()})`
            : dup.name,
        })
        .eq('id', dup.id);
    } else {
      // Empty duplicate — move campaigns to canonical, then delete
      await client
        .from('campaigns')
        .update({ workspace_id: canonical.id })
        .eq('workspace_id', dup.id);

      await client
        .from('workspaces')
        .delete()
        .eq('id', dup.id);
    }
  }
}

export async function saveWorkspaceContext(
  workspaceId: string,
  context: FullContext
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
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
  const b = workspace.brand_context;
  const a = workspace.audience_context;
  const o = workspace.offer_context;

  // Check if ANY section has meaningful data
  const hasData =
    b?.name || b?.tagline || b?.mission ||
    a?.jobTitles?.length || a?.industries?.length || a?.description ||
    o?.name || o?.pitch || o?.usp;

  if (!hasData) return null;

  return {
    brand: b || {},
    audience: a || {},
    offer: o || {},
    isComplete: true,
  };
}

// --- Campaigns ---

export async function loadCampaigns(
  userId: string,
  workspaceId: string
): Promise<Campaign[]> {
  const client = requireSupabase();
  const { data, error } = await client
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
  const client = requireSupabase();
  const { error } = await client
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
  const client = requireSupabase();
  const { error } = await client
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
}

// --- Workspace Management ---

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
  const client = requireSupabase();
  const { data, error } = await client
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
  const client = requireSupabase();
  const { data, error } = await client
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
  const client = requireSupabase();
  const { error } = await client
    .from('workspaces')
    .update({ name })
    .eq('id', workspaceId);

  if (error) throw new Error(`Failed to rename workspace: ${error.message}`);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw new Error(`Failed to delete workspace: ${error.message}`);
}
