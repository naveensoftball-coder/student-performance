@echo off
title Student Performance Prediction - SQLite Server
color 0b
echo ===============================================================
echo   STUDENT PERFORMANCE PREDICTION SYSTEM
echo   Powered by SQLite Database: student_performance.db
echo ===============================================================
echo.
echo Starting SQLite Backend API Server on http://127.0.0.1:5000 ...
echo.

REM Open browser after 2 seconds in the background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:5000"

REM Launch Python Flask SQLite Server
python server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Could not start Python server.
    echo Please verify Python is installed and run: python server.py
    pause
)
