import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/mistral", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt'" });
    }

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt,
        stream: false // this is necessary for a clean response
      }),
    });

    const data = await ollamaRes.json();
    res.json(data);
  } catch (err) {
    console.error("🔴 Proxy Error:", err);
    res.status(500).json({ error: "Proxy Error: " + err.message });
  }
});

app.listen(4000, () => {
  console.log("✅ Ollama Proxy running at http://localhost:4000/mistral");
});