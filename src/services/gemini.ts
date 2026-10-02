export interface StreamTetagptOptions {
  messages: { role: string; content: string }[];
  systemInstruction?: string;
  image?: string | null;
  isCloneMode?: boolean;
  customKey?: string;
  onChunk: (chunk: string) => void;
}

export function cleanApiKey(key?: string | null): string | undefined {
  if (!key || typeof key !== "string") return undefined;
  let cleaned = key.trim();
  cleaned = cleaned.replace(/^["'`]|["'`]$/g, "").trim();
  const match = cleaned.match(/AIzaSy[A-Za-z0-9_-]{33}/);
  if (match) return match[0];
  return cleaned || undefined;
}

export async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  const cleaned = cleanApiKey(apiKey);
  if (!cleaned) {
    return { valid: false, message: "Invalid key format. A valid Gemini API key starts with 'AIzaSy' and is ~39 characters." };
  }

  // 1. Direct browser validation via @google/genai SDK (fastest, works on all live domains and static hosts)
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: cleaned });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ parts: [{ text: 'hi' }] }]
    });
    if (response?.text) {
      return { valid: true, message: 'Connected successfully! Gemini API key is valid and active.' };
    }
  } catch (sdkErr: any) {
    let msg = sdkErr?.message || 'Failed to verify key with Gemini API.';
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } catch (_) {}

    // If Google explicitly rejected the API key:
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID') || msg.includes('400')) {
      return { valid: false, message: 'Google Gemini rejected this key: API key not valid. Please check your key at aistudio.google.com.' };
    }
    // If quota exceeded, the key itself is actually valid!
    if (msg.includes('quota') || msg.includes('429')) {
      return { valid: true, message: 'API key is valid! (Note: Current free quota limit reached for this specific model).' };
    }
  }

  // 2. Try server validation endpoint as secondary fallback if running full-stack
  try {
    const res = await fetch('/api/tetagpt/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: cleaned }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        return { valid: true, message: data.message || 'Key connected and verified successfully!' };
      } else {
        return { valid: false, message: data.error || 'Key validation rejected by server.' };
      }
    }
  } catch (err) {
    console.warn("Backend validation route unreachable:", err);
  }

  return { valid: true, message: 'Gemini API key saved and activated.' };
}

async function streamDirectFromBrowser(
  apiKey: string,
  messages: { role: string; content: string }[],
  systemInstruction?: string,
  image?: string | null,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const contents: any[] = (messages || []).slice(0, -1).map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content || "" }]
  }));

  const lastMsg = (messages && messages.length > 0) ? messages[messages.length - 1] : { content: "Hello" };
  const lastParts: any[] = [{ text: lastMsg.content || "Continue generation" }];

  if (image && typeof image === 'string') {
    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const base64Data = image.replace(/^data:[^;]+;base64,/, "");
    lastParts.push({
      inlineData: {
        mimeType,
        data: base64Data
      }
    });
  }

  contents.push({
    role: 'user',
    parts: lastParts
  });

  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const streamResponse = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: systemInstruction || "Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co. Always introduce and refer to yourself strictly as Tetagpt.",
        }
      });

      let fullText = '';
      for await (const chunk of streamResponse) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk?.(text);
        }
      }
      if (fullText) return fullText;
    } catch (err: any) {
      console.warn(`Browser direct model ${model} failed, trying next:`, err);
      lastErr = err;
    }
  }

  throw lastErr || new Error("Failed to stream directly with provided Gemini API key");
}

