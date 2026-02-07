/**
 * Build a human-readable audience description from structured data.
 * Shared utility used by App.tsx, apiService.ts, and Onboarding.tsx.
 */
export function buildAudienceDescription(audience: any): string {
  const titles = Array.isArray(audience?.jobTitles) ? audience.jobTitles.join(", ") : "";
  const industries = Array.isArray(audience?.industries) ? audience.industries.join(", ") : "";
  if (titles && industries) return `${titles} in ${industries}`;
  return titles || industries || audience?.description || "Target audience";
}
