# Vulcan

Vulcan is a repository intelligence and engineering decision platform. Paste a public GitHub repository URL, inspect its structure and dependencies, and receive deterministic recommendations for database, ORM, authentication, deployment, caching, queues, logging, and monitoring.

## Product Flow

`GitHub URL -> GitHub API inspection -> Repository Knowledge Model -> deterministic recommendation engine -> Neon PostgreSQL analysis record`

The deployed workflow does not clone or execute repository code. It reads public GitHub metadata, file trees, and selected package/lock manifests through HTTPS, which makes it compatible with Vercel serverless functions.

## Included Features

- Responsive dark engineering-review workspace at `/analyze`
- Serverless-safe GitHub inspection capped at 2,000 files
- Framework, language, test, package, and project-structure detection
- Deterministic recommendations with repository evidence and confidence scores
- PostgreSQL persistence through Prisma for completed analyses
- Strict request validation and GitHub API error handling
- Six-request-per-minute IP rate limit for repository analyses
- Health endpoint for deployment configuration readiness

## Architecture

- `src/app` - UI and App Router API routes
- `src/modules/repository` - URL validation, GitHub inspection, knowledge model, persistence
- `src/modules/recommendation` - deterministic decision rules
- `src/server/db` - Prisma singleton
- `prisma` - PostgreSQL schema and migrations

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Create a free Neon PostgreSQL database and add its pooled connection string as `DATABASE_URL`.
3. Create a fine-grained GitHub token with read-only repository metadata access and set `GITHUB_TOKEN`. Public repositories work without it, but the unauthenticated GitHub API limit is too low for reliable deployment.
4. Run:

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000/analyze` and analyze a public repository.

## Deploy To Vercel

1. Push the project to GitHub and import it into Vercel.
2. Add production environment variables:

```env
DATABASE_URL=<your Neon pooled PostgreSQL URL>
GITHUB_TOKEN=<read-only GitHub token>
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
GIT_CLONE_TIMEOUT_MS=60000
```

3. From a terminal configured with the production `DATABASE_URL`, run `npm run db:migrate` once. Vercel then runs `npm run build`; `postinstall` generates Prisma Client automatically.
4. Check `/api/health`. A `200` with `status: "ready"` confirms `DATABASE_URL` is configured. Run an analysis from `/analyze` to verify GitHub access and database persistence.

`CLONE_WORKDIR` only supports the legacy clone endpoint and is not needed by the deployed analysis workflow.

## Rate Limiting

`POST /api/analyses` allows 6 requests per IP per minute. Add free Upstash Redis credentials in Vercel (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) for a persistent limit across serverless invocations. Without them, Vulcan uses an in-memory fallback that resets on cold starts; this is suitable for local development and portfolio scope, not production-grade abuse control.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:migrate
npm run db:validate
```

## API

- `POST /api/analyses` - inspect, recommend, and save an engineering review
- `POST /api/recommend` - deterministic recommendations from a supplied knowledge model
- `GET /api/health` - deployment configuration health

Example request:

```json
{
  "repoUrl": "https://github.com/vercel/next.js",
  "constraints": {
    "teamSize": 3,
    "budget": "low",
    "expectedTraffic": "medium",
    "deploymentPreference": "serverless",
    "relationalPreference": "relational"
  }
}
```
