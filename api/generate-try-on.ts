
import { GoogleGenAI } from "@google/genai";

export const config = {
    runtime: 'edge', // Use Edge runtime for better performance if supported by @google/genai, otherwise switch to nodejs
};

// Note: If @google/genai doesn't support Edge, we might need to remove the config export or use nodejs
// Based on typical Node usage, standard Serverless (Lambda) might be safer than Edge for some libraries.
// However, let's stick to standard nodejs default if we don't strictly need Edge.
// Removing Edge config for safety with the SDK unless we are sure.
// Let's actually use standard Node.js runtime for this to be safe with the SDK.

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { personImage, clothingImage } = await request.json();

        if (!personImage || !clothingImage) {
            return new Response(JSON.stringify({ error: "Missing images" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set in environment variables");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        // 3. Call the API with the Flash Model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            // @ts-ignore
            config: {
                generationConfig: {
                    temperature: 0.0,
                }
            },
            contents: {
                parts: [
                    {
                        text: `You are an expert digital tailor specializing in high-end Indian ethnic wear.
                
                YOUR GOAL:
                You are a "Virtual Try-On" generator.
                You MUST generate an image of the PERSON from Image 1, fully wearing the garment from Image 2.
                
                CRITICAL INSTRUCTION: REPLACE, DO NOT LAYER.
                - You MUST digitally REMOVE the person's current clothes.
                - The new garment (Image 2) must replace the original outfit entirely.
                - DO NOT draw the new garment on top of the old clothes.
                - If the new garment reveals more skin than the original (e.g., sleeveless shoulders), you MUST generate realistic skin texture to match the person's skin tone. (e.g. if the original was a long sleeve shirt and the new dress is strapless, generate realistic bare arms/shoulders).
                
                FAILURE CONDITIONS (DO NOT DO THIS):
                - Do NOT just return the garment image.
                - Do NOT allow the original clothes to peek through underneath.
                - Do NOT create a "bulky" look by layering.
                
                STRICT RULES FOR TEXTURE & COLOR PRESERVATION:
                1. [CRITICAL] NO LIGHTING CHANGES: Do NOT brighten, overexpose, or wash out the garment. Keep the exact brightness and contrast of the 'Garment Image'.
                2. [CRITICAL] EXACT COLOR MATCH: The output HEX codes of the fabric must match the input. Dark colors must STAY DARK.
                3. PRESERVE EMBROIDERY: All zari work, beads, borders, and prints visible in the 'Garment Image' must appear in the final output.
                4. NO HALLUCINATIONS: Do not generate new patterns or accessories.
                
                DRAPING INSTRUCTIONS:
                - If the garment is a Saree: Ensure the pleats are physically accurate at the waist and the Pallu drapes naturally over the shoulder.
                - If the garment is a Lehenga: Ensure the skirt volume is realistic.
                - Maintain the person's exact facial features, skin tone, and body shape.
                - Natural Fit: The cloth should conform to the body's natural curves, replacing whatever volume was added by previous clothing.
                
                Inputs:
                - Image 1 (BASE): Person (Target)
                - Image 2 (OVERLAY): Garment (Source)
                
                Output only the final composite image.`
                    },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: personImage
                        }
                    },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: clothingImage
                        }
                    }
                ]
            },
        });

        // Extract image
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return new Response(JSON.stringify({
                            result: `data:image/png;base64,${part.inlineData.data}`
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }
        }

        return new Response(JSON.stringify({ error: "No image generated" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Gemini API Error:", error);

        let message = "Failed to generate try-on image.";
        if (error.message?.includes('429')) {
            message = "Traffic is high. Please wait 1 minute and try again.";
        }

        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
