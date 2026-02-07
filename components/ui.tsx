import React, { useState } from 'react';
import { Loader2, X, Plus } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-transparent",
    secondary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
    outline: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent",
    danger: "bg-white text-red-600 hover:bg-red-50 border border-red-200 shadow-sm"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${onClick ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-200' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'blue' | 'yellow' | 'gray' | 'purple' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <input 
      className={`block w-full rounded-xl border-gray-200 bg-white text-gray-900 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm p-3 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <textarea
      className={`block w-full rounded-xl border-gray-200 bg-white text-gray-900 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm p-3 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  </div>
);

// --- TagInput ---

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: 'indigo' | 'pink' | 'emerald' | 'gray';
}

const tagColors = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', x: 'hover:text-indigo-900' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', x: 'hover:text-pink-900' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', x: 'hover:text-emerald-900' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', x: 'hover:text-gray-900' },
};

export const TagInput: React.FC<TagInputProps> = ({ label, tags, onChange, placeholder = 'Add item...', color = 'gray' }) => {
  const [inputValue, setInputValue] = useState('');
  const c = tagColors[color];

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white p-2 focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500 transition-all">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={`${tag}-${i}`} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
                className={`${c.text} ${c.x} transition-colors`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent py-1 px-1"
          />
        </div>
      </div>
    </div>
  );
};

// --- RangeSlider ---

interface RangeSliderProps {
  label?: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ label, leftLabel, rightLabel, value, onChange, min = 1, max = 10 }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 text-right shrink-0">{leftLabel}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
      />
      <span className="text-xs text-gray-500 w-20 shrink-0">{rightLabel}</span>
      <span className="text-sm font-medium text-gray-700 w-6 text-center shrink-0">{value}</span>
    </div>
  </div>
);
