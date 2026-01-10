# JChatAI.space

A modern, full-stack AI roleplay chat platform built with Next.js, allowing users to create, share, and chat with AI characters using varied personas and scenarios.

## Features

- **Real-time AI Chat**: Seamless streaming chat experience with AI characters.
- **Multi-Model Support**: Integration with OpenRouter to support various LLMs (Claude, GPT, Llama, etc.).
- **Character Creation**: Detailed character editor with support for:
  - Names, Tags, and Avatars
  - Personas and Scenarios
  - First Messages and Example Dialogues
  - **Lorebooks**: Create and link extensive lorebooks to characters for deeper context.
- **Authentication**: Secure user authentication (Login/Register) with email verification.
- **Community Feed**: Discover new characters and lorebooks created by the community.
- **Responsive Design**: Mobile-first UI tailored for all devices.
- **Chat History**: Persistent chat history using Prisma ORM.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma ORM)
- **AI Provider**: OpenRouter API
- **State Management**: React Hooks & Context

## Development Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/JoshuaRVLS/jchatai.space.git
    cd jchatai.space
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add the necessary variables (DATABASE_URL, OPENROUTER_API_KEY, AUTH_SECRET, etc.).

4.  **Run the development server**:
    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is configured for deployment on VPS using PM2 and Nginx. The production build serves the application on a specified port, proxied via Nginx with SSL enabled.
