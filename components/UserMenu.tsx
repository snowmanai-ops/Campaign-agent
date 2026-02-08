import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Crown, User } from 'lucide-react';
import { useAuthContext } from '../hooks/useAuth';

export const UserMenu: React.FC = () => {
  const { user, profile, isPremium, signOut } = useAuthContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
      >
        <Crown size={16} />
        Upgrade
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = profile?.display_name || user.user_metadata?.full_name || user.email || '';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={16} className="text-indigo-600" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-100 shadow-lg py-2 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {isPremium && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                <Crown size={12} /> Premium
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
