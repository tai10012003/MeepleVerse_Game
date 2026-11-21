# MeepleVerse_Game

Monorepo TypeScript: user web (3000), API (5000), admin portal (9000).

```powershell
npm run dev        # user + API + admin
npm run dev:user   # localhost:3000
npm run dev:api    # localhost:5000
npm run dev:admin  # localhost:9000
```

Xem [hướng dẫn chạy local](docs/development/local-setup.md).

Kiến trúc backend: Modular Layered Architecture. Đã có hai phiên bản UNO với luật authoritative và phòng realtime.

UNO basic v1: domain engine, public/private views, and tests. See [rules](docs/games/uno.md).
Run tests: npm run test

Colyseus UNO realtime: [protocol and local tests](docs/development/realtime-uno.md).

User lobby: [local setup and browser tests](docs/development/user-lobby.md).

Playable UNO table: [how to play and browser tests](docs/development/uno-table.md).

UNO effects: [animation behavior and tests](docs/development/uno-animations.md).

Sảnh MeepleVerse và hai phiên bản UNO: [giao diện danh mục game](docs/development/game-catalog.md).

UNO Mở rộng đã mở chơi thử tại `/games/uno-expanded`, cùng API thông thường. Xem [luồng chơi thử và kiểm tra bước 12](docs/development/uno-expanded-beta.md).
