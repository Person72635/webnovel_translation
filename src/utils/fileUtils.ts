import { TranslationResult } from '../types';

export const downloadTranslation = (result: TranslationResult) => {
  const content = `Translation Result
================

Original Language: ${result.sourceLanguage}
Target Language: ${result.targetLanguage}
Translated on: ${new Date(result.timestamp).toLocaleString()}

Characters: ${result.characterCount.toLocaleString()}
Words: ${result.wordCount.toLocaleString()}

Original Text:
${result.originalText}

Translated Text:
${result.translatedText}
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `translation_${result.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};