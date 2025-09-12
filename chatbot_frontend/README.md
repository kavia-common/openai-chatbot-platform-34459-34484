# KAVIA Q&A Chatbot Frontend (React)

A lightweight React UI for a simple Q&A chatbot, connecting to a Django REST backend.

## Features
- Modern chat layout with sidebar sessions, message bubbles, typing indicator
- Session management (create, select, delete), persisted active session
- Connects to backend REST API for health, sessions, messages, and chat
- Light/Dark theme toggle with persistence
- Loading and error states with optimistic UI for sending messages

## Quick Start

Install dependencies:
- npm install

Run with development proxy (expects backend on localhost:3001):
- npm start

Alternatively, explicitly specify backend URL (recommended for preview environments):
- npm run start:backend   # uses http://localhost:3001/api
- npm run start:preview   # uses https://vscode-internal-37494-beta.beta01.cloud.kavia.ai:3001/api

Build for production:
- npm run build
or
- npm run build:backend

## Fixing "Invalid Host header" in development

When accessing the app via IP, a tunnel, or a preview domain, Create React App's dev server may show:
"Invalid Host header".

To allow your host in development:
1) Create (already added by default) `.env.development.local` with:
   HOST=0.0.0.0
   DANGEROUSLY_DISABLE_HOST_CHECK=true

This binds the dev server to all interfaces and disables the host check only in development.
Do NOT use this in production.

If you prefer a stricter setup, set HOST to your known domain:
   HOST=your-preview-domain.example.com

You can also set PUBLIC_URL in development if your preview requires a specific base path:
   PUBLIC_URL=/

## Backend URL Configuration

This app discovers the backend API base URL in the following order:
1. window.ENV.REACT_APP_BACKEND_URL (runtime-injected)
2. process.env.REACT_APP_BACKEND_URL (build-time)
3. Defaults to /api (use a reverse proxy or CRA proxy)

Development proxy is set to http://localhost:8000, so API calls like /api/chat/ will be proxied to the backend during npm start.

To point to a custom backend:
- Use environment variable at start:
  REACT_APP_BACKEND_URL="https://your-backend.example.com/api" npm start
- Or inject at runtime by defining window.ENV in index.html before bundle:
  <script>window.ENV = { REACT_APP_BACKEND_URL: "https://your-backend.example.com/api" };</script>

## Scripts
- npm start: Start dev server with CRA proxy
- npm run start:backend: Start dev server pointing to http://localhost:8000/api
- npm test: Run tests
- npm run build: Create production build
- npm run build:backend: Create build using /api base path

## Notes
- The UI expects the backend to implement endpoints described by the provided OpenAPI (chat, sessions, messages, health).
- No binary assets or additional libraries are required.
