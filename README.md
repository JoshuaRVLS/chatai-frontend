# JChatAI Admin Panel

The comprehensive administrative dashboard for the [JChatAI.space](https://jchatai.space) platform, enabling full control over users, content, and system settings.

## Features

- **Dashboard**: Real-time overview of platform statistics (users, characters, chats).
- **User Management**:
  - View all registered users.
  - Quick actions: Verified status toggle, Ban/Unban, Whitelist.
  - Detailed user profiles.
- **Character Management**:
  - Browse and search all created characters.
  - **Deep Inspection Details Modal**: View advanced metadata including system IDs, author info, prompt definitions (Persona, Scenario), linked lorebooks, and statistics.
  - One-click deletion or "View on Site".
- **Access Control**:
  - **Maintenance Mode**: Lock down the site for non-admins.
  - **Whitelist Mode**: Restrict access to a specific list of approved users.
- **Lorebook & Conversation Management**: Monitor and moderate content.

## Tech Stack

- **Framework**: Next.js 15.3.8 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Data**: Prisma ORM (Shared database with main app)

## Pages

- `/` - **Dashboard**: Key metrics and activity overview.
- `/users` - **Users**: Manage accounts, bans, and permissions.
- `/characters` - **Characters**: Moderate AI characters and view detailed prompts.
- `/conversations` - **Logs**: Review chat logs for moderation.
- `/settings` - **System Settings**: Toggle Maintenance/Whitelist modes and configure global options.

## Deployment

This admin panel shares the same repository as the main application but resides in the `admin` branch. It is deployed as a separate standalone Next.js application, typically on a subdomain (e.g., `admin.jchatai.space`).

### Standard Deployment Steps

1.  **Push to Admin Branch**:
    ```bash
    git checkout -b admin
    git push origin admin
    ```

2.  **Server Setup**:
    Clone the `admin` branch into a separate directory on your server.
    ```bash
    git clone -b admin https://github.com/JoshuaRVLS/jchatai.space.git admin-panel
    cd admin-panel
    pnpm install && pnpm build
    ```

3.  **Run with PM2**:
    ```bash
    PORT=3001 pm2 start pnpm --name "jchatai-admin" -- start
    ```

## API Routes

### System & Analytics
- `GET /api/stats` - Dashboard overview statistics (users, nsfw/sfw counts)
- `GET /api/analytics` - Detailed platform metrics
- `GET /api/settings` - Get system configuration
- `POST /api/settings` - Update settings (Maintenance/Whitelist mode)

### Content Management
- `GET /api/characters` - List all characters (paginated)
- `GET /api/characters/[id]` - Get full character details (prompts, author, etc.)
- `DELETE /api/characters/[id]` - Delete a character
- `GET /api/users` - List all users
- `POST /api/users/[id]` - Moderate user (Ban/Unban/Verify)
- `GET /api/conversations` - View chat logs
- `GET /api/lorebooks` - Manage lorebooks

