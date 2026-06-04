# Career Survival Kit - Project X Vietnam

Prototype hỗ trợ người dùng chuẩn bị hồ sơ ứng tuyển: tải CV lên, chọn định hướng nghề nghiệp, nhận gợi ý cải thiện CV bằng AI và tìm công việc phù hợp với hồ sơ.

## Tính năng chính

- Upload CV dạng PDF/TXT và trích xuất nội dung.
- Chọn nhóm ngành/vị trí mục tiêu theo các track nghề nghiệp.
- Phân tích CV bằng Gemini, trả về thông tin đã cấu trúc và gợi ý cải thiện.
- Tìm việc theo role/CV, tổng hợp kết quả từ mock data, RapidAPI hoặc Apify nếu có API key.
- Đánh giá mức độ phù hợp của từng job với CV bằng AI.

## Công nghệ và API sử dụng

- Frontend: React 19, TypeScript, Vite, React Router, Tailwind CSS, lucide-react, motion.
- Backend: Node.js, Express, tsx, multer, pdf-parse.
- AI: Google Gemini qua `@google/genai`, model đang dùng trong server là `gemini-3.1-flash-lite`.
- Database/service tùy chọn: Supabase client.
- Job APIs tùy chọn: RapidAPI Google Jobs, RapidAPI LinkedIn Jobs, Apify.

## Cách chạy prototype

Yêu cầu: Node.js và npm.

1. Cài dependencies:

   ```bash
   npm install
   ```

2. Tạo file môi trường từ mẫu:

   ```bash
   cp .env.example .env
   ```

   Trên Windows PowerShell có thể dùng:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Điền các biến cần thiết trong `.env`.

   - `GEMINI_API_KEY`: cần cho phân tích CV và đánh giá job bằng AI.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` hoặc `SUPABASE_KEY`: tùy chọn nếu dùng Supabase.
   - `RAPIDAPI_KEY`: tùy chọn, dùng cho Google Jobs/LinkedIn Jobs live.
   - `APIFY_API_TOKEN`: tùy chọn, dùng cho Apify.
   - Nếu thiếu các key job API, app vẫn có thể dùng dữ liệu mock/fallback.

4. Chạy app local:

   ```bash
   npm run dev
   ```

5. Mở trình duyệt tại:

   ```text
   http://localhost:3000
   ```

## Scripts

- `npm run dev`: chạy Express server cùng Vite middleware ở môi trường development.
- `npm run build`: build frontend bằng Vite và bundle backend vào `dist/server.cjs`.
- `npm start`: chạy bản production đã build.
- `npm run preview`: preview frontend bằng Vite.
- `npm run lint`: kiểm tra TypeScript với `tsc --noEmit`.

## Chia công việc thành 4 phần

### Phần 1 - Frontend Upload CV và điều hướng

Phụ trách các màn hình/logic:

- `src/App.tsx`
- `src/components/CVUploader.tsx`
- Luồng điều hướng từ upload CV sang chọn role.
- Kiểm tra định dạng file PDF/TXT và trạng thái upload/lỗi.

Kết quả cần có: người dùng tải CV lên được, file được lưu trong state và chuyển sang bước chọn role.

### Phần 2 - Role Selection

Phụ trách các màn hình/logic:

- `src/pages/RoleSelection.tsx`
- Danh sách career tracks và roles.
- Lưu role đã chọn vào state/localStorage.
- Điều hướng sang CV Workshop sau khi chọn role.

Kết quả cần có: người dùng chọn được role mục tiêu và role đó được dùng ở các bước sau.

### Phần 3 - CV Workshop và AI phân tích CV

Phụ trách các màn hình/logic:

- `src/pages/CVWorkshop.tsx`
- API `POST /api/cv/analyze` trong `server.ts`.
- Xử lý PDF/TXT bằng `multer` và `pdf-parse`.
- Gọi Gemini để trích xuất thông tin CV, tạo gợi ý cải thiện và hiển thị/edit CV data.

Kết quả cần có: CV được phân tích, hiển thị thông tin có cấu trúc và có gợi ý cải thiện theo role.

### Phần 4 - Job Search, Backend API và tích hợp service ngoài

Phụ trách các màn hình/logic:

- `src/components/JobSearch.tsx`
- API `POST /api/jobs/search` trong `server.ts`.
- Tích hợp RapidAPI Google Jobs/LinkedIn Jobs hoặc Apify nếu có key.
- Fallback/mock data khi thiếu API key.
- AI đánh giá `fit_percent` và `fit_reason` cho từng job.
- Quản lý `.env.example`, README và hướng dẫn chạy.

Kết quả cần có: người dùng tìm được danh sách job và thấy đánh giá mức độ phù hợp với CV/role.

## Quy tắc commit và nộp bài

- Mỗi thành viên nên có ít nhất một commit thực chất trong repo.
- Không commit `.env`, API key hoặc thông tin nhạy cảm.
- Nếu cần thêm biến môi trường, chỉ thêm tên biến và mô tả vào `.env.example`.
- Trước khi nộp, nên chạy:

  ```bash
  npm run lint
  npm run build
  ```

## Phân công nhanh

| Phần | Người phụ trách | Phạm vi |
| --- | --- | --- |
| 1 | Nguyễn Kim Hoàng | Upload CV, routing, state CV |
| 2 | Nguyễn Thành Đạt | Role selection, career tracks |
| 3 | Nguyễn Trí Nguyên | CV Workshop, Gemini analyze CV |
| 4 | Đoàn Hải Phong | Job search, external APIs, README/env |
| 5 | Phạm Duy Thái | merg code |
| 6 | Phạm Văn Mạnh | slide thuyết trình |

