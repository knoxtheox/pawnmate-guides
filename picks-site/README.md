# Picks

Private, sign-in-only CFB / NFL picks dashboard. Next.js 16 (App Router, TypeScript) + Railway Postgres, deployed on Railway.

Built in six milestones from the build spec; this branch currently holds **milestone 1 (skeleton)**.

## Local development

```bash
npm install
cp .env.example .env.local      # fill in values (see below)
npm run db:migrate              # create tables
npm run dev                     # http://localhost:3000
npm test                        # unit tests
```

## Server settings (environment variables)

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. On Railway: `${{Postgres.DATABASE_URL}}` |
| `AUTH_EMAIL` | The one account's email |
| `AUTH_PASSWORD_HASH` | Output of `npm run hash-password` (never the password itself) |
| `AUTH_SECRET` | 32+ random characters for signing the session cookie (`openssl rand -base64 48`) |
| `CRON_SECRET` | 32+ random characters; the scheduled jobs send it as `Authorization: Bearer …` |
| `ODDS_API_KEY`, `CFBD_API_KEY` | Data API keys (milestone 3) |

There is no sign-up page. The only account is the one defined by `AUTH_EMAIL` + `AUTH_PASSWORD_HASH`.
To change the password, run `npm run hash-password` and replace `AUTH_PASSWORD_HASH`.

## Deploy on Railway (new project, separate from your other sites)

1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo and branch.
2. In the service's **Settings → Source**, set **Root Directory** to `picks-site` (only while the app lives in this subfolder).
3. In the project, **+ New → Database → PostgreSQL**.
4. In the app service's **Variables**, add the variables above (`DATABASE_URL` as the reference `${{Postgres.DATABASE_URL}}`).
5. **Settings → Networking → Generate Domain** for the free `*.up.railway.app` HTTPS address.

`railway.json` sets the build, runs `npm run db:migrate` before each deploy, and uses `/api/health` as the health check.

## Security

- `src/proxy.ts` checks the signed session cookie on every page and API route; pages and server actions check again server-side.
- `/api/health` is public and returns only `{ ok }`. `/api/cron/*` routes require `CRON_SECRET`.
- Login is throttled (5 failures per IP per 15 minutes). API keys never reach the browser.
