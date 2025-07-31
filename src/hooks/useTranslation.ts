import { useState, useCallback, useRef } from 'react';
import { TranslationResult } from '../types';

export type TranslationEngine = 'mymemory' | 'deepl' | 'gemini';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const translateText = useCallback(async (
    text: string,
    sourceLang: string,
    targetLang: string,
    engine: TranslationEngine,
    apiKey?: string,
    styleExamples?: { source: string; target: string }
  ): Promise<TranslationResult | null> => {
    if ((engine === 'deepl' || engine === 'gemini') && !apiKey) {
      throw new Error('API key is required for this translation engine.');
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setIsTranslating(true);
    setProgress(0);

    const CHUNK_SIZE = engine === 'gemini' ? 15000 : engine === 'deepl' ? 5000 : 1000;
    const originalLines = text.split('\n');
    const structuredChunks: string[][] = [];

    for (const line of originalLines) {
      if (line.length === 0) {
        structuredChunks.push(['']);
      } else {
        const subChunks = line.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];
        structuredChunks.push(subChunks);
      }
    }

    const allApiChunks = structuredChunks.flat();

    try {
      const translatedApiChunks = await Promise.all(
        allApiChunks.map(async (chunk, index) => {
          if (signal.aborted) throw new Error('AbortError');
          if (!chunk.trim()) return chunk;

          let translatedChunk = '';

          if (engine === 'mymemory') {
            const apiUrl = `/api/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`;
            const response = await fetch(apiUrl, { signal });
            const data = await response.json();
            if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'MyMemory API error');
            translatedChunk = data.responseData.translatedText;
          } else if (engine === 'deepl') {
            if (!apiKey) throw new Error('DeepL API key is required.');
            const apiUrl = 'https://api-free.deepl.com/v2/translate';
            const response = await fetch(apiUrl, {
              signal,
              method: 'POST',
              headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: [chunk],
                target_lang: targetLang.toUpperCase(),
              }),
            });

            if (!response.ok) {
              const errorBody = await response.text();
              console.error(`[DeepL] API Error: ${response.status}`, errorBody);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            translatedChunk = data.translations[0].text;
          } else if (engine === 'gemini') {
            if (!apiKey) throw new Error('Gemini API key is required.');
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            const prompt = styleExamples && styleExamples.source && styleExamples.target
              ? `Translate the following text from ${sourceLang} to ${targetLang}, matching the style of the provided example.\n\n---\nExample Source Text:\n${styleExamples.source}\n\n---\nExample Target Text:\n${styleExamples.target}\n\n---\nText to Translate:\n${chunk}`
              : `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${chunk}`;
            const response = await fetch(apiUrl, {
              signal,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            });

            if (!response.ok) {
              const errorBody = await response.text();
              console.error(`[Gemini] API Error: ${response.status}`, errorBody);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            translatedChunk = data.candidates[0].content.parts[0].text.trim();
          }
          
          setProgress(Math.round(((index + 1) / allApiChunks.length) * 95));
          return translatedChunk;
        })
      );

      let apiChunkIndex = 0;
      const translatedLines = structuredChunks.map(lineArray => {
        const translatedLineParts = lineArray.map(() => translatedApiChunks[apiChunkIndex++]);
        return translatedLineParts.join('');
      });

      const translatedText = translatedLines.join('\n');
      setProgress(100);

      const result: TranslationResult = {
        id: Date.now().toString(),
        originalText: text,
        translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        timestamp: Date.now(),
        characterCount: translatedText.length,
        wordCount: translatedText.trim().split(/\s+/).length,
      };

      return result;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Translation canceled by user.');
        return null;
      } else {
        console.error('Translation failed:', error);
        return null;
      }
    } finally {
      setIsTranslating(false);
      setProgress(0);
    }
  }, []);

  const cancelTranslation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    translateText,
    isTranslating,
    progress,
    cancelTranslation,
  };
};