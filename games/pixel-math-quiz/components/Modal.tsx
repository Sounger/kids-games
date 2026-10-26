import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full ${maxWidth} bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 transform transition-all scale-100`}>
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-200 border-2 border-transparent hover:border-black transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
            {children}
        </div>
      </div>
    </div>
  );
};
