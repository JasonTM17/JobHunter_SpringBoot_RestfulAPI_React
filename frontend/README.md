# Jobhunter Frontend (Next.js)

## Run

1. `cd frontend`
2. `copy .env.example .env.local` (Windows) or create `.env.local` manually
3. `npm install`
4. `npm run dev`

Open: `http://localhost:3000`

## Logo path rule

- API: `GET http://localhost:8080/api/v1/companies?page=1&size=100`
- DB field: `companies.logo`
- Render path: `http://localhost:8080/storage/company/<logo-file-name>`

Put files in backend folder:

- `D:/PROJECT_INDIVIDUAL/Jobhunter/backend/storage/company/`

Example file names from current DB:

- `1716687538974-amzon.jpg`
- `1716687768336-apple.jpg`
- `1716687909879-google.png`
- `1716688017004-lazada.png`
- `1716688067538-netflix.png`
- `1716688187365-photoshop.png`
- `1716688251710-pr.jpg`
- `1716688292011-shopee.png`
- `1716688336563-tiki.jpg`
- `1716688386288-tiktok.jpg`
