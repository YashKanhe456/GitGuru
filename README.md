# RepoMind

AI-powered codebase intelligence for GitHub repositories.

RepoMind turns a GitHub repository URL into a focused engineering report. It scans high-signal files, runs a LangGraph workflow, uses Groq for code analysis, and stores reports in Neon Postgres when configured.

## Features

- GitHub repository URL analyzer
- Dynamic repo tree and file sampling
- LangGraph workflow: scan repository, build prompt, generate report
- Groq-powered architecture, risk, improvement, and test-plan generation
- Neon Postgres history for saved analyses
- Reopen saved reports from recent analyses
- Markdown report download
- Groq-safe focused scan limits for free-tier usage

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- LangGraph JS
- Groq SDK
- Neon Postgres
- Drizzle ORM

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=
GITHUB_TOKEN=
```

`GROQ_API_KEY` enables real AI reports. Without it, RepoMind returns a fallback report so the app does not crash.

`DATABASE_URL` enables Neon history. Run `drizzle.sql` in the Neon SQL editor before saving reports.

`GITHUB_TOKEN` is optional, but useful if you hit GitHub public API rate limits.

## Neon Setup

Run this file in Neon SQL Editor:

```text
drizzle.sql
```

It creates the `analyses` table used for saved report history.

## MVP Flow

1. Paste a GitHub repository URL.
2. RepoMind fetches the repository tree and focused source files.
3. LangGraph coordinates scan, prompt, and report generation.
4. Groq returns a structured engineering report.
5. Neon saves the report when configured.
6. The UI displays the report and allows Markdown download.

## Resume Pitch

Built RepoMind, a full-stack AI codebase intelligence app using Next.js, LangGraph, Groq, and Neon Postgres. It analyzes GitHub repositories, generates architecture summaries, detects code risks with severity labels, suggests improvements, creates test plans, saves analysis history, and exports Markdown engineering reports.

## Validation

```bash
npm run lint
npm run build
```
