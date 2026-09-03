<div align="center">

<img w="800" h="400" src="/public/assets/images/open_chainer_thumbnail.svg" alt="Open Chainer Thumbnail" />

# ⚡ OPENCHAINER

**An open-source, resilient AI tool for analyzing electrical schematics and circuit diagrams**

Upload an electrical schematic or PCB layout → receive automated component identification, AC/DC power path tracing, and plain-language circuit explanations in seconds.

[![Framework: TanStack Start](https://img.shields.io/badge/Framework-TanStack%20Start-black.svg?logo=react&style=for-the-badge)](https://tanstack.com/start)
[![React: 19](https://img.shields.io/badge/React-19-blue.svg?logo=react&style=for-the-badge)](https://react.dev/)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8.svg?logo=tailwindcss&style=for-the-badge)](https://tailwindcss.com/)
[![Linter: Biome](https://img.shields.io/badge/Linter-Biome-60a5fa.svg?logo=biome&style=for-the-badge)](https://biomejs.dev/)

[Features](#-features) • [Tech Stack](#️-tech-stack) • [LLM Architecture](#-llm-architecture--fallback-pipeline) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [API](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📑 Table of Contents

- [⚡ Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🧠 LLM Architecture & Fallback Pipeline](#-llm-architecture--fallback-pipeline)
  - [Provider Hierarchy](#provider-hierarchy)
  - [Fail-Fast Strategy](#fail-fast-strategy)
  - [Defensive JSON Sanitizer (`extractJson`)](#defensive-json-sanitizer-extractjson)
- [🧱 System Architecture](#-system-architecture)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup (Supabase)](#database-setup-supabase)
  - [Development Server](#development-server)
- [🔌 API Reference](#-api-reference)
  - [`POST /api/analyze`](#post-apianalyze)
  - [Quick Curl Test](#quick-curl-test)
- [🧪 Scripts & Tooling](#-scripts--tooling)
- [📋 Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ⚡ Overview

**OpenChainer** is an open-source, full-stack web application and API built with **TanStack Start** and **React 19**. It eliminates the complexity of reading intricate circuit diagrams by transforming raw schematic images into structured engineering reports.

By coupling a **SHA-256 content-based deduplication cache** (backed by Supabase) with an **autonomous multi-provider AI fallback chain** (Google Gemini → Groq → OpenRouter), OpenChainer guarantees high availability, sub-second cached responses, and resilience against upstream outages, model deprecations, or quota limits.

---

## ✨ Features

- 🔍 **AI-Powered Schematic Parsing**:
  - **Component Detection**: Lists resistors, capacitors, ICs, transistors, diodes, connectors, and switches with designated labels (e.g. `R1`, `U1`), quantities, and engineering descriptions.
  - **Power Domain Tracing**: Identifies voltage regulators, batteries, USB supplies, and traces AC vs DC domains with physical reasoning.
  - **Plain-Language Summary**: Offers both high-level executive summaries and in-depth educational explanations.
  - **Non-Schematic Detection**: Gracefully recognizes non-circuit photos (e.g., animals, landscapes, general objects) without hallucinating connections.
  - **Uncertainty Flags**: Highlights blurred traces or unverified pins rather than guessing.

- 🔄 **Autonomous Multi-Provider Fallback Pipeline**:
  - Seamlessly switches down the chain: **Gemini 3.x → Groq LPU → OpenRouter Free Tier**.
  - If a provider is down, rate-limited (`429`), unauthorized (`401`/`403`), or decommissioned (`404`), the request immediately shifts to the next tier in < 2 seconds.

- 🎨 **Modern Workbench UI**:
  - Drag-and-drop file uploader supporting images up to 10MB.
  - Interactive diagram preview and zoom capability.
  - Dynamic active provider badge indicating live execution vs cache status.
  - One-click sample test preset (NE555 Timer Circuit).
  - Responsive design with dark and light theme support.
  - Local client-side history with lightweight WebP thumbnails.

---

## 🛠️ Tech Stack

### Core Application
- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React framework with SSR and Server Functions)
- **Routing**: [TanStack Router](https://tanstack.com/router) (Strictly typed, file-based routing)
- **UI Library**: [React 19](https://react.dev/) + React Compiler (`babel-plugin-react-compiler`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with native CSS variables and dark mode support
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

### AI & Backend Services
- **Primary AI Provider**: [Google Gemini API](https://aistudio.google.com/) (`gemini-3.6-flash`, `gemini-3.8-flash`, `gemini-flash-latest`)
- **Secondary AI Provider**: [Groq Cloud](https://console.groq.com/) (Ultra-low latency LPU inference)
- **Tertiary AI Provider**: [OpenRouter](https://openrouter.ai/) (Aggregated free vision endpoints: `minimax/minimax-m3:free`, `google/gemma-4-*-it:free`)
- **Database & Cache**: [Supabase](https://supabase.com/) (Managed PostgreSQL for hash-indexed JSON results)

### Tooling & Build
- **Bundler**: [Vite 8](https://vite.dev/)
- **Code Quality**: [Biome](https://biomejs.dev/) (Fast linter & formatter)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)

---

## 🧠 LLM Architecture & Fallback Pipeline

### Provider Hierarchy

```
                   Incoming Schematic Upload
                               │
                               ▼
                 SHA-256 Content Hash (Crypto)
                               │
                               ▼
        [ Cache Lookup ] ──(Cache Hit)──► Return Cached Result (isCached: true)
                               │
                          (Cache Miss)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 1. Google Gemini Flash (Primary)                       │
   │    • gemini-3.6-flash / gemini-3.8-flash               │
   └───────────────────────────┬────────────────────────────┘
                               │ (401 / 403 / 429 / 404 Fail-Fast)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 2. Groq LPU Provider (Secondary)                       │
   │    • Ultra-low latency inference                       │
   └───────────────────────────┬────────────────────────────┘
                               │ (401 / 429 / Decommissioned Fail-Fast)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ 3. OpenRouter Free Tier (Tertiary)                     │
   │    • minimax-m3:free / gemma-4:free                    │
   └───────────────────────────┬────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
         [ All Failed ]              [ 200 OK Response ]
                │                             │
      Throw 500 Summary Error                 ▼
                                     extractJson() Sanitizer
                                              │
                                              ▼
                                     normalizeAnalysisResult()
                                              │
                                              ▼
                                     Save to Supabase Cache
                                              │
                                              ▼
                                     Deliver JSON to Client
```

1. **Google Gemini (Primary)**:
   - Evaluates `gemini-3.6-flash`, `gemini-3.8-flash`, `gemini-flash-latest`, and `gemini-3.5-flash`.
   - Uses strict JSON schema enforcement via `generationConfig.response_mime_type = "application/json"`.

2. **Groq LPU (Secondary)**:
   - Rapid fallback for high-throughput multimodal processing.
   - Automatically bypasses `response_format: { type: "json_object" }` to prevent vision API incompatibilities.

3. **OpenRouter (Tertiary)**:
   - Routes through active free multimodal endpoints (e.g. `minimax/minimax-m3:free`, `google/gemma-4-26b-a4b-it:free`).
   - Guarantees zero-cost availability when primary keys exhaust their rate limits.

### Fail-Fast Strategy
To avoid client HTTP timeouts, the pipeline enforces a **fail-fast policy**:
- Authentication (`401`), Quota Exhaustion (`403`), Rate Limit (`429`), and Decommissioned (`404` / `model_decommissioned`) responses immediately terminate that provider's candidate loop.
- The pipeline transitions to the next provider within milliseconds rather than making repetitive retries.

### Defensive JSON Sanitizer (`extractJson`)
Open-weights models frequently wrap responses in markdown fences or append conversational preambles (`"Here is the schematic analysis: ```json ... ```"`). 

`extractJson` safely strips code fences and extracts the object slice between the outermost `{` and `}` delimiters:

```ts
export function extractJson<T = unknown>(text: string): T {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end !== -1 && start < end) {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  }
  return JSON.parse(candidate) as T;
}
```

---

## 🧱 System Architecture

```
[ Browser / Client ]
        │
        ▼ (Multipart Form-Data)
[ POST /api/analyze ] (TanStack Start Server Route Handler)
        │
        ├─► SHA-256 Content Hashing
        ├─► Supabase Lookup (eq("image_hash", hash)) ───► [HIT] Return cached result
        │                                                        (~50-100ms)
        ├─► [MISS] Fallback Pipeline (src/lib/analyze.ts)
        │     ├─► Google Gemini (v1beta API)
        │     ├─► Groq LPU (OpenAI-compatible chat completions)
        │     └─► OpenRouter (Free Vision models)
        │
        ├─► normalizeAnalysisResult()
        ├─► Asynchronous Write to Supabase (analyses table)
        └─► Return Unified AnalysisResult Payload
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`
- **Google Gemini API Key**: Free at [Google AI Studio](https://aistudio.google.com/)
- **Supabase Account**: Free project at [supabase.com](https://supabase.com/)
- *(Optional)* **Groq API Key**: Free at [console.groq.com](https://console.groq.com/)
- *(Optional)* **OpenRouter API Key**: Free at [openrouter.ai](https://openrouter.ai/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Anandaxing/OpenChainer.git
cd OpenChainer/open-chainer

# Install dependencies
pnpm install

# or 
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# -----------------------------------------------------------------------------
# Supabase Cache Layer (Required for caching)
# -----------------------------------------------------------------------------
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# -----------------------------------------------------------------------------
# 1. Google Gemini (Primary Provider)
# -----------------------------------------------------------------------------
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# -----------------------------------------------------------------------------
# 2. Groq LPU (Secondary Provider - Optional Fallback)
# -----------------------------------------------------------------------------
GROQ_API_KEY=your_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1

# -----------------------------------------------------------------------------
# 3. OpenRouter (Tertiary Provider - Optional Fallback)
# -----------------------------------------------------------------------------
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

> **Note**: Do not enclose environment variable values in quotes.

### Database Setup (Supabase)

In your Supabase project dashboard, navigate to the **SQL Editor** and run:

```sql
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  image_hash text unique not null,
  result jsonb not null,
  created_at timestamptz default now()
);

-- Index for instant hash lookups
create index if not exists idx_analyses_image_hash on analyses(image_hash);
```

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Reference

### `POST /api/analyze`

Submits an image for schematic analysis.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `image` *(File, required)*: Schematic diagram (PNG, JPEG, WebP, max 10MB).

#### Response (`200 OK`)

```json
{
  "id": "analysis-1741065600000",
  "filename": "schematic.png",
  "fileSizeFormatted": "245.8 KB",
  "imageUrl": "",
  "isSchematic": true,
  "cached": false,
  "isCached": false,
  "provider": "Gemini (gemini-3.6-flash)",
  "summary": "An astable multivibrator circuit configured using the NE555 timer IC.",
  "components": [
    {
      "name": "NE555 Timer IC",
      "designator": "U1",
      "quantity": 1,
      "description": "Precision timing circuit generating clock pulses"
    },
    {
      "name": "10kΩ Resistor",
      "designator": "R1",
      "quantity": 1,
      "description": "Timing resistor connected between VCC and DISCH"
    }
  ],
  "power": {
    "source": "9V DC Battery",
    "voltage": "9V DC",
    "notes": "Direct power rail feeding VCC and ground"
  },
  "acRegions": [],
  "dcRegions": [
    {
      "location": "Pins 8, 4, 1",
      "reasoning": "Standard DC power lines regulated at 9V"
    }
  ],
  "explanation": "The NE555 timer oscillates continuously between high and low states by charging and discharging capacitor C1 through resistors R1 and R2.",
  "uncertainties": [],
  "analyzedAt": "2026-09-03T14:00:00.000Z"
}
```

### Quick Curl Test

```bash
# First call: Processes via AI (~1.5s - 2.5s)
curl -X POST http://localhost:3000/api/analyze \
  -F 'image=@sample_circuit.png' | jq '{provider, isCached, summary}'

# Second call: Served instantly from Supabase cache (~80ms)
curl -X POST http://localhost:3000/api/analyze \
  -F 'image=@sample_circuit.png' | jq '{provider, isCached, summary}'
```

---

## 🧪 Scripts & Tooling

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Starts Vite dev server on port `3000` |
| `pnpm dev-mac` | Runs `dot_clean .` before launching Vite (cleans macOS metadata) |
| `pnpm build` | Compiles production bundles for both client and SSR server |
| `pnpm preview` | Previews the compiled production build |
| `pnpm check` | Runs Biome checks across all project files |
| `pnpm lint` | Runs Biome linter |
| `pnpm format` | Auto-formats codebase according to Biome specifications |
| `pnpm generate-routes` | Re-generates TanStack Router type-safe route trees |

---

## 📋 Roadmap

- **PCB Layout & Trace Vectorization**: Highlight physical tracks and net connections on copper layers.
- **BOM (Bill of Materials) Export**: Export detected components directly to CSV and Excel formats for purchasing.
- **Multi-Page Schematic Stitching**: Support multi-sheet PDF electrical schematics.
- **Interactive Visual Pin Tracing**: Click on any component to highlight connected nets in the UI.
- **Community Schematic Repository**: Share and explore verified schematics with the community.

---

## 🤝 Contributing

Contributions are welcome! Whether you want to improve prompt engineering, add new vision providers, or enhance the workbench UI:

1. **Fork the Repository**
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
3. **Run Code Quality Checks**:
   ```bash
   pnpm check
   npx tsc --noEmit
   ```
4. **Commit Your Changes**:
   ```bash
   git commit -m "feat: add support for local Ollama vision provider"
   ```
5. **Push to Your Branch**:
   ```bash
   git push origin feat/my-new-feature
   ```
6. **Open a Pull Request**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

<div align="center">

Built with Tanstack Start & Gemini AI by [Ananda Adiputra](https://github.com/Anandaxing) and open-source contributors.

</div>
