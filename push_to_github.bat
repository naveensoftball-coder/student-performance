@echo off
setlocal enabledelayedexpansion
title Push Student Performance to GitHub

echo ========================================================
echo   Student Performance & Prediction - Push to GitHub
echo ========================================================
echo.

:: 1. Check if git is installed
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH.
    echo.
    echo Please install Git for Windows from:
    echo   https://git-scm.com/download/win
    echo.
    echo Or run this in PowerShell / Command Prompt:
    echo   winget install --id Git.Git -e --source winget
    echo.
    pause
    exit /b 1
)

echo [OK] Git is installed.
echo.

:: 2. Prompt for GitHub repository URL
set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/username/repo.git): "
if "%REPO_URL%"=="" (
    echo [ERROR] Repository URL cannot be empty.
    pause
    exit /b 1
)

echo.
echo Initializing Git repository...
if not exist ".git" (
    git init
)

echo.
echo Staging project files...
git add .

echo.
echo Committing changes...
git commit -m "Initial commit: Student Academic Analytics and ML Performance Prediction Portal"

echo.
echo Setting branch to main...
git branch -M main

echo.
echo Configuring remote repository...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo Pushing code to GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   [SUCCESS] Entire project pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo [NOTICE] If the push failed due to authentication, please ensure:
    echo   1. You are logged into GitHub in your browser/Git credential manager.
    echo   2. Or use a GitHub Personal Access Token (PAT) as your password.
)

echo.
pause
