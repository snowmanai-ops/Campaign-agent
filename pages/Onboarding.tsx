import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UploadCloud, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Globe, FileText, File, X, Loader2, AlertCircle, Pencil } from 'lucide-react';
import { analyzeContext, extractTextFromFile, extractTextFromUrl, saveContext } from '../services/apiService';
import { useAppStore } from '../App';
import { buildAudienceDescription } from '../utils';
import { Button, Card, Textarea, Input } from '../components/ui';
import { ContextDrawer, BrandEditor, AudienceEditor, OfferEditor } from '../components/ContextEditor';
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher';
import { UserMenu } from '../components/UserMenu';
import { BrandContext, AudienceContext, OfferContext } from '../types';

type SourceType = 'file' | 'url' | 'text';
type SourceStatus = 'extracting' | 'ready' | 'error';

interface Source {
  id: string;
  type: SourceType;
  name: string;
  content: string;
  status: SourceStatus;
  error?: string;
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const {
    setContext,
    userContext,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    handleCreateWorkspace,
    handleRenameWorkspace,
    handleDeleteWorkspace,
  } = useAppStore();

  const canSkipOnboarding = workspaces.some(ws =>
    ws.brand_context?.name || ws.audience_context?.jobTitles?.length
  );
  const [sources, setSources] = useState<Source[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'url' | 'text' | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (userContext) {
      setAnalyzedData(userContext);
    } else {
      setAnalyzedData(null);
    }
  }, [userContext]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeModal]);

  const updateSource = (id: string, updates: Partial<Source>) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2);

  // --- File handling ---

  const ACCEPTED_EXTENSIONS = ['txt', 'md', 'csv', 'pdf', 'docx'];

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ACCEPTED_EXTENSIONS.includes(ext)) return;

      const id = generateId();
      setSources(prev => [...prev, {
        id,
        type: 'file',
        name: file.name,
        content: '',
        status: 'extracting',
      }]);

      extractTextFromFile(file)
        .then(result => {
          updateSource(id, { content: result.text, status: 'ready' });
        })
        .catch(err => {
          updateSource(id, { status: 'error', error: err.message });
        });
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // --- URL handling ---

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;

    const id = generateId();
    let displayName: string;
    try {
      displayName = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
    } catch {
      displayName = url.slice(0, 40);
    }

    setSources(prev => [...prev, {
      id,
      type: 'url',
      name: displayName,
      content: '',
      status: 'extracting',
    }]);

    setUrlInput('');
    setActiveModal(null);

    extractTextFromUrl(url)
      .then(result => {
        updateSource(id, {
          content: result.text,
          name: result.title || displayName,
          status: 'ready',
        });
      })
      .catch(err => {
        updateSource(id, { status: 'error', error: err.message });
      });
  };

  // --- Text handling ---

  const handleAddText = () => {
    const text = textInput.trim();
    if (!text) return;

    const preview = text.slice(0, 50) + (text.length > 50 ? '...' : '');
    setSources(prev => [...prev, {
      id: generateId(),
      type: 'text',
      name: preview,
      content: text,
      status: 'ready',
    }]);

    setTextInput('');
    setActiveModal(null);
  };

  // --- Generate ---

  const readySources = sources.filter(s => s.status === 'ready');
  const hasExtractingSources = sources.some(s => s.status === 'extracting');
  const canGenerate = readySources.length > 0 && !hasExtractingSources;

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const combinedText = readySources
        .map(s => s.content)
        .join('\n\n---\n\n');

      const result = await analyzeContext(combinedText);
      setAnalyzedData(result);
    } catch (e) {
      alert("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (!canGenerate) return;
    runAnalysis();
  };

  const handleConfirm = () => {
    if (analyzedData) {
      setContext(analyzedData);
      saveContext(analyzedData).catch(console.error);
      navigate('/dashboard');
    }
  };

  // --- Drawer editing ---

  const [editingCard, setEditingCard] = useState<'brand' | 'audience' | 'offer' | null>(null);
  const [editDraft, setEditDraft] = useState<any>(null);

  const handleCardClick = (card: 'brand' | 'audience' | 'offer') => {
    setEditDraft(JSON.parse(JSON.stringify(analyzedData[card])));
    setEditingCard(card);
  };

  const handleSaveEdit = () => {
    if (!editingCard || !editDraft) return;
    const updated = { ...analyzedData };
    updated[editingCard] = editDraft;

    // Recompute backward-compat fields
    if (editingCard === 'brand') {
      updated.brand.voice = (updated.brand.voiceCharacteristics || []).join(", ");
    }
    if (editingCard === 'audience') {
      updated.audience.description = buildAudienceDescription(updated.audience);
      updated.audience.desires = updated.audience.goals;
    }
    if (editingCard === 'offer') {
      updated.offer.details = updated.offer.usp;
    }

    setAnalyzedData(updated);
    // Also persist to global state if user came from dashboard
    if (userContext) {
      setContext(updated);
    }
    setEditingCard(null);
    setEditDraft(null);
  };

  // --- Example suggestions ---

  const addExampleSource = (label: string, text: string) => {
    setSources([{
      id: generateId(),
      type: 'text',
      name: label,
      content: text,
      status: 'ready',
    }]);
  };

  // --- Source chip icon ---

  const SourceIcon = ({ source }: { source: Source }) => {
    if (source.status === 'extracting') return <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />;
    if (source.status === 'error') return <AlertCircle size={14} className="text-red-500 shrink-0" />;
    if (source.type === 'file') return <File size={14} className="text-blue-500 shrink-0" />;
    if (source.type === 'url') return <Globe size={14} className="text-green-500 shrink-0" />;
    return <FileText size={14} className="text-purple-500 shrink-0" />;
  };

  // =====================
  // HELPER: Tone scale mini bar
  // =====================

  const ToneScaleMini = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-28 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${value * 10}%` }} />
      </div>
      <span className="text-gray-500 w-4 text-right">{value}</span>
    </div>
  );

  // =====================
  // CONFIRMATION SCREEN
  // =====================

  if (analyzedData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-8">
          <div>
            {canSkipOnboarding && (
              <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSwitch={switchWorkspace}
              onCreate={handleCreateWorkspace}
              onRename={handleRenameWorkspace}
              onDelete={handleDeleteWorkspace}
            />
            <UserMenu />
          </div>
        </header>
        <div className="text-center mb-12">
             <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Your Brand Profile</h1>
             <p className="text-lg text-gray-500 max-w-2xl mx-auto">
               Click any card to edit its details. <br/>
               <button onClick={() => setAnalyzedData(null)} className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1 mt-2">
                 <RefreshCw size={14} /> Re-analyze from sources
               </button>
             </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Brand Card */}
          <Card
            className="p-8 hover:shadow-xl transition-all duration-300 border-indigo-100/50 cursor-pointer hover:border-indigo-300"
            onClick={() => handleCardClick('brand')}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <CheckCircle size={28} />
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Pencil size={12} /> Edit
              </span>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-4">Brand Voice</h3>
            <div className="space-y-3">
                <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Brand Name</span>
                    <p className="text-base font-medium text-gray-900">{analyzedData.brand.name}</p>
                </div>
                {analyzedData.brand.tagline && (
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Tagline</span>
                    <p className="text-sm text-gray-700">{analyzedData.brand.tagline}</p>
                  </div>
                )}
            </div>

            {/* Voice characteristics tags */}
            {analyzedData.brand.voiceCharacteristics?.length > 0 && (
              <div className="mt-4">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">Voice</span>
                <div className="flex flex-wrap gap-1.5">
                  {analyzedData.brand.voiceCharacteristics.slice(0, 4).map((vc: string, i: number) => (
                    <span key={`${vc}-${i}`} className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {vc}
                    </span>
                  ))}
                  {analyzedData.brand.voiceCharacteristics.length > 4 && (
                    <span className="text-xs text-gray-400 px-1 py-1">+{analyzedData.brand.voiceCharacteristics.length - 4}</span>
                  )}
                </div>
              </div>
            )}

            {/* Tone scale mini bars */}
            {analyzedData.brand.toneScale && (
              <div className="space-y-2 mt-4">
                <ToneScaleMini label="Formal / Casual" value={analyzedData.brand.toneScale.formalCasual} />
                <ToneScaleMini label="Serious / Humorous" value={analyzedData.brand.toneScale.seriousHumorous} />
                <ToneScaleMini label="Respectful / Irreverent" value={analyzedData.brand.toneScale.respectfulIrreverent} />
              </div>
            )}

            {/* Keywords */}
            {analyzedData.brand.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {analyzedData.brand.keywords.slice(0, 4).map((k: string, i: number) => (
                  <span key={`${k}-${i}`} className="text-xs font-medium bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100">{k}</span>
                ))}
              </div>
            )}
          </Card>

          {/* Audience Card */}
          <Card
            className="p-8 hover:shadow-xl transition-all duration-300 border-pink-100/50 cursor-pointer hover:border-pink-300"
            onClick={() => handleCardClick('audience')}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                <CheckCircle size={28} />
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Pencil size={12} /> Edit
              </span>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-4">Target Audience</h3>

            {/* Job titles & Industries */}
            {(analyzedData.audience.jobTitles?.length > 0 || analyzedData.audience.industries?.length > 0) && (
              <div className="mb-4">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5 block">Who they are</span>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {[
                    analyzedData.audience.jobTitles?.join(", "),
                    analyzedData.audience.industries?.length > 0 ? `in ${analyzedData.audience.industries.join(", ")}` : ""
                  ].filter(Boolean).join(" ")}
                </p>
              </div>
            )}

            {/* Pain points */}
            {analyzedData.audience.painPoints?.length > 0 && (
              <>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Top Pain Points</h4>
                <ul className="space-y-2 mb-4">
                  {analyzedData.audience.painPoints.slice(0, 3).map((p: string, i: number) => (
                    <li key={`${p}-${i}`} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span>
                      {p}
                    </li>
                  ))}
                  {analyzedData.audience.painPoints.length > 3 && (
                    <li className="text-xs text-gray-400 pl-3.5">+{analyzedData.audience.painPoints.length - 3} more</li>
                  )}
                </ul>
              </>
            )}

            {/* Goals */}
            {analyzedData.audience.goals?.length > 0 && (
              <>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Goals</h4>
                <ul className="space-y-2">
                  {analyzedData.audience.goals.slice(0, 3).map((g: string, i: number) => (
                    <li key={`${g}-${i}`} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      {g}
                    </li>
                  ))}
                  {analyzedData.audience.goals.length > 3 && (
                    <li className="text-xs text-gray-400 pl-3.5">+{analyzedData.audience.goals.length - 3} more</li>
                  )}
                </ul>
              </>
            )}
          </Card>

          {/* Offer Card */}
          <Card
            className="p-8 hover:shadow-xl transition-all duration-300 border-emerald-100/50 cursor-pointer hover:border-emerald-300"
            onClick={() => handleCardClick('offer')}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle size={28} />
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Pencil size={12} /> Edit
              </span>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-4">The Offer</h3>
            <div className="bg-emerald-50/50 p-4 rounded-xl mb-4 border border-emerald-100">
                <p className="font-bold text-emerald-900">{analyzedData.offer.name}</p>
                <p className="text-sm text-emerald-700 mt-1">{analyzedData.offer.pitch}</p>
            </div>
            {analyzedData.offer.usp && (
              <div className="mb-3">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1 block">USP</span>
                <p className="text-sm text-gray-600 leading-relaxed">{analyzedData.offer.usp}</p>
              </div>
            )}
            {analyzedData.offer.featuresBenefits?.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-400">{analyzedData.offer.featuresBenefits.length} feature{analyzedData.offer.featuresBenefits.length !== 1 ? 's' : ''} mapped</span>
              </div>
            )}
            {analyzedData.offer.pricing && (
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1 block">Pricing</span>
                <p className="text-sm text-gray-600">{analyzedData.offer.pricing}</p>
              </div>
            )}

            {/* Social Proof Summary */}
            {(analyzedData.offer.caseStudies?.length > 0 || analyzedData.offer.testimonials?.length > 0 || analyzedData.offer.socialProofStats?.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">Social Proof</span>
                <div className="flex flex-wrap gap-1.5">
                  {analyzedData.offer.caseStudies?.length > 0 && (
                    <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {analyzedData.offer.caseStudies.length} case {analyzedData.offer.caseStudies.length === 1 ? 'study' : 'studies'}
                    </span>
                  )}
                  {analyzedData.offer.testimonials?.length > 0 && (
                    <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {analyzedData.offer.testimonials.length} testimonial{analyzedData.offer.testimonials.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {analyzedData.offer.socialProofStats?.length > 0 && (
                    <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {analyzedData.offer.socialProofStats.length} stat{analyzedData.offer.socialProofStats.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Persona Types Summary */}
            {analyzedData.offer.personaTypes?.length > 0 && (
              <div className="mt-3">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5 block">Persona Types</span>
                <div className="flex flex-wrap gap-1.5">
                  {analyzedData.offer.personaTypes.slice(0, 3).map((p: any, i: number) => (
                    <span key={`${p.label}-${i}`} className="text-xs font-medium bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">
                      {p.label}
                    </span>
                  ))}
                  {analyzedData.offer.personaTypes.length > 3 && (
                    <span className="text-xs text-gray-400 px-1 py-1">+{analyzedData.offer.personaTypes.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" onClick={() => setAnalyzedData(null)}>
                Re-analyze Sources
            </Button>
            <Button onClick={handleConfirm} size="lg" className="px-8 shadow-lg shadow-indigo-200">
                Save & Go to Dashboard <ArrowRight size={18} className="ml-2" />
            </Button>
        </div>

        {/* Edit Drawers */}
        {editingCard === 'brand' && (
          <ContextDrawer
            isOpen={true}
            onClose={() => { setEditingCard(null); setEditDraft(null); }}
            onSave={handleSaveEdit}
            title="Edit Brand Voice"
            color="indigo"
          >
            <BrandEditor brand={editDraft as BrandContext} onChange={setEditDraft} />
          </ContextDrawer>
        )}
        {editingCard === 'audience' && (
          <ContextDrawer
            isOpen={true}
            onClose={() => { setEditingCard(null); setEditDraft(null); }}
            onSave={handleSaveEdit}
            title="Edit Target Audience"
            color="pink"
          >
            <AudienceEditor audience={editDraft as AudienceContext} onChange={setEditDraft} />
          </ContextDrawer>
        )}
        {editingCard === 'offer' && (
          <ContextDrawer
            isOpen={true}
            onClose={() => { setEditingCard(null); setEditDraft(null); }}
            onSave={handleSaveEdit}
            title="Edit The Offer"
            color="emerald"
          >
            <OfferEditor offer={editDraft as OfferContext} onChange={setEditDraft} />
          </ContextDrawer>
        )}
      </div>
    );
  }

  // =====================
  // INPUT COLLECTION SCREEN
  // =====================

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="flex justify-between items-center mb-8">
        <div>
          {canSkipOnboarding && (
            <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSwitch={switchWorkspace}
            onCreate={handleCreateWorkspace}
            onRename={handleRenameWorkspace}
            onDelete={handleDeleteWorkspace}
          />
          <UserMenu />
        </div>
      </header>
      <div className="mb-12 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
          Your email campaigns, ready in <span className="text-indigo-600">3 minutes</span>
        </h1>
        <p className="text-gray-500 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
          Feed it your brand details & get back a full email strategy with copy ready to send
        </p>
      </div>

      {/* Drop zone card */}
      <Card className="mb-6 shadow-xl border-gray-200 overflow-hidden">
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 sm:p-12 m-3 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-50/50'
              : 'border-gray-200 bg-gray-50/30 hover:border-gray-300 hover:bg-gray-50/60'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={40} className={`transition-colors duration-200 ${isDragOver ? 'text-indigo-400' : 'text-gray-300'}`} />
          <p className={`font-medium text-base mt-4 text-center transition-colors duration-200 ${isDragOver ? 'text-indigo-600' : 'text-gray-500'}`}>
            {isDragOver ? 'Drop files here' : 'Drag & drop your files here (e.g. brand guides, product pages, past campaigns)'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            pdf, docx, txt, md, csv
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
          >
            <UploadCloud size={16} /> Upload files
          </button>
          <button
            onClick={() => setActiveModal('url')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
          >
            <Globe size={16} /> Websites
          </button>
          <button
            onClick={() => setActiveModal('text')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
          >
            <FileText size={16} /> Copied text
          </button>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.csv,.pdf,.docx"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Source chips */}
      {sources.length > 0 && (
        <div className="mb-6 text-left">
          <p className="text-sm font-medium text-gray-500 mb-3">
            {sources.length} source{sources.length !== 1 ? 's' : ''} added
          </p>
          <div className="flex flex-wrap gap-3">
            {sources.map(source => (
              <div
                key={source.id}
                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl text-sm shadow-sm transition-all ${
                  source.status === 'error'
                    ? 'border-red-200 bg-red-50/50'
                    : source.status === 'extracting'
                    ? 'border-gray-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <SourceIcon source={source} />
                <span className="text-gray-700 truncate max-w-[200px]">{source.name}</span>
                {source.status === 'extracting' && (
                  <span className="text-xs text-gray-400">Extracting...</span>
                )}
                {source.status === 'error' && (
                  <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">Failed</span>
                )}
                {source.status !== 'extracting' && (
                  <button
                    onClick={() => removeSource(source.id)}
                    className="ml-1 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!canGenerate}
          isLoading={isAnalyzing}
          className="h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all"
        >
          {isAnalyzing ? "Analyzing Business..." : "Build My Campaigns"} <ArrowRight className="ml-2" />
        </Button>
      </div>

      {/* Example suggestions */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
        <span>Quick start:</span>
        <button
          onClick={() => addExampleSource("B2B SaaS Onboarding", "We offer a B2B SaaS analytics platform for enterprise sales teams that helps them close 20% more deals. Our platform integrates with existing CRM systems and provides real-time coaching during sales calls. We target VP of Sales and Sales Directors at mid-market companies with 50-500 employees. Our pricing starts at $299/month per seat with a 30-day free trial and money-back guarantee.")}
          className="hover:text-indigo-600 underline decoration-dotted cursor-pointer"
        >
          B2B SaaS Onboarding
        </button>
        <button
          onClick={() => addExampleSource("High-Ticket Agency", "I run a high-ticket marketing agency helping dentists get 50+ qualified implant leads per month using paid ads. We charge $3,000/month with a 90-day minimum commitment. Our clients typically see 3-5x ROI within the first 60 days. We handle everything from ad creative to lead nurturing and appointment booking.")}
          className="hover:text-indigo-600 underline decoration-dotted cursor-pointer"
        >
          High-Ticket Agency
        </button>
        <button
          onClick={() => addExampleSource("E-com Abandon Cart", "We sell premium organic skincare products. We need to recover lost revenue from customers who abandoned their checkout. Our average order value is $85 and our products are cruelty-free, vegan, and made with sustainably sourced ingredients. We target health-conscious women aged 25-45 who value clean beauty.")}
          className="hover:text-indigo-600 underline decoration-dotted cursor-pointer"
        >
          E-com Abandon Cart
        </button>
      </div>

      {/* URL Modal */}
      {activeModal === 'url' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <Card
            className="w-full max-w-md mx-4 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-gray-900 mb-1 text-left">Add a website</h3>
            <p className="text-sm text-gray-500 mb-4 text-left">
              Paste a URL and we'll extract the content as context for your agent.
            </p>
            <Input
              placeholder="https://example.com/landing-page"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && urlInput.trim()) handleAddUrl(); }}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setActiveModal(null); setUrlInput(''); }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
              >
                Add URL
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Text Modal */}
      {activeModal === 'text' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <Card
            className="w-full max-w-lg mx-4 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-gray-900 mb-1 text-left">Paste text</h3>
            <p className="text-sm text-gray-500 mb-4 text-left">
              Paste landing page copy, product descriptions, or any text about your business.
            </p>
            <Textarea
              placeholder="Paste your text here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[160px]"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setActiveModal(null); setTextInput(''); }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddText}
                disabled={!textInput.trim()}
              >
                Add text
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};
