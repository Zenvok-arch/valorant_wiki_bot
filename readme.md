# 🎮 Valorant Wiki Bot

A full-stack semantic search powered knowledge assistant for Valorant agents.

This project uses **React (frontend)** and **Express (backend)** with vector embeddings and cosine similarity to retrieve the most relevant agent data before generating grounded responses using Gemini.

---

## 🚀 Live Demo

👉 **Live Link:** *Comming soon*

---

## 🧠 Features

* Semantic search using vector embeddings
* Cosine similarity ranking
* Heuristic boosting for better accuracy
* Context-grounded AI responses
* Conversation memory (session-based)
* Clean React chat UI
* Confidence scoring for sources

---

## 🛠️ Tech Stack

### Frontend

* React
* Tailwind CSS
* Fetch API

### Backend

* Node.js
* Express
* Xenova Transformers (Embeddings)
* Google Gemini API
* Cosine Similarity (custom implementation)

---

## ⚙️ How It Works

1. Agent data is loaded from a static JSON file.
2. The data is chunked into descriptions, abilities, and ultimates.
3. Each chunk is converted into vector embeddings.
4. User questions are embedded and compared using cosine similarity.
5. Top-matching chunks are selected.
6. Retrieved context is sent to Gemini for grounded answer generation.
7. Response + confidence sources are returned to the frontend.

---

## 📦 Installation

### Clone the repository

```bash
git clone <your-repo-link>
cd <project-folder>
```

### Install backend dependencies

```bash
cd backend
npm install
```

### Install frontend dependencies

```bash
cd frontend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the backend directory:

```
GEMINI_API_KEY=your_api_key_here
```

---

## ▶️ Running the Project

### Start Backend

```bash
node index.js
```

### Start Frontend

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

Backend runs on:

```
http://localhost:3000
```

---

## 📌 Future Improvements

* Database instead of static JSON
* Authentication
* Deployment to cloud (Render / Vercel)
* Improved retrieval ranking
* Better UI/UX polish

##
