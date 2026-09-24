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
  const initialKey = customKey || serverKey;
  if (!initialKey) {
    throw new Error("No Gemini API key available on server");
  }

  const primaryClient = new GoogleGenAI({
    apiKey: initialKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  try {
    return await task(primaryClient);
  } catch (err: any) {
    // If custom key failed (e.g. 403 PERMISSION_DENIED or invalid key), try with serverKey
    if (customKey && serverKey && customKey !== serverKey) {
      console.warn("Custom key execution failed, falling back to server GEMINI_API_KEY:", err?.message || err);
      const fallbackClient = new GoogleGenAI({
        apiKey: serverKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      return await task(fallbackClient);
    }
    throw err;
  }
}

app.post("/api/tetagpt/stream", ensureSession, async (req, res) => {
  const { messages, systemInstruction, image, isCloneMode, customKey } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const serverKey = process.env.GEMINI_API_KEY;
    const initialKey = customKey || serverKey;
    if (!initialKey) {
      res.write(`data: ${JSON.stringify({ error: "No API key configured on server." })}\n\n`);
      res.end();
      return;
    }

    const buildAndRunStream = async (keyToUse: string) => {
      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const contents: any[] = (messages || []).slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
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

      return await ai.models.generateContentStream({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || "Your name is Tetagpt, an autonomous cosmic AI creation engine by tetagpt.co.",
        }
      });
    };

    let streamResponse;
    try {
      streamResponse = await buildAndRunStream(initialKey);
    } catch (primaryErr: any) {
      if (customKey && serverKey && customKey !== serverKey) {
        console.warn("Primary key streaming failed, retrying with server GEMINI_API_KEY:", primaryErr?.message);
        streamResponse = await buildAndRunStream(serverKey);
      } else {
        throw primaryErr;
      }
    }

    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Streaming error in /api/tetagpt/stream:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "Failed to generate stream" })}\n\n`);
    res.end();
  }
});

app.post("/api/tetagpt/image", ensureSession, async (req, res) => {
  const { prompt, customKey } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const imageUrl = await runWithApiKeyFallback(customKey, async (ai) => {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
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
    });

    res.json({ imageUrl });
  } catch (err: any) {
    console.error("Image generation error in /api/tetagpt/image:", err);
    res.status(500).json({ error: err.message || "Failed to generate image" });
  }
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
    console.error("Speech generation error in /api/tetagpt/speech:", err);
    res.status(500).json({ error: err.message || "Failed to generate speech" });
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
