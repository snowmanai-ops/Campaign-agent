import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useAuthContext } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const UpgradeSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  // Refresh the profile to pick up the new subscription status
  useEffect(() => {
    if (user) {
      // Small delay to let the webhook process
      const timer = setTimeout(() => {
        supabase?.auth.refreshSession();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Welcome to Premium!
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Your subscription is active. You now have persistent memory,
            multiple workspaces, and generous API access.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="w-full gap-2"
          >
            Go to Dashboard <ArrowRight size={18} />
          </Button>
        </Card>
      </div>
    </div>
  );
};
