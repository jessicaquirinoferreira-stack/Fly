import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// We try to initialize with default credentials (works in Cloud Run/Google Cloud)
try {
  admin.initializeApp();
} catch (e) {
  console.log("Firebase Admin already initialized or failed to init with defaults");
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    
    // Credentials check
    const isAdmin = (email === "fly@store.com" && password === "admin123") || 
                    (email === "jessicaquirinoferreira@gmail.com" && password === "admin123");

    if (isAdmin) {
      res.json({ 
        success: true, 
        token: "internal-admin-bypass-token",
        user: { email, role: "admin" } 
      });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  });

  // REST API Proxy for Firestore (Bypasses Domain Rules)
  app.post("/api/admin/db/:collection", async (req, res) => {
    const { collection } = req.params;
    const data = req.body;
    try {
      const docRef = await db.collection(collection).add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch("/api/admin/db/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const data = req.body;
    try {
      await db.collection(collection).doc(id).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/admin/db/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    try {
      await db.collection(collection).doc(id).delete();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
