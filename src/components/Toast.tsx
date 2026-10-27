import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
          type === 'error'
            ? 'bg-red-950/90 border-red-800 text-red-200'
            : 'bg-[#21201D]/95 border-[#C6A15B]/50 text-[#F7F3EA]'
        }`}
      >
        {type === 'error' ? (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-[#C6A15B] shrink-0" />
        )}
        <p className="text-xs font-semibold leading-relaxed flex-1 font-['Cairo']">
          {message}
        </p>
        <button onClick={onClose} className="text-[#888] hover:text-[#fff] p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
