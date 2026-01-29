import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
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
            [Image 1]: TARGET USER. This is the person who must appear in the final photo.
            [Image 2]: CLOTHING REFERENCE. This shows the Saree/Lehenga/Outfit. It may be on a MANNEQUIN, a model, or a hanger.

            INSTRUCTIONS:
            1. Take the clothes from [Image 2] and put them on the person in [Image 1].
            2. IGNORE THE MANNEQUIN/MODEL in [Image 2]. Do not generate the mannequin's face or plastic body. 
            3. The final image MUST show the face, skin tone, and body pose of the PERSON in [Image 1].
            4. Wrap the garment naturally around the user's body shape.
            5. PRESERVE DETAILS: Keep the exact embroidery, patterns, and colors of the garment.

            Output: A high-quality photorealistic image of Person 1 wearing Outfit 2.`
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