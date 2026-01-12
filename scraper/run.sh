#!/bin/bash

# Configuration
# Default concurrency can be high since Go is efficient
CONCURRENCY=20

echo "🚀 Building Go Scraper..."
go build -o scraper main.go

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "Usage Examples:"
echo "  ./scraper --userId <your-id> --search 'fantasy' --limit 50 --concurrency 20"
echo "  ./scraper --userId <your-id> --type character --search 'Genshin' --tags 'Female,SFW'"
echo "  ./scraper --userId <your-id> --id 'lorebooks/12345'"
echo ""

# Optional: Run directly if args provided
if [ "$#" -gt 0 ]; then
    ./scraper "$@"
fi
