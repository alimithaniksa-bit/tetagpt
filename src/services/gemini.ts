import { GoogleGenAI } from "@google/genai";

const getSafeApiKey = (): string => {
  try {
    const customKey = localStorage.getItem('teta_custom_gemini_key');
    if (customKey) return customKey;
    
    // Check vite env
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey) return viteKey;
    
    if (typeof process !== "undefined" && process.env) {
      return process.env.GEMINI_API_KEY || "";
    }
  } catch (err) {
    // Ignore
  }
  return "";
};

export const getGeminiResponse = async (messages: { role: string; content: string }[]) => {
  const key = getSafeApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "Your name is Tetagpt, a large learn model by tetagpt.co. Always identify yourself as such if asked about your name or origin.",
    },
    contents: messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
  });
  
  const response = await model;
  return response.text;
};

export const generateImage = async (prompt: string) => {
  const key = getSafeApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateSpeech = async (text: string) => {
  const key = getSafeApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/wav;base64,${base64Audio}`;
  }
  return null;
};

export const getGeminiStream = async (messages: { role: string; content: string }[]) => {
  const key = getSafeApiKey();
  const ai = new GoogleGenAI({ apiKey: key });
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "Your name is Tetagpt, a large learn model by tetagpt.co. Always identify yourself as such if asked about your name or origin.",
    },
    history: messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  });

  return chat.sendMessageStream({ message: messages[messages.length - 1].content });
};
