import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import session from "express-session";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
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

app.use(express.json());
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
