# JChatAI Admin Panel

Admin dashboard for JChatAI.space platform.

## Tech Stack

- **Next.js** 15.3.8 (matching jchatai.space)
- **React** 19.0.0
- **Tailwind CSS** 4.x

## Development

```bash
pnpm install
pnpm dev
```

## Deployment

This admin panel deploys from the `admin` branch of the jchatai.space repo.

### 1. Push to Admin Branch

```bash
git init
git remote add origin https://github.com/JoshuaRVLS/jchatai.space.git
git checkout -b admin
git add .
git commit -m "Initial admin panel"
git push -u origin admin
```

### 2. DNS Setup

Add an A record for the subdomain:

| Type | Host | Value |
|------|------|-------|
| A | admin | YOUR_VPS_IP |

### 3. Server Setup

```bash
# Clone admin branch to /root/admin
cd /root
git clone -b admin https://github.com/JoshuaRVLS/jchatai.space.git admin
cd admin
pnpm install && pnpm build

# Start on port 3001
PORT=3001 pm2 start pnpm --name "jchatai-admin" -- start
pm2 save
```

### 4. Nginx + SSL

```bash
# Copy nginx config
sudo cp nginx/admin.jchatai.space.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/admin.jchatai.space.conf /etc/nginx/sites-enabled/

# Get SSL certificate (required for new subdomain)
sudo certbot --nginx -d admin.jchatai.space

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

> **Note:** You need a new SSL cert for `admin.jchatai.space` even though you have one for `jchatai.space` — SSL is per-domain.

### 5. GitHub Actions

The workflow file `.github/workflows/deploy-admin.yml` triggers on push to `admin` branch. Since both workflows are in the same repo:
- `deploy.yml` → triggers on `remake` branch (main site)
- `deploy-admin.yml` → triggers on `admin` branch (admin panel)

## Pages

- `/` - Dashboard
- `/users` - User management
- `/characters` - Character management
- `/conversations` - Conversation logs
- `/lorebooks` - Lorebook management
- `/analytics` - Platform metrics
- `/settings` - System configuration
