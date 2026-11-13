# MeepleVerse_Game

Monorepo TypeScript: user web (3000), API (5000), admin portal (9000).

Xem [hướng dẫn chạy local](docs/development/local-setup.md).

Kiến trúc backend: Modular Layered Architecture. Hiện chỉ triển khai nền kỹ thuật và health check.

UNO basic v1: domain engine, public/private views, and tests. See [rules](docs/games/uno.md).
Run tests: npx.cmd --yes pnpm@10.34.9 test

Colyseus UNO realtime: [protocol and local tests](docs/development/realtime-uno.md).
