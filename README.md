# Process-Hub

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Database (Postgres via Docker)

The process builder library (diagrams, folders, uploaded media) is persisted in
Postgres through Prisma.

```bash
cp .env.example .env        # adjust DATABASE_URL if needed (default port 5433)
npm install                 # runs `prisma generate` automatically
npm run db:up               # start Postgres (docker compose)
npm run db:migrate          # apply migrations (creates the tables)
```

The default `DATABASE_URL` points at the bundled docker-compose Postgres on
`localhost:5433` (5433 avoids clashing with any local Postgres already on 5432).
The library seeds a few sample diagrams the first time it's loaded.

Useful scripts: `npm run db:down`, `npm run db:studio` (Prisma Studio),
`npm run db:migrate:dev` (create a new migration during development).

### 2. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

> Optional: set `ANTHROPIC_API_KEY` in `.env` to enable live "Converge with AI";
> without it the builder falls back to a built-in text parser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
