# Agriculture App Project Setup Guide

This is a full-stack application with three main components: client (frontend), server (backend), and an AI agent. Below is a comprehensive guide to setting up the development environment.

## Prerequisites

- Node.js (v16+)
- Python 3.8+
- MongoDB

## Project Structure

- `client/`: React frontend application built with Vite, TypeScript and TailwindCSS
- `server/`: Express.js backend API
- `agent/`: Python-based LiveKit assistant agent

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hackathon
```

### 2. Backend Setup (Server)

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create environment file (.env.development.local)
touch .env.development.local
```

Configure your environment variables in `.env.development.local`:

```
PORT=5000
NODE_ENV=development
DB_URI=mongodb://localhost:27017/agriculture-app
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=90d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PLANT_ID_API_KEY=your_plant_id_api_key
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

Start the server:

```bash
npm run dev
```

### 3. Frontend Setup (Client)

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Create environment file (.env.local)
touch .env.local
```

Configure your environment variables in `.env.local`:

```
VITE_SERVER_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

### 4. Agent Setup

```bash
# Navigate to the agent directory
cd agent

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux

# Update pip and install required packages
python -m pip install --upgrade pip
pip install livekit-agents[groq,silero,turn-detector]~=1.0rc
pip install python-dotenv

# Create environment file (.env)
touch .env
```

Configure your environment variables in `.env`:

```
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
GROQ_API_KEY=your_groq_api_key
```

Run the agent:

```bash
python assistant.py download-files
python assistant.py start
```

## Accessing the Application

- Frontend: http://localhost:5173 (default Vite port)
- Backend API: http://localhost:5000
- Agent: Connect using [LiveKit Agents Playground](https://agents-playground.livekit.io/)

## Features

- User authentication
- Chat functionality with AI assistant
- Real-time communication using Socket.io
- LiveKit integration for voice/video
- Plant disease detection
- Multi-language support (English and Arabic)

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- TailwindCSS
- Socket.io Client
- i18next for internationalization

### Backend

- Express.js
- MongoDB (Mongoose)
- Socket.io
- JWT Authentication
- Cloudinary (for image storage)
- LiveKit Server SDK

### Agent

- Python
- LiveKit Agents
- Groq API

## Development Workflow

1. Start the MongoDB service
2. Run the server
3. Run the client
4. Start the agent (if needed)

## Contribution Guidelines

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

## Troubleshooting

- If you encounter CORS issues, make sure your server is properly configured to accept requests from the client origin
- Check MongoDB connection if you experience database-related errors
- For LiveKit issues, verify your API keys and URL are correctly configured
