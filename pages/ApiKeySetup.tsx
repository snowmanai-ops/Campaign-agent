import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ExternalLink, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button, Card } from '../components/ui';

interface ApiKeySetupProps {
  onSave: (provider: 'openai' | 'anthropic', apiKey: string) => void;
  existingProvider?: 'openai' | 'anthropic' | null;
  existingKey?: string | null;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSave, existingProvider, existingKey }) => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<'openai' | 'anthropic'>(existingProvider || 'openai');
  const [apiKey, setApiKey] = useState(existingKey || '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const isUpdating = !!existingKey;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();

    if (!trimmed) {
      setError('Please enter your API key.');
      return;
    }

    if (provider === 'openai' && !trimmed.startsWith('sk-')) {
      setError('OpenAI keys typically start with "sk-". Double-check your key.');
      return;
    }

    if (provider === 'anthropic' && !trimmed.startsWith('sk-ant-')) {
      setError('Anthropic keys typically start with "sk-ant-". Double-check your key.');
      return;
    }

    setError('');
    onSave(provider, trimmed);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-5">
            <Key className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Your AI</h1>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Enter your own API key to power the email agent. Your key is stored locally in your browser — never sent to us.
          </p>
        </div>

        {isUpdating && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setProvider('openai'); setError(''); }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    provider === 'openai'
                      ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  OpenAI
                </button>
                <button
                  type="button"
                  onClick={() => { setProvider('anthropic'); setError(''); }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    provider === 'anthropic'
                      ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Anthropic
                </button>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                  placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="block w-full rounded-xl border-gray-200 bg-white text-gray-900 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm p-3 pr-10 placeholder:text-gray-400"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Where to get a key */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
              <p className="font-medium text-gray-700">Where to get a key:</p>
              {provider === 'openai' ? (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  OpenAI API Keys <ExternalLink size={14} />
                </a>
              ) : (
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Anthropic API Keys <ExternalLink size={14} />
                </a>
              )}
              <p className="text-gray-500">You'll need a funded account with API credits.</p>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2">
              Save & Continue <ArrowRight size={18} />
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your key is stored in your browser's local storage only. It's sent directly to {provider === 'openai' ? 'OpenAI' : 'Anthropic'} — we never see or store it.
        </p>
      </div>
    </div>
  );
};
