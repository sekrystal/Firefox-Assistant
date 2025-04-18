import express from 'express';
import dotenv from 'dotenv';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dockerDir = '/Users/samuelkrystal/Assistant/ollama-pdf-bot'; // full absolute path

dotenv.config();
const app = express();
app.use(express.json());

const PORT = 4200;
const API_KEY = process.env.SERVER_TOKEN;

let processes = {
  ollama: null,
  perplexity: null,
};

// 🔐 Middleware to check X-API-Key
function verifyKey(req, res, next) {
  const token = req.header('X-API-Key');
  if (!token || token !== API_KEY) {
    return res.status(403).send('Forbidden: Invalid API Key');
  }
  next();
}

// 🐳 Start Docker Compose
function startDockerCompose() {
  return new Promise((resolve, reject) => {
    const cmd = 'docker compose up -d';
    exec(cmd, { cwd: dockerDir }, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout || err.message);
      resolve(stdout || '✓');
    });
  });
console.log("📦 Running Docker command in:", dockerDir);
console.log("🧪 Running command:", cmd);
}

// 🛑 Stop Docker Compose
function stopDockerCompose() {
  return new Promise((resolve, reject) => {
    const cmd = 'docker compose down';
    exec(cmd, { cwd:dockerDir }, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout || err.message);
      resolve(stdout || '✓');
    });
  });
  console.log("📦 Running Docker command in:", dockerDir);
  console.log("🧪 Running command:", cmd);  
}

// 🟢 Start Node-based subserver
function startProcess(name, scriptPath) {
  if (processes[name]) return `${name} already running`;
  const child = spawn('node', [scriptPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
    detached: false,
  });
  processes[name] = child;
  return `${name} started with PID ${child.pid}`;
}

// 🔴 Stop Node-based subserver
function stopProcess(name) {
  const proc = processes[name];
  if (!proc) return `${name} not running`;

  try {
    process.kill(proc.pid, 'SIGINT');
    processes[name] = null;
    return `${name} stopped`;
  } catch (e) {
    return `${name} could not be stopped: ${e.message}`;
  }
}

// 🚀 Start endpoint
app.post('/start-services', verifyKey, async (req, res) => {
  try {
    console.log("🔧 Received request to start services");

    const docker = await startDockerCompose();
    console.log("✅ Docker output:", docker);

    const o = startProcess('ollama', '../ollama-proxy/server.js');
    const p = startProcess('perplexity', '../perplexity-proxy/server.js');

    res.send(`✅ Services started:\n- docker: ${docker}\n- ${o}\n- ${p}`);
  } catch (err) {
    console.error("❌ Server failed to start services:", err);
    res.status(500).send(`Failed to start services:\n${err}`);
  }
});

// 🛑 Stop endpoint
app.post('/stop-services', verifyKey, async (req, res) => {
  try {
    const docker = await stopDockerCompose();
    const o = stopProcess('ollama');
    const p = stopProcess('perplexity');
    res.send(`🛑 Services stopped:\n- docker: ${docker}\n- ${o}\n- ${p}`);
  } catch (err) {
    res.status(500).send(`Failed to stop services:\n${err}`);
  }
});

app.listen(PORT, () => {
  console.log(`🛡 Control server running on http://127.0.0.1:${PORT}`);
});