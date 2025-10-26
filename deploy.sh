#!/bin/bash

# HireNexa Deployment Script
echo "🚀 Starting HireNexa Deployment..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized!"
    echo "Run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 Found uncommitted changes. Committing..."
    git add .
    read -p "Enter commit message (or press Enter for default): " commit_msg
    commit_msg=${commit_msg:-"Update: Deploy to Vercel"}
    git commit -m "$commit_msg"
else
    echo "✅ No uncommitted changes"
fi

# Push to repository
echo "📤 Pushing to repository..."
git push origin main || git push origin master

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Check deployment status"
echo "3. Verify environment variables are set"
echo "4. Test the deployed app"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT.md"
