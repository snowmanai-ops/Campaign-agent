# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas UI implementation requires pixel-perfect consistency. This system fixes that mismatch.

## Project Context

This is an **Email Marketing Campaign Agent** — a React web app where users onboard their brand, build AI-powered email campaigns, and manage campaign sequences.

**Tech Stack:**
- React 19 + TypeScript (strict)
- Vite (dev server on port 3000)
- Tailwind CSS (CDN via `index.html`)
- Lucide React (icon library — **never use emojis as icons**)
- React Router v7 (HashRouter)
- Local storage for state persistence

**Run locally:** `npm run dev` → `http://localhost:3000`
**Build:** `npm run build`

## The 3-Layer Architecture

**Layer 1: Design System (What it should look like)**
- The UI/UX Pro Max skill lives in `.claude/skills/ui-ux-pro-max/`
- Contains 67 styles, 96 color palettes, 57 font pairings, and 100 industry reasoning rules
- Generate a design system before building: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --design-system`
- Persist design decisions to `design-system/MASTER.md` with `--persist` flag
- Design system is the source of truth — every UI decision traces back to it

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing between design intent and implementation.
- Read the design system, pick the right components, apply the right patterns, handle edge cases
- You don't guess at colors or fonts — you run the design system generator and follow its output
- When something looks off, you search the skill database for the right fix, not improvise

**Layer 3: Implementation (Building the UI)**
- React components in `pages/` and `components/`
- Reusable primitives in `components/ui.tsx` (Button, Card, Badge, Input, Textarea)
- API integration in `services/apiService.ts`
- Type definitions in `types.ts`
- All styling via Tailwind utility classes — no custom CSS files

**Why this works:** if you eyeball colors, guess spacing, and wing typography, quality degrades across pages. 90% accuracy per decision = 59% success over 5 decisions. The solution: push design choices into a deterministic design system. You just implement.

## File Structure

```
Campaign-agent/
├── index.html              # Entry point (Tailwind CDN, Inter font, base styles)
├── index.tsx               # React root mount
├── App.tsx                 # Router + global state (Context API + localStorage)
├── types.ts                # TypeScript interfaces (Brand, Audience, Offer, Campaign, Email)
├── vite.config.ts          # Vite config (aliases @ → root, API_URL env)
├── components/
│   └── ui.tsx              # Shared UI primitives (Button, Card, Badge, Input, Textarea)
├── pages/
│   ├── Onboarding.tsx      # Brand/audience/offer setup wizard
│   ├── Dashboard.tsx       # Campaign list + overview
│   ├── CampaignBuilder.tsx # Create new campaigns
│   └── CampaignView.tsx    # View/edit individual campaigns
├── services/
│   └── apiService.ts       # Backend API calls (context, campaigns, export)
└── .claude/skills/         # UI/UX Pro Max skill (design intelligence)
```

## Operating Principles

**1. Check existing components first**
Before creating a new component, check `components/ui.tsx`. Extend existing primitives rather than creating parallel ones. If a variant is needed (e.g., a new Button style), add it to the existing component.

**2. Design system before code**
Before building any new page or major UI change, generate a design system recommendation:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "email marketing SaaS dashboard" --design-system -p "Campaign Agent"
```
For stack-specific patterns:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "form layout responsive" --stack react
```

**3. Self-anneal when things look wrong**
- Screenshot or describe the visual issue
- Search the skill for the right fix: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "contrast spacing" --domain ux`
- Fix the component, verify it works
- If the fix reveals a pattern (e.g., "all cards need consistent padding"), apply it globally
- Update `design-system/MASTER.md` with the learning

**4. Consistency over creativity**
- Same spacing scale everywhere (Tailwind's default: 4, 6, 8, 12, 16, 24)
- Same border radius across similar elements (currently `rounded-xl` for inputs, `rounded-2xl` for cards)
- Same shadow system (`shadow-sm` for buttons, `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` for cards)
- Same color tokens for same meanings (e.g., success = emerald, warning = amber, danger = red)
- Same transition timing (`transition-all duration-200`)

## UI Development Rules

**Styling:**
- All styles via Tailwind classes — no inline style objects, no CSS modules
- Tailwind is loaded via CDN in `index.html`, not PostCSS
- Inter is the base font (loaded via Google Fonts in `index.html`)
- Base theme: light mode, `bg-gray-50` body, `text-slate-900` body text
- Use `@` path alias for imports (e.g., `import { Button } from '@/components/ui'`)

**Components:**
- Shared primitives live in `components/ui.tsx` — keep this file as the single source of truth for base elements
- Page components live in `pages/` — each page is self-contained with its own layout
- Props interfaces go above the component in the same file
- Export named components (not default) from component files; default export only for `App.tsx`

**Icons:**
- Use Lucide React exclusively: `import { IconName } from 'lucide-react'`
- Standard size: `className="w-5 h-5"` (or `w-4 h-4` for small contexts)
- Never use emojis as functional icons

**State:**
- Global state via React Context in `App.tsx` (useAppStore hook)
- State persists to localStorage automatically
- Local UI state (modals, form inputs, loading) stays in the component via useState

**Routing:**
- HashRouter (for static hosting compatibility)
- Routes: `/onboarding`, `/dashboard`, `/campaigns/new`, `/campaigns/:id`
- Protected routes redirect to `/onboarding` if context is null

**API:**
- All API calls go through `services/apiService.ts`
- Base URL from `VITE_API_URL` env var, defaults to `http://localhost:8000`
- Errors are caught and re-thrown with user-friendly messages

## Pre-Delivery Checklist

Before considering any UI work complete:

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states use smooth transitions (`duration-200`)
- [ ] Focus states visible for keyboard navigation
- [ ] Text contrast is 4.5:1 minimum against background
- [ ] Icons are from Lucide (no emojis)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Loading states shown during async operations
- [ ] Error states shown when API calls fail
- [ ] All form inputs have visible labels
- [ ] `prefers-reduced-motion` respected for animations

## Self-Annealing Loop

Errors and visual issues are learning opportunities. When something breaks or looks wrong:
1. Identify the root cause (wrong token, missing class, bad spacing)
2. Fix it in the component
3. Check if the same issue exists elsewhere — fix globally if so
4. Update `design-system/MASTER.md` if it reveals a pattern
5. System is now stronger

## Deployment

- **Repo:** `https://github.com/snowmanai-ops/Campaign-agent`
- **Build:** `npm run build` outputs to `dist/`
- Never commit `.env`, `node_modules/`, or `dist/` to git
- Push changes back to the repo when ready to deploy

## Summary

You sit between design intent (the skill's design system) and deterministic implementation (React components with Tailwind). Generate the design system, make decisions, implement with precision, self-anneal when things drift.

Be consistent. Be pixel-precise. Self-anneal.
