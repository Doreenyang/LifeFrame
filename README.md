# LifeFrame

This repository contains two distinct parts:

- **frontend/** – the existing React + Vite user interface (formerly named ReMind).
- **server/** – a new Node.js/Express backend written in TypeScript that will power the application via REST APIs.

The goal is to build out the backend first and keep the front end / any future plugins or extensions decoupled from the server logic.

## Getting Started

### Prerequisites

- Node.js 18+ (includes npm)
- Git

### Frontend (UI)

```bash
cd frontend
npm ci
npm run dev      # start development server
npm run build    # create production build
```

Development commands use the `package.json` inside `frontend/`.

### Server (API)

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Install dependencies and start the dev server:

```bash
cd server
npm ci
npm run dev      # starts ts-node-dev on port 4000 by default
```

3. Build for production and run:

```bash
npm run build
npm start
```

The API exposes a basic health check at `GET /` and a sample users router at `GET/POST /api/users`.

## Project Structure

```
/
├─ frontend/          # React/Vite application
│   ├─ src/
│   ├─ package.json
│   └─ ...
├─ server/            # TypeScript/Express API
│   ├─ src/
│   │   ├─ index.ts
│   │   └─ routes/
│   ├─ package.json
│   └─ tsconfig.json
└─ README.md          # you are here
```

## Roadmap

1. Expand backend with authentication, photo storage, reminders, and AI endpoints.
2. Add a database (Postgres, MongoDB, etc.) and ORM (Prisma/TypeORM/Mongoose).
3. Enhance the frontend to consume the API; or wrap it in Electron/Mobile/etc.
4. Publish SDK/CLI/plugin layers for other platforms.

Contributions and suggestions are welcome!

MIT License

