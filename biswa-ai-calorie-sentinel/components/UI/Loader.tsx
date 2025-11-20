import React from 'react';
import { Settings } from 'lucide-react';

interface LoaderProps {
  text?: string;
}

export const FullScreenLoader: React.FC<LoaderProps> = ({ text = "PROCESSING..." }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-8">
           <Settings className="w-20 h-20 text-ai-cyan animate-[spin_3s_linear_infinite]" />
           <div className="absolute inset-0 bg-ai-cyan/30 blur-2xl rounded-full animate-pulse"></div>
           <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-ai-cyan/20 rounded-full animate-ping"></div>
           </div>
        </div>
        <h2 className="text-3xl font-oswald font-bold text-white tracking-[0.3em] mb-3">BISWA ENGINE</h2>
        <p className="text-sm font-mono text-ai-cyan animate-pulse tracking-widest">{text}</p>
      </div>
    </div>
  );
};