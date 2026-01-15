
import React, { useState, FormEvent } from 'react';
import { getQuickResponse } from '../services/geminiService';

const QuickChat: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please ask a question to get a fun fact!');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const aiResponse = await getQuickResponse(question);
      setResponse(aiResponse);
    } catch (err: any) {
      console.error("Error getting quick response:", err);
      setError(`Oops! Couldn't get a fun fact right now: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8">
      <h2 className="text-4xl font-extrabold text-teal-700 text-center mb-8">
        🚀 Fun Fact Chat! 🚀
      </h2>
      <p className="text-lg text-gray-700 text-center mb-6">
        Ask me anything and I'll give you a super fast, fun answer!
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="chat-question" className="block text-xl font-semibold text-gray-700 sr-only">
          Ask your question:
        </label>
        <input
          id="chat-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., Why do cats purr? Tell me a joke!"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-lg"
          disabled={loading}
          aria-label="Your question for the AI"
        />
        <button
          type="submit"
          className="w-full bg-teal-500 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-teal-600 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={loading || !question.trim()}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking of a Fun Fact...
            </>
          ) : (
            'Get Fun Fact!'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-6 p-5 bg-teal-50 border border-teal-200 rounded-lg shadow-inner">
          <h4 className="text-xl font-bold text-teal-800 mb-3">AI Says:</h4>
          <p className="text-lg text-gray-800 leading-relaxed">
            {response}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickChat;
