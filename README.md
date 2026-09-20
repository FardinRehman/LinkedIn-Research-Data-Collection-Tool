# LinkedIn Research & Data Collection Tool

A production-grade, modular web application for conducting targeted research, dynamically projecting custom fields, performing intelligent composite deduplication, tracking live collection progress via Server-Sent Events (SSE), and exporting clean data to CSV, Excel (XLSX), and JSON.

---

## 🌟 Key Features & Dual Provider Architecture

### 🔌 1. Pluggable Data Provider Architecture (Ports & Adapters)
The application provides a clean separation between data collection adapters and downstream processing:

```
                  BaseDataProvider (Interface)
                         │
         ┌───────────────┴───────────────┐
         │                               │
  SimulationProvider            RealLinkedInProvider
  (Deterministic Mock)        (Authorized REST Adapter)
```

- **`SimulationProvider` (`DATA_PROVIDER=simulation`)**:
  - High-fidelity multi-page synthetic test data with realistic network latency, pagination simulation, and intentional duplicates for testing all features without credentials.
- **`RealLinkedInProvider` (`DATA_PROVIDER=real`)**:
  - Compliant adapter designed for authorized LinkedIn REST APIs or approved enterprise data partners.
  - **Strictly Non-Circumventing**: Does **NOT** implement CAPTCHA bypass, anti-bot evasion, session scraping, or login cracking.
  - **Zero Fake Data**: If credentials are not configured or invalid, it halts safely with `"Real data provider is not configured. Please configure the authorized provider credentials."` and **never fabricates records**.

---

## ⚙️ Environment Configuration

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Active Provider: 'simulation' or 'real'
DATA_PROVIDER=simulation

# Authorized Real Provider Configuration (Required when DATA_PROVIDER=real)
LINKEDIN_API_BASE_URL=https://api.linkedin.com/v2
LINKEDIN_API_KEY=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
```

---

## 🚀 How to Run Locally

### Start Backend API Server
```bash
cd server
npm run dev
# Server running at http://localhost:5000 (Health Check: http://localhost:5000/api/health)
```

### Start Frontend Client
```bash
cd client
npm run dev
# Client running at http://localhost:5173
```

---

## 🧪 Running Automated Tests

Run the automated test suite covering unit logic, simulation provider, real provider credential checks, dynamic fields, deduplication, and export fidelity:

```bash
cd server
npm test
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs` | Creates and starts a research job (`provider: "simulation"` or `"real"`) |
| `GET` | `/api/jobs/providers` | Lists provider metadata and active connection health |
| `GET` | `/api/jobs/:id` | Returns current job status and metrics snapshot |
| `GET` | `/api/jobs/:id/events` | Server-Sent Events (SSE) stream for real-time progress |
| `POST` | `/api/jobs/:id/cancel` | Cancels an ongoing collection job |
| `GET` | `/api/jobs/:id/results` | Returns paginated and filtered results |
| `GET` | `/api/jobs/:id/failed-records` | Returns diagnostic info on skipped/failed records |
| `GET` | `/api/jobs/:id/export/:format` | Streams export file (`csv`, `xlsx`, `json`) |
