# Visual Assets And Product Screenshots

## Purpose

Jobhunter uses repository-owned visual assets for a cleaner portfolio presentation. The app does not depend on third-party company logos for the demo experience, and product screenshots are captured from the running local production stack rather than assembled manually.

## Brand Identity

<p align="center">
  <img src="../frontend/public/logo-full.svg" alt="Jobhunter" width="320" />
</p>

- `frontend/public/logo-full.svg`: primary header/footer wordmark.
- `frontend/public/logo-mark.svg`: compact brand mark for small surfaces.
- `frontend/public/favicon.svg`: browser favicon using the same mark.

The mark combines a briefcase, search lens, and upward career signal to communicate IT hiring, discovery, and progression.

## Demo Company Images

Seeded employer images live in:

```text
backend/storage/company/
```

Every seeded company now has a generated PNG brand tile, including companies that previously had no image. The assets are deterministic and can be regenerated with:

```powershell
python scripts/generate-demo-company-logos.py
```

The backend Docker image copies these assets into `/opt/bootstrap-storage/company`, and the demo seeder writes the matching filename into each company record at startup.

## Product Screenshots

Screenshots are generated from the running local production stack:

```powershell
npm run qa:local -- --frontend-url=http://localhost:3001 --api-base-url=http://localhost:8080/api/v1 --screenshots
```

The same QA run also checks security headers, backend health, public APIs, unsafe-method guard, chatbot rendering, authenticated workspaces, mobile overflow, unexpected HTTP errors, and browser console errors.

| Screen | Asset |
| --- | --- |
| Public job board | ![Public job board](assets/screenshots/jobhunter-home.jpg) |
| Job detail | ![Job detail](assets/screenshots/jobhunter-job-detail.jpg) |
| Candidate workspace | ![Candidate workspace](assets/screenshots/jobhunter-candidate-workspace.jpg) |
| Recruiter pipeline | ![Recruiter pipeline](assets/screenshots/jobhunter-recruiter-pipeline.jpg) |
| Admin users | ![Admin users](assets/screenshots/jobhunter-admin-users.jpg) |
| AI assistant | ![AI assistant](assets/screenshots/jobhunter-chatbot.jpg) |

## Maintenance Checklist

- Regenerate company logos after changing seeded company names or sectors.
- Run the local production QA scanner after changing UI layout, logo assets, header/footer, company cards, or chatbot surfaces.
- Review screenshots before release notes are published.
- Keep screenshots in `docs/assets/screenshots` so GitHub README and About docs render without external hosting.
