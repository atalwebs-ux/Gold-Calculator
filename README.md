# Global Gold Live - Backend REST API Server

Production-ready REST API server built with Node.js, Express, TypeScript, MySQL 8+, and Prisma ORM.

## Features
- **Strict TypeScript & Node.js 18+**
- **Security**: Helmet headers, configurable CORS, and request logging
- **Hostinger MySQL & Prisma ORM**: Relational schema for Users, Gold Rates, Price Alerts, and Devices
- **Live Gold & Forex Data**: Real-time integration with fastFOREX and GoldPrice
- **Push Notification Broadcast**: Admin broadcast route to push notifications to mobile devices
- **Docker Support**: Production multi-stage Dockerfile and Render blueprint

---

## Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | MySQL Connection String | `mysql://user:pass@srv671.hstgr.io:3306/u785941294_gold` |
| `FASTFOREX_API_KEY` | fastFOREX API Key | `ed1ebbd296-f60d61f339-tllrbu` |
| `CORS_ORIGIN` | Allowed Origins | `*` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `gold-calculator-b1036` |

---

## Commands

```bash
# Install dependencies
npm install

# Build (generates Prisma client + compiles TypeScript)
npm run build

# Start Production Server
npm start

# Start Development Server
npm run dev

# Run Typecheck
npm run typecheck
```

---

## Production Deployment

### 1. Render.com / Railway / Cloud Hosting
1. Connect this repository to Render or Railway as a **Web Service**.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Set Environment Variables in dashboard:
   - `DATABASE_URL`: `mysql://u785941294_gold_db:PASSWORD@srv671.hstgr.io:3306/u785941294_gold`
   - `FASTFOREX_API_KEY`: `ed1ebbd296-f60d61f339-tllrbu`
   - `NODE_ENV`: `production`

### 2. Docker
```bash
docker build -t global-gold-api .
docker run -p 5000:5000 --env-file .env global-gold-api
```

---

## API Endpoints

- `GET /` — API root and status
- `GET /api/v1/health` — System health, uptime, and MySQL latency check
- `GET /api/v1/gold/rates` — Live gold rates across 16 countries & 4 purities (24K, 22K, 18K, 14K)
- `GET /api/v1/countries` — List of supported countries and currency configurations
- `POST /api/v1/notifications/broadcast` — Broadcast push notification to registered devices
