import { ImageUpload } from "../types";
const resizeImage = (base64Str: string, maxDimension: number = 1536): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.95)); // 0.95 High Quality
    };
  });
};

/**
 * Generates a virtual try-on image using the backend API.
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

    // 2. Strip headers for API so we send clean base64
    const personBase64 = resizedPerson.split(',')[1];
    const clothingBase64 = resizedClothing.split(',')[1];

    // 3. Call the Backend API
    const response = await fetch('/api/generate-try-on', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personImage: personBase64,
        clothingImage: clothingBase64,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate image");
    }

    return data.result;

  } catch (error: any) {
    console.error("Generator Error:", error);
    throw new Error(error.message || "Failed to generate try-on image.");
  }
};