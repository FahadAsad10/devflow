# DevFlow

DevFlow is a full-stack developer project management SaaS built with React, TypeScript, Express, PostgreSQL, and Prisma.

## Frontend

From the repository root:

npm install
npm run build
npm run dev

## Backend

From the server directory:

npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev

The API runs on port 4000 by default.

## Production checklist

- Authentication uses bcrypt password hashing and HttpOnly JWT cookies.
- Helmet security headers and API rate limiting are enabled.
- Production HTTP requests are redirected to HTTPS.
- Secrets are supplied through environment variables.
- Client forms validate input and API routes validate again with Zod.
- Privacy and Terms pages are included.
- Cookie consent gates optional analytics.
- Custom 404 handling, sitemap, robots.txt, favicon, metadata, Open Graph preview, responsive layouts, and accessibility focus states are included.
- Before launch, replace devflow.example.com with the actual production domain and have the legal templates reviewed for the operating jurisdiction.
