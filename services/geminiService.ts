
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PromptRequest, GeneratedPrompt, Language, Shot, Character } from "../types";

const apiKey = process.env.API_KEY || "";

// Initialize the Gemini API
const ai = new GoogleGenAI({ apiKey });

const promptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, catchy title for the video concept.",
    },
    visualPrompt: {
      type: Type.STRING,
      description: "The main descriptive prompt detailing the subject, action, environment, and atmosphere. Use vivid language suitable for Sora/Veo.",
    },
    technicalPrompt: {
      type: Type.STRING,
      description: "Technical keywords including camera angles, lighting types (e.g., volumetric), film stock, render engine (e.g., Unreal Engine 5), and resolution.",
    },
    negativePrompt: {
      type: Type.STRING,
      description: "Elements to exclude to ensure high quality (e.g., blur, distortion, low quality).",
    },
    narration: {
      type: Type.STRING,
      description: "A voiceover script for the video. It MUST include emotion/tone tags in brackets at the beginning of sentences (e.g., [Mysterious], [Excited], [Calm]).",
    },
    shots: {
      type: Type.ARRAY,
      description: "A sequential breakdown of the video into individual shots/cuts.",
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER, description: "Shot number (1, 2, 3...)" },
          visualPrompt: { type: Type.STRING, description: "Specific visual action for this shot." },
          technicalPrompt: { type: Type.STRING, description: "Specific camera/lighting for this shot." },
          duration: { type: Type.STRING, description: "Duration of this shot (e.g., '3s')." },
          bgm: { type: Type.STRING, description: "Background Music mood/genre recommendation for this specific shot (e.g., 'Suspenseful cello buildup', 'Upbeat funk')." },
          sfx: { type: Type.STRING, description: "Sound Effects recommendation for this specific shot (e.g., 'Rain tapping on window', 'Futuristic engine hum')." },
          characters: {
            type: Type.ARRAY,
            description: "List of characters appearing in this specific shot.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Character name or identifier (e.g. 'The Detective')." },
                description: { type: Type.STRING, description: "Visual description of the character in this shot (clothing, expression)." }
              },
              required: ["name", "description"]
            }
          },
          dialogue: { type: Type.STRING, description: "Dialogue spoken in this shot, if any. Include emotion tags (e.g., 'John: [Angry] Stop!'). Leave empty if no dialogue." }
        },
        required: ["index", "visualPrompt", "technicalPrompt", "duration", "bgm", "sfx", "characters", "dialogue"]
      }
    }
  },
  required: ["title", "visualPrompt", "technicalPrompt", "narration", "shots"],
};

