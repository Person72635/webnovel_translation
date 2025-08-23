export type TranslationEngine = 'mymemory' | 'deepl' | 'gemini';

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  characterCount: number;
  wordCount: number;
}
