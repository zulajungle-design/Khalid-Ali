
import { GoogleGenAI, Type, GenerateContentResponse, RequestOptions } from "@google/genai";
import { ArticleParagraph, ArticleTextResponse, ImageSize } from '../types';

/**
 * Utility function to convert a Blob to a base64 string
 * @param blob The Blob object to convert.
 * @returns A Promise that resolves with the base64 encoded string (data part only, without "data:mime/type;base64," prefix).
 */
export async function blobToBase64(blob: Blob): Promise<{ data: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data part (e.g., "data:image/jpeg;base64,..." -> "...")
      const [header, base64Data] = result.split(',');
      const mimeType = header.match(/data:(.*?);base64/)?.[1] || '';
      if (base64Data && mimeType) {
        resolve({ data: base64Data, mimeType: mimeType });
      } else {
        reject(new Error('Failed to extract base64 data or mime type from Blob.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates an article for kids with multiple paragraphs and a 3D image for each paragraph.
 * @param topic The current event topic for the article.
 * @returns An array of ArticleParagraph objects, each containing text and an image URL.
 */
export const generateKidArticle = async (topic: string): Promise<ArticleParagraph[]> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please configure your API key.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Generate article text in JSON format
  const articlePrompt = `Write a funny, educational news article about "${topic}" for children aged 6-10.
  The article should be at least 5 paragraphs long. Each paragraph should be distinct, easy to understand, and include a humorous touch.
  Format your response as a JSON array of objects, where each object has a 'paragraph' key containing the text for that paragraph.`;

  let articleTextResponse: GenerateContentResponse;
  try {
    articleTextResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Suitable for basic text tasks
      contents: articlePrompt,
      config: {
        systemInstruction: "You are a friendly, funny, and educational AI assistant writing news articles for children aged 6-10. Your articles should be easy to understand, and always include a humorous touch.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              paragraph: {
                type: Type.STRING,
                description: 'A single paragraph of the news article for kids, written in a funny and engaging way.'
              },
            },
            required: ['paragraph'],
          },
        },
      },
    });
  } catch (error: any) {
    console.error("Error generating article text:", error);
    throw new Error(`Could not generate article text. Please try a different topic. ${error.message || error}`);
  }

  const jsonString = articleTextResponse.text;
  if (!jsonString) {
    throw new Error('Failed to get article text from Gemini API.');
  }

  let paragraphsData: ArticleTextResponse[];
  try {
    paragraphsData = JSON.parse(jsonString);
    if (!Array.isArray(paragraphsData) || paragraphsData.length < 5) {
        throw new Error('Generated article does not contain at least 5 paragraphs or is not in the expected format.');
    }
  } catch (parseError) {
    console.error("Error parsing article JSON:", parseError);
    // If JSON parsing fails, attempt to extract paragraphs heuristically if it's plain text.
    // This is a fallback and might not always produce the desired 5 paragraphs
    const lines = jsonString.split('\n').filter(line => line.trim().length > 0);
    paragraphsData = lines.slice(0, Math.max(5, lines.length)).map(line => ({ paragraph: line }));
    if (paragraphsData.length < 5) {
      throw new Error(`Failed to parse article text or generate enough paragraphs. Raw response: ${jsonString}`);
    }
  }

  const articleWithImages: ArticleParagraph[] = [];

  // 2. Generate a 3D image for each paragraph
  for (const pData of paragraphsData) {
    const imagePrompt = `Generate a 3D, cartoon-style, funny image related to this text for kids: "${pData.paragraph}". Focus on bright colors, engaging characters, and a light-hearted mood.`;
    
    let imageResponse: GenerateContentResponse;
    try {
      imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Nano Banana for image generation
        contents: {
          parts: [
            { text: imagePrompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1", // Square images
          },
        },
      });
    } catch (imageError: any) {
      console.error(`Error generating image for paragraph: "${pData.paragraph}"`, imageError);
      // Fallback to a placeholder image if generation fails
      articleWithImages.push({
        text: pData.paragraph,
        imageUrl: 'https://picsum.photos/400/400?grayscale', // Placeholder
      });
      continue; // Skip to the next paragraph
    }

    let imageUrl: string = 'https://picsum.photos/400/400?blur=2'; // Default placeholder

    // Find the image part in the response
    const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      const base64EncodeString: string = imagePart.inlineData.data;
      imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64EncodeString}`;
    } else {
      console.warn(`No inline image data found for paragraph: "${pData.paragraph}"`);
    }

    articleWithImages.push({
      text: pData.paragraph,
      imageUrl: imageUrl,
    });
  }

  return articleWithImages;
};

/**
 * Generates a new image from a text prompt using Gemini 3 Pro Image Preview.
 * @param prompt The text prompt for image generation.
 * @param imageSize The desired size of the image (1K, 2K, 4K).
 * @param requestOptions Optional request options for the API call.
 * @returns A base64 encoded image URL.
 */
export const generateImage = async (prompt: string, imageSize: ImageSize, requestOptions?: RequestOptions): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please configure your API key.');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageGenerationPrompt = `Generate a vibrant, high-quality, cartoon-style image for kids based on: "${prompt}". Ensure it is visually appealing and child-friendly.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: imageGenerationPrompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Default to square, can be enhanced with UI options if needed
          imageSize: imageSize,
        },
      },
    }, requestOptions); // Pass requestOptions here

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      const base64EncodeString: string = imagePart.inlineData.data;
      return `data:${imagePart.inlineData.mimeType};base64,${base64EncodeString}`;
    } else {
      throw new Error('No image data found in the response.');
    }
  } catch (error: any) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate image: ${error.message || 'An unknown error occurred.'}`);
  }
};

/**
 * Edits an existing image based on a text prompt using Gemini 2.5 Flash Image.
 * @param originalImageBase64Data The base64 data of the original image.
 * @param originalImageMimeType The MIME type of the original image.
 * @param editPrompt The text prompt describing the desired edit.
 * @returns A base64 encoded image URL of the edited image.
 */
export const editImage = async (originalImageBase64Data: string, originalImageMimeType: string, editPrompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please configure your API key.');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImageBase64Data,
              mimeType: originalImageMimeType,
            },
          },
          {
            text: `Edit this image for kids in a funny, cartoon style: ${editPrompt}`,
          },
        ],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      const base64EncodeString: string = imagePart.inlineData.data;
      return `data:${imagePart.inlineData.mimeType};base64,${base64EncodeString}`;
    } else {
      throw new Error('No edited image data found in the response.');
    }
  } catch (error: any) {
    console.error("Error editing image:", error);
    throw new Error(`Failed to edit image: ${error.message || 'An unknown error occurred.'}`);
  }
};

/**
 * Gets a quick, low-latency text response using Gemini 2.5 Flash Lite.
 * @param prompt The user's question or prompt.
 * @returns A plain text response.
 */
export const getQuickResponse = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please configure your API key.');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly, enthusiastic AI assistant that provides short, fun, and easy-to-understand facts or answers for children.",
        temperature: 0.7, // Keep it creative but factual
        maxOutputTokens: 100, // Keep responses concise for low-latency
      },
    });
    return response.text || 'Oops! I tried to think of a fun fact, but my wires got a bit tangled!';
  } catch (error: any) {
    console.error("Error getting quick response:", error);
    throw new Error(`Failed to get quick response: ${error.message || 'An unknown error occurred.'}`);
  }
};
