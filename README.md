# 🚀 FounderOS AI — Your AI Startup Co-Founder

> **Turn your startup idea into a complete launch strategy in minutes with your AI-powered co-founder.**

FounderOS AI is an AI-native mobile application built for the **Anna AI-Native App Hackathon**. It helps entrepreneurs, students, and indie hackers transform raw startup ideas into actionable business plans through a workflow of **five specialized AI agents**, powered by **Groq**.

---

## 🎥 Demo

<p align="center">
  <a href="https://www.youtube.com/watch?v=XnZs3Xmyo8Q" target="_blank">
    <img src="https://img.youtube.com/vi/XnZs3Xmyo8Q/maxresdefault.jpg" alt="FounderOS AI Demo" width="700"/>
  </a>
</p>

> **Watch the demo:** https://www.youtube.com/watch?v=XnZs3Xmyo8Q

> **Note:** GitHub README files do **not** support embedded `<iframe>` videos. Use the thumbnail image above instead.

---

# ✨ Features

## 🤖 AI-Powered Startup Planning

FounderOS AI orchestrates **five specialized AI agents** in a LangGraph-inspired workflow:

### 🔬 Market Research Agent
- Market analysis
- TAM / SAM / SOM estimation
- Industry trends
- Customer segmentation

### ⚔️ Competitor Analysis Agent
- Competitor research
- SWOT analysis
- Market gap identification
- Competitive positioning

### ⚡ MVP Planning Agent
- Core feature prioritization
- MVP scope definition
- Success metrics
- Technical recommendations

### 🗺️ Roadmap Agent
- 90-day development roadmap
- Milestone planning
- Sprint recommendations
- Resource estimation

### 🎯 Launch Strategy Agent
- Go-to-market strategy
- Pricing recommendations
- Marketing channels
- Product launch checklist

---

## 🚀 Additional Features

- ✅ Powered entirely by **Groq LLMs**
- ✅ Uses **Qwen3-32B** for research & planning
- ✅ Uses **DeepSeek-R1-Distill-70B** for reasoning & strategy
- ✅ Persistent local project storage
- ✅ Secure API key storage with **Expo Secure Store**
- ✅ Guest mode (no account required)
- ✅ Offline-first architecture
- ✅ Beautiful modern UI
- ✅ Dark mode support
- ✅ Built with Expo SDK 54 + React Native + TypeScript

---

# 🏗️ Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Expo SDK 54, React Native, TypeScript, Expo Router |
| UI | NativeWind, React Native Reusables, Lucide Icons |
| State Management | Zustand (Persisted) |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| AI Workflow | LangGraph (`@langchain/langgraph`) |
| LLM Provider | Groq API (Qwen3-32B & DeepSeek-R1-Distill-70B) |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (Drizzle ORM), PostgreSQL Ready |
| Secure Storage | Expo Secure Store |
| Deployment | Expo EAS Build |

---

# 📂 Project Structure

```text
founderos-ai/
│
├── app/
│   ├── (tabs)/
│   ├── startup/
│   └── _layout.tsx
│
├── agents/
│   ├── founder-agent.ts
│   ├── market-agent.ts
│   ├── competitor-agent.ts
│   ├── mvp-agent.ts
│   ├── roadmap-agent.ts
│   └── launch-agent.ts
│
├── workflows/
│   └── founder-workflow.ts
│
├── services/
│
├── hooks/
│
├── store/
│
├── components/
│
├── backend/
│
├── types/
│
├── constants/
│
└── utils/
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/founderos-ai.git

cd founderos-ai
```

---

## 2. Install Dependencies

```bash
npm install
```

or

```bash
yarn
```

---

## 3. Configure Environment Variables

Create a `.env` file.

```env
EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## 4. Get a Groq API Key

Create a free account at:

https://console.groq.com

Generate a new API key beginning with:

```
gsk_
```

---

## 5. Run the Application

```bash
npx expo start
```

Then choose:

- 📱 Scan QR with Expo Go
- 🤖 Press `a` for Android Emulator
- 🍎 Press `i` for iOS Simulator
- 🌐 Press `w` for Web

---

# 🖥️ Optional Backend

```bash
cd backend

npm install

cp .env.example .env

npm run dev
```

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Get project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id/results` | Save results |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/agents/run` | Run single AI agent |
| POST | `/api/agents/run-all` | Run full AI workflow |
| POST | `/api/agents/stream` | Streaming responses |

---

# 🤖 AI Workflow

```text
                Startup Idea
                     │
                     ▼
        Founder Agent (Coordinator)
                     │
                     ▼
       🔬 Market Research Agent
                     │
                     ▼
      ⚔️ Competitor Analysis Agent
                     │
                     ▼
          ⚡ MVP Planning Agent
                     │
                     ▼
        🗺️ Roadmap Planning Agent
                     │
                     ▼
        🎯 Launch Strategy Agent
                     │
                     ▼
         Review → Save → Dashboard
```

---

# 📱 Build for Production

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login:

```bash
eas login
```

Android Preview Build:

```bash
eas build --profile preview --platform android
```

Production Build:

```bash
eas build --profile production --platform all
```

---

# 🔒 Security

- API keys are stored securely using **Expo Secure Store**
- No API keys are transmitted to FounderOS servers
- Local-first project storage
- Optional backend synchronization
- Hardware-backed encryption where supported

---

# 📄 License

Licensed under the **MIT License**.

---

# 🏆 Hackathon

Built with ❤️ for the **Anna AI-Native App Hackathon**.

FounderOS AI demonstrates how AI agents can collaborate to transform a simple startup idea into a structured business strategy within minutes.
