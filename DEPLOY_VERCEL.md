# TaskFlow — Vercel deployment

TaskFlow is a monorepo with three applications:

- `apps/web` — Next.js frontend
- `apps/api` — Express + Prisma API
- `apps/ai` — optional FastAPI AI service

## Recommended production layout

Use two Vercel projects from the same GitHub repository:

1. **TaskFlow Web**
   - Root Directory: `apps/web`
   - Framework: Next.js
   - Build Command: `npm run build`

2. **TaskFlow API**
   - Root Directory: `apps/api`
   - Framework: Other / Vercel Node
   - The repository already contains `apps/api/vercel.json`.

The API is exposed as a Vercel Function. Local development still starts the normal Express HTTP server.

## Database

Use a managed PostgreSQL provider connected to the Vercel project, for example Neon or Prisma Postgres from the Vercel Marketplace. The provider should supply `DATABASE_URL`.

The API deployment runs `prisma generate` and `prisma db push --accept-data-loss` during the Vercel build because the repository currently contains a Prisma schema but no migration directory. After the first production deployment is stable, switch to checked-in Prisma migrations and replace `db push` with `prisma migrate deploy`.

## API environment variables

Set these in the **TaskFlow API** Vercel project:

```text
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
FRONTEND_URL=https://YOUR-WEB-PROJECT.vercel.app
CORS_ORIGIN=https://YOUR-WEB-PROJECT.vercel.app
API_URL=https://YOUR-API-PROJECT.vercel.app
AI_SERVICE_URL=... (optional)
GOOGLE_CLIENT_ID=... (optional)
GOOGLE_CLIENT_SECRET=... (optional)
GITHUB_CLIENT_ID=... (optional)
GITHUB_CLIENT_SECRET=... (optional)
```

`CORS_ORIGIN` accepts a comma-separated list, so preview/staging origins can be added when needed.

## Web environment variables

Set this in the **TaskFlow Web** Vercel project:

```text
NEXT_PUBLIC_API_URL=https://YOUR-API-PROJECT.vercel.app
```

## Deployment order

1. Import the repository into Vercel as **TaskFlow API** and set Root Directory to `apps/api`.
2. Add PostgreSQL through Vercel Marketplace and copy/connect its `DATABASE_URL`.
3. Add `JWT_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`, and `API_URL`.
4. Deploy the API and verify `https://YOUR-API-PROJECT.vercel.app/health`.
5. Import the same GitHub repository again as **TaskFlow Web** with Root Directory `apps/web`.
6. Set `NEXT_PUBLIC_API_URL` to the deployed API URL.
7. Deploy the web app.
8. Update `FRONTEND_URL` and `CORS_ORIGIN` in the API project with the final web URL and redeploy the API.

## OAuth

If Google/GitHub login is enabled, update the OAuth callback URLs to use the production API URL:

- Google: `https://YOUR-API-PROJECT.vercel.app/auth/google/callback`
- GitHub: `https://YOUR-API-PROJECT.vercel.app/auth/github/callback`

Also set the corresponding client ID/secret environment variables in Vercel.

## Redis, MinIO and AI

The current API source does not actively use Redis or MinIO in its request handlers, so they are not required for the core production deployment. The Python AI service is optional because the API has local fallback logic for AI endpoints. If you deploy `apps/ai`, set `AI_SERVICE_URL` to its HTTPS URL.

## Important Vercel limitation

The Express API is deployed as serverless HTTP functions. The existing Socket.IO server is kept for local development, but persistent Socket.IO connections should not be treated as a required production feature on this Vercel setup. The current web application does not depend on a Socket.IO client connection for its core task flows.
