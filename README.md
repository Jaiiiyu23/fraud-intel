# Fraud Intel India — Deployment Guide

## Project Structure
```
fraud-intel/
├── frontend/
│   └── fraud-intel-platform.jsx   ← React app (deploy to Vercel)
├── backend/
│   ├── src/
│   │   ├── index.js               ← Express entry point
│   │   ├── routes/                ← auth, reports, classify, patterns, stats, admin
│   │   ├── services/              ← classifier.js, networkDetector.js
│   │   ├── jobs/                  ← ingestion.js (cron + manual)
│   │   ├── middleware/            ← auth.js (JWT + API key)
│   │   └── utils/                ← logger, helpers
│   ├── prisma/schema.prisma       ← PostgreSQL schema
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml             ← Full local stack
```

---

## Option A: Local Development (5 minutes)

### Prerequisites
- Docker + Docker Compose installed
- Anthropic API key

### Steps
```bash
# 1. Clone / copy project
cd fraud-intel

# 2. Set your API key
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# 3. Start everything (Postgres + API)
docker-compose up -d

# 4. Check it's running
curl http://localhost:3000/health
```

---

## Option B: Deploy to Railway (Recommended for production)

Railway gives you Postgres + Node hosting in one place, free tier available.

### Steps

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Add Postgres
railway add --plugin postgresql

# 5. Set environment variables (in Railway dashboard or CLI)
railway variables set JWT_SECRET="your-secret-here"
railway variables set ANTHROPIC_API_KEY="sk-ant-your-key"
railway variables set NODE_ENV="production"
railway variables set ALLOWED_ORIGINS="https://your-frontend.vercel.app"

# 6. Deploy backend
cd backend
railway up

# Railway auto-sets DATABASE_URL from the Postgres plugin
```

---

## Option C: Deploy Frontend to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Create a Next.js or Vite project and copy the .jsx file in
# OR use the existing component directly

# 3. Deploy
vercel --prod
```

---

## API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register org + admin |
| POST | `/api/v1/auth/login` | Login, get JWT |
| POST | `/api/v1/auth/api-keys` | Create API key |
| GET | `/api/v1/auth/api-keys` | List API keys |
| DELETE | `/api/v1/auth/api-keys/:id` | Revoke API key |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports` | List reports (filterable) |
| GET | `/api/v1/reports/:id` | Single report |
| POST | `/api/v1/reports` | Submit + auto-classify |
| GET | `/api/v1/reports/stats/summary` | Aggregate stats |

### Classify
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/classify` | Classify text (no save) |

### Patterns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/patterns/networks` | All scam networks |
| GET | `/api/v1/patterns/networks/:id` | Network detail |
| GET | `/api/v1/patterns/surge-alerts` | Active surge alerts |
| GET | `/api/v1/patterns/trends` | 30-day trend data |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats/overview` | Platform-wide stats |
| GET | `/api/v1/stats/region/:state` | State-level stats |

### Admin (JWT admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/orgs` | All organizations |
| GET | `/api/v1/admin/ingestion-logs` | Ingestion history |
| POST | `/api/v1/admin/ingest` | Trigger ingestion now |
| PATCH | `/api/v1/admin/surge-alerts/:id/resolve` | Resolve alert |

---

## Authentication

### For dashboard users (JWT)
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mha.gov.in","password":"yourpassword"}'

# Use token
curl http://localhost:3000/api/v1/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### For government/NGO API integrations (API Key)
```bash
curl http://localhost:3000/api/v1/reports \
  -H "X-API-Key: ifi_yourapikeyhere"
```

---

## Data Ingestion

Ingestion runs automatically every 6 hours (configurable via `INGESTION_CRON`).

```bash
# Run manually
npm run ingest

# Or via admin API
curl -X POST http://localhost:3000/api/v1/admin/ingest \
  -H "Authorization: Bearer ADMIN_JWT"
```

### Ingestion Sources
1. **Twitter/X** — Searches fraud-related tweets (requires `TWITTER_BEARER_TOKEN`)
2. **Cybercrime Portal** — Scrapes cybercrime.gov.in advisories
3. **Partner NGO feed** — POST to `/api/v1/reports` with `sourceType: PARTNER_NGO`
4. **Manual submission** — Direct API submission

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing |
| `ANTHROPIC_API_KEY` | ✅ | For AI classification |
| `TWITTER_BEARER_TOKEN` | ❌ | For Twitter ingestion |
| `ALLOWED_ORIGINS` | ✅ | CORS allowed domains |
| `INGESTION_CRON` | ❌ | Default: `0 */6 * * *` |

---

## Next Steps
- [ ] Add webhook notifications (when surge alert created, POST to client URL)
- [ ] Add Hindi language classification support  
- [ ] Integrate with NPCI / RBI fraud API feeds
- [ ] Add phone number / UPI ID blacklist lookup
- [ ] Build mobile app for field investigators
