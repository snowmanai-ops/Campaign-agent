import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { BrandContext, AudienceContext, OfferContext, FeatureBenefit, CaseStudy, Testimonial, PersonaType } from '../types';
import { Button, Input, Textarea, TagInput, RangeSlider } from './ui';

// =====================
// CONTEXT DRAWER
// =====================

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  color: 'indigo' | 'pink' | 'emerald';
  children: React.ReactNode;
}

const colorMap = {
  indigo: { accent: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
  pink: { accent: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-600' },
  emerald: { accent: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600' },
};

export const ContextDrawer: React.FC<ContextDrawerProps> = ({ isOpen, onClose, onSave, title, color, children }) => {
  const c = colorMap[color];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Color accent bar */}
        <div className={`h-1 ${c.accent}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-4 flex justify-end gap-3 bg-white">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Changes</Button>
        </div>
      </div>

      {/* Inline animation style */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

// =====================
// SECTION HEADER
// =====================

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-4 mt-8 first:mt-0">
    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h3>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

// =====================
// BRAND EDITOR
// =====================

interface BrandEditorProps {
  brand: BrandContext;
  onChange: (brand: BrandContext) => void;
}

export const BrandEditor: React.FC<BrandEditorProps> = ({ brand, onChange }) => {
  const [draft, setDraft] = useState<BrandContext>({ ...brand });

  // Sync draft if brand prop changes (e.g. re-analyze)
  useEffect(() => { setDraft({ ...brand }); }, [brand]);

  // Expose draft to parent via onChange on every change
  const update = (updates: Partial<BrandContext>) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Core Identity" />
      <Input
        label="Brand Name"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Your brand name"
      />
      <Input
        label="Tagline"
        value={draft.tagline}
        onChange={(e) => update({ tagline: e.target.value })}
        placeholder="Your brand tagline"
      />
      <Textarea
        label="Mission Statement"
        value={draft.mission}
        onChange={(e) => update({ mission: e.target.value })}
        placeholder="What is your brand's mission?"
        className="min-h-[80px]"
      />

      <SectionHeader title="Voice Characteristics" subtitle="How your brand sounds" />
      <TagInput
        label="Voice Traits"
        tags={draft.voiceCharacteristics}
        onChange={(voiceCharacteristics) => update({ voiceCharacteristics, voice: voiceCharacteristics.join(", ") })}
        placeholder="e.g. professional, friendly, bold..."
        color="indigo"
      />

      <SectionHeader title="Voice Scale" subtitle="Where does your brand fall on each spectrum?" />
      <RangeSlider
        leftLabel="Formal"
        rightLabel="Casual"
        value={draft.toneScale.formalCasual}
        onChange={(v) => update({ toneScale: { ...draft.toneScale, formalCasual: v } })}
      />
      <RangeSlider
        leftLabel="Serious"
        rightLabel="Humorous"
        value={draft.toneScale.seriousHumorous}
        onChange={(v) => update({ toneScale: { ...draft.toneScale, seriousHumorous: v } })}
      />
      <RangeSlider
        leftLabel="Respectful"
        rightLabel="Irreverent"
        value={draft.toneScale.respectfulIrreverent}
        onChange={(v) => update({ toneScale: { ...draft.toneScale, respectfulIrreverent: v } })}
      />

      <SectionHeader title="Style Guidelines" />
      <TagInput
        label="Do's"
        tags={draft.dos}
        onChange={(dos) => update({ dos })}
        placeholder="Things your brand should do..."
        color="indigo"
      />
      <TagInput
        label="Don'ts"
        tags={draft.donts}
        onChange={(donts) => update({ donts })}
        placeholder="Things your brand should avoid..."
        color="gray"
      />

      <SectionHeader title="Vocabulary" />
      <TagInput
        label="Words We Love"
        tags={draft.keywords}
        onChange={(keywords) => update({ keywords })}
        placeholder="Preferred words and phrases..."
        color="indigo"
      />
      <TagInput
        label="Words We Avoid"
        tags={draft.avoidWords}
        onChange={(avoidWords) => update({ avoidWords })}
        placeholder="Words to stay away from..."
        color="gray"
      />
    </div>
  );
};

// =====================
// AUDIENCE EDITOR
// =====================

interface AudienceEditorProps {
  audience: AudienceContext;
  onChange: (audience: AudienceContext) => void;
}

export const AudienceEditor: React.FC<AudienceEditorProps> = ({ audience, onChange }) => {
  const [draft, setDraft] = useState<AudienceContext>({ ...audience });

  useEffect(() => { setDraft({ ...audience }); }, [audience]);

  const update = (updates: Partial<AudienceContext>) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Demographics" subtitle="Who are they?" />
      <TagInput
        label="Job Titles / Roles"
        tags={draft.jobTitles}
        onChange={(jobTitles) => update({ jobTitles })}
        placeholder="e.g. VP of Sales, Marketing Director..."
        color="pink"
      />
      <TagInput
        label="Industries"
        tags={draft.industries}
        onChange={(industries) => update({ industries })}
        placeholder="e.g. SaaS, Healthcare, E-commerce..."
        color="pink"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Company Size"
          value={draft.companySize}
          onChange={(e) => update({ companySize: e.target.value })}
          placeholder="e.g. 50-500 employees"
        />
        <Input
          label="Revenue Range"
          value={draft.revenueRange}
          onChange={(e) => update({ revenueRange: e.target.value })}
          placeholder="e.g. $1M-$10M"
        />
      </div>

      <SectionHeader title="Psychographics" subtitle="What defines them?" />
      <TagInput
        label="Goals & Desires"
        tags={draft.goals}
        onChange={(goals) => update({ goals, desires: goals })}
        placeholder="What do they want to achieve?"
        color="pink"
      />
      <TagInput
        label="Values"
        tags={draft.values}
        onChange={(values) => update({ values })}
        placeholder="What do they care about?"
        color="pink"
      />
      <TagInput
        label="Fears"
        tags={draft.fears}
        onChange={(fears) => update({ fears })}
        placeholder="What are they afraid of?"
        color="gray"
      />
      <TagInput
        label="Objections"
        tags={draft.objections}
        onChange={(objections) => update({ objections })}
        placeholder="Why might they say no?"
        color="gray"
      />

      <SectionHeader title="Before State" subtitle="Pain points — life BEFORE your product" />
      <TagInput
        label="Pain Points"
        tags={draft.painPoints}
        onChange={(painPoints) => update({ painPoints })}
        placeholder="What problems do they face?"
        color="pink"
      />

      <SectionHeader title="After State" subtitle="Transformation — life AFTER your product" />
      <Textarea
        label="Desired Transformation"
        value={draft.desiredTransformation}
        onChange={(e) => update({ desiredTransformation: e.target.value })}
        placeholder="Describe the transformation they experience..."
        className="min-h-[80px]"
      />

      <SectionHeader title="Buying Triggers" subtitle="What makes them look for a solution NOW?" />
      <TagInput
        label="Triggers"
        tags={draft.buyingTriggers}
        onChange={(buyingTriggers) => update({ buyingTriggers })}
        placeholder="Events that trigger buying..."
        color="pink"
      />
    </div>
  );
};

// =====================
// FEATURE BENEFIT EDITOR
// =====================

interface FeatureBenefitEditorProps {
  items: FeatureBenefit[];
  onChange: (items: FeatureBenefit[]) => void;
}

const FeatureBenefitEditor: React.FC<FeatureBenefitEditorProps> = ({ items, onChange }) => {
  const addRow = () => {
    onChange([...items, { feature: '', benefit: '', outcome: '' }]);
  };

  const updateRow = (index: number, updates: Partial<FeatureBenefit>) => {
    onChange(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Features vs. Benefits</label>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase">#{i + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Input
            placeholder="Feature — What it is"
            value={item.feature}
            onChange={(e) => updateRow(i, { feature: e.target.value })}
          />
          <Input
            placeholder="Benefit — What it does for them"
            value={item.benefit}
            onChange={(e) => updateRow(i, { benefit: e.target.value })}
          />
          <Input
            placeholder="Outcome — How it changes their life"
            value={item.outcome}
            onChange={(e) => updateRow(i, { outcome: e.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
      >
        <Plus size={16} /> Add Feature
      </button>
    </div>
  );
};

// =====================
// CASE STUDY EDITOR
// =====================

interface CaseStudyEditorProps {
  items: CaseStudy[];
  onChange: (items: CaseStudy[]) => void;
}

const CaseStudyEditor: React.FC<CaseStudyEditorProps> = ({ items, onChange }) => {
  const addRow = () => {
    onChange([...items, { company: '', challenge: '', result: '', metric: '' }]);
  };

  const updateRow = (index: number, updates: Partial<CaseStudy>) => {
    onChange(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Case Studies</label>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase">#{i + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Input
            placeholder="Company / Client name"
            value={item.company}
            onChange={(e) => updateRow(i, { company: e.target.value })}
          />
          <Input
            placeholder="Challenge — What problem did they face?"
            value={item.challenge}
            onChange={(e) => updateRow(i, { challenge: e.target.value })}
          />
          <Input
            placeholder="Result — What outcome did they get?"
            value={item.result}
            onChange={(e) => updateRow(i, { result: e.target.value })}
          />
          <Input
            placeholder="Key metric — e.g. 3x ROI, 50% cost reduction"
            value={item.metric}
            onChange={(e) => updateRow(i, { metric: e.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
      >
        <Plus size={16} /> Add Case Study
      </button>
    </div>
  );
};

// =====================
// TESTIMONIAL EDITOR
// =====================

interface TestimonialEditorProps {
  items: Testimonial[];
  onChange: (items: Testimonial[]) => void;
}

const TestimonialEditor: React.FC<TestimonialEditorProps> = ({ items, onChange }) => {
  const addRow = () => {
    onChange([...items, { quote: '', author: '', role: '', company: '' }]);
  };

  const updateRow = (index: number, updates: Partial<Testimonial>) => {
    onChange(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Testimonials</label>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase">#{i + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Textarea
            placeholder="Quote — What did they say?"
            value={item.quote}
            onChange={(e) => updateRow(i, { quote: e.target.value })}
            className="min-h-[60px]"
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Author name"
              value={item.author}
              onChange={(e) => updateRow(i, { author: e.target.value })}
            />
            <Input
              placeholder="Role / Title"
              value={item.role}
              onChange={(e) => updateRow(i, { role: e.target.value })}
            />
            <Input
              placeholder="Company"
              value={item.company}
              onChange={(e) => updateRow(i, { company: e.target.value })}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
      >
        <Plus size={16} /> Add Testimonial
      </button>
    </div>
  );
};

// =====================
// PERSONA TYPE EDITOR
// =====================

interface PersonaTypeEditorProps {
  items: PersonaType[];
  onChange: (items: PersonaType[]) => void;
}

const PersonaTypeEditor: React.FC<PersonaTypeEditorProps> = ({ items, onChange }) => {
  const addRow = () => {
    onChange([...items, { label: '', description: '' }]);
  };

  const updateRow = (index: number, updates: Partial<PersonaType>) => {
    onChange(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Customer Persona Types</label>
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase">#{i + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Input
            placeholder="Persona label — e.g. The Skeptic, The Budget-Conscious Buyer"
            value={item.label}
            onChange={(e) => updateRow(i, { label: e.target.value })}
          />
          <Textarea
            placeholder="Description — What defines this persona? What do they care about?"
            value={item.description}
            onChange={(e) => updateRow(i, { description: e.target.value })}
            className="min-h-[60px]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
      >
        <Plus size={16} /> Add Persona Type
      </button>
    </div>
  );
};

// =====================
// OFFER EDITOR
// =====================

interface OfferEditorProps {
  offer: OfferContext;
  onChange: (offer: OfferContext) => void;
}

export const OfferEditor: React.FC<OfferEditorProps> = ({ offer, onChange }) => {
  const [draft, setDraft] = useState<OfferContext>({ ...offer });

  useEffect(() => { setDraft({ ...offer }); }, [offer]);

  const update = (updates: Partial<OfferContext>) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Core Offer" />
      <Input
        label="Product Name"
        value={draft.name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Your product or service name"
      />
      <Textarea
        label="One-Sentence Pitch"
        value={draft.pitch}
        onChange={(e) => update({ pitch: e.target.value })}
        placeholder="Summarize your offer in one compelling sentence"
        className="min-h-[60px]"
      />

      <SectionHeader title="Features & Benefits" subtitle="What it is, what it does, and the outcome" />
      <FeatureBenefitEditor
        items={draft.featuresBenefits}
        onChange={(featuresBenefits) => update({ featuresBenefits })}
      />

      <SectionHeader title="Unique Selling Proposition" subtitle="Why choose you over competitors?" />
      <Textarea
        label="USP"
        value={draft.usp}
        onChange={(e) => update({ usp: e.target.value, details: e.target.value })}
        placeholder="What makes your offer unique?"
        className="min-h-[80px]"
      />

      <SectionHeader title="Pricing & Guarantee" />
      <Input
        label="Price Points"
        value={draft.pricing}
        onChange={(e) => update({ pricing: e.target.value })}
        placeholder="e.g. $299/month, Free trial, etc."
      />
      <Textarea
        label="Guarantees / Risk Reversal"
        value={draft.guarantees}
        onChange={(e) => update({ guarantees: e.target.value })}
        placeholder="Money-back guarantee, free trial, etc."
        className="min-h-[60px]"
      />

      <SectionHeader title="Bonuses" />
      <TagInput
        label="Bonuses Included"
        tags={draft.bonuses}
        onChange={(bonuses) => update({ bonuses })}
        placeholder="Additional bonuses with the offer..."
        color="emerald"
      />

      <SectionHeader title="Social Proof" subtitle="Evidence that builds trust and credibility" />
      <CaseStudyEditor
        items={draft.caseStudies || []}
        onChange={(caseStudies) => update({ caseStudies })}
      />
      <TestimonialEditor
        items={draft.testimonials || []}
        onChange={(testimonials) => update({ testimonials })}
      />
      <Textarea
        label="Brand Story / Origin Story"
        value={draft.brandStory || ''}
        onChange={(e) => update({ brandStory: e.target.value })}
        placeholder="How did this product/company come to be? What's the founder's story?"
        className="min-h-[100px]"
      />
      <TagInput
        label="Social Proof Stats"
        tags={draft.socialProofStats || []}
        onChange={(socialProofStats) => update({ socialProofStats })}
        placeholder="e.g. 10,000+ customers, 98% satisfaction rate, Featured in Forbes..."
        color="emerald"
      />

      <SectionHeader title="Persona Types" subtitle="Different customer archetypes your offer serves" />
      <PersonaTypeEditor
        items={draft.personaTypes || []}
        onChange={(personaTypes) => update({ personaTypes })}
      />
    </div>
  );
};
