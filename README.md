# Jobhunter Monorepo Layout

- `backend/`: Spring Boot API (Gradle)
- `frontend/`: Next.js (React) UI

## Run backend

1. `cd backend`
2. configure `backend/.env`
3. `.\gradlew.bat bootRun`

## Run frontend

1. `cd frontend`
2. copy `.env.example` to `.env.local`
3. `npm install`
4. `npm run dev`
