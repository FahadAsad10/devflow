# DevFlow

DevFlow is a full-stack developer project management SaaS built with React, TypeScript, Express, PostgreSQL, and Prisma.

## What is implemented

- JWT authentication with bcrypt password hashing and HttpOnly cookies
- Protected React routes and persistent PostgreSQL data
- Project creation, editing, deletion, status and due dates
- Task creation, status workflow and deletion
- Team invitations, project roles and member management
- Team membership visibility
- Project discussions/comments with ownership-aware deletion and collaborator notifications
- Search and filtering for projects
- Dashboard statistics, task completion analytics and overdue project tracking
- Task assignment with collaborator notifications
- Private project file attachments (10 MB limit in local storage)
- Responsive layouts with keyboard focus states and accessible labels
- Dark/light theme preference persisted locally
- Privacy, Terms, cookie consent, 404 handling, favicon and SEO/Open Graph metadata
- Helmet security headers, CORS allowlisting, JSON size limits and API/auth rate limiting
- Docker Compose PostgreSQL development environment
- GitHub Actions build checks

## Frontend

From the repository root:

```bash
npm install
npm run build
npm run dev
```

The Vite development server normally runs on port 5173 or the next available port.

## Backend

From the server directory:

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run build
npm run dev
```

The API runs on port 4000 by default.

For local development, make sure `FRONTEND_URL` matches the Vite URL. Multiple comma-separated origins are supported.

## PostgreSQL with Docker

From the repository root:

```bash
docker compose up -d
```

The full local stack is available with the frontend at `localhost:8080`, API at `localhost:4000`, and PostgreSQL at `localhost:5432`. Uploaded files are stored in the Docker `devflow-uploads` volume.

## Production checklist

Before deployment:

1. Generate a strong random `JWT_SECRET` and never commit it.
2. Set `NODE_ENV=production` and HTTPS.
3. Set `FRONTEND_URL` to the real frontend origin.
4. Configure `VITE_API_URL` to the deployed API before building the frontend image.
5. Replace `devflow.example.com` in metadata, sitemap and robots.txt with the real domain.
6. Review Privacy and Terms templates with the requirements of the jurisdiction where the service operates.
7. Use managed PostgreSQL or a protected private database network.
8. Configure object storage (S3-compatible storage or equivalent) instead of local uploads for multi-instance production deployments.
9. Add backups, monitoring and error tracking before serving real users.
10. Review allowed upload MIME types and size limits for your deployment.

## Project structure

- `src/` — React frontend
- `server/src/` — Express API
- `server/prisma/` — Prisma schema and migrations
- `.github/workflows/` — CI
- `Dockerfile` — frontend container
- `server/Dockerfile` — API container
- `docker-compose.yml` — local PostgreSQL/API environment
