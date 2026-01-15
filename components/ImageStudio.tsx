
import React, { useState, ChangeEvent, useRef } from 'react';
import { generateImage, editImage, blobToBase64 } from '../services/geminiService';
import { ImageSize, ImageResult } from '../types';

interface ImageStudioProps {
  apiKeySelected: boolean;
  onSelectApiKey: () => Promise<void>;
  onApiKeyError: () => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ apiKeySelected, onSelectApiKey, onApiKeyError }) => {
  // Image Generation States
  const [generatePrompt, setGeneratePrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<ImageResult | null>(null);
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);
  // Allow React.ReactNode in error state to display rich error messages with buttons/links
  const [generateError, setGenerateError] = useState<string | React.ReactNode | null>(null);
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize>(ImageSize['1K']);

  // Image Editing States
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editedImage, setEditedImage] = useState<ImageResult | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  // Allow React.ReactNode in error state to display rich error messages
  const [editError, setEditError] = useState<string | React.ReactNode | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) {
      setGenerateError('Please enter a prompt to generate an image.');
      return;
    }
    if (!apiKeySelected) {
      setGenerateError(
        <>
          Image generation with this model requires a paid API key. Please{' '}
          <button onClick={onSelectApiKey} className="text-blue-700 underline font-bold">select your API key</button>
          {' '}to proceed.
          <br />
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            Billing information
          </a>
        </>
      );
      return;
    }

    setGenerateLoading(true);
    setGenerateError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateImage(generatePrompt, selectedImageSize);
      setGeneratedImage({ url: imageUrl, prompt: generatePrompt, size: selectedImageSize });
    } catch (err: any) {
      console.error("Error generating image:", err);
      // Ensure existing error content (if any) is preserved or correctly merged when updating.
      setGenerateError((prev) => (
        <>
          {typeof prev === 'string' ? prev : null}
          {prev ? <br /> : null} {/* Add line break only if there was previous content */}
          Failed to generate image: {err.message || 'An unknown error occurred.'}
        </>
      ));
      if (err.message && err.message.includes("Requested entity was not found.")) {
        onApiKeyError(); // Signal App to reset API key status
        setGenerateError(prev => (
          <>
            {prev} <br /> Your API key might be invalid or not properly configured for this model. Please{' '}
            <button onClick={onSelectApiKey} className="text-blue-700 underline font-bold">re-select your API key</button>.
          </>
        ));
      }
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setEditError(null);
      setEditedImage(null);
    } else {
      setOriginalImageFile(null);
      setOriginalImagePreview(null);
    }
  };

  const handleEditImage = async () => {
    if (!originalImageFile) {
      setEditError('Please upload an image to edit.');
      return;
    }
    if (!editPrompt.trim()) {
      setEditError('Please enter an edit prompt.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    setEditedImage(null);

    try {
      const { data, mimeType } = await blobToBase64(originalImageFile);
      const imageUrl = await editImage(data, mimeType, editPrompt);
      setEditedImage({ url: imageUrl, prompt: editPrompt });
    } catch (err: any) {
      console.error("Error editing image:", err);
      setEditError(`Failed to edit image: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8">
      <h2 className="text-4xl font-extrabold text-purple-700 text-center mb-8">
        🌟 Image Studio 🌟
      </h2>

      {/* Image Generation Section */}
      <div className="mb-12 border-b-2 border-purple-200 pb-8">
        <h3 className="text-3xl font-bold text-indigo-600 mb-6 text-center">Generate New Images (Gemini 3 Pro Image)</h3>
        <p className="text-lg text-gray-700 text-center mb-6">
          Dream up anything and watch AI bring it to life in high quality!
        </p>
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <input
            type="text"
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            placeholder="e.g., A happy unicorn eating a rainbow ice cream"
            className="flex-grow px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
            disabled={generateLoading}
            aria-label="Image generation prompt"
          />
          <select
            value={selectedImageSize}
            onChange={(e) => setSelectedImageSize(e.target.value as ImageSize)}
            className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg md:w-auto"
            disabled={generateLoading}
            aria-label="Select image size"
          >
            {Object.values(ImageSize).map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <button
            onClick={handleGenerateImage}
            className="w-full md:w-auto bg-green-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={generateLoading}
          >
            {generateLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </button>
        </div>
        {generateError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
            {generateError}
          </div>
        )}
        {generatedImage && (
          <div className="mt-8 text-center bg-blue-50 p-4 rounded-lg shadow-inner">
            <h4 className="text-xl font-semibold text-blue-800 mb-4">Your Generated Masterpiece:</h4>
            <img
              src={generatedImage.url}
              alt={generatedImage.prompt}
              className="max-w-full h-auto mx-auto rounded-lg shadow-md border-4 border-blue-300 transition duration-300 ease-in-out hover:scale-105"
              onError={(e) => { e.currentTarget.src = 'https://picsum.photos/400/400?random=fail'; e.currentTarget.alt = 'Failed to load generated image, showing a placeholder.'; }}
            />
            <p className="text-sm text-gray-600 mt-2 italic">Prompt: "{generatedImage.prompt}" (Size: {generatedImage.size})</p>
          </div>
        )}
      </div>

      {/* Image Editing Section */}
      <div>
        <h3 className="text-3xl font-bold text-indigo-600 mb-6 text-center">Edit Existing Images (Gemini 2.5 Flash Image)</h3>
        <p className="text-lg text-gray-700 text-center mb-6">
          Upload a picture and tell AI how to change it!
        </p>
        <div className="mb-6">
          <label htmlFor="image-upload" className="block text-xl font-semibold text-gray-700 mb-2">
            1. Upload an image:
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            ref={fileInputRef}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm text-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            aria-label="Upload image for editing"
          />
          {originalImagePreview && (
            <div className="mt-4 text-center">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Original Image Preview:</h4>
              <img
                src={originalImagePreview}
                alt="Original for editing"
                className="max-w-xs md:max-w-sm h-auto mx-auto rounded-lg shadow-md border-2 border-gray-300"
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="edit-prompt" className="block text-xl font-semibold text-gray-700 mb-2">
            2. Tell AI what to do:
          </label>
          <input
            id="edit-prompt"
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="e.g., Add a wizard hat to the dog, make the background blue"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
            disabled={editLoading || !originalImageFile}
            aria-label="Image edit prompt"
          />
        </div>

        <button
          onClick={handleEditImage}
          className="w-full bg-orange-500 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-orange-600 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={editLoading || !originalImageFile || !editPrompt.trim()}
        >
          {editLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Editing Image...
            </>
          ) : (
            'Edit My Image!'
          )}
        </button>

        {editError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
            {editError}
          </div>
        )}
        {editedImage && (
          <div className="mt-8 text-center bg-yellow-50 p-4 rounded-lg shadow-inner">
            <h4 className="text-xl font-semibold text-yellow-800 mb-4">Your Edited Image:</h4>
            <img
              src={editedImage.url}
              alt={editedImage.prompt}
              className="max-w-full h-auto mx-auto rounded-lg shadow-md border-4 border-yellow-300 transition duration-300 ease-in-out hover:scale-105"
              onError={(e) => { e.currentTarget.src = 'https://picsum.photos/400/400?random=fail'; e.currentTarget.alt = 'Failed to load edited image, showing a placeholder.'; }}
            />
            <p className="text-sm text-gray-600 mt-2 italic">Edit Instruction: "{editedImage.prompt}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageStudio;