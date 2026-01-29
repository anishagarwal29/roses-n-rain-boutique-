
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
                
                RETURN ONLY THE TRANSFORMED IMAGE 1.`
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