/**
 * Safe ID generator that works in all environments (http/https)
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto fails
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * robustly extracts JSON from text by counting braces
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) return {};

  try {
    // 1. Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // 2. Extract JSON object using brace counting (handles nested structures correctly)
    const startIndex = text.indexOf('{');
    if (startIndex === -1) throw new Error("No JSON object found in response");

    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === '{') {
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      const jsonString = text.substring(startIndex, endIndex + 1);
      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error("Failed to parse extracted JSON string:", jsonString.substring(0, 100) + "...");
        throw parseError;
      }
    }
    
    throw new Error("Could not find closing brace for JSON object");
  }
};

const parseDuration = (durationStr: string): number => {
  if (!durationStr) return 0;
  // Remove non-numeric chars except dot
  const num = parseFloat(durationStr.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return 0;
  
  // Simple heuristic: if string contains 'm' treat as minutes, otherwise seconds
  if (durationStr.toLowerCase().includes('m') && !durationStr.toLowerCase().includes('ms')) {
    return num * 60;
  }
  return num;
};

export const generateDetailSuggestions = async (topic: string, style: string, language: Language): Promise<string> => {
  if (!topic) return "";

  const modelId = "gemini-2.5-flash";
  const targetLanguage = language === 'ko' ? 'Korean' : 'English';

  const prompt = `
    Role: A creative synergy of world-renowned Film Directors (e.g., Nolan, Kubrick, Tarantino), Art Directors (e.g., Wes Anderson's color palettes, Blade Runner aesthetics), and Music Directors (focusing on visual rhythm and mood).
    
    Task: Suggest 1 concise, artistic, and impactful sentence describing specific lighting, color grading, atmosphere, or rhythmic visual texture that would elevate the provided video topic to a masterpiece.
    
    Context:
    - Topic: ${topic}
    - Style: ${style}
    
    Instructions:
    1. Draw inspiration from legendary cinematic techniques and artistic signatures.
    2. Focus on sensory details: "Chiaroscuro lighting," "Neon-noir reflections," "Pastel symmetrical composition," or "Frenetic, syncopated visual rhythm."
    3. Be highly specific and evocative.
    4. Output Language: ${targetLanguage}.
    5. Return ONLY the suggestion text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return "";
  }
};

export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (!text || !text.trim()) return "";
  
  const modelId = "gemini-2.5-flash";
  const targetLangName = targetLanguage === 'ko' ? 'Korean' : 'English';
  
  const prompt = `
    Translate the following text to ${targetLangName}. 
    Return ONLY the translation, with no additional commentary or quotes.
    
    Text: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    
    let cleaned = response.text?.trim() || text;
    // Remove surrounding quotes if the model added them despite instructions
    if (cleaned.length > 1 && cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  } catch (error) {
    console.error("Error translating text:", error);
    return text; // Return original text on failure
  }
};

export const translatePromptResult = async (result: GeneratedPrompt, targetLanguage: Language): Promise<GeneratedPrompt> => {
  const modelId = "gemini-2.5-flash";
  const targetLangName = targetLanguage === 'ko' ? 'Korean' : 'English';
  
  // Prepare data for translation, including shots and narration
  const contentToTranslate = {
    title: result.title,
    visualPrompt: result.visualPrompt,
    technicalPrompt: result.technicalPrompt,
    negativePrompt: result.negativePrompt,
    narration: result.narration,
    shots: result.shots.map(s => ({
      index: s.index,
      visualPrompt: s.visualPrompt,
      technicalPrompt: s.technicalPrompt,
      bgm: s.bgm,
      sfx: s.sfx,
      characters: s.characters,
      dialogue: s.dialogue
    }))
  };

  const prompt = `
    You are a professional translator for Video AI prompts.
    Translate the values of the following JSON object to ${targetLangName}.
    
    CRITICAL RULE:
    - Keep all JSON KEYS in English (e.g., "visualPrompt", "shots", "index"). ONLY translate the VALUES.
    
    Rules:
    1. 'title': Translate naturally.
    2. 'visualPrompt': Translate naturally, preserving the vivid descriptive tone.
    3. 'technicalPrompt': Translate descriptive adjectives, but KEEP specific technical terms (e.g., "Unreal Engine 5", "Octane Render", "Bokeh", "8k") in English if they are standard industry terms.
    4. 'negativePrompt': Translate naturally.
    5. 'narration': Translate the script content naturally to fit the new language flow. Translate the Emotion/Tone tags inside brackets (e.g., [Happy] -> [행복하게]) if appropriate for the target language context.
    6. 'shots': 
       - Translate 'visualPrompt' and 'technicalPrompt'.
       - Translate 'bgm' and 'sfx' descriptions naturally.
       - Translate 'characters': Translate 'name' and 'description'.
       - Translate 'dialogue': Translate the spoken text and Emotion/Tone tags naturally.
    
    Input JSON:
    ${JSON.stringify(contentToTranslate)}
    
    Output:
    Return ONLY the valid JSON object. Do not wrap in markdown code blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return result;

    const translatedData = cleanAndParseJSON(text);

    // Safely map translated shots back to original structure
    // We iterate over the ORIGINAL shots to ensure we preserve IDs and counts
    const translatedShots: Shot[] = result.shots.map((originalShot, i) => {
      // Try to find corresponding shot in translated data by index, or fallback to array position
      const translatedShot = translatedData.shots?.find((s: any) => s.index === originalShot.index) || translatedData.shots?.[i];

      return {
        id: originalShot.id, // Keep original ID
        index: originalShot.index,
        visualPrompt: translatedShot?.visualPrompt || originalShot.visualPrompt,
        technicalPrompt: translatedShot?.technicalPrompt || originalShot.technicalPrompt,
        duration: originalShot.duration, // Duration usually shouldn't change
        bgm: translatedShot?.bgm || originalShot.bgm,
        sfx: translatedShot?.sfx || originalShot.sfx,
        characters: translatedShot?.characters || originalShot.characters,
        dialogue: translatedShot?.dialogue || originalShot.dialogue
      };
    });

    return {
      ...result,
      title: translatedData.title || result.title,
      visualPrompt: translatedData.visualPrompt || result.visualPrompt,
      technicalPrompt: translatedData.technicalPrompt || result.technicalPrompt,
      negativePrompt: translatedData.negativePrompt || result.negativePrompt,
      narration: translatedData.narration || result.narration,
      shots: translatedShots
    };

  } catch (error) {
    console.error("Error translating result:", error);
    // Return original result if translation fails to prevent data loss
    return result;
  }
};

export const generateVideoPrompt = async (request: PromptRequest, language: Language): Promise<GeneratedPrompt> => {
  const modelId = "gemini-2.5-flash";

  const targetLanguage = language === 'ko' ? 'Korean' : 'English';
  
  // Calculate required shot count
  const totalSec = parseDuration(request.totalDuration);
  const cutSec = parseDuration(request.cutDuration);
  let targetShotCount = 0;
  if (totalSec > 0 && cutSec > 0) {
    targetShotCount = Math.floor(totalSec / cutSec);
  }

  const systemInstruction = `
    You are an expert AI Prompt Engineer specializing in video generation models like OpenAI Sora, Google Veo, and Runway Gen-3.
    
    Your task is to take a user's basic idea and expand it into a highly detailed, cinematic, and technically precise prompt, PLUS a voiceover narration script and sound design.
    
    CRITICAL LANGUAGE RULE:
    - The output fields 'title', 'visualPrompt', 'technicalPrompt', 'narration', and 'shots' content MUST be written in ${targetLanguage}.
    - DO NOT translate JSON Keys (e.g. keep "visualPrompt", "shots", "bgm" as keys).
    - If the target language is Korean:
      1. Translate the 'visualPrompt' (descriptive scene) fully into natural Korean.
      2. For 'technicalPrompt', you may keep standard technical terms in English.
      3. 'shots' visual prompts, character descriptions, dialogue, BGM, and SFX must be in ${targetLanguage}.
      4. 'narration' must be in ${targetLanguage}.

    Rules:
    1. Focus on visual storytelling: Describe texture, lighting, color grading, and movement dynamics.
    2. Be specific about the camera movement defined by the user.
    3. Adhere to the requested style.
    4. SHOT COUNT RULE (STRICT):
       - You MUST generate exactly the number of shots calculated from the user's input.
       - If the user specifies a Total Duration and Cut Duration that results in X shots, you must provide X items in the 'shots' array.
    5. For each shot:
       - Define 'characters': Identify main characters.
       - Define 'dialogue': If characters speak, write the line with emotion tags.
       - Define 'bgm': Suggest specific musical mood/genre/tempo matching the visual.
       - Define 'sfx': Suggest specific sound effects matching the action.
    6. Generate a 'narration' script for the overall video voiceover. 
       - Use Emotion/Tone tags in brackets.
       - CRITICAL: The length of the narration must strictly fit the 'Total Video Duration'. (e.g., ~2.5 words per second). Ensure it is not too long or too short for the given duration.
    7. Output must be JSON.
  `;

  const userContent = `
    Create a video generation prompt for the following concept:
    
    Topic/Subject: ${request.topic}
    Style: ${request.style}
    Camera Motion: ${request.motion}
    Aspect Ratio: ${request.aspectRatio}
    Total Video Duration: ${request.totalDuration}
    Average Cut Duration: ${request.cutDuration}
    Calculated Target Shot Count: ${targetShotCount > 0 ? targetShotCount : "Auto-calculate based on total/cut duration"} (STRICTLY FOLLOW THIS COUNT if provided)
    Additional Details: ${request.details || "None"}
    
    Requirements:
    1. Create a main 'visualPrompt' summarizing the whole video.
    2. Create a list of 'shots'. 
       - STRICTLY generate EXACTLY ${targetShotCount > 0 ? targetShotCount : "appropriate number of"} shots.
       - Ensure the sum of shot durations equals the Total Duration.
       - For each shot, strictly define 'characters', 'dialogue', 'bgm', and 'sfx'.
    3. Create a 'narration' script that fits within the ${request.totalDuration}.
    
    Language of output: ${targetLanguage}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: promptSchema,
        temperature: 0.7, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = cleanAndParseJSON(text);

    // Post-process shots to ensure they have IDs and correct structure
    const shots: Shot[] = (data.shots || []).map((s: any) => ({
      id: generateId(), // Use safe ID generator
      index: s.index,
      visualPrompt: s.visualPrompt,
      technicalPrompt: s.technicalPrompt,
      duration: s.duration,
      characters: s.characters || [],
      dialogue: s.dialogue || "",
      bgm: s.bgm || "",
      sfx: s.sfx || ""
    }));

    return {
      id: generateId(), // Use safe ID generator
      title: data.title,
      visualPrompt: data.visualPrompt,
      technicalPrompt: data.technicalPrompt,
      negativePrompt: data.negativePrompt,
      narration: data.narration,
      shots: shots,
      timestamp: Date.now(),
      originalRequest: request
    };

  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
};
