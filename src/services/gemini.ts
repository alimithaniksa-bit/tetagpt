export interface StreamTetagptOptions {
  messages: { role: string; content: string }[];
  systemInstruction?: string;
  image?: string | null;
  isCloneMode?: boolean;
  customKey?: string;
  onChunk: (chunk: string) => void;
}

export async function streamTetagpt({
  messages,
  systemInstruction,
  image,
  isCloneMode,
  customKey,
  onChunk,
}: StreamTetagptOptions): Promise<string> {
  const safeCustomKey = customKey || localStorage.getItem('teta_custom_api_key') || localStorage.getItem('teta_custom_gemini_key') || undefined;

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

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `Server stream error ${response.status}`);
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

  return fullText;
}

export const generateImage = async (prompt: string, customKey?: string): Promise<string | null> => {
  const safeCustomKey = customKey || localStorage.getItem('teta_custom_api_key') || localStorage.getItem('teta_custom_gemini_key') || undefined;
  const res = await fetch('/api/tetagpt/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, customKey: safeCustomKey }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Image generation failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.imageUrl || null;
};

export const generateSpeech = async (text: string, customKey?: string): Promise<string | null> => {
  const safeCustomKey = customKey || localStorage.getItem('teta_custom_api_key') || localStorage.getItem('teta_custom_gemini_key') || undefined;
  const res = await fetch('/api/tetagpt/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, customKey: safeCustomKey }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Speech generation failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.audioUrl || null;
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
