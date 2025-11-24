
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PromptRequest, GeneratedPrompt, Language, Shot, Character, CameraMotion, ProductionNote } from "../types";

const apiKey = process.env.API_KEY || "";

const promptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, catchy title for the video concept.",
    },
    visualPrompt: {
      type: Type.STRING,
      description: "The main descriptive prompt detailing the subject, action, environment, and atmosphere. Use vivid language suitable for Sora/Veo. Focus on objective visual elements.",
    },
    technicalPrompt: {
      type: Type.STRING,
      description: "Technical keywords including camera angles, lighting types (e.g., volumetric), film stock, render engine (e.g., Unreal Engine 5), and resolution.",
    },
    negativePrompt: {
      type: Type.STRING,
      description: "Elements to exclude to ensure high quality (e.g., blur, distortion, low quality, text overlays).",
    },
    narration: {
      type: Type.STRING,
      description: "A voiceover script for the video. CRITICAL: You MUST include emotion/tone tags (e.g., [Whisper], [Excited], [Calm]) before lines. The length must match the video's total duration exactly based on a standard speaking rate.",
    },
    characters: {
      type: Type.ARRAY,
      description: "List of MAIN characters appearing in the video with consistent visual descriptions.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Character Name (e.g. 'Neo', 'The Old Man')" },
          description: { type: Type.STRING, description: "Detailed visual appearance (age, clothing, face, style) to ensure consistency." }
        },
        required: ["name", "description"]
      }
    },
    productionNote: {
      type: Type.OBJECT,
      description: "A comprehensive guide designed by a world-class production team (Director, DP, Art Director, Sound Designer).",
      properties: {
        directorVision: { type: Type.STRING, description: "Directorial style reference (e.g., 'Tension like Hitchcock', 'Grandeur like Nolan')." },
        cinematography: { type: Type.STRING, description: "Detailed guide on Lighting (High-key/Low-key), Color Palette (Teal&Orange, Monochrome), and Lens choices." },
        artDirection: { type: Type.STRING, description: "Set design, textures, costumes, and overall atmosphere." },
        soundDesign: { type: Type.STRING, description: "Audio landscape philosophy, mixing BGM and SFX strategy." },
        editingStyle: { type: Type.STRING, description: "Rhythm and pacing of the cuts (e.g. 'Fast-paced montage', 'Slow, meditative flow')." }
      },
      required: ["directorVision", "cinematography", "artDirection", "soundDesign", "editingStyle"]
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
          dialogue: { type: Type.STRING, description: "Dialogue spoken in this shot, if any. Include emotion tags (e.g., 'John: [Angry] Stop!'). Leave empty if no dialogue." },
          lipSync: { type: Type.STRING, description: "Technical instructions for AI Lip-Sync platforms (e.g. D-ID). Describe specific Visemes (mouth shapes), jaw aperture, and facial muscle tension to match the dialogue phonetics." }
        },
        required: ["index", "visualPrompt", "technicalPrompt", "duration", "bgm", "sfx", "characters", "dialogue", "lipSync"]
      }
    }
  },
  required: ["title", "visualPrompt", "technicalPrompt", "narration", "characters", "productionNote", "shots"],
};

/**
 * Safe ID generator that works in all environments (http/https)
 */
const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
};

