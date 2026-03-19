# Jobhunter — Nền tảng Tuyển dụng Công nghệ

> Nền tảng tuyển dụng công nghệ dành cho sinh viên và kỹ sư phần mềm tại Việt Nam.
> Dự án thực tập cá nhân — Spring Boot + Next.js + MySQL + Redis + Docker.

---

## Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Kiến trúc](#kiến-trúc)
3. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
4. [Cấu trúc dự án](#cấu-trúc-dự-án)
5. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
6. [Cài đặt Local](#cài-đặt-local)
   - [Backend — Java 21 + Gradle](#backend--java-21--gradle)
   - [Frontend — Node.js + Next.js](#frontend--nodejs--nextjs)
7. [Chạy bằng Docker / Docker Compose](#chạy-bằng-docker--docker-compose)
8. [Biến môi trường](#biến-môi-trường)
9. [Database migrations (Flyway)](#database-migrations-flyway)
10. [Chạy tests](#chạy-tests)
    - [Backend tests](#backend-tests)
    - [Frontend tests](#frontend-tests)
11. [Docker — Build và Push lên Docker Hub](#docker--build-và-push-lên-docker-hub)
12. [Monitoring / Health Endpoints](#monitoring--health-endpoints)
13. [CI/CD](#cicd)
14. [Bảo mật](#bảo-mật)
15. [Đóng góp](#đóng-góp)

---

## Giới thiệu

**Jobhunter** là một nền tảng tuyển dụng công nghệ thực tế, được xây dựng theo kiến trúc **fullstack** với:

- Trang việc làm công khai (danh sách, bộ lọc, chi tiết, ứng tuyển)
- Workspace dành cho **Ứng viên** — theo dõi hồ sơ đã nộp
- Workspace dành cho **Nhà tuyển dụng** — quản lý tin tuyển, xử lý hồ sơ
- Workspace dành cho **Quản trị viên** — RBAC, quản lý người dùng, dữ liệu
- Chatbot AI tư vấn việc làm (OpenAI GPT-4 / Google Gemini)
- Email tự động: nhắc nhở định kỳ, gợi ý việc làm hàng tuần
- Hệ thống phân quyền RBAC đầy đủ
- Docker hóa hoàn chỉnh — build và chạy trong container

---

## Kiến trúc

```
┌──────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│              Next.js (Port 3000/3001)                │
└──────────────────┬───────────────────────────────────┘
                   │ HTTP / REST
┌──────────────────▼───────────────────────────────────┐
│             API Gateway (Spring Boot)                 │
│              Backend (Port 8080)                     │
│  Controllers → Services → Repositories → MySQL      │
│           JWT Auth | RBAC | Flyway Migrations        │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                      ▼
┌───────────────┐   ┌─────────────────┐
│    MySQL 8.4  │   │  Redis (cache)   │
│  jobhunter_db │   │   (optional)      │
└───────────────┘   └─────────────────┘
```

---

## Công nghệ sử dụng

| Layer     | Công nghệ                  |
|-----------|----------------------------|
| Frontend  | Next.js 16 + React 19 + TypeScript + TailwindCSS 3 |
| Backend   | Spring Boot 4.0 + Java 21 + Gradle                |
| Database  | MySQL 8.4                                          |
| Cache     | Redis (tùy chọn)                                  |
| Migrations| Flyway                                             |
| ORM       | Spring Data JPA / Hibernate                        |
| Security  | Spring Security + JWT (HS512)                      |
| Docs      | SpringDoc OpenAPI (Swagger UI)                    |
| Container | Docker + Docker Compose                            |
| CI/CD     | GitHub Actions                                     |
| Email     | Spring Mail (SMTP Gmail)                          |
| AI        | OpenAI GPT-4 + Google Gemini                       |

---

## Cấu trúc dự án

```
jobhunter/
├── .github/workflows/          # GitHub Actions CI/CD
│   ├── ci.yml                  # Lint, test, Docker build check
│   └── cd.yml                  # Push Docker images to Docker Hub
├── backend/
│   ├── src/main/java/.../       # Java source
│   │   ├── controller/         # REST controllers (13 file)
│   │   ├── service/            # Business logic (16 file)
│   │   ├── repository/         # JPA repositories
│   │   ├── domain/             # Entities, DTOs, responses
│   │   ├── config/             # Security, CORS, Flyway, etc.
│   │   └── util/               # Helpers, constants, exceptions
│   ├── src/main/resources/
│   │   ├── db/migration/      # Flyway migration scripts
│   │   └── application*.properties  # Spring profiles
│   ├── src/test/               # 17 unit + integration tests
│   ├── Dockerfile
│   ├── build.gradle
│   └── docker/entrypoint.sh
├── frontend/
│   ├── pages/                  # Next.js pages (12 route)
│   ├── components/             # React components (24 file)
│   │   ├── common/            # Shell, Logo, Toast, etc.
│   │   ├── jobs/              # JobCard, Filters, QuickDetail
│   │   ├── management/        # CRUD panels (admin/recruiter)
│   │   └── chat/              # FloatingChatWidget
│   ├── services/              # API client, RBAC helpers
│   ├── contexts/              # AuthContext
│   ├── utils/                # Formatting, permissions
│   ├── types/                # TypeScript models
│   ├── __tests__/             # Jest tests
│   ├── jest.config.ts
│   ├── jest.setup.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml         # Local build (builds images)
├── docker-compose.hub.yml     # Pull images from Docker Hub
├── scripts/                   # Dev ops scripts
├── .env.example               # Template cho .env
└── README.md
```

---

## Yêu cầu hệ thống

- **Java**: 21 (JDK 21 — Temurin / Eclipse Temurin)
- **Node.js**: 22.x
- **Gradle**: 9.x (wrapper có sẵn)
- **MySQL**: 8.4+
- **Docker**: 24.x + Docker Compose v2
- **Git**

---

## Cài đặt Local

### Backend — Java 21 + Gradle

```bash
cd backend

# Cài dependencies và chạy (dev mode với seed data)
./gradlew bootRun

# Hoặc build JAR rồi chạy
./gradlew bootJar
java -jar build/libs/jobhunter-*.jar
```

Backend chạy tại: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

### Frontend — Node.js + Next.js

```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server (port 3000)
npm run dev

# Hoặc dev server turbo (nhanh hơn)
npm run dev:turbo
```

Frontend chạy tại: `http://localhost:3000`

---

## Chạy bằng Docker / Docker Compose

### 1. Local build (build từ source)

```bash
# Copy template và chỉnh sửa biến môi trường
cp .env.example .env

# Build và chạy toàn bộ stack
docker compose up -d

# Xem logs
docker compose logs -f backend
docker compose logs -f frontend
```

**Services sau khi khởi động:**

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:3001    |
| Backend  | http://localhost:8080     |
| MySQL    | localhost:3307 (host)    |
| Swagger  | http://localhost:8080/swagger-ui.html |

### 2. Pull từ Docker Hub

```bash
# Chỉnh sửa DOCKERHUB_USERNAME trong .env
cp .env.hub.example .env
# Sửa DOCKERHUB_USERNAME=nguyenson1710

docker compose -f docker-compose.hub.yml up -d
```

---

## Biến môi trường

| Biến                          | Mặc định                          | Mô tả                                    |
|-------------------------------|------------------------------------|------------------------------------------|
| `DB_URL`                      | `jdbc:mysql://localhost:3306/...` | JDBC connection string                    |
| `DB_USERNAME`                 | `jobhunter`                        | Tên user MySQL                          |
| `DB_PASSWORD`                 | `jobhunter`                        | Mật khẩu MySQL                          |
| `JWT_BASE64_SECRET`           | *(bắt buộc đặt trong prod)*        | Secret key cho JWT (base64 64-byte)      |
| `FLYWAY_ENABLED`              | `true`                             | Bật/tắt Flyway migrations               |
| `SON_JPA_DDL_AUTO`            | `none` (prod) / `update` (dev)    | Hibernate DDL strategy                   |
| `JOBHUNTER_SEED_ENABLED`     | `true`                             | Chạy seed data khi khởi động            |
| `JOBHUNTER_BOOTSTRAP_ADMIN_EMAIL` | `admin@jobhunter.local`       | Email tài khoản bootstrap admin          |
| `JOBHUNTER_BOOTSTRAP_ADMIN_PASSWORD` | `changeme`                  | Mật khẩu bootstrap admin                |
| `JOBHUNTER_BOOTSTRAP_ADMIN_ENABLED` | `true`                       | Bật/tắt bootstrap admin                  |
| `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` | `health,info,prometheus,metrics` | Actuator endpoints         |
| `MAIL_ENABLED`               | `false`                            | Bật gửi email SMTP                      |

> **Lưu ý bảo mật:** Thay đổi `JWT_BASE64_SECRET`, `DB_PASSWORD`, và `JOBHUNTER_BOOTSTRAP_ADMIN_PASSWORD` trước khi deploy production.
> Sau lần đầu chạy thành công, đặt `JOBHUNTER_SEED_ENABLED=false` để tránh seed ghi đè dữ liệu đã tạo thủ công.

---

## Database Migrations (Flyway)

Schema được quản lý bằng **Flyway**. Scripts migration nằm trong:

```
backend/src/main/resources/db/migration/
└── V1__init_schema.sql    # Tạo toàn bộ bảng, index, FK
```

**Quy tắc:**

- Mỗi thay đổi schema → tạo script mới (`V2__*.sql`, `V3__*.sql`, ...)
- **KHÔNG** sửa script đã commit (Flyway checksum sẽ lỗi)
- Dev: `SON_JPA_DDL_AUTO=update` cho phép Hibernate tự sync thêm cột mới sau migration
- Prod: `SON_JPA_DDL_AUTO=none` — Flyway hoàn toàn sở hữu schema

**Chạy migration thủ công:**

```bash
# Sau khi start Docker, backend tự động chạy Flyway
# Kiểm tra trong logs backend:
# Flyway: Successfully applied 1 migration to schema
```

---

## Chạy Tests

### Backend tests

```bash
cd backend

# Chạy tất cả tests (JUnit 5 + Spring Boot Test)
./gradlew test

# Chạy tests kèm coverage
./gradlew test jacocoTestReport

# Báo cáo coverage
open build/reports/jacoco/test/html/index.html
```

### Frontend tests

```bash
cd frontend

# Cài testing dependencies (lần đầu)
npm install

# Chạy tests
npm test

# Chạy tests với coverage
npm run test:coverage
```

Coverage threshold hiện tại: 30% (branches, functions, lines, statements)

---

## Docker — Build và Push lên Docker Hub

**Yêu cầu:** Docker Engine / Docker Desktop đang chạy.

### Cách 1: `docker compose` (image tên cố định)

Tạo image `jobhunter-backend:latest` và `jobhunter-frontend:latest`:

```bash
# Đa nền tảng (Node/npm)
npm run docker:build

# Hoặc trực tiếp
docker compose build backend frontend
```

Đổi tên image (ví dụ chuẩn bị push Hub) — trong `.env` hoặc export trước khi build:

```bash
export BACKEND_IMAGE=yourdockerhub/jobhunter-backend:v1.0.0
export FRONTEND_IMAGE=yourdockerhub/jobhunter-frontend:v1.0.0
docker compose build backend frontend
```

### Cách 2: Script PowerShell (Windows)

```powershell
# Local (không cần Docker Hub username)
.\scripts\docker-build-images.ps1

# Tag theo namespace Docker Hub + version
.\scripts\docker-build-images.ps1 -DockerhubUsername "yourdockerhub" -ImageTag "v1.0.0"
```

Push (sau khi `docker login`):

```powershell
.\scripts\docker-push-images.ps1 -DockerhubUsername "yourdockerhub" -ImageTags @("v1.0.0","latest")
```

### Cách 3: Script Bash (Linux/macOS)

```bash
chmod +x scripts/docker-build-images.sh
./scripts/docker-build-images.sh                    # local tags
./scripts/docker-build-images.sh yourdockerhub v1.0.0
```

### Cách 4: Thủ công từng image

```bash
# Backend (không cần build-arg Next)
docker build -t jobhunter-backend:latest ./backend

# Frontend (build-time env cho browser)
docker build -t jobhunter-frontend:latest ./frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 \
  --build-arg NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8080 \
  --build-arg INTERNAL_API_BASE_URL=http://backend:8080 \
  --build-arg INTERNAL_STORAGE_BASE_URL=http://backend:8080

# Tag + push Docker Hub
docker tag jobhunter-backend:latest yourdockerhub/jobhunter-backend:latest
docker tag jobhunter-frontend:latest yourdockerhub/jobhunter-frontend:latest
docker push yourdockerhub/jobhunter-backend:latest
docker push yourdockerhub/jobhunter-frontend:latest
```

### Tag thêm version rồi push

```bash
VERSION=v1.0.0
docker tag jobhunter-backend:latest yourdockerhub/jobhunter-backend:$VERSION
docker tag jobhunter-frontend:latest yourdockerhub/jobhunter-frontend:$VERSION
docker push yourdockerhub/jobhunter-backend:$VERSION
docker push yourdockerhub/jobhunter-frontend:$VERSION
```

---

## Monitoring / Health Endpoints

Backend expose các actuator endpoint sau (công khai):

| Endpoint                        | Mô tả                          |
|--------------------------------|--------------------------------|
| `GET /actuator/health`         | Health check                  |
| `GET /actuator/info`           | Thông tin ứng dụng             |
| `GET /actuator/prometheus`     | Prometheus metrics (nếu bật)   |
| `GET /actuator/metrics`        | Danh sách metrics              |
| `GET /actuator/metrics/{name}` | Chi tiết metric cụ thể        |

**Bật Prometheus metrics:**

```bash
# Trong .env hoặc biến môi trường
MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED=true
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,prometheus,metrics
```

---

## CI/CD

GitHub Actions workflows tự động chạy:

| Workflow | Trigger                    | Jobs                                      |
|----------|----------------------------|-------------------------------------------|
| `ci.yml` | Push / PR vào `master`    | backend test, frontend lint+build, Docker build check |
| `cd.yml` | Push tag `v*.*.*` vào `master` | Build và push Docker images lên Docker Hub |

**Secrets cần thiết cho CD (GitHub → Settings → Secrets):**

- `DOCKERHUB_USERNAME` — Username Docker Hub
- `DOCKERHUB_PASSWORD` — Password hoặc Access Token Docker Hub

---

## Bảo mật

- **JWT (HS512)**: Token có TTL 15 phút, refresh token 7 ngày
- **RBAC**: Phân quyền theo role + permission key tại tất cả endpoint
- **Seed Admin**: Credentials mặc định được externalize qua env vars; tắt sau lần đầu boot
- **Env vars**: Không bao giờ commit `.env` vào repo — `.gitignore` đã được cấu hình
- **SQL Injection**: An toàn qua JPA / parameterized queries
- **CORS**: Chỉ whitelist các origin được cấu hình trong `CORS_ALLOWED_ORIGINS`

---

## Đóng góp

Dự án này phục vụ mục đích học tập và thực tập cá nhân. Mọi góp ý và đề xuất cải tiến đều được hoan nghênh qua Pull Request.

---

## License

MIT License
