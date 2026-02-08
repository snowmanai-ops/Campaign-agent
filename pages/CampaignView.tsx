import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Save, GripVertical, Trash2, Copy, Download, Calendar, CheckCircle2, Circle, Clock, Mail } from 'lucide-react';
import { useAppStore } from '../App';
import { Button, Card, Input, Textarea, Badge } from '../components/ui';
import { Email } from '../types';

export const CampaignView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { campaigns, updateCampaign } = useAppStore();
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const campaign = campaigns.find(c => c.id === id);
  
  if (!campaign) return <Navigate to="/dashboard" replace />;

  const activeEmail = campaign.emails.find(e => e.id === activeEmailId);

  // Helper to safely get body content regardless of old/new data structure
  const getEmailBody = (email: any): string => {
    if (typeof email.body === 'string') {
      return email.body;
    }
    // Backward compatibility for old "EmailSection" objects
    if (typeof email.body === 'object' && email.body !== null) {
      return [
        email.body.hook,
        email.body.context,
        email.body.value,
        email.body.cta,
        email.body.signOff
      ].filter(Boolean).join('\n\n');
    }
    return '';
  };

  const handleUpdateEmail = (field: keyof Email, value: any) => {
    if (!activeEmail) return;

    const updatedEmail = { ...activeEmail, [field]: value };
    const updatedEmails = campaign.emails.map(e => e.id === updatedEmail.id ? updatedEmail : e);
    updateCampaign(campaign.id, { emails: updatedEmails, lastEditedAt: new Date().toISOString() });
  };

  const handleExport = (format: 'txt' | 'json') => {
    let content = '';
    if (format === 'json') {
      content = JSON.stringify(campaign, null, 2);
    } else {
      content = campaign.emails.map((e, i) => `
EMAIL ${i + 1}: ${e.subject}
Send Time: ${e.dayOffset === 0 ? 'Immediately' : `Day ${e.dayOffset}`}
----------------------------------------
Subject: ${e.subject}
Preview: ${e.previewText}

${getEmailBody(e)}

----------------------------------------
`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, '_')}_export.${format}`;
    a.click();
    setShowExport(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar / Timeline */}
      <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-gray-200 bg-white flex flex-col z-10">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="font-bold text-gray-900 truncate px-2 text-sm">{campaign.name}</h2>
          <div className="relative">
             <Button size="sm" variant="outline" onClick={() => setShowExport(!showExport)}>
               <Download size={16} />
             </Button>
             {showExport && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 overflow-hidden">
                 <button onClick={() => handleExport('txt')} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Download as Text</button>
                 <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Download as JSON</button>
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 px-1">
            <span>Sequence</span>
            <span>{campaign.emails.length} Emails</span>
          </div>

          {campaign.emails.map((email, index) => (
            <div 
              key={email.id}
              onClick={() => setActiveEmailId(email.id)}
              className={`relative pl-6 transition-all cursor-pointer group ${activeEmailId === email.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              {/* Timeline Connector */}
              {index < campaign.emails.length - 1 && (
                <div className="absolute left-[35px] top-14 bottom-[-24px] w-0.5 bg-gray-100 z-0"></div>
              )}
              
              <div className={`relative z-10 p-5 rounded-2xl border transition-all duration-200 ${activeEmailId === email.id ? 'bg-white border-indigo-600 shadow-lg ring-1 ring-indigo-600' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                     <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${activeEmailId === email.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                       {index + 1}
                     </span>
                     <Badge color="blue">{email.type}</Badge>
                   </div>
                   <div className="flex items-center text-xs text-gray-400 gap-1 font-medium bg-gray-50 px-2 py-1 rounded-full">
                     <Clock size={12} />
                     {email.dayOffset === 0 ? 'Instant' : `Day ${email.dayOffset}`}
                   </div>
                 </div>
                 <h4 className={`font-semibold text-sm mb-1 line-clamp-1 ${activeEmailId === email.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                   {email.subject || "No Subject"}
                 </h4>
                 <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                   {email.previewText}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50">
        {activeEmail ? (
          <>
            <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Editing Email {campaign.emails.findIndex(e => e.id === activeEmailId) + 1}</span>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="truncate max-w-lg">{activeEmail.subject}</span>
                </h1>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" className="gap-2">
                   <CheckCircle2 size={18} /> Mark Ready
                 </Button>
                 <Button className="gap-2" onClick={() => setActiveEmailId(null)}>
                   <Save size={18} /> Save & Close
                 </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
              <div className="max-w-3xl mx-auto space-y-8 pb-12">
                {/* Meta Data */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label="Subject Line" 
                      value={activeEmail.subject}
                      onChange={(e) => handleUpdateEmail('subject', e.target.value)}
                      maxLength={60}
                      className="text-lg font-medium"
                    />
                     <Input 
                      label="Preview Text" 
                      value={activeEmail.previewText}
                      onChange={(e) => handleUpdateEmail('previewText', e.target.value)}
                      maxLength={140}
                    />
                  </div>
                  <div className="border-t border-gray-50 pt-4">
                     <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Send Timing</label>
                        <select 
                          className="block w-full rounded-xl border-gray-200 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                          value={activeEmail.dayOffset}
                          onChange={(e) => handleUpdateEmail('dayOffset', parseInt(e.target.value))}
                        >
                          <option value={0}>Immediately</option>
                          <option value={1}>Day 1</option>
                          <option value={2}>Day 2</option>
                          <option value={3}>Day 3</option>
                          <option value={5}>Day 5</option>
                          <option value={7}>Day 7</option>
                        </select>
                     </div>
                  </div>
                </div>

                {/* Email Body Sections */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Content</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  <Card className="p-6">
                    <Textarea 
                      label="Email Body" 
                      className="bg-white text-gray-900 border-gray-200 text-base leading-relaxed font-normal p-4 min-h-[400px]"
                      rows={15}
                      value={getEmailBody(activeEmail)}
                      onChange={(e) => handleUpdateEmail('body', e.target.value)}
                    />
                  </Card>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
               <Mail size={32} className="opacity-40" />
            </div>
            <p className="text-xl font-medium text-gray-600">Select an email to start editing</p>
            <p className="text-sm text-gray-400 mt-2">Use the timeline on the left to navigate your sequence</p>
          </div>
        )}
      </div>
    </div>
  );
};