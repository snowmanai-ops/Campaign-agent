import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, Edit2, ArrowRight, RefreshCw } from 'lucide-react';
import { analyzeContext } from '../services/geminiService';
import { useAppStore } from '../App';
import { Button, Card, Textarea } from '../components/ui';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { setContext, userContext } = useAppStore();
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  useEffect(() => {
    if (userContext) {
      setAnalyzedData(userContext);
    }
  }, [userContext]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeContext(inputText);
      setAnalyzedData(result);
    } catch (e) {
      alert("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (analyzedData) {
      setContext(analyzedData);
      navigate('/dashboard');
    }
  };

  if (analyzedData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
             <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Your Brand Profile</h1>
             <p className="text-lg text-gray-500 max-w-2xl mx-auto">
               This is the context our AI uses to generate your campaigns. <br/>
               <button onClick={() => setAnalyzedData(null)} className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1 mt-2">
                 <RefreshCw size={14} /> Re-analyze from text
               </button>
             </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Brand Card */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-indigo-100/50">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <CheckCircle size={28} />
              </div>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-4">Brand Voice</h3>
            <div className="space-y-3">
                <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Brand Name</span>
                    <p className="text-base font-medium text-gray-900">{analyzedData.brand.name}</p>
                </div>
                <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Tone & Voice</span>
                    <p className="text-base text-gray-700">{analyzedData.brand.voice}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {analyzedData.brand.keywords.slice(0, 4).map((k: string) => (
                <span key={k} className="text-xs font-medium bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100">{k}</span>
              ))}
            </div>
          </Card>

          {/* Audience Card */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-pink-100/50">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                <CheckCircle size={28} />
              </div>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-4">Target Audience</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{analyzedData.audience.description}</p>
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Top Pain Points</h4>
            <ul className="space-y-2">
              {analyzedData.audience.painPoints.slice(0, 3).map((p: string) => (
                <li key={p} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span>
                    {p}
                </li>
              ))}
            </ul>
          </Card>

          {/* Offer Card */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-emerald-100/50">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle size={28} />
              </div>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-4">The Offer</h3>
            <div className="bg-emerald-50/50 p-4 rounded-xl mb-4 border border-emerald-100">
                <p className="font-bold text-emerald-900">{analyzedData.offer.name}</p>
                <p className="text-sm text-emerald-700 mt-1">{analyzedData.offer.pitch}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{analyzedData.offer.details}</p>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" onClick={() => setAnalyzedData(null)}>
                Edit Context
            </Button>
            <Button onClick={handleConfirm} size="lg" className="px-8 shadow-lg shadow-indigo-200">
                Save & Go to Dashboard <ArrowRight size={18} className="ml-2" />
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">Your email campaigns ready to launch in <span className="text-indigo-600">3 minutes</span></h1>
        <p className="text-gray-500 text-xl leading-relaxed max-w-2xl mx-auto">
          Tell the agent what you sell, then watch it apply $1M/yr direct-response frameworks to your sequences.
        </p>
      </div>

      <Card className="p-2 mb-8 shadow-xl border-gray-200">
        <Textarea 
          placeholder="Paste your entire landing page copy here, or describe your 'After' state transformation..." 
          className="min-h-[240px] border-0 focus:ring-0 resize-none text-lg p-6"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center rounded-b-xl border-t border-gray-100">
           <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
             <UploadCloud size={16} /> Upload any supporting documents that will give the agent the most context into your business
           </span>
           <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">AI</div>
           </div>
        </div>
      </Card>

      <div className="flex justify-center">
         <Button 
           size="lg" 
           onClick={handleAnalyze} 
           disabled={inputText.length < 10}
           isLoading={isAnalyzing}
           className="h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all"
         >
           {isAnalyzing ? "Analyzing Business..." : "Generate My Agent"} <ArrowRight className="ml-2" />
         </Button>
      </div>
      
      <div className="mt-12 flex justify-center gap-4 text-sm text-gray-400">
          <span>Not inspired? Try one of these ideas:</span>
          <button onClick={() => setInputText("We offer a B2B SaaS analytics platform for enterprise sales teams that helps them close 20% more deals...")} className="hover:text-indigo-600 underline decoration-dotted">B2B SaaS Onboarding</button>
          <button onClick={() => setInputText("I run a high-ticket marketing agency helping dentists get 50+ qualified implant leads per month using paid ads...")} className="hover:text-indigo-600 underline decoration-dotted">High-Ticket Agency</button>
          <button onClick={() => setInputText("We sell premium organic skincare products. We need to recover lost revenue from customers who abandoned their checkout...")} className="hover:text-indigo-600 underline decoration-dotted">E-com Abandon Cart</button>
      </div>
    </div>
  );
};
