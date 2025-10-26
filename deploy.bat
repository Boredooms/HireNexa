@echo off
REM HireNexa Deployment Script for Windows

echo 🚀 Starting HireNexa Deployment...
echo.

REM Check if git is initialized
if not exist .git (
    echo ❌ Git repository not initialized!
    echo Run: git init && git add . && git commit -m "Initial commit"
    pause
    exit /b 1
)

REM Check for uncommitted changes
git status --short > temp.txt
set /p changes=<temp.txt
del temp.txt

if not "%changes%"=="" (
    echo 📝 Found uncommitted changes. Committing...
    git add .
    set /p commit_msg="Enter commit message (or press Enter for default): "
    if "%commit_msg%"=="" set commit_msg=Update: Deploy to Vercel
    git commit -m "%commit_msg%"
) else (
    echo ✅ No uncommitted changes
)

REM Push to repository
echo.
echo 📤 Pushing to repository...
git push origin main
if errorlevel 1 git push origin master

echo.
echo ✅ Deployment initiated!
echo.
echo 📋 Next steps:
echo 1. Go to Vercel Dashboard: https://vercel.com/dashboard
echo 2. Check deployment status
echo 3. Verify environment variables are set
echo 4. Test the deployed app
echo.
echo 📖 For detailed instructions, see VERCEL_DEPLOYMENT.md
echo.
pause
