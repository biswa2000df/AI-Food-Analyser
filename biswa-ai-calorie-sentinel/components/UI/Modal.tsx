import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f131a] border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl transform transition-all scale-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-xl font-oswald text-white tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-ai-cyan transition">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
