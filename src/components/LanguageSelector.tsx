import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  languages: Language[];
  selected: string;
  onSelect: (code: string) => void;
  label: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selected,
  onSelect,
  label,
}) => {
  const selectedLanguage = languages.find(lang => lang.code === selected);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
      </div>
    </div>
  );
};