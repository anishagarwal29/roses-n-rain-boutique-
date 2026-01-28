import { GoogleGenAI } from "@google/genai";
import { ImageUpload } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Initialize the client
// Last updated: 2026-01-28 (Force Deploy)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Helper to resize an image to a maximum dimension, reducing token usage.
 * Slightly increased to 1280 to capture embroidery details better.
 */
const resizeImage = (base64Str: string, maxDimension: number = 1280): Promise<string> => {
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
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85)); // 0.85 quality to keep textures sharp
    };
  });
};

/**
 * Generates a virtual try-on image using Gemini.
 * @param personImage The image of the user.
 * @param clothingImage The image of the clothing item.
 * @returns The base64 data URL of the generated image.
 */
export const generateTryOnImage = async (
  personImage: ImageUpload,
  clothingImage: ImageUpload
): Promise<string> => {
  if (!personImage.base64 || !clothingImage.base64) {
    throw new Error("Images are missing base64 data.");
  }

  try {
    // 1. Resize images to reduce token count and avoid 429 Errors
    const resizedPerson = await resizeImage(personImage.base64);
    const resizedClothing = await resizeImage(clothingImage.base64);

    // 2. Strip headers for API
    const personBase64 = resizedPerson.split(',')[1];
    const clothingBase64 = resizedClothing.split(',')[1];

    // 3. Call the API with the Flash Model (Stable & Fast)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      config: {
        generationConfig: {
          temperature: 0.0, // Strict deterministic output
        }
      },
      contents: {
        parts: [
          {
            text: `You are an expert digital tailor specializing in high-end Indian ethnic wear.
            
            YOUR GOAL:
            You are a "Virtual Try-On" generator.
            You MUST generate an image of the PERSON from Image 1, fully wearing the garment from Image 2.
            
            FAILURE CONDITIONS (DO NOT DO THIS):
            - Do NOT just return the garment image.
            - Do NOT just return the person image without the change.
            - The output MUST be a composite of Person + Garment.
            
            STRICT RULES FOR TEXTURE & COLOR PRESERVATION:
            1. [CRITICAL] NO LIGHTING CHANGES: Do NOT brighten, overexpose, or wash out the garment. Keep the exact brightness and contrast of the 'Garment Image'.
            2. [CRITICAL] EXACT COLOR MATCH: The output HEX codes of the fabric must match the input. Dark colors must STAY DARK.
            3. PRESERVE EMBROIDERY: All zari work, beads, borders, and prints visible in the 'Garment Image' must appear in the final output.
            4. NO HALLUCINATIONS: Do not generate new patterns or accessories.
            
            DRAPING INSTRUCTIONS:
            - If the garment is a Saree: Ensure the pleats are physically accurate at the waist and the Pallu drapes naturally over the shoulder.
            - If the garment is a Lehenga: Ensure the skirt volume is realistic.
            - Maintain the person's exact facial features, skin tone, and body shape.
            
            Negative Constraints:
            - NO overexposure.
            - NO color grading.
            - NO studio lighting effects that alter fabric perception.
            - NO floating garments.
            
            Inputs:
            - Image 1 (BASE): Person (Target)
            - Image 2 (OVERLAY): Garment (Source)
            
            Output only the final composite image.`
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
    });

    // Extract image from response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    }

    // Fallback if no image found directly in standard structure
    throw new Error("No image generated by the model. It might have been blocked by safety filters.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('429')) {
      throw new Error("Traffic is high. Please wait 1 minute and try again, or check your API key quota.");
    }
    throw new Error(error.message || "Failed to generate try-on image.");
  }
};