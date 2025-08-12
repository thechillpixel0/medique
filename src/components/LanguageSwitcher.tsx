import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { useTranslation } from '../lib/translations';

export const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <div className="flex rounded-md overflow-hidden border border-gray-300">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('hi')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'hi'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          हिं
        </button>
      </div>
    </div>
  );
};