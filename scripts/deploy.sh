#!/bin/bash

# Configuration
PROJECT_DIR="/root/admin"
APP_NAME="jchatai-admin"

echo "🚀 Starting admin panel deployment..."

cd $PROJECT_DIR || exit

echo "📥 Syncing with remote..."
git fetch origin admin
git reset --hard origin/admin

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️ Generating Prisma client..."
pnpm prisma generate

echo "🏗️ Building application..."
pnpm build

echo "🔄 Restarting PM2 process..."
pm2 restart $APP_NAME || pm2 start pnpm --name "$APP_NAME" -- start

echo "✅ Admin panel deployment complete!"
