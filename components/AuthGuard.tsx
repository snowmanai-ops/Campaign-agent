import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requirePremium = false }) => {
  const { user, isPremium, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requirePremium && !isPremium) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
