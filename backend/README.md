# Cake House Backend (FastAPI)

## Requirements
- Python 3.10+

## Setup
```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

## Run (port 4000)
```bash
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

The frontend Vite dev server proxies `/api` to `http://localhost:4000`, so the React app can call endpoints like:
- GET `/api/cakes`
- POST `/api/cakes`
- PUT `/api/cakes/{id}`
- DELETE `/api/cakes/{id}`
- GET `/api/orders`
- POST `/api/orders`
