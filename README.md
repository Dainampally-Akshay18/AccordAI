# AccordAI 🚀
AccordAI is a full-stack AI-powered document analysis platform built with FastAPI (backend) and React + Vite (frontend).
It allows users to upload and analyze documents of different formats such as PDF, DOCX, and JSON, and provides smart insights including:

Risk Analysis → Detects potential risks, inconsistencies, or compliance issues.

Summarization → Generates concise summaries of lengthy documents.

Letter & Report Generation → Creates ready-to-use professional letter/report formats based on document content.

AccordAI is designed to be lightweight, scalable, and developer-friendly, with the option to run locally or inside Docker containers for easy deployment.

The project is split into two main parts:

Backend (FastAPI) → Handles document parsing, AI-powered analysis, and APIs.

Frontend (React + Vite) → Provides an interactive user interface to upload files, view results, and download generated outputs.

Whether you are a student, researcher, or enterprise user, AccordAI helps you save time by automating the tedious parts of document analysis and presenting the results in a clean, user-friendly format.

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
uvicorn app.main:app --reload
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


