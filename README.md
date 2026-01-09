# JChatAI Admin Panel

Admin dashboard for managing JChatAI.space platform.

## Tech Stack

- **Next.js** 15.3.8 (matching jchatai.space)
- **React** 19.0.0
- **Tailwind CSS** 4.x
- **TypeScript** 5.x

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

This admin panel is deployed from the `admin` branch of the `jchatai.space` repository.

### Push to Admin Branch

```bash
# From this directory, push to the admin branch
git init
git remote add origin https://github.com/JoshuaRVLS/jchatai.space.git
git checkout -b admin
git add .
git commit -m "Initial admin panel"
git push -u origin admin
```

### DNS Setup

Add an A record for `admin.jchatai.space` pointing to your VPS IP:

```
Type: A
Host: admin
Value: YOUR_VPS_IP
TTL: 3600
```

### 2. Server Setup

```bash
# Clone from jchatai.space repo (admin branch)
cd /root
git clone -b admin https://github.com/JoshuaRVLS/jchatai.space.git admin
cd admin

# Install dependencies
pnpm install

# Build
pnpm build

# Start with PM2 on port 3001
PORT=3001 pm2 start pnpm --name "jchatai-admin" -- start
pm2 save
```

### 3. Nginx Setup

```bash
# Copy nginx config
sudo cp nginx/admin.jchatai.space.conf /etc/nginx/sites-available/admin.jchatai.space

# Enable site
sudo ln -s /etc/nginx/sites-available/admin.jchatai.space /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot --nginx -d admin.jchatai.space

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 4. GitHub Actions (Self-Hosted Runner)

The repo uses a self-hosted runner for deployment. Push to `main` triggers auto-deploy.

## Pages

- `/` - Dashboard with stats and activity
- `/users` - User management
- `/characters` - Character management
- `/conversations` - Conversation logs
- `/lorebooks` - Lorebook management
- `/analytics` - Platform metrics
- `/settings` - System configuration