/**
 * ROBUST JSON Parser v3
 * Combines Regex extraction, Brace Counting, and basic string cleanup
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) return {};

  // 1. Try cleaning generic markdown blocks first
  let cleaned = text;
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(markdownRegex);
  if (match && match[1]) {
    cleaned = match[1];
  }

  // 2. Attempt strict parse on cleaned text
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue to advanced extraction
  }

  // 3. Brace Counting Strategy (Most Robust for nested objects)
  try {
    const firstOpen = text.indexOf('{');
    if (firstOpen !== -1) {
      let balance = 0;
      let lastClose = -1;
      let insideString = false;
      let escape = false;

      for (let i = firstOpen; i < text.length; i++) {
        const char = text[i];
        
        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          insideString = !insideString;
          continue;
        }

        if (!insideString) {
          if (char === '{') {
            balance++;
          } else if (char === '}') {
            balance--;
            if (balance === 0) {
              lastClose = i;
              break; 
            }
          }
        }
      }

      if (lastClose !== -1) {
        const jsonStr = text.substring(firstOpen, lastClose + 1);
        try {
           return JSON.parse(jsonStr);
        } catch(e) {
           // Try a simple fix for trailing commas or newlines
           const fixed = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/\n/g, "\\n");
           return JSON.parse(fixed);
        }
      }
    }
  } catch (e) {
    console.error("Brace counting parse failed", e);
  }

  // 4. Fallback: Simple First/Last Brace
  try {
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const jsonStr = text.substring(firstOpen, lastClose + 1);
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error("Fallback parse failed", e);
  }

  console.error("JSON Parsing Failed. Raw Text:", text);
  throw new Error("Failed to parse valid JSON from AI response.");
};

const parseDuration = (durationStr: string): number => {
  if (!durationStr) return 0;
  const num = parseFloat(durationStr.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return 0;
  if (durationStr.toLowerCase().includes('m') && !durationStr.toLowerCase().includes('ms')) {
    return num * 60;
  }
  return num;
};

// --- NEW: AI Director Auto-Design (Input Helper) ---
export const generateCinematicDesign = async (topic: string, style: string, language: Language): Promise<{ details: string, motion: CameraMotion[] }> => {
  if (!topic) return { details: "", motion: [] };

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";
  const targetLanguage = language === 'ko' ? 'Korean' : 'English';

  const prompt = `
    Role: A creative collective of Oscar-winning Film Directors, Cinematographers (DOP), and Colorists.
    Task: Analyze the topic '${topic}' and style '${style}'. 
    1. Design the PERFECT visual atmosphere (Lighting, Color Grading, Texture).
    2. Select the BEST Camera Motions to enhance the storytelling.
    
    Output Format: JSON ONLY.
    {
      "details": "A string describing specific lighting (e.g. Chiaroscuro), color palette (e.g. Teal & Orange), and lens choice.",
      "motion": ["List", "Of", "CameraMotion", "Enum", "Values"]
    }
    
    Choose motion values strictly from this list: 
    [${Object.values(CameraMotion).join(", ")}]
    
    Language for 'details': ${targetLanguage}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: [{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" }]
      }
    });

    const data = cleanAndParseJSON(response.text || "{}");
    return {
      details: data.details || "",
      motion: Array.isArray(data.motion) ? data.motion : [CameraMotion.Static]
    };
  } catch (error) {
    console.error("Error generating cinematic design:", error);
    return { details: "", motion: [] };
  }
};

export const generateDetailSuggestions = async (topic: string, style: string, language: Language): Promise<string> => {
  if (!topic) return "";

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";
  const targetLanguage = language === 'ko' ? 'Korean' : 'English';

  const prompt = `
    Role: A creative synergy of world-renowned Film Directors, Art Directors, and Music Directors.
    Task: Suggest 1 concise, artistic sentence describing specific lighting, color grading, atmosphere, AND high-fidelity technical specifications (e.g. 8k, sharp focus, hyper-detailed, crystal clear) to significantly upgrade the visual quality.
    Context: Topic '${topic}', Style '${style}'.
    Output Language: ${targetLanguage}.
    Safety: Avoid any NSFW, violent, or policy-violating concepts.
    Return ONLY the suggestion text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return "";
  }
};

export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (!text || !text.trim()) return "";
  
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";
  const targetLangName = targetLanguage === 'ko' ? 'Korean' : 'English';
  
  const prompt = `Translate to ${targetLangName}. Return ONLY translation. Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        safetySettings: [{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" }]
      }
    });
    
    let cleaned = response.text?.trim() || text;
    if (cleaned.length > 1 && cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  } catch (error) {
    return text;
  }
};

export const translatePromptResult = async (result: GeneratedPrompt, targetLanguage: Language): Promise<GeneratedPrompt> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";
  const targetLangName = targetLanguage === 'ko' ? 'Korean' : 'English';
  
  // Only send translatable fields
  const contentToTranslate = {
    title: result.title,
    visualPrompt: result.visualPrompt,
    technicalPrompt: result.technicalPrompt,
    negativePrompt: result.negativePrompt,
    narration: result.narration,
    characters: result.characters,
    productionNote: result.productionNote, // Added Production Note
    shots: result.shots.map(s => ({
      index: s.index,
      visualPrompt: s.visualPrompt,
      technicalPrompt: s.technicalPrompt,
      bgm: s.bgm,
      sfx: s.sfx,
      characters: s.characters,
      dialogue: s.dialogue,
      lipSync: s.lipSync // Include Lip Sync in translation
    }))
  };

  // STRICTER Translation Prompt for Consistency
  const prompt = `
    You are a professional AI Localization Engine.
    Task: Translate the JSON VALUES to ${targetLangName}.

    CRITICAL RULES:
    1. **Structure**: Keep JSON KEYS exactly as they are (English). Do NOT translate keys.
    2. **Technical Terms**: Do NOT translate specific technical terms (e.g., "Unreal Engine 5", "8k", "Arri Alexa", "Bokeh") even if the target is Korean. Keep them in English for accuracy.
    3. **Names**: Keep character names consistent.
    4. **Narration Tags**: In the 'narration' field, keep emotion/tone tags (text inside square brackets like [Whisper], [Excited]) in ENGLISH. Do NOT translate the tags themselves, only translate the spoken text.
    5. **Formatting**: The output MUST be valid JSON. Escape all newlines inside strings (use \\n). Do not create invalid control characters.
    
    Input JSON: ${JSON.stringify(contentToTranslate)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        safetySettings: [{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" }]
      }
    });

    const text = response.text;
    if (!text) return result;

    const translatedData = cleanAndParseJSON(text);

    // Defensive mapping
    const translatedShots: Shot[] = result.shots.map((originalShot, i) => {
      const tShot = (translatedData.shots && Array.isArray(translatedData.shots)) 
        ? (translatedData.shots.find((s: any) => s.index === originalShot.index) || translatedData.shots[i])
        : null;

      return {
        ...originalShot,
        visualPrompt: tShot?.visualPrompt || originalShot.visualPrompt,
        technicalPrompt: tShot?.technicalPrompt || originalShot.technicalPrompt,
        bgm: tShot?.bgm || originalShot.bgm,
        sfx: tShot?.sfx || originalShot.sfx,
        characters: tShot?.characters || originalShot.characters,
        dialogue: tShot?.dialogue || originalShot.dialogue,
        lipSync: tShot?.lipSync || originalShot.lipSync
      };
    });

    return {
      ...result,
      title: translatedData.title || result.title,
      visualPrompt: translatedData.visualPrompt || result.visualPrompt,
      technicalPrompt: translatedData.technicalPrompt || result.technicalPrompt,
      negativePrompt: translatedData.negativePrompt || result.negativePrompt,
      narration: translatedData.narration || result.narration,
      characters: translatedData.characters || result.characters,
      productionNote: translatedData.productionNote || result.productionNote, // Map Production Note
      shots: translatedShots
    };

  } catch (error) {
    console.error("Error translating result:", error);
    return result; // Fallback to original on error
  }
};

export const generateVideoPrompt = async (request: PromptRequest, language: Language): Promise<GeneratedPrompt> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash";
  const targetLanguage = language === 'ko' ? 'Korean' : 'English';
  
  const totalSec = parseDuration(request.totalDuration);
  const cutSec = parseDuration(request.cutDuration);
  
  // 1. Calculate Shot Count
  let targetShotCount = 0;
  if (totalSec > 0 && cutSec > 0) {
    targetShotCount = Math.floor(totalSec / cutSec);
  }
  if (targetShotCount === 0) targetShotCount = 1;

  // 2. Calculate Narration Word Count
  const approxWordCount = totalSec > 0 ? Math.floor(totalSec * 2.5) : 30;

  const motionString = Array.isArray(request.motion) ? request.motion.join(', ') : request.motion;

  // Enhanced System Instruction for Guidelines & Consistency
  const systemInstruction = `
    You are an expert AI Video Prompt Architect specialized in Sora, Veo, and Runway Gen-3.
    Act as a "Dream Team" of world-class filmmakers (Director, DOP, Art Director, Sound Designer).
    
    OUTPUT RULES:
    1. **Language**: Output values in ${targetLanguage}, but keep JSON Keys in English.
    2. **Format**: Return strictly valid JSON matching the schema.
    
    PLATFORM GUIDELINES (COMPLIANCE):
    1. **Visual Objectivity**: Describe observable visual elements (lighting, texture, movement) rather than abstract feelings. Instead of "scary", say "dim flickering lights, long sharp shadows".
    2. **Safety**: Do NOT generate NSFW, sexually explicit, realistic violence, or hate speech content.
    3. **Public Figures**: Do NOT use specific real-world names (celebrities, politicians). Use generic descriptions (e.g., "a man resembling a 50s movie star").
    
    GENERATION CONSTRAINTS:
    - **Duration**: Total ${request.totalDuration}, Cut ${request.cutDuration}.
    - **Structure**: You MUST generate EXACTLY ${targetShotCount} shots. This is a strict mathematical requirement.
    - **Narration**: Write a script fitting exactly ${request.totalDuration} (approx ${approxWordCount} words).
    - **Tags**: Narration MUST include emotion tags (e.g. [Whisper], [Excited]) at the start of lines. IMPORTANT: These tags must ALWAYS be in ENGLISH, regardless of the output language.
    - **Lip Sync**: For shots with dialogue, generate technical instructions optimized for **AI Lip-Sync platforms (e.g., D-ID, HeyGen, SyncLabs)**. Describe specific **Visemes (mouth shapes)**, jaw aperture, and facial muscle tension to match the phonetic sounds of the dialogue. e.g., "Wide open 'A' shape", "Compressed lips for 'M'", "Quivering chin with slight smile".
    - **Production Note**: Fill the 'productionNote' object with high-level professional insights (Directorial Vision, Color Grading, etc.).
    
    Ensure all strings are properly escaped (no raw newlines in strings).
  `;

  const userContent = `
    Topic: ${request.topic}
    Style: ${request.style}
    Motion: ${motionString}
    Ratio: ${request.aspectRatio}
    Details: ${request.details || "None"}
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
        safetySettings: [
          // Allow artistic content (e.g. "War movie", "Thriller") but block actual harm
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ]
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const data = cleanAndParseJSON(text);

    // Post-processing validation
    const shots: Shot[] = (Array.isArray(data.shots) ? data.shots : []).map((s: any, idx: number) => ({
      id: generateId(),
      index: s.index || idx + 1,
      visualPrompt: s.visualPrompt || "",
      technicalPrompt: s.technicalPrompt || "",
      // STRICTLY ENFORCE USER INPUT DURATION
      duration: request.cutDuration || s.duration || "3s", 
      characters: Array.isArray(s.characters) ? s.characters : [],
      dialogue: s.dialogue || "",
      lipSync: s.lipSync || "", // Default to empty if missing
      bgm: s.bgm || "",
      sfx: s.sfx || ""
    }));

    return {
      id: generateId(),
      title: data.title || request.topic.substring(0, 20),
      visualPrompt: data.visualPrompt || "",
      technicalPrompt: data.technicalPrompt || "",
      negativePrompt: data.negativePrompt,
      narration: data.narration || "",
      characters: Array.isArray(data.characters) ? data.characters : [],
      productionNote: data.productionNote || { 
        directorVision: "N/A", cinematography: "N/A", artDirection: "N/A", soundDesign: "N/A", editingStyle: "N/A" 
      },
      shots: shots,
      timestamp: Date.now(),
      originalRequest: request
    };

  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
};
