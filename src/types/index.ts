export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

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

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface FileUpload {
  file: File;
  content: string;
  name: string;
  size: number;
}