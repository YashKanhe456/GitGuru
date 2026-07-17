# 🚀 GitGuru

A full-stack platform that analyzes GitHub repositories and provides structured insights into project architecture, technology stack, dependencies, and engineering best practices.

---

## 📖 Overview

GitGuru is a developer-focused platform that analyzes GitHub repositories to provide a structured overview of their architecture, technology stack, dependencies, and project organization. It simplifies repository exploration by reading public GitHub metadata, file trees, and selected package manifests via the GitHub API, making it fully compatible with serverless environments.

Designed with a modular architecture to support scalable repository analysis without cloning or executing untrusted code.

---

## ✨ Key Highlights

- GitHub Repository Analysis
- Technology Stack Detection
- Dependency Analysis
- Architecture Insights
- Engineering Recommendations
- Secure Repository Processing
- PostgreSQL Persistence
- Responsive Dashboard

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Lucide React |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | PostgreSQL, Prisma ORM |
| **APIs** | GitHub REST API |
| **Deployment** | Vercel |

---

## 🏗 System Architecture

```text
GitHub Repository
        │
        ▼
 GitHub REST API
        │
        ▼
 Repository Analysis Engine (src/modules/repository)
        │
        ▼
 Deterministic Decision Rules (src/modules/recommendation)
        │
        ▼
 PostgreSQL Database via Prisma (src/server/db)
        │
        ▼
 Next.js UI Workspace (src/app)
```

---

## 📂 Project Structure

```text
GitGuru/
├── prisma/             # PostgreSQL schema and migrations
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router UI and API routes
│   ├── core/           # Core domain logic and entities
│   ├── modules/        # Domain modules (repository, recommendation, rate-limit)
│   └── server/         # Database and server singletons
├── README.md
```

---

## 🚀 Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/YashKanhe456/GitGuru.git
cd GitGuru
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure the application**

Copy `.env.example` to `.env.local` and add the required environment variables:
- `DATABASE_URL`: A pooled PostgreSQL connection string (e.g., Neon).
- `GITHUB_TOKEN`: A fine-grained GitHub token with read-only repository metadata access (highly recommended to avoid unauthenticated API limits).

**4. Set up the database**

```bash
npm run db:migrate
```

**5. Start the development server**

```bash
npm run dev
```

Open `http://localhost:3000/analyze` and run your first repository analysis!

---

## 🌍 Deploy To Vercel

1. Push the project to GitHub and import it into Vercel.
2. Add production environment variables:
   - `DATABASE_URL`
   - `GITHUB_TOKEN`
   - `NEXT_PUBLIC_APP_URL`
   - `GIT_CLONE_TIMEOUT_MS` (e.g., `60000`)
3. From a terminal configured with the production `DATABASE_URL`, run `npm run db:migrate` once.
4. Check the `/api/health` endpoint to verify the deployment configuration.

*(Optional)* For production rate limiting (6 requests/minute), add Upstash Redis credentials (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) in Vercel.

---

## 📄 License

MIT

---

## 👨💻 Author

**Yash Santosh Kanhe**

- GitHub: https://github.com/YashKanhe456
