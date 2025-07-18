import React from 'react';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { TranslationResult as TranslationResultType } from '../types';

interface TranslationResultProps {
  result: TranslationResultType;
  onDownload: () => void;
  onCopy: () => void;
  copied: boolean;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  result,
  onDownload,
  onCopy,
  copied,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Translation Result</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCopy}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={onDownload}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs text-gray-600">
          <div>Characters: {result.characterCount.toLocaleString()}</div>
          <div>Words: {result.wordCount.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 font-mono">
            {result.translatedText}
          </pre>
        </div>
      </div>
    </div>
  );
};