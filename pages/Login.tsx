import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Database, Layers, Crown, Check } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useAuthContext } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium, signInWithGoogle, loading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      setSigningIn(false);
    }
  };

  const handleUpgrade = async () => {
    setError(null);
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in first.');
        setCheckingOut(false);
        return;
      }

      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            return_url: window.location.origin,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setCheckingOut(false);
    }
  };

  const benefits = [
    { icon: Database, label: 'Persistent Memory', desc: 'Your campaigns and context saved across devices' },
    { icon: Zap, label: 'Generous API Access', desc: 'Use our API with a generous monthly cap' },
    { icon: Layers, label: 'Multiple Workspaces', desc: 'Switch between brands, clients, or businesses' },
  ];

  // Already premium — show confirmation
  if (user && isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">You're Premium</h1>
            <p className="text-gray-500 mt-2 text-sm mb-6">
              You have full access to all premium features.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to app
        </button>

        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Crown size={24} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Upgrade to Premium
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {user
                ? 'Subscribe to unlock all premium features.'
                : 'Sign in to unlock persistent memory, workspaces, and more.'}
            </p>
          </div>

          {/* Price */}
          <div className="text-center mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">$29</span>
              <span className="text-gray-500 text-sm">/month</span>
            </div>
            <p className="text-xs text-indigo-600 mt-1 font-medium">Cancel anytime</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            {benefits.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
                  <Icon size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action buttons */}
          {user ? (
            // Signed in — show upgrade button
            <Button
              onClick={handleUpgrade}
              isLoading={checkingOut}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Subscribe — $29/month
            </Button>
          ) : (
            // Not signed in — show Google sign in
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {signingIn ? 'Signing in...' : 'Continue with Google'}
            </button>
          )}

          {/* Free tier note */}
          <p className="text-xs text-gray-400 text-center mt-6">
            The free version works without an account.
            <br />
            Premium unlocks persistence and advanced features.
          </p>
        </Card>
      </div>
    </div>
  );
};
