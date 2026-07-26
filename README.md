# 🚀 FounderOS AI — Your AI Startup Co-Founder

> From Startup Idea to Launch Plan in Minutes with Your AI Co-Founder.

FounderOS AI is a complete AI-native mobile app built for the **Anna AI-Native App Hackathon**. It helps entrepreneurs, students, and indie hackers transform raw startup ideas into actionable plans using a pipeline of 5 specialized AI agents powered by **Groq**.

<iframe width="560" height="315" src="https://www.youtube.com/embed/XnZs3Xmyo8Q?si=OAWK0elvkdGI9jkR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

---

## ✨ Features

- **5 Specialized AI Agents** running sequentially via a LangGraph-style workflow:
  1. 🔬 **Market Research Agent** — TAM/SAM/SOM, trends, customer segments
  2. ⚔️ **Competitor Agent** — Competitor landscape, SWOT, market gaps
  3. ⚡ **MVP Agent** — Core features, MVP scope, success metrics
  4. 🗺️ **Roadmap Agent** — 90-day development roadmap (3 phases)
  5. 🎯 **Launch Agent** — Go-to-market strategy, pricing, launch checklist

- **100% Groq-powered** — uses `Qwen3-32B` (research/planning) and `DeepSeek-R1-Distill-70B` (reasoning/strategy)
- **Persistent local storage** of all generated startup plans
- **Secure API key storage** via Expo SecureStore
- **Guest mode** — no signup required
- Built with **Expo SDK 54 + React Native + TypeScript**

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo SDK 54, React Native, TypeScript, Expo Router |
| UI | NativeWind, React Native Reusables, Lucide Icons |
| State | Zustand (with persistence) |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| AI Workflow | LangGraph (`@langchain/langgraph`) |
| LLM Provider | Groq API (Qwen3-32B + DeepSeek-R1-Distill-70B) |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (Drizzle ORM) / PostgreSQL-ready |
| Storage | Expo Secure Store |
| Deployment | Expo EAS Build |

---

## 📂 Project Structure

```
founderos-ai/
├── app/                      # Expo Router screens
│   ├── _layout.tsx
│   ├── (tabs)/               # Bottom tab navigator
│   │   ├── index.tsx         # Home / Dashboard
│   │   ├── dashboard.tsx
│   │   ├── roadmap.tsx
│   │   ├── projects.tsx
│   │   └── profile.tsx       # Settings & API key
│   └── startup/               # Workflow screens
│       ├── create.tsx        # Idea input + agent runner
│       ├── research.tsx
│       ├── competitors.tsx
│       ├── mvp.tsx
│       ├── roadmap.tsx
│       └── launch.tsx
├── agents/                    # AI agent definitions
│   ├── founder-agent.ts
│   ├── market-agent.ts
│   ├── competitor-agent.ts
│   ├── mvp-agent.ts
│   ├── roadmap-agent.ts
│   └── launch-agent.ts
├── workflows/
│   └── founder-workflow.ts   # LangGraph orchestration
├── services/
│   ├── groq.service.ts       # Groq API client + streaming
│   ├── startup.service.ts    # Backend API client
│   ├── roadmap.service.ts
│   └── competitor.service.ts
├── store/                     # Zustand stores
│   ├── project-store.ts
│   ├── auth-store.ts
│   └── roadmap-store.ts
├── hooks/
│   ├── useWorkflow.ts
│   ├── useProjects.ts
│   ├── useRoadmap.ts
│   └── useResearch.ts
├── components/
│   ├── ui/                   # Button, Card, Input, Modal, Loader
│   └── startup/              # IdeaInput, AgentCard, ResultViewer, etc.
├── backend/                    # Express + SQLite backend (optional)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/ (projects, agents, users)
│   │   └── database/ (schema, db)
│   └── package.json
├── types/index.ts
├── constants/index.ts
└── utils/ (markdown, validation, formatters)
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Groq API Key

Sign up free at [console.groq.com](https://console.groq.com) and generate an API key (starts with `gsk_`).

### 3. Run the app

```bash
npx expo start
```

Scan the QR code with **Expo Go**, or press `w` for web, `i` for iOS simulator, `a` for Android emulator.

### 4. Add your Groq API Key in-app

Open the app → **Profile tab → Groq API Key → Add Key**. The key is stored securely on-device using `expo-secure-store` and never leaves your device (unless you opt to use the optional backend).

---

## 🖥️ Optional Backend Setup

The app works **fully offline-capable for AI calls** (calls Groq directly from the device). The included Express + SQLite backend is optional, for teams who want centralized project storage.

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Then set `EXPO_PUBLIC_BACKEND_URL` in your `.env` to point to the backend (e.g. `http://localhost:3001`).

### Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project with all agent results |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id/results` | Save agent results |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/agents/run` | Run a single agent |
| POST | `/api/agents/run-all` | Run full 5-agent pipeline |
| POST | `/api/agents/stream` | Streaming agent response (SSE) |

---

## 🤖 AI Agent Pipeline (LangGraph)

```
User Startup Idea
      ↓
Founder Agent (coordinator)
      ↓
Market Research Agent  → Qwen3-32B
      ↓
Competitor Agent        → Qwen3-32B
      ↓
MVP Agent                → DeepSeek-R1-Distill-70B
      ↓
Roadmap Agent            → Qwen3-32B
      ↓
Launch Agent             → DeepSeek-R1-Distill-70B
      ↓
Human Review → Save Project → Dashboard
```

Each agent runs sequentially, with results streamed back to the UI and persisted to local storage (and optionally the backend database).

---

## 📱 Building for Production (EAS)

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
eas build --profile production --platform all
```

---

## 🔒 Security Notes

- Groq API keys are stored using `expo-secure-store` (hardware-backed keychain on iOS, EncryptedSharedPreferences on Android)
- No API keys are ever transmitted to FounderOS servers
- All project data is stored locally by default

---

## 📄 License

MIT — built for the Anna AI-Native App Hackathon.
# Founder-oS-Agent
