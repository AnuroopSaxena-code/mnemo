# Mnemo 

**An engineering déjà vu & pre-mortem agent designed to permanently solve the problem of engineering amnesia.**

Mnemo passively builds an institutional memory bank for your software team by intercepting discussions, Pull Requests, and architecture shifts, storing the *intent* behind technical decisions using semantic vector memory.

---

## 🧠 The Problem: Engineering Amnesia
When teams scale or engineers leave, the context behind critical architectural decisions ("Why did we drop Kafka?", "Why did we choose Postgres over Mongo?") is lost. Code tells you *what* a system does, but not *why* it was built that way. Standard documentation rots the second it's merged, and searching Slack yields poor results for conceptual choices.

## ✨ The Solution
Mnemo solves this by treating context as a first-class citizen:
1. **Passive Ingestion:** Automatically listens to GitHub webhooks (capturing PR diffs, `schema.prisma` updates, and `package.json` dependency changes) to infer architectural shifts.
2. **Semantic Memory:** Utilizes [Hindsight](https://github.com/vectorize-io/hindsight) to index the *intent* of decisions into a vector database, eliminating the need for exact keyword matches.
3. **Pre-Mortem Agent:** intercepts GitHub PRs to cross-reference proposed changes against past failures (e.g., "Warning: We explicitly removed this library 6 months ago because it caused a memory leak").
4. **Discord Integration:** A native Discord bot allowing developers to query past context (e.g., `/why did we do this?`) directly in their workflow.

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Sources ["Data Sources"]
        GH[GitHub Webhooks]
        DC[Discord Bot]
        SL[Slack App]
    end

    subgraph Backend ["Mnemo Next.js Backend"]
        API[API & Webhook Handlers]
        PM[Pre-Mortem Agent]
    end

    subgraph Storage ["Storage & Memory"]
        DB[(PostgreSQL\nRelational State)]
        HS[(Hindsight\nVector Memory)]
    end

    GH -->|Pushes schema diffs & PRs| API
    DC -->|Slash Commands & Queries| API
    SL -->|Slash Commands & Queries| API
    
    API -.->|Auth & Workspace Data| DB
    API ==>|Retain/Recall Context| HS
    
    API -->|Context + Query| LLM[LLM Synthesis]
    LLM -->|Final Answer/Warning| DC
```

## 🛠️ Tech Stack
* **Framework:** Next.js (App Router, React, TypeScript)
* **Agent Memory:** `@vectorize-io/hindsight-client` for seamless embedding, chunking, and semantic vector retrieval.
* **Database:** Prisma ORM with PostgreSQL for standard relational state mapping (Workspaces, Repositories).
* **Bot Engine:** `discord.js` integrated with a `Promise.race` serverless defensive architecture to gracefully handle Vercel cold-starts within Discord's strict 3.0s interaction timeout limits.
* **Deployment:** Vercel (Frontend/Webhooks) + Railway (Background Jobs / Nixpacks).

## 🚀 Getting Started

### Prerequisites
* Node.js v20+
* A PostgreSQL Database
* A Discord Bot Token & Application ID
* A [Hindsight API Key](https://hindsight.vectorize.io/)

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-org/mnemo.git
   cd mnemo
   npm install
   ```

2. **Environment Configuration**
   Duplicate `.env.local.example` to `.env.local` and configure your API keys:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/mnemo"
   HINDSIGHT_API_KEY="your_hindsight_key"
   DISCORD_BOT_TOKEN="your_discord_token"
   DISCORD_APPLICATION_ID="your_discord_app_id"
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

### Discord Bot Development
If developing the Discord bot locally alongside the Next.js server, you can run the bot script natively:
```bash
npx tsx discord-bot/index.ts
```

## 🛡️ Key Design Decisions
* **Vector Over Keyword Search:** Relying heavily on Hindsight's retrieval engine because architectural problems change vocabulary over time.
* **Serverless Graceful Degradation:** The Discord bot implements immediate deferrals (`deferReply`) when querying Hindsight takes longer than 2.0 seconds, actively preventing InteractionFailed crash loops.