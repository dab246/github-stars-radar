# ★ GitHub Stars Radar

Trang tổng hợp các repository GitHub **nhiều sao nhất trong tuần, tháng, năm**, chia theo danh mục:

- **Xu hướng**: tất cả repo
- **Công cụ AI**: `llm`, `ai`, `generative-ai`, `machine-learning`, `mcp`, `chatgpt`
- **AI Agent**: `ai-agent`, `ai-agents`, `agents`, `agentic-ai`, `multi-agent`, `claude-code`
- **Mobile**: `android`, `ios`, `flutter`, `react-native`, `swiftui`, `jetpack-compose`
- **Web**: `react`, `nextjs`, `vue`, `svelte`, `frontend`, `tailwindcss`, `web`
- **Ngôn ngữ**: TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Swift, Dart, C++, C#, PHP, Ruby, Zig

Bấm **+** để lưu repo vào tab **Đã lưu** (lưu trên trình duyệt).

## Cách hoạt động

- `scripts/fetch.mjs` gọi GitHub Search API, lấy các repo được **tạo** trong 7 / 30 / 365 ngày gần nhất, xếp theo tổng số sao, và ghi ra `site/data/repos.json`.
- `site/` là trang tĩnh (HTML/CSS/JS thuần, không cần build).
- GitHub Actions (`.github/workflows/update.yml`) chạy mỗi 6 giờ: cập nhật dữ liệu, commit, rồi deploy lên GitHub Pages.

## Chạy local

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/fetch.mjs   # Node 18+
python3 -m http.server -d site 8000                    # mở http://localhost:8000
```

Muốn thêm danh mục hoặc ngôn ngữ: sửa `CATEGORIES` / `LANGUAGES` trong `scripts/fetch.mjs`, giao diện tự hiển thị theo dữ liệu.
