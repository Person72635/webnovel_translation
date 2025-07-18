import React from 'react';
import { Clock, FileText, Download } from 'lucide-react';
import { TranslationResult } from '../types';

interface TranslationHistoryProps {
  history: TranslationResult[];
  onLoadTranslation: (result: TranslationResult) => void;
  onDownloadTranslation: (result: TranslationResult) => void;
}

export const TranslationHistory: React.FC<TranslationHistoryProps> = ({
  history,
  onLoadTranslation,
  onDownloadTranslation,
}) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>No translation history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Translation History</h3>
      <div className="space-y-3">
        {history.map((result) => (
          <div
            key={result.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors duration-200 cursor-pointer"
            onClick={() => onLoadTranslation(result)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(result.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-900 truncate">
                  {result.originalText.substring(0, 100)}...
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                  <span>{result.characterCount.toLocaleString()} chars</span>
                  <span>{result.wordCount.toLocaleString()} words</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadTranslation(result);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};