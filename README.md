# Web Translation Tool

A versatile web-based translation tool supporting multiple translation engines with a specialized RAG-powered mode for stylized translations.

## Features

- **Multiple Translation Engines**: Seamlessly switch between MyMemory, DeepL, and Google Gemini
- **File Upload Support**: Translate content directly from `.txt` and `.docx` files
- **Translation History**: Keeps a record of your last 10 translations for easy access during your session
- **Styled Translation**: Upload your own source/target example pair to steer the translation's style
- **RAG-Powered Stylized Translation**: Advanced translation mode using Retrieval-Augmented Generation (RAG) with vector embeddings for highly accurate, style-consistent translations
- **API Key Management**: Securely enter and use your API keys for DeepL and Gemini
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Lucide icons

## How to Use

1. **Enter or Upload Text**: Type your text directly or upload a `.txt` or `.docx` file
2. **Select Languages**: Choose your source and target languages from the dropdown
3. **Choose Translation Engine**: Select MyMemory (free), DeepL, or Google Gemini
4. **Translate**: Click the translate button to get your translation
5. **RAG Mode**: For stylized translations, use the "If Her Flag Breaks" tab to leverage the RAG system
6. **History**: Access your recent translations from the History tab to reload or download them

### Getting API Keys

To use DeepL or Google Gemini translation engines, you'll need your own API keys:

- **DeepL**: Get a free API key from the [DeepL website](https://www.deepl.com/pro-api)
- **Google Gemini**: Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

Enter these keys in the application's UI when prompted.

---

## Possible Future Updates

- **Selectable RAG Modes**: `Cost Saver`, `Balanced`, and `Quality` modes are already supported by the backend API — the UI currently defaults to `Balanced`
- **Persistent Translation History**: History is currently stored in memory only and resets when the page is refreshed
