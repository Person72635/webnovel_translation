import { useState, useCallback, useEffect } from 'react';
import { Languages, Zap, Globe, FileText, Loader2, RefreshCw } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { FileUpload } from './components/FileUpload';
import { TextInput } from './components/TextInput';
import { TranslationResult as TranslationResultComponent } from './components/TranslationResult';
import { TranslationHistory } from './components/TranslationHistory';
import { useTranslation, TranslationEngine } from './hooks/useTranslation';
import { downloadTranslation, copyToClipboard } from './utils/fileUtils';
import { languages } from './data/languages';
import { TranslationResult } from './types';
import Toast from './components/Toast';

function App() {
  const [sourceLanguage, setSourceLanguage] = useState('zh');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [currentResult, setCurrentResult] = useState<TranslationResult | null>(null);
  const [translationHistory, setTranslationHistory] = useState<TranslationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'translate' | 'history' | 'styled' | 'ifHerFlagBreaks'>('translate');
  const [copied, setCopied] = useState(false);
  const [engine, setEngine] = useState<TranslationEngine>('mymemory');
  const [apiKey, setApiKey] = useState('');

  // State for 'If Her Flag Breaks' section
  const [exampleSourceText, setExampleSourceText] = useState('');
  const [exampleTargetText, setExampleTargetText] = useState('');
  const [exampleSourceFile, setExampleSourceFile] = useState<{ name: string; size: number } | null>(null);
  const [exampleTargetFile, setExampleTargetFile] = useState<{ name: string; size: number } | null>(null);
  const [styledInput, setStyledInput] = useState('');
  const [styledResult, setStyledResult] = useState<TranslationResult | null>(null);
  const [styledCopied, setStyledCopied] = useState(false);
  const [styledSourceLanguage, setStyledSourceLanguage] = useState('zh');
  const [styledTargetLanguage, setStyledTargetLanguage] = useState('en');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // State for If Her Flag Breaks tab
  const [ifHerFlagBreaksInput, setIfHerFlagBreaksInput] = useState('');
  const [ifHerFlagBreaksResult, setIfHerFlagBreaksResult] = useState<TranslationResult | null>(null);
  const [ifHerFlagBreaksCopied, setIfHerFlagBreaksCopied] = useState(false);
  const [flagBreaksExampleSource, setFlagBreaksExampleSource] = useState('');
  const [flagBreaksExampleTarget, setFlagBreaksExampleTarget] = useState('');

  const { translateText, isTranslating, progress, cancelTranslation } = useTranslation();

  useEffect(() => {
    const fetchExampleFiles = async () => {
      try {
        const sourceResponse = await fetch('/assets/Flags 0-6 Chinese.txt');
        const targetResponse = await fetch('/assets/Flags 0-6 English.txt');
        
        if (!sourceResponse.ok || !targetResponse.ok) {
          throw new Error('Failed to fetch example files');
        }

        const sourceText = await sourceResponse.text();
        const targetText = await targetResponse.text();

        setFlagBreaksExampleSource(sourceText);
        setFlagBreaksExampleTarget(targetText);
      } catch (error) {
        console.error('Error fetching example files:', error);
        setToast({ message: 'Could not load style examples.', type: 'error' });
      }
    };

    fetchExampleFiles();
  }, []);

  const styledSourceLanguageName = languages.find(lang => lang.code === styledSourceLanguage)?.name;
  const styledTargetLanguageName = languages.find(lang => lang.code === styledTargetLanguage)?.name;

  const handleFileUpload = useCallback((content: string, fileName: string) => {
    setInputText(content);
    setUploadedFile({ name: fileName, size: content.length });
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setInputText('');
  }, []);

  const handleExampleSourceUpload = useCallback((content: string, fileName: string) => {
    setExampleSourceText(content);
    setExampleSourceFile({ name: fileName, size: content.length });
  }, []);

  const handleRemoveExampleSourceFile = useCallback(() => {
    setExampleSourceText('');
    setExampleSourceFile(null);
  }, []);

  const handleExampleTargetUpload = useCallback((content: string, fileName: string) => {
    setExampleTargetText(content);
    setExampleTargetFile({ name: fileName, size: content.length });
  }, []);

  const handleRemoveExampleTargetFile = useCallback(() => {
    setExampleTargetText('');
    setExampleTargetFile(null);
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    try {
      const result = await translateText(inputText, sourceLanguage, targetLanguage, engine, apiKey);
      if (result) {
        setCurrentResult(result);
        setTranslationHistory(prev => [result, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Translation failed in component:', error);
        setToast({ message: (error as Error).message, type: 'error' });
      }
    }
  }, [inputText, sourceLanguage, targetLanguage, translateText, engine, apiKey]);

  const handleDownload = useCallback(() => {
    if (currentResult) {
      downloadTranslation(currentResult);
    }
  }, [currentResult]);

  const handleCopy = useCallback(() => {
    if (currentResult) {
      copyToClipboard(currentResult.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentResult]);

  const swapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  }, [sourceLanguage, targetLanguage]);

  const handleLoadFromHistory = (result: TranslationResult) => {
    setCurrentResult(result);
    setInputText(result.originalText);
    setSourceLanguage(result.sourceLanguage);
    setTargetLanguage(result.targetLanguage);
    setActiveTab('translate');
  };

  const handleDownloadFromHistory = (result: TranslationResult) => {
    downloadTranslation(result);
  };

  const handleStyled = useCallback(async () => {
    if (!styledInput.trim() || !exampleSourceText || !exampleTargetText) return;

    try {
      const result = await translateText(
        styledInput,
        styledSourceLanguage,
        styledTargetLanguage,
        'gemini',
        apiKey,
        { source: exampleSourceText, target: exampleTargetText }
      );
      if (result) {
        setStyledResult(result);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Styled translation failed in component:', error);
        setToast({ message: (error as Error).message, type: 'error' });
      }
    }
  }, [styledInput, exampleSourceText, exampleTargetText, apiKey, translateText, styledSourceLanguage, styledTargetLanguage]);

  const handleStyledCopy = useCallback(() => {
    if (styledResult) {
      copyToClipboard(styledResult.translatedText);
      setStyledCopied(true);
      setTimeout(() => setStyledCopied(false), 2000);
    }
  }, [styledResult]);

  const handleIfHerFlagBreaks = useCallback(async () => {
    if (!ifHerFlagBreaksInput.trim() || !flagBreaksExampleSource || !flagBreaksExampleTarget) return;

    try {
      const result = await translateText(
        ifHerFlagBreaksInput,
        'zh',
        'en',
        'gemini',
        apiKey,
        { source: flagBreaksExampleSource, target: flagBreaksExampleTarget }
      );
      if (result) {
        setIfHerFlagBreaksResult(result);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('If Her Flag Breaks translation failed in component:', error);
        setToast({ message: (error as Error).message, type: 'error' });
      }
    }
  }, [ifHerFlagBreaksInput, flagBreaksExampleSource, flagBreaksExampleTarget, apiKey, translateText]);

  const handleIfHerFlagBreaksCopy = useCallback(() => {
    if (ifHerFlagBreaksResult) {
      copyToClipboard(ifHerFlagBreaksResult.translatedText);
      setIfHerFlagBreaksCopied(true);
      setTimeout(() => setIfHerFlagBreaksCopied(false), 2000);
    }
  }, [ifHerFlagBreaksResult]);

  const handleIfHerFlagBreaksDownload = useCallback(() => {
    if (ifHerFlagBreaksResult) {
      downloadTranslation(ifHerFlagBreaksResult);
    }
  }, [ifHerFlagBreaksResult]);

  const handleStyledDownload = useCallback(() => {
    if (styledResult) {
      downloadTranslation(styledResult);
    }
  }, [styledResult]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">WebNovel Translator</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('translate')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'translate'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Languages className="h-4 w-4" />
                <span>Translate</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>History</span>
              </button>
              <button
                onClick={() => setActiveTab('styled')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'styled'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText size={16} />
                <span>Styled Translation</span>
              </button>
              <button
                onClick={() => setActiveTab('ifHerFlagBreaks')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'ifHerFlagBreaks'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText size={16} />
                <span>If Her Flag Breaks</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'translate' && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <FileUpload id="main-translation-upload" onFileUpload={handleFileUpload} onRemoveFile={handleRemoveFile} uploadedFile={uploadedFile} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <TextInput value={inputText} onChange={setInputText} />
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <LanguageSelector 
                        selected={sourceLanguage} 
                        onSelect={setSourceLanguage} 
                        label="Source Language"
                        languages={languages}
                      />
                      <div>
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                          <button onClick={swapLanguages} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <RefreshCw className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                        <LanguageSelector 
                          selected={targetLanguage} 
                          onSelect={setTargetLanguage} 
                          label=""
                          languages={languages}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="engine-select" className="block text-sm font-medium text-gray-700 mb-2">Translation Engine</label>
                      <div className="relative">
                        <select 
                          id="engine-select"
                          value={engine}
                          onChange={(e) => setEngine(e.target.value as TranslationEngine)}
                          className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                        >
                          <option value="mymemory">MyMemory (Free)</option>
                          <option value="deepl">DeepL (API Key)</option>
                          <option value="gemini">Gemini (API Key)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                      {(engine === 'deepl' || engine === 'gemini') && (
                        <div className="mt-4">
                          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                            {engine === 'deepl' ? 'DeepL API Key' : 'Gemini API Key'}
                          </label>
                          <input
                            type="password"
                            id="api-key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                            placeholder="Enter your API key"
                          />
                          {engine === 'deepl' && (
                            <p className="text-xs text-gray-500 mt-2">Get a free key from <a href="https://www.deepl.com/pro-api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">deepl.com</a>.</p>
                          )}
                          {engine === 'gemini' && (
                            <p className="text-xs text-gray-500 mt-2">Get a free key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <button 
                      onClick={isTranslating ? cancelTranslation : handleTranslate}
                      disabled={!inputText.trim()}
                      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${isTranslating ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200`}
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span>Translating... ({progress}%)</span>
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          <span>Translate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {currentResult && (
              <div className="mt-8">
                <TranslationResultComponent 
                  result={currentResult} 
                  onCopy={handleCopy} 
                  copied={copied} 
                  onDownload={handleDownload} 
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <TranslationHistory
                history={translationHistory}
                onLoadTranslation={handleLoadFromHistory}
                onDownloadTranslation={handleDownloadFromHistory}
              />
            </div>
          </div>
        )}

        {activeTab === 'styled' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Styled Translation</h2>
              <p className="text-gray-600 mb-6">Upload example translation files to guide the AI. Provide a source text file and a corresponding target text file that reflects the desired translation style.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <LanguageSelector
                  label="Source Language"
                  selected={styledSourceLanguage}
                  onSelect={setStyledSourceLanguage}
                  languages={languages}
                />
                <div className="flex items-end justify-center">
                  <button onClick={() => { setStyledSourceLanguage(styledTargetLanguage); setStyledTargetLanguage(styledSourceLanguage); }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <RefreshCw className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <LanguageSelector
                  label="Target Language"
                  selected={styledTargetLanguage}
                  onSelect={setStyledTargetLanguage}
                  languages={languages}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="gemini-api-key-styled" className="block text-sm font-medium text-gray-800 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  id="gemini-api-key-styled"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50"
                  placeholder="Enter your Gemini API Key"
                />
                <p className="text-xs text-gray-500 mt-2">You can get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Example Source File Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Example Source ({styledSourceLanguageName})</h3>
                  <FileUpload 
                    id="example-source-upload"
                    onFileUpload={handleExampleSourceUpload} 
                    onRemoveFile={handleRemoveExampleSourceFile} 
                    uploadedFile={exampleSourceFile} 
                  />
                  {exampleSourceText && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{exampleSourceText}</pre>
                    </div>
                  )}
                </div>

                {/* Example Target File Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Example Translation ({styledTargetLanguageName})</h3>
                  <FileUpload 
                    id="example-target-upload"
                    onFileUpload={handleExampleTargetUpload} 
                    onRemoveFile={handleRemoveExampleTargetFile} 
                    uploadedFile={exampleTargetFile} 
                  />
                  {exampleTargetText && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{exampleTargetText}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Text to Translate</h3>
                <TextInput value={styledInput} onChange={setStyledInput} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Styled Result</h3>
                {styledResult ? (
                  <TranslationResultComponent 
                    result={styledResult}
                    onCopy={handleStyledCopy}
                    copied={styledCopied}
                    onDownload={handleStyledDownload}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Translation result will appear here.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleStyled}
                disabled={!styledInput.trim() || !exampleSourceText || !exampleTargetText || isTranslating}
                className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${isTranslating ? 'bg-yellow-500' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200`}
              >
                <Zap className="mr-2 h-5 w-5" />
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    <span>Translate with Style</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ifHerFlagBreaks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">If Her Flag Breaks</h2>
              <p className="text-gray-600 mb-6">Translate If Her Flag Breaks using Person72635's translations as examples.</p>

              <div className="mb-6">
                <label htmlFor="gemini-api-key-if-her-flag-breaks" className="block text-sm font-medium text-gray-800 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  id="gemini-api-key-if-her-flag-breaks"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50"
                  placeholder="Enter your Gemini API Key"
                />
                <p className="text-xs text-gray-500 mt-2">You can get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Text to Translate (Chinese)</h3>
                  <TextInput value={ifHerFlagBreaksInput} onChange={setIfHerFlagBreaksInput} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Result (English)</h3>
                  {ifHerFlagBreaksResult ? (
                    <TranslationResultComponent 
                      result={ifHerFlagBreaksResult}
                      onCopy={handleIfHerFlagBreaksCopy}
                      copied={ifHerFlagBreaksCopied}
                      onDownload={handleIfHerFlagBreaksDownload}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Translation result will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleIfHerFlagBreaks}
                disabled={!ifHerFlagBreaksInput.trim() || !flagBreaksExampleSource || !flagBreaksExampleTarget || isTranslating}
                className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white ${isTranslating ? 'bg-yellow-500' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200`}
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    <span>Translate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;