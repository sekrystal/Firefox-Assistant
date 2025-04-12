# Firefox AI Research Assistant

A powerful Firefox extension that combines local and cloud-based AI models for enhanced web research capabilities.

## Project Thesis & Motivation

This project began with a clear vision: creating a privacy-first research assistant that runs entirely locally. The foundation is built around the Mistral model running through Ollama, providing a balance of capability and privacy that's perfect for daily research tasks.

Then came the guilty pleasure - I found myself increasingly drawn to the capabilities of combining Perplexity with GPT-4 for deep research. This created an interesting challenge - how to integrate these cloud tools while staying true to the project's privacy-focused roots?

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

## Requirements

### Local Model (Mistral)
- [Ollama](https://ollama.ai/) - Local model runner
- Mistral model (7B parameters, ~4GB disk space)
- Node.js 18+ and npm

### Deep Research Model (Optional)
- OpenAI API key
- Perplexity API key ([Get here](https://docs.perplexity.ai/))
- Node.js 18+ and npm

## Installation

### 1. Install Ollama
```bash
# macOS (using Homebrew)
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh

# Windows
# Visit https://ollama.ai/download
```

### 2. Download Mistral Model
```bash
# After installing Ollama
ollama pull mistral
```

### 3. Set Up Proxy Servers
```bash
# Clone the repository
git clone [your-repo-url]
cd [your-repo-name]

# Install dependencies for both proxies
cd ollama-proxy
npm install
cd ../perplexity-proxy
npm install
```

### 4. Configure API Keys (for Deep Research)
Create `.env` files in the perplexity-proxy directory:
```bash
# perplexity-proxy/.env
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

### 5. Start Services

1. Start Ollama (Local Model):
```bash
# This runs in the background after installation
# Verify it's running:
ollama list
```

2. Start Proxy Servers:
```bash
# Terminal 1 - Ollama Proxy (Port 4000)
cd ollama-proxy
npm start

# Terminal 2 - Deep Research Proxy (Port 3000)
cd perplexity-proxy
npm start
```

### 6. Install Firefox Extension

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from your cloned repository

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
- PDF.js integration
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