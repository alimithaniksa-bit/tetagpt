import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import session from "express-session";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    userId: string;
    isGuest: boolean;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("teta_gpt.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_id) REFERENCES chats(id)
  );
`);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  session({
    secret: "teta-gpt-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);

// Auth Middleware - Simplified for no-login
const ensureSession = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    req.session.userId = "user_" + Math.random().toString(36).substring(7);
    req.session.isGuest = true;
    
    // Create a default user record if it doesn't exist
    db.prepare("INSERT OR IGNORE INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)").run(
      req.session.userId,
      `${req.session.userId}@local`,
      "Guest User",
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.session.userId}`
    );
  }
  next();
};

// --- API Routes ---

app.get("/api/me", ensureSession, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  res.json({ ...user, isGuest: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Chat Routes
app.get("/api/chats", ensureSession, (req, res) => {
  const chats = db.prepare("SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC").all(req.session.userId);
  res.json(chats);
});

app.post("/api/chats", ensureSession, (req, res) => {
  const { id, title } = req.body;
  db.prepare("INSERT INTO chats (id, user_id, title) VALUES (?, ?, ?)").run(id, req.session.userId, title);
  res.json({ id, title });
});

app.get("/api/chats/:id/messages", ensureSession, (req, res) => {
  const messages = db.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json(messages);
});

app.post("/api/chats/:id/messages", ensureSession, (req, res) => {
  const { id, role, content } = req.body;
  db.prepare("INSERT INTO messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)").run(id, req.params.id, role, content);
  res.json({ id, role, content });
});

app.delete("/api/chats/:id", ensureSession, (req, res) => {
  db.prepare("DELETE FROM messages WHERE chat_id = ?").run(req.params.id);
  db.prepare("DELETE FROM chats WHERE id = ? AND user_id = ?").run(req.params.id, req.session.userId);
  res.json({ success: true });
});

// --- Tetagpt Cosmic AI Service Endpoints ---

async function runWithApiKeyFallback<T>(
  customKey: string | undefined,
  task: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const serverKey = process.env.GEMINI_API_KEY;
  const keysToTry: string[] = [];
  if (customKey && customKey.trim()) keysToTry.push(customKey.trim());
  if (serverKey && !keysToTry.includes(serverKey)) keysToTry.push(serverKey);

  if (keysToTry.length === 0) {
    throw new Error("No Gemini API key available on server");
  }

  let lastError: any = null;
  for (const key of keysToTry) {
    try {
      const client = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      return await task(client);
    } catch (err: any) {
      console.warn("API key execution failed, trying next candidate:", err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

app.post("/api/tetagpt/stream", ensureSession, async (req, res) => {
  const { messages, systemInstruction, image, isCloneMode, customKey } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const serverKey = process.env.GEMINI_API_KEY;
    const keysToTry: string[] = [];
    if (customKey && typeof customKey === "string" && customKey.trim()) {
      keysToTry.push(customKey.trim());
    }
    if (serverKey && !keysToTry.includes(serverKey)) {
      keysToTry.push(serverKey);
    }

    if (keysToTry.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "No API key configured on server." })}\n\n`);
      res.end();
      return;
    }

    // Models in priority order (gemini-3.8-flash primary, gemini-3.1-flash-lite on 503 high-demand or rate limit)
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

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

    let streamSucceeded = false;
    let lastError: any = null;

    for (const keyToUse of keysToTry) {
      if (streamSucceeded) break;

      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      for (const modelName of candidateModels) {
        if (streamSucceeded) break;

        try {
          const streamResponse = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config: {
              systemInstruction: systemInstruction || "Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co. Always introduce and refer to yourself strictly as Tetagpt. Never refer to yourself as Gemini or mention Google models.",
            }
          });

          for await (const chunk of streamResponse) {
            const text = chunk.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }

          streamSucceeded = true;
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        } catch (attemptErr: any) {
          console.warn(`Streaming attempt failed (model: ${modelName}):`, attemptErr?.message || attemptErr);
          lastError = attemptErr;
        }
      }
    }

    if (!streamSucceeded) {
      console.error("All streaming attempts failed. Last error:", lastError);
      res.write(`data: ${JSON.stringify({ error: lastError?.message || "Failed to generate stream" })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error("Fatal error in /api/tetagpt/stream:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "Failed to generate stream" })}\n\n`);
    res.end();
  }
});

app.post("/api/tetagpt/image", ensureSession, async (req, res) => {
  const { prompt, customKey } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const serverKey = process.env.GEMINI_API_KEY;
  const keysToTry: string[] = [];
  if (customKey && customKey.trim()) keysToTry.push(customKey.trim());
  if (serverKey && !keysToTry.includes(serverKey)) keysToTry.push(serverKey);

  const candidateModels = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"];

  for (const keyToUse of keysToTry) {
    for (const model of candidateModels) {
      try {
        const ai = new GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const response = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
          }
        }
      } catch (err: any) {
        console.warn(`Image model ${model} failed:`, err?.message || err);
      }
    }
  }

  // Graceful fallback to procedural cosmic visual card
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
  const base64Svg = Buffer.from(svg).toString('base64');
  return res.json({ imageUrl: `data:image/svg+xml;base64,${base64Svg}` });
});

app.post("/api/tetagpt/speech", ensureSession, async (req, res) => {
  const { text, customKey } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const audioUrl = await runWithApiKeyFallback(customKey, async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [{ text: text.slice(0, 500) }],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return `data:audio/wav;base64,${base64Audio}`;
      }
      return null;
    });

    res.json({ audioUrl });
  } catch (err: any) {
    console.warn("Speech generation fallback:", err?.message || err);
    res.json({ audioUrl: null });
  }
});

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
