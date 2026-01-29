import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageUpload } from "../types";

// In Vite, env vars must start with VITE_ to be exposed to the client
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Helper to resize an image to a maximum dimension.
 * REDUCED to 800px to prevent 429 Quota Exceeded errors on Free Tier.
 */
const resizeImage = (base64Str: string, maxDimension: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // Using 0.7 quality to further reduce payload size
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str); // Fallback
      }
    };
  });
};

/**
 * Generates a virtual try-on image using Gemini.
 */
export const generateTryOnImage = async (
  personImage: ImageUpload,
  clothingImage: ImageUpload
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  if (!personImage.base64 || !clothingImage.base64) {
    throw new Error("Images are missing base64 data.");
  }

  try {
    // 1. Resize images to reduce token count (Critical for Free Tier)
    const resizedPerson = await resizeImage(personImage.base64, 800);
    const resizedClothing = await resizeImage(clothingImage.base64, 800);

    // 2. Strip headers for API
    const personBase64 = resizedPerson.split(',')[1];
    const clothingBase64 = resizedClothing.split(',')[1];

    // 3. Call the API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            // PROMPT UPDATED: Uses the "Photo Editor" Persona to prevent Mannequin hallucinations
            text: `You are a professional Texture Transfer & Photo Retouching AI.
                
            TASK:
            Transfer the clothing texture from "Image 2" onto the person in "Image 1".
            
            STRICT COMPOSITING RULES:
            1. BASE IMAGE (Image 1): usage = MASTER CANVAS. 
                - You MUST keep the exact pixel dimensions, background, lighting, and pose of Image 1.
                - The final output MUST look like Image 1, just with different clothes.
                - DO NOT CHANGE THE PERSON'S FACE OR BODY SHAPE.
            
            2. SOURCE TEXTURE (Image 2): usage = TEXTURE REFERENCE ONLY.
                - Extract only the fabric pattern/color from this image.
                - IGNORE the mannequin, human model, or background in Image 2.
                - DO NOT generate the mannequin.
            
            3. EXECUTION STEPS:
                A. Identify the shirt/dress/outfit in Image 2.
                B. Segment the body of the person in Image 1.
                C. Warp the fabric from Image 2 to fit the body of Image 1 strictly.
                D. If the new clothing revealed skin (e.g. sleeveless), generate realistic skin for the person in Image 1.
            
            CRITICAL FAILURE CONDITIONS:
            - If the output looks like a mannequin -> FAILED.
            - If the face changes -> FAILED.
            - If the background changes from Image 1 -> FAILED.
            
            Inputs:
            - Image 1 (BASE): Person (Target)
            - Image 2 (OVERLAY): Garment (Source)
            
            RETURN ONLY THE TRANSFORMED IMAGE 1.`
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: personBase64
            }
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: clothingBase64
            }
          }
        ]
      },
      config: {
        // Explicitly set safety settings to BLOCK_ONLY_HIGH to avoid false positives on body images
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      }
    });

    // 4. Validate Response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];

      // Check if the model refused to generate due to safety
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("The AI blocked this request for safety reasons. Please try a different photo (avoid revealing clothing or complex poses).");
      }

      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`; // Fixed MIME type assumption 
          }
          // Handle text output if necessary (though we expect image)
        }
      }
    }

    throw new Error("No image generated. The model might be busy or the input was filtered.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error.message?.includes('403')) {
      throw new Error("Permission Denied. Check API Key or Model access.");
    }

    if (error.message?.includes('429')) {
      throw new Error("Too many requests. Please wait 30 seconds and try again.");
    }

    if (error.message?.includes('503')) {
      throw new Error("The AI service is overloaded. Please try again.");
    }

    throw new Error(error.message || "Failed to generate try-on image.");
  }
};