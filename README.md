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


## API Routes

### Authentication & Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/validate` - Validate user credentials
- `POST /api/send-verification` - Send email verification
- `GET /api/verify-email` - Verify email token
- `GET /api/users/[userId]` - Get user profile
- `GET /api/users/picture/[userId]` - Get user avatar

### Characters & AI
- `GET /api/characters` - List characters (with filtering/sorting)
- `GET /api/characters/[id]` - Get character details
- `POST /api/characters` - Create a new character
- `POST /api/import/chub` - Import character/lorebook from Chub.ai
- `POST /api/ai` - Generate AI response
- `GET /api/suggestions` - Get chat suggestions

### Chat & Messaging
- `GET /api/chats` - List user chats
- `GET /api/chats/[id]` - Get chat history
- `POST /api/messages` - Send a message
- `POST /api/messages/regenerate` - Regenerate last AI response

### Lorebooks
- `GET /api/lorebooks` - List lorebooks
- `POST /api/lorebooks` - Create lorebook
- `GET /api/lorebooks/[id]` - Get lorebook details

