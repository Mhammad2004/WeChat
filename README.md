# WeChat 💬

A real-time chat application built with React and Node.js, featuring one-on-one and group messaging, friend requests, and live updates over WebSockets.

> Note: not affiliated with Tencent's WeChat — this is a personal chat-app project built for learning full-stack + real-time development.

## Features

- 🔐 **Authentication** — JWT-based register/login
- 💬 **Real-time messaging** — instant delivery via Socket.io
- 👥 **Friend system** — send, accept, and manage friend requests
- 🚫 **Blocking** — block/unblock other users
- 👨‍👩‍👧‍👦 **Group chats** — create groups, manage members
- 🔍 **User search** — find other users to connect with

## Tech Stack

**Client**
- React 19 + Vite
- Socket.io Client
- Axios

**Server**
- Node.js + Express 5
- Socket.io
- MySQL (via `mysql2`)
- JWT for auth, bcrypt for password hashing

## Project Structure

```
WeChat/
├── client/          # React frontend
│   └── src/
│       ├── components/   # Login, Register, Sidebar, ChatWindow, Message, GroupDetails...
│       └── App.jsx
└── server/          # Express backend
    ├── config/       # Database connection
    ├── middleware/   # Auth middleware
    └── routes/       # auth, users, messages, groups
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- A MySQL database (local or hosted)

### 1. Clone the repo

```bash
git clone https://github.com/Mhammad2004/WeChat.git
cd WeChat
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file in `server/` with:

```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306
JWT_SECRET=your-secret-key
PORT=5000
```

Run the server:

```bash
npm run dev
```

### 3. Set up the client

```bash
cd ../client
npm install
npm run dev
```

The app should now be running at `http://localhost:5173`, connecting to the API at `http://localhost:5000`.

## API Overview

| Route | Description |
|---|---|
| `POST /api/auth/register` | Create a new account |
| `POST /api/auth/login` | Log in and receive a JWT |
| `GET /api/users` | List users |
| `GET /api/users/search` | Search for users |
| `POST /api/users/friend-request/:userId` | Send a friend request |
| `GET /api/messages/:userId` | Get message history with a user |
| `POST /api/groups` | Create a group |
| `GET /api/groups/:groupId` | Get group details |

Real-time events (Socket.io) handle message delivery once a client is authenticated with a JWT over the socket handshake.

## Deployment

This project is set up to deploy for free across three services:

- **Database** — [Aiven](https://aiven.io) (free MySQL)
- **Server** — [Render](https://render.com) (free Node web service)
- **Client** — [Vercel](https://vercel.com) (free static/Vite hosting)

## License

This project is open source and available for learning purposes.
