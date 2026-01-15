
import React from 'react';

interface ArticleGeneratorProps {
  topic: string;
  setTopic: (topic: string) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
}

const ArticleGenerator: React.FC<ArticleGeneratorProps> = ({
  topic,
  setTopic,
  onGenerate,
  loading,
  error,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8 no-print">
      <div className="mb-6">
        <label htmlFor="topic-input" className="block text-xl font-semibold text-gray-700 mb-2">
          What exciting current event should we write about today?
        </label>
        <input
          id="topic-input"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., new dinosaur discovery, space mission to Mars, giant cookie baked!"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
          disabled={loading}
        />
      </div>

      <button
        onClick={onGenerate}
        className="w-full bg-pink-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-pink-700 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Fun News...
          </>
        ) : (
          'Generate My Awesome Article!'
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
          Oops! Something went wrong: {error}
        </div>
      )}
    </div>
  );
};

export default ArticleGenerator;
