# Jobhunter

Jobhunter là hệ thống tuyển dụng fullstack gồm cổng công khai, xác thực theo vai trò và khu quản trị.

## Công nghệ sử dụng
- Backend: Spring Boot, Spring Security, JPA, MySQL, Swagger, Thymeleaf.
- Frontend: Next.js, TypeScript, TailwindCSS.
- Hạ tầng chạy cục bộ: Docker Compose.

## Cấu trúc thư mục chính
- `backend`: mã nguồn backend.
- `frontend`: mã nguồn frontend.
- `scripts`: script hỗ trợ vận hành cục bộ.

## Chạy cục bộ từ mã nguồn
1. Backend
```powershell
cd backend
Copy-Item .env.example .env
.\gradlew.bat bootRun
```
2. Frontend
```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

## Chạy bằng Docker Compose (xây dựng image tại máy)
```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

## Chạy bằng image từ Docker Hub
1. Chuẩn bị tệp biến môi trường cho chế độ Docker Hub:
```powershell
Copy-Item .env.hub.example .env.hub
```
2. Cập nhật ít nhất hai biến trong `.env.hub`:
- `DOCKERHUB_USERNAME`
- `IMAGE_TAG`

3. Khởi chạy stack:
```powershell
docker compose --env-file .env.hub -f docker-compose.hub.yml up -d
```

## Chuẩn hóa và đẩy image lên Docker Hub
Không lưu mật khẩu hoặc token Docker Hub trong mã nguồn.

1. Đăng nhập Docker Hub:
```powershell
docker login
```

2. Xây dựng image backend và frontend:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker-build-images.ps1 `
  -DockerhubUsername DOCKERHUB_USERNAME `
  -ImageTag IMAGE_TAG `
  -AlsoTagLatest
```

3. Đẩy image lên Docker Hub:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker-push-images.ps1 `
  -DockerhubUsername DOCKERHUB_USERNAME `
  -ImageTags IMAGE_TAG,latest
```

Tên image chuẩn:
- `DOCKERHUB_USERNAME/jobhunter-backend:IMAGE_TAG`
- `DOCKERHUB_USERNAME/jobhunter-frontend:IMAGE_TAG`

Database dùng image chính thức `mysql:8.4`, không cần đẩy image riêng.

## Biến môi trường quan trọng
- `MYSQL_ROOT_PASSWORD`: bắt buộc để MySQL khởi tạo.
- `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`: tài khoản cơ sở dữ liệu cho ứng dụng.
- `JWT_BASE64_SECRET`: khóa JWT dạng base64.
- `NEXT_PUBLIC_API_BASE_URL`: địa chỉ API cho trình duyệt.
- `INTERNAL_API_BASE_URL`: địa chỉ API nội bộ giữa container.

## Địa chỉ kiểm tra nhanh
- Giao diện frontend: `http://localhost:3001`
- Backend API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`

## Gửi thư và tác vụ định kỳ
- Có thể bật hoặc tắt gửi thư và tác vụ định kỳ bằng các biến `MAIL_*` và `JOBHUNTER_*` trong tệp `.env`.
- Khuyến nghị việc làm theo tuần và dọn log định kỳ chỉ nên bật khi đã cấu hình đầy đủ.

## Dọn file tạm và log cục bộ
```powershell
npm run clean
```

## Lưu ý an toàn
- Không commit các tệp `.env`, `.env.local`, `.env.hub`.
- Không ghi mật khẩu, token hoặc khóa bí mật trong Dockerfile, script và README.
