# AccordAI 🚀
A full-stack project with **FastAPI (backend)** and **React + Vite (frontend)**.  
You can run locally or with **Docker Compose**.

---

## 📂 Project Structure
```

AccordAI/
├── backend/          # FastAPI backend
├── frontend/         # React frontend (Vite)
├── docs/             # Documentation
├── plan/             # Planning files
├── scripts/          # Utility scripts
├── docker-compose.yml
├── README.md
└── .gitignore

````

---

## ⚙️ Backend (FastAPI)

### 1. Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
````

If `requirements.txt` is missing:

```bash
pip install fastapi uvicorn
```

### 2. Run

```bash
uvicorn main:app --reload
```

### 3. Test

* API docs → [http://localhost:8000/docs](http://localhost:8000/docs)
* Health check → [http://localhost:8000/health](http://localhost:8000/health)

---

## 🎨 Frontend (React + Vite)

### 1. Setup

Install [Node.js](https://nodejs.org/).

```bash
cd frontend
npm install
```

### 2. Run

```bash
npm run dev
```

App runs at → [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

* **Backend** → create `.env` in `backend/`
* **Frontend** → create `.env` in `frontend/` (e.g., API URLs)

---

---

## 🔧 Useful Commands

* Deactivate Python venv → `deactivate`
* Install new Python pkg → `pip install <package>`
* Install new Node pkg → `npm install <package>`

---


