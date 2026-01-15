
import React, { useState, useCallback, useEffect } from 'react';
import { generateKidArticle } from './services/geminiService';
import { ArticleParagraph, AppView } from './types';
import ArticleGenerator from './components/ArticleGenerator';
import ArticleDisplay from './components/ArticleDisplay';
import ImageStudio from './components/ImageStudio';
import QuickChat from './components/QuickChat';

// The 'window.aistudio' object and its methods are assumed to be pre-configured, valid, and accessible in the execution context.
// Therefore, an explicit 'declare global' is not needed and can cause type conflicts if already defined by the environment.
// declare global {
//   interface Window {
//     aistudio: {
//       hasSelectedApiKey: () => Promise<boolean>;
//       openSelectKey: () => Promise<void>;
//     };
//   }
// }

function App() {
  const [topic, setTopic] = useState<string>('');
  const [article, setArticle] = useState<ArticleParagraph[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.ARTICLES);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false); // For premium models like gemini-3-pro-image-preview

  useEffect(() => {
    const checkApiKeyStatus = async () => {
      // Check if window.aistudio and its methods are available before attempting to use them.
      // The problem statement asserts they are accessible, but a runtime check is good practice.
      if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setApiKeySelected(hasKey);
        } catch (e) {
          console.error("Error checking API key status:", e);
          setApiKeySelected(false);
        }
      } else {
        console.warn('window.aistudio or hasSelectedApiKey not available. API key selection will not function.');
        // If the API key selection mechanism isn't available, we assume the API_KEY env var is the sole source.
        // For local development or environments without `window.aistudio`, proceed as if key is selected.
        setApiKeySelected(!!process.env.API_KEY);
      }
    };
    checkApiKeyStatus();
  }, []);

  const handleSelectApiKey = async () => {
    if (typeof window.aistudio !== 'undefined' && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Assume success immediately to avoid race condition, as per guidelines.
        setApiKeySelected(true);
      } catch (e) {
        console.error("Error opening API key selection:", e);
        alert('Failed to open API key selection. Please try again.');
        setApiKeySelected(false); // Reset if selection failed
      }
    } else {
      alert('API key selection tool not available. Ensure you are in a supported environment.');
    }
  };

  const handleGenerateArticle = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a current event topic to generate an article.');
      return;
    }
    setLoading(true);
    setError(null);
    setArticle(null); // Clear previous article
    try {
      const generatedArticle = await generateKidArticle(topic);
      setArticle(generatedArticle);
    } catch (err: any) {
      console.error("Error generating article:", err);
      setError(`Failed to generate article: ${err.message || 'An unknown error occurred.'}`);
      // If a premium model fails due to "Requested entity was not found." (Veo/Imagen),
      // it might indicate an API key issue, so prompt for key selection again.
      if (err.message && err.message.includes("Requested entity was not found.")) {
        setApiKeySelected(false);
      }
    } finally {
      setLoading(false);
    }
  }, [topic]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8 no-print">
        <h1 className="text-5xl font-extrabold text-blue-700 leading-tight mb-4 tracking-wider">
          AI Kids <span className="text-pink-500">News</span>
        </h1>
        <p className="text-xl text-indigo-600 font-medium">
          Funny news, just for you! Powered by AI.
        </p>
        <nav className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setCurrentView(AppView.ARTICLES)}
            className={`px-6 py-3 rounded-full font-bold transition duration-300 ease-in-out transform hover:scale-105 ${currentView === AppView.ARTICLES ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
            aria-current={currentView === AppView.ARTICLES ? 'page' : undefined}
          >
            Kids News Articles
          </button>
          <button
            onClick={() => setCurrentView(AppView.IMAGE_STUDIO)}
            className={`px-6 py-3 rounded-full font-bold transition duration-300 ease-in-out transform hover:scale-105 ${currentView === AppView.IMAGE_STUDIO ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
            aria-current={currentView === AppView.IMAGE_STUDIO ? 'page' : undefined}
          >
            Image Studio
          </button>
          <button
            onClick={() => setCurrentView(AppView.QUICK_CHAT)}
            className={`px-6 py-3 rounded-full font-bold transition duration-300 ease-in-out transform hover:scale-105 ${currentView === AppView.QUICK_CHAT ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
            aria-current={currentView === AppView.QUICK_CHAT ? 'page' : undefined}
          >
            Fun Fact Chat
          </button>
        </nav>
      </header>

      {currentView === AppView.ARTICLES && (
        <>
          <ArticleGenerator
            topic={topic}
            setTopic={setTopic}
            onGenerate={handleGenerateArticle}
            loading={loading}
            error={error}
          />
          {article && (
            <ArticleDisplay article={article} />
          )}
        </>
      )}

      {currentView === AppView.IMAGE_STUDIO && (
        <ImageStudio
          apiKeySelected={apiKeySelected}
          onSelectApiKey={handleSelectApiKey}
          onApiKeyError={() => setApiKeySelected(false)} // Reset key status if an image API call fails with entity not found
        />
      )}

      {currentView === AppView.QUICK_CHAT && (
        <QuickChat />
      )}
    </div>
  );
}

export default App;
