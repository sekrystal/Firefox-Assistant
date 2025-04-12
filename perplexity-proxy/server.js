// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PERPLEXITY_API = "https://api.perplexity.ai/search";
const MISTRAL_API = "http://localhost:11434/api/chat";

// === /search endpoint (Proxies Perplexity API) ===
app.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query || !process.env.PERPLEXITY_API_KEY) {
    return res.status(400).json({ error: "Missing query or API key" });
  }

  try {
    const perplexityRes = await fetch(PERPLEXITY_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const data = await perplexityRes.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Perplexity fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch from Perplexity" });
  }
});

// === /mistral endpoint (Proxies Ollama's local LLM) ===
app.post("/mistral", async (req, res) => {
  try {
    const mistralRes = await fetch(MISTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await mistralRes.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Ollama fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch from Mistral (Ollama)" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
});