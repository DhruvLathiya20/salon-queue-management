import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

export const LanguageSwitcher = ({ className = '' }) => {
  const { language, toggleLanguage } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-salon-gold/60 text-xs font-medium text-salon-textSecondary hover:text-salon-gold bg-salon-darker transition-colors duration-150 ${className}`}
      title={language === 'en' ? 'Switch to Gujarati' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5" />
      <span>{language === 'en' ? 'ગુજરાતી' : 'English'}</span>
    </button>
  );
};
