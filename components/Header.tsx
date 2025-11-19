
import React from 'react';
import { Sparkles, Video, Globe, Loader2 } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  isTranslating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ language, onToggleLanguage, isTranslating = false }) => {
  return (
    <header className="w-full py-6 px-4 md:px-8 border-b border-white/10 bg-dark/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-dark rounded-full p-2">
              <Video className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            VeoSpark
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
            onClick={onToggleLanguage}
            disabled={isTranslating}
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 disabled:opacity-50 disabled:cursor-wait"
          >
            {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            <span>
              {isTranslating 
                ? (language === 'en' ? 'Translating...' : '번역 중...') 
                : (language === 'en' ? '한국어' : 'English')}
            </span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-400 bg-surface/50 px-3 py-1.5 rounded-full border border-white/5">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Powered by Gemini 2.5</span>
          </div>
        </div>
      </div>
    </header>
  );
};
