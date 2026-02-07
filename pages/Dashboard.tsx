import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Mail, BarChart3, Clock, ArrowRight, Settings, Trash2, Key } from 'lucide-react';
import { useAppStore } from '../App';
import { Card, Button, Badge } from '../components/ui';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, userContext, deleteCampaign } = useAppStore();

  const totalEmails = campaigns.reduce((acc, c) => acc + c.emails.length, 0);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this campaign? This cannot be undone.")) {
      deleteCampaign(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your email campaigns and brand settings.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/setup">
            <Button variant="outline" className="gap-2">
              <Key size={18} /> API Key
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button variant="outline" className="gap-2">
              <Settings size={18} /> Context
            </Button>
          </Link>
          <Link to="/campaigns/new">
            <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all">
              <Plus size={18} /> New Campaign
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 flex items-center space-x-4 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Campaigns</p>
            <h3 className="text-2xl font-bold text-gray-900">{campaigns.length}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center space-x-4 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Emails Drafted</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalEmails}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center space-x-4 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Brand Context</p>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-sm font-semibold text-gray-900">{userContext?.brand.name || 'Set up now'}</span>
               {userContext && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-gray-900">Your Campaigns</h2>
      </div>
      
      {campaigns.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
          <div className="mx-auto w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-400 shadow-sm">
            <Mail size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Start by creating your first email sequence based on your brand goals.</p>
          <Link to="/campaigns/new">
            <Button>Create First Campaign</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-5 flex items-center justify-between group hover:border-indigo-200">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gray-50 text-gray-500 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                   <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{campaign.name}</h3>
                  <div className="flex items-center gap-3">
                    <Badge color="purple">{campaign.goal}</Badge>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{campaign.emails.length} emails</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500">Edited {new Date(campaign.lastEditedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDelete(e, campaign.id)}
                >
                    <Trash2 size={18} />
                </Button>
                <div className="h-8 w-px bg-gray-100 mx-1"></div>
                <Link to={`/campaigns/${campaign.id}`}>
                  <Button variant="outline" className="group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200">
                    Open Editor <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
