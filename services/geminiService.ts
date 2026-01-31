import { GoogleGenAI } from "@google/genai";
import { ImageUpload } from "../types";

// NOTE: Changed process.env to import.meta.env for Vite Client compatibility
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

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
  if (!personImage.base64 || !clothingImage.base64) {
    throw new Error("Images are missing base64 data.");
  }

  try {
    // 1. Resize images to reduce token count (Critical for Free Tier)
    const resizedPerson = await resizeImage(personImage.base64);
    const resizedClothing = await resizeImage(clothingImage.base64);

    // 2. Strip headers for API
    const personBase64 = resizedPerson.split(',')[1];
    const clothingBase64 = resizedClothing.split(',')[1];

    // 3. Call the API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            // Concise but STRICT prompt to handle mannequins correctly
            text: `VIRTUAL TRY-ON TASK

            INPUTS:
            [Image 1]: TARGET PERSON (The User).
            [Image 2]: CLOTHING REFERENCE (The Outfit).

            STRICT INSTRUCTIONS:
            1. GENERATE a photorealistic image of the TARGET PERSON from [Image 1] wearing the outfit from [Image 2].
            2. FACE & BODY: You MUST preserve the facial features, skin tone, and body proportions of the TARGET PERSON in [Image 1].
            3. IGNORE MANNEQUIN: If [Image 2] shows a mannequin or another model, completely ignore their body/face. Only extract the clothing fabric/pattern.
            4. FIT: Drape the clothing naturally on the TARGET PERSON's pose.
            5. REPLACE CLOTHING: You MUST completely REMOVE the original clothing of the TARGET PERSON before applying the new outfit. Do NOT overlay the new outfit on top of the old one. The original clothes should not be visible.
            6. DETAILS: Keep the exact embroidery and color of the clothing.
            7. LIGHTING: Preserve the lighting and brightness of the original photo. Do NOT darken the image.
            8. SINGLE USER ONLY: The output must contain EXACTLY ONE person (The Target Person). Do NOT generate a side-by-side comparison. Do NOT include the original person standing next to the new one.

            Output: The final generated image only. containing a SINGLE person.`
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
        // Using string literals cast to any to avoid runtime Enum import issues while satisfying TS
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_ONLY_HIGH' as any },
          { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_ONLY_HIGH' as any },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_ONLY_HIGH' as any },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_ONLY_HIGH' as any },
        ],
        imageConfig: {
          aspectRatio: "3:4"
        }
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
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    }

    throw new Error("No image generated. The model might be busy or the input was filtered.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error.message?.includes('403')) {
      throw new Error("Permission Denied. API Key issue or Model access restricted.");
    }

    if (error.message?.includes('429')) {
      throw new Error("Too many requests. The free plan has limits on image generation. Please wait 30 seconds and try again.");
    }

    if (error.message?.includes('503')) {
      throw new Error("The AI service is currently overloaded. Please try again in a moment.");
    }

    throw new Error(error.message || "Failed to generate try-on image.");
  }
};