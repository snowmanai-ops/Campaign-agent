import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, UserPlus, Users, RotateCcw, Sparkles, MessageSquare, ArrowLeft, Newspaper, DollarSign, GraduationCap, ShoppingBag, RefreshCw, CalendarHeart, Megaphone, TrendingUp } from 'lucide-react';
import { useAppStore } from '../App';
import { generateCampaign } from '../services/apiService';
import { CampaignGoal } from '../types';
import { Button, Card, Textarea } from '../components/ui';

const goals: { id: CampaignGoal; label: string; icon: React.ReactNode; desc: string }[] = [
  // Acquisition
  { id: 'welcome',       label: 'Welcome Series',      icon: <UserPlus size={24} />,       desc: 'Build trust and introduce your brand to new subscribers.' },
  { id: 'onboarding',    label: 'Onboarding',           icon: <Sparkles size={24} />,       desc: 'Help new customers get value quickly and stick around.' },
  { id: 'newsletter',    label: 'Newsletter',           icon: <Newspaper size={24} />,      desc: 'Send regular updates, tips, and curated content.' },
  // Engagement & Revenue
  { id: 'nurture',       label: 'Nurture Leads',        icon: <Users size={24} />,          desc: 'Educate prospects and move them closer to buying.' },
  { id: 'educational',   label: 'Educational Series',   icon: <GraduationCap size={24} />,  desc: 'Teach a topic over multiple emails and build authority.' },
  { id: 'launch',        label: 'Product Launch',       icon: <Rocket size={24} />,         desc: 'Build hype and drive sales for a new offer.' },
  { id: 'announcement',  label: 'Announcement',         icon: <Megaphone size={24} />,      desc: 'Share a new product, feature, or company update.' },
  { id: 'sales',         label: 'Sales Sequence',       icon: <DollarSign size={24} />,     desc: 'Close deals with objection handling and direct CTAs.' },
  { id: 'seasonal',      label: 'Seasonal Promo',       icon: <CalendarHeart size={24} />,  desc: 'Run holiday, Black Friday, or event-based campaigns.' },
  // Retention & Growth
  { id: 'post_purchase',  label: 'Post-Purchase',       icon: <ShoppingBag size={24} />,    desc: 'Thank buyers, drive reviews, and cross-sell naturally.' },
  { id: 'upsell',         label: 'Upsell / Cross-sell', icon: <TrendingUp size={24} />,     desc: 'Upgrade plans, promote add-ons, or complementary products.' },
  { id: 'reactivation',   label: 'Re-activation',       icon: <RefreshCw size={24} />,      desc: 'Recover expired trials, lapsed clients, or cancellations.' },
  { id: 'reengagement',   label: 'Win Back',            icon: <RotateCcw size={24} />,      desc: 'Re-ignite interest from cold or inactive subscribers.' },
  // Always last
  { id: 'custom',         label: 'Custom Goal',         icon: <MessageSquare size={24} />,  desc: 'Describe exactly what you need.' },
];

export const CampaignBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { userContext, addCampaign } = useAppStore();
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreate = async () => {
    if (!selectedGoal || !userContext) return;
    
    setIsGenerating(true);
    try {
      const newCampaign = await generateCampaign(selectedGoal, userContext, additionalDetails);
      const campaignWithId = { ...newCampaign, id: Date.now().toString() } as any;
      addCampaign(campaignWithId);
      navigate(`/campaigns/${campaignWithId.id}`);
    } catch (e) {
      alert("Failed to generate campaign. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Crafting your campaign...</h2>
        <p className="text-gray-500 max-w-md text-center text-lg leading-relaxed">
          Our AI agent is analyzing your brand "{userContext?.brand.name}" and writing high-converting emails for a {selectedGoal} sequence.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">New Campaign</h1>
        <p className="text-gray-500 text-lg">Select a goal to start generating your email sequence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {goals.map((goal) => (
          <Card 
            key={goal.id} 
            className={`p-6 transition-all duration-200 border-2 ${selectedGoal === goal.id ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-600' : 'border-transparent hover:border-indigo-100 hover:shadow-md'}`}
            onClick={() => setSelectedGoal(goal.id)}
          >
            <div className={`mb-5 p-3 rounded-xl w-fit ${selectedGoal === goal.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
              {goal.icon}
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">{goal.label}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{goal.desc}</p>
          </Card>
        ))}
      </div>

      {selectedGoal && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 mb-8 bg-gray-50/50 border-gray-200">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                Extra Instructions (Optional)
             </h3>
             <Textarea 
                placeholder="E.g., We are launching next Monday, offer a 20% discount code WELCOME20, emphasize the free trial..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="bg-white min-h-[120px]"
             />
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>Cancel</Button>
            <Button size="lg" onClick={handleCreate} className="shadow-lg shadow-indigo-200 hover:-translate-y-1 transition-all">
              Generate Campaign <Rocket size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
