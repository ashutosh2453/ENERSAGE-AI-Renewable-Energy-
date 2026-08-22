# ⚡ ENER SAGE AI — Intelligent Renewable Energy Management Platform

A production-grade AI-powered Renewable Energy Forecasting, Analysis, Decision & Management platform.

**Architecture:** React Frontend × Node.js Backend × Python ML Microservice (monorepo)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)

### 1. Start MongoDB (if local)
```bash
mongod --dbpath ./data/db
```

### 2. Start the ML Service
```bash
cd ml-service
pip install -r requirements.txt       # first time only
uvicorn main:app --reload --port 8000
```

### 3. Start the Backend
```bash
cd backend
npm install                            # first time only
npm run dev
```

### 4. Start the Frontend
```bash
cd frontend
npm install                            # first time only
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🎯 Demo Mode (No Setup Required for Data)

1. Register a free account at `/register`
2. Click **"Launch Live Demo"** on the landing page
3. 30 days of synthetic Solar + Wind Microgrid data auto-loads
4. Navigate to Dashboard → the system auto-generates forecasts and alerts

---

## 📁 Project Structure

```
renew-ai/
├── frontend/          # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/     # Landing, Dashboard, Forecast, EnergyFlow, Alerts, Copilot, Simulator, Upload
│       ├── components/ # KPICard, Charts, EnergyFlowDiagram, AppLayout
│       ├── contexts/   # AuthContext, ProjectContext, ToastContext
│       └── services/  # api.js (Axios layer)
├── backend/           # Node.js + Express + MongoDB
│   └── src/
│       ├── models/    # User, Project, EnergyRecord, Forecast, Alert
│       ├── routes/    # auth, projects, data, forecast, simulate, alerts, copilot
│       └── services/  # decisionEngine, alertService, demoDataService
└── ml-service/        # Python FastAPI
    └── app/
        ├── preprocessing.py   # Feature engineering
        ├── trainer.py         # RF + GBM + XGBoost ensemble training
        ├── forecaster.py      # Confidence intervals + XAI reasons
        └── routers/           # /train, /forecast, /health
```

---

## 🔌 API Endpoints

### Backend (port 5000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/data/demo` | Generate 30-day synthetic dataset |
| POST | `/api/data/upload/:id` | Upload CSV |
| GET | `/api/data/stats/:id` | Dataset statistics |
| POST | `/api/forecast/train/:id` | Train ML model |
| POST | `/api/forecast/generate/:id` | Generate forecast |
| GET | `/api/forecast/:id` | Get latest forecast |
| POST | `/api/simulate/:id` | Run What-If simulation |
| GET | `/api/alerts/:id` | Get alerts |
| POST | `/api/copilot/chat` | AI Copilot (Groq LLaMA 3) |

### ML Service (port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/train` | Train RF+GBM+XGBoost ensemble |
| POST | `/forecast` | Generate forecast with confidence intervals |

---

## 🧠 ML Architecture

- **Models:** RandomForest + GradientBoosting + XGBoost ensemble (average of 3)
- **Features:** Hour sin/cos, day-of-week sin/cos, lag-1h, lag-24h, rolling-6h mean, irradiance, windspeed, temperature
- **Confidence Intervals:** ±1.5σ from ensemble variance (3-model spread)
- **XAI:** Feature importance from RF + GBM averaged, mapped to human-readable strings

---

## ⚡ Decision Engine Logic

| Condition | Action |
|-----------|--------|
| Surplus > 0, SOC < 90% | **STORE** — charge battery |
| Surplus > 0, SOC ≥ 90% | **EXPORT** — sell to grid |
| Deficit > 0, SOC > 20% | **USE** — discharge battery |
| Deficit > 0, SOC ≤ 20%, grid available | **GRID** — import |

---

## 🤖 AI Copilot

- Powered by **Groq LLaMA 3 70B** (ultra-fast inference)
- Groq API Key: configured in `backend/.env`
- Context-aware: injects current SOC, generation, demand, forecast confidence into system prompt
- Deterministic fallback if Groq is unreachable

---

## 🔐 Environment Variables

### `backend/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/renewai
JWT_SECRET=your_jwt_secret_here
ML_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
```

### `ml-service/.env`
```
BACKEND_URL=http://localhost:5000
MODELS_DIR=./models
PORT=8000
```
