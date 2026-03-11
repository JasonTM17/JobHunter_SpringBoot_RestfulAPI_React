# Jobhunter Monorepo Layout

- `backend/`: Spring Boot API (Gradle)
- `frontend/`: Next.js (React) UI

## Run backend

1. `cd backend`
2. configure `backend/.env` (add `OPENAI_API_KEY` to enable AI chatbot endpoint)
3. `.\gradlew.bat bootRun`

## Run frontend

1. `cd frontend`
2. copy `.env.example` to `.env.local`
3. `npm install`
4. `npm run dev`

## AI chatbot

- Backend API: `POST /api/v1/ai/chat`
- Frontend page: `http://localhost:3000/chatbot`