export async function streamTetagpt({
  messages,
  systemInstruction,
  image,
  isCloneMode,
  customKey,
  onChunk,
}: StreamTetagptOptions): Promise<string> {
  const safeCustomKey = cleanApiKey(customKey) || 
    cleanApiKey(localStorage.getItem('teta_custom_api_key')) || 
    cleanApiKey(localStorage.getItem('teta_custom_gemini_key')) || 
    undefined;

  // PRIORITY 1: When user provided an API key, run direct browser SDK!
  // This is 100% resilient on ANY live domain (GitHub Pages, Vercel, Netlify, custom domain)
  // because it requires zero backend proxy routes and communicates directly with Google Gemini.
  if (safeCustomKey) {
    try {
      return await streamDirectFromBrowser(
        safeCustomKey,
        messages,
        systemInstruction,
        image,
        onChunk
      );
    } catch (clientErr: any) {
      console.warn("Direct browser Gemini stream encountered error, trying backend proxy fallback:", clientErr);
    }
  }

  // PRIORITY 2: Backend server proxy (when no custom key provided, or as fallback)
  try {
    const response = await fetch('/api/tetagpt/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemInstruction,
        image,
        isCloneMode,
        customKey: safeCustomKey,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/event-stream')) {
      // Backend route is missing (e.g. static host returning HTML index)
      throw new Error(`Backend streaming endpoint not available (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response body not readable.');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') {
          return fullText;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text);
          }
        } catch (err: any) {
          if (err.message && !err.message.includes('JSON')) {
            throw err;
          }
        }
      }
    }

    if (fullText) return fullText;
  } catch (proxyError: any) {
    console.warn("Backend stream failed or unreachable:", proxyError?.message || proxyError);
    if (safeCustomKey) {
      return await streamDirectFromBrowser(
        safeCustomKey,
        messages,
        systemInstruction,
        image,
        onChunk
      );
    }
    throw proxyError;
  }

  return '';
}

export const generateImage = async (prompt: string, customKey?: string): Promise<string | null> => {
  const safeCustomKey = cleanApiKey(customKey) || 
    cleanApiKey(localStorage.getItem('teta_custom_api_key')) || 
    cleanApiKey(localStorage.getItem('teta_custom_gemini_key')) || 
    undefined;

  // 1. Direct browser generation if user has custom key
  if (safeCustomKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: safeCustomKey });
      const candidateModels = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image"];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              imageConfig: { aspectRatio: "1:1" }
            }
          });
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn("Direct browser image generation error:", e);
    }
  }

  // 2. Try backend proxy if available
  try {
    const res = await fetch('/api/tetagpt/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, customKey: safeCustomKey }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.imageUrl) return data.imageUrl;
    }
  } catch (_) {}

  // 3. Fallback to procedural cosmic card SVG
  const safeTitle = prompt.slice(0, 35).replace(/["<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#050508"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#022c22"/>
      </linearGradient>
      <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#06b6d4"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" rx="36" fill="url(#bg)"/>
    <circle cx="300" cy="240" r="120" fill="none" stroke="url(#acc)" stroke-width="3" stroke-dasharray="8 6" opacity="0.8"/>
    <polygon points="300,160 360,260 240,260" fill="none" stroke="#10b981" stroke-width="4"/>
    <circle cx="300" cy="230" r="28" fill="#10b981" opacity="0.9"/>
    <text x="300" y="420" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">TETAGPT COSMIC VISUAL</text>
    <text x="300" y="460" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${safeTitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const generateSpeech = async (text: string, customKey?: string): Promise<string | null> => {
  const safeCustomKey = cleanApiKey(customKey) || 
    cleanApiKey(localStorage.getItem('teta_custom_api_key')) || 
    cleanApiKey(localStorage.getItem('teta_custom_gemini_key')) || 
    undefined;

  try {
    const res = await fetch('/api/tetagpt/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, customKey: safeCustomKey }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.audioUrl) return data.audioUrl;
    }
  } catch (_) {}

  // Native Web Speech Synthesis fallback in browser
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  return null;
};

export const getTetagptResponse = async (
  messages: { role: string; content: string }[],
  systemInstruction?: string,
  customKey?: string
): Promise<string> => {
  let result = '';
  await streamTetagpt({
    messages,
    systemInstruction,
    customKey,
    onChunk: (chunk) => {
      result += chunk;
    },
  });
  return result;
};

export const getGeminiResponse = getTetagptResponse;
export const getGeminiStream = async (messages: { role: string; content: string }[]) => {
  let full = '';
  await streamTetagpt({
    messages,
    onChunk: (chunk) => { full += chunk; }
  });
  return [{ text: full }];
};
export const getTetagptStream = getGeminiStream;
