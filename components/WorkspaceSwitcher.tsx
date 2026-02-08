import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react';
import { useAuthContext } from '../hooks/useAuth';
import type { Workspace } from '../services/supabaseService';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitch: (workspaceId: string) => void;
  onCreate: (name: string) => void;
  onRename: (workspaceId: string, name: string) => void;
  onDelete: (workspaceId: string) => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  activeWorkspaceId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}) => {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  // Not logged in = no workspaces
  if (!user) return null;

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onCreate(trimmed);
      setNewName('');
      setCreating(false);
    }
  };

  const handleRename = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) {
      onRename(id, trimmed);
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
      >
        <Layers size={16} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">
          {activeWorkspace?.name || 'Workspace'}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</p>
          </div>

          {/* Workspace list */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {workspaces.map((ws) => (
              <div key={ws.id} className="group flex items-center">
                {editingId === ws.id ? (
                  // Editing mode
                  <div className="flex items-center gap-1 px-3 py-2 w-full">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(ws.id);
                        if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                      }}
                      autoFocus
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => handleRename(ws.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditName(''); }}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  // Display mode
                  <button
                    onClick={() => {
                      onSwitch(ws.id);
                      setOpen(false);
                    }}
                    className={`flex-1 flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      ws.id === activeWorkspaceId
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ws.id === activeWorkspaceId ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                    <span className="truncate">{ws.name}</span>
                    {ws.is_default && (
                      <span className="text-[10px] text-gray-400 font-normal ml-auto shrink-0">default</span>
                    )}
                  </button>
                )}

                {/* Actions (only show on hover, not for editing) */}
                {editingId !== ws.id && (
                  <div className="hidden group-hover:flex items-center gap-0.5 pr-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(ws.id);
                        setEditName(ws.name);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Pencil size={12} />
                    </button>
                    {!ws.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${ws.name}"? All campaigns in this workspace will be lost.`)) {
                            onDelete(ws.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create new */}
          <div className="border-t border-gray-100 pt-1 pb-1 px-1">
            {creating ? (
              <div className="flex items-center gap-1 px-2 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                  }}
                  placeholder="Workspace name..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-30 cursor-pointer"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(''); }}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={16} />
                New Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
