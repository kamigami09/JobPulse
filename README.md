<div align="center">
  <h1>🚀 JobPulse</h1>
  <p>An intelligent, automated Job Application Tracker & CRM for modern professionals.</p>
</div>

---

## 📌 What is JobPulse?
When you apply to jobs, using spreadsheets or bookmarks quickly becomes unmanageable. JobPulse is a centralized command center to track your job hunt. 

Instead of typing out job titles and companies manually, simply **paste the URL of the job** into JobPulse. The backend automatically visits the link, extracts the *Title, Company,* and *Location* using intelligent web scraping, and inserts it straight into your tracking pipeline!

## ✨ Features
*   **🤖 Automated Web Scraping:** Uses `beautifulsoup4` to extract `<title>` metadata seamlessly from LinkedIn, SimplyHired, Greenhouse, Lever, etc.
*   **📊 Pipeline Management:** Drag roles through `Saved` ➡️ `Applied` ➡️ `Interviewing` ➡️ `Offer` statuses.
*   **📓 Note Tracking:** Keep track of interview schedules, recruiter names, and follow-ups.
*   **🎨 Premium UI:** Custom Vanilla CSS tailored to have a high-contrast, professional clean aesthetic (similar to Stripe or Linear).
*   **☁️ Cloud Ready:** Pre-configured with `render.yaml` for instantaneous deployment.

---

## 🏗️ Architecture Stack
**JobPulse is a decoupled Client-Server application.**

*   **Frontend**: React + Vite + React Router (Bootstrapped for speed and responsiveness).
*   **Backend**: Python + Flask + Flask-SQLAlchemy (REST API).
*   **Database**: SQLite (for local development) / PostgreSQL (for production).

---

## 💻 Running Locally

### 1. Start the Backend API (Port 5000)
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python run.py
```

### 2. Start the Frontend App (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser. The app will automatically sync with the Python backend to fetch your database records.

---

## 🌍 Cloud Deployment
The repository is perfectly structured for immediate deployment using **Vercel** (Frontend) and **Render** (Backend).

### Step 1: Deploy Backend (Render)
1. Log into Render.com and create a **New Blueprint**.
2. Connect to this GitHub repository.
3. Render reads the included `render.yaml` and will automatically provision a Python web service and a PostgreSQL database in seconds.

### Step 2: Deploy Frontend (Vercel)
1. Log into Vercel.com.
2. Import this GitHub repository.
3. In Environment Variables, set `VITE_API_URL` to your new Render web address (e.g., `https://jobpulse-api.onrender.com`).
4. Set the **Root Directory** to `frontend`.
5. Deploy!

---

*Built cleanly. Engineered to help you get hired.* 💼
