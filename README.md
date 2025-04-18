# Firefox AI Assistant

A Firefox extension that combines local and cloud-based AI models for enhanced web research capabilities.

## Project Thesis & Motivation

This project began with a clear vision: creating a privacy-first research assistant that runs entirely locally. The foundation is built around the Mistral model running through Ollama, providing a balance of capability and privacy that's perfect for daily research tasks.

I found myself increasingly drawn to the capabilities of combining Perplexity with GPT-4 for deep research. This created an interesting challenge - how to integrate these cloud tools while staying true to the project's privacy-focused roots?

The result is a dual-model approach that:
- Defaults to local processing with Mistral for privacy-sensitive tasks
- Reluctantly (but excitedly) enables deep research capabilities through a carefully designed privacy pipeline
- Uses proxy servers and planned VPN integration to minimize data exposure
- Will be fully dockerized for easy deployment and enhanced security

The Firefox sidebar implementation was chosen specifically because Firefox's commitment to privacy aligns with the project's goals, and their extension APIs provide the necessary flexibility for a seamless research experience.

### Future Privacy Enhancements
- Full dockerization of all components
- VPN integration for API calls
- Enhanced data sanitization
- Configurable privacy levels
- Local caching options

## Features

- 🤖 Dual AI Model Support:
  - Local Mistral model via Ollama for privacy-focused analysis
  - Cloud-based Deep Research using Perplexity + GPT-4 for comprehensive research
- 📑 Content Processing:
  - Smart text extraction (up to 20k characters)
  - Automatic intent detection
  - PDF support (in development)
- 🔒 Privacy-First Design:
  - Local processing option
  - Secure API key management
  - Content truncation safeguards
- 🎯 Enhanced UX:
  - Intuitive sidebar interface
  - Model switching
  - Copy functionality
  - Status messages and accessibility features

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

---

### 2. Install Requirements

- **Ollama**  
  [Install instructions](https://ollama.ai/download) or, on macOS:
  ```bash
  brew install ollama
  ```

- **Docker**  
  [Get Docker Desktop](https://www.docker.com/products/docker-desktop/) or, on macOS:
  ```bash
  brew install --cask docker
  ```
  Make sure Docker Desktop is running before you continue.

---

### 3. Download Mistral with Ollama

```bash
ollama pull mistral
```
This will download the Mistral model for local use.

---

### 4. Set the Control Server Token

The control server manages all backend services and requires a token for secure commands.

1. In the `control-server` directory, create or edit the `.env` file:
    ```bash
    cd control-server
    echo "SERVER_TOKEN=your_secure_token_here" > .env
    ```
    Replace `your_secure_token_here` with a secure value of your choice.

---

### 5. Start the Control Server

From the `control-server` directory:
```bash
npm install
npm run start
```
The control server will:
- Start/stop Docker Compose for the PDF bot
- Start/stop the Ollama and Perplexity proxy servers
- Expose endpoints for the extension to control all services

---

### 6. Install the Extension in Firefox

1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from your cloned repository

---

### 7. Double-Check That You've Started All Servers

Before using the extension, make sure:
- Docker Desktop is running
- The Ollama daemon is running
- The control server is running (`npm run start` in the `control-server` directory)
- The Mistral model is running (`ollama run mistral` in a terminal)
- (Optional) You've used the extension's UI button to start/stop all services

## Usage

1. Click the extension icon to open the sidebar
2. Choose your model:
   - Toggle OFF = Local Mistral (Privacy-focused, no API key needed)
   - Toggle ON = Deep Research (More powerful, requires API keys)
3. If using Deep Research, click the gear icon to enter your API keys
4. Start researching! The extension will:
   - Process selected text or entire pages
   - Handle PDFs (local model only currently)
   - Provide AI-powered insights and analysis

## PDF Support

- **PDF reading is being updated!**
- The new workflow uses [ollama-pdf-bot](https://github.com/amithkoujalgi/ollama-pdf-bot) instead of PDF.js
- The control server manages the ollama-pdf-bot via Docker Compose
- **Integration with the Mistral workflow is in progress**
- Current status: PDF bot runs in its own Docker container, but full integration with the extension is coming soon

### Attribution

This project incorporates [ollama-pdf-bot](https://github.com/amithkoujalgi/ollama-pdf-bot) by Amith Koujalgi, which is licensed under the [MIT License](https://github.com/amithkoujalgi/ollama-pdf-bot/blob/main/LICENSE). The original repository can be found at https://github.com/amithkoujalgi/ollama-pdf-bot.

## Troubleshooting

### Local Model Issues
1. Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```
2. Check proxy server logs
3. Restart Ollama if needed:
```bash
sudo systemctl restart ollama
```

### Deep Research Issues
1. Verify API keys in `.env` file
2. Check proxy server logs
3. Ensure both proxy servers are running
4. Verify ports 3000 and 4000 are available

## Development Status

### Completed
- Core extension architecture
- Local Mistral integration
- Basic content extraction
- UI framework
- API key management

### In Progress
- **ollama-pdf-bot integration** - Replacing PDF.js with [ollama-pdf-bot](https://github.com/amithkoujalgi/ollama-pdf-bot)
- Deep Research pipeline optimization
- Content truncation improvements
- PDF upload interface

### Planned
- Docker containerization
- Enhanced prompt injection prevention
- Improved Mistral accuracy
- Increased content limit

## Contributing

Contributions are welcome! Please check the issues page for current development priorities.