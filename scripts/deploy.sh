#!/bin/bash

# Configuration
PROJECT_DIR="/root/web" # Updated to match deploy.yml
APP_NAME="jchatai" # The name of your PM2 process

echo "🚀 Starting deployment..."

cd $PROJECT_DIR || exit

echo "📥 Pulling latest changes..."
git pull origin remake

echo "📦 Installing dependencies..."
pnpm install

echo "🏗️ Building application..."
pnpm build

echo "🔄 Restarting PM2 process..."
pm2 restart $APP_NAME || pm2 start pnpm --name "$APP_NAME" -- start

echo "✅ Deployment complete!"
