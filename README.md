# LMS Frontend

Next.js frontend for the LMS project.

## Environment Variables

The app reads API requests from:

- `NEXT_PUBLIC_API_URL` (required in production)

If `NEXT_PUBLIC_API_URL` is not set, the frontend falls back to:

- `http://localhost:5251`

Create a local env file:

```bash
cp .env.example .env.local
```

Then set:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Development

Install dependencies and run:

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Vercel Deployment

1. Import this repository into Vercel.
2. In Vercel Project Settings -> Environment Variables, add:
   `NEXT_PUBLIC_API_URL` = your production API base URL (for example `https://api.example.com`).
3. Redeploy the project after saving environment variables.

## API Client Notes

- Reusable axios client: `src/lib/api.ts`
- Login uses the shared API client and resolves to:
  `${NEXT_PUBLIC_API_URL}/api/v1/auth/login`
  (or `http://localhost:5251/api/v1/auth/login` when env is missing in local development)
