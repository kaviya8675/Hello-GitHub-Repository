@echo off
title AI-Powered Context-Aware Meeting Intelligence
echo =========================================================================
echo  Starting AI-Powered Context-Aware Meeting Intelligence System
echo =========================================================================
echo.
echo 1. Starting Backend REST API with Persistent SQLite Database on http://localhost:8080 ...
start "MeetingIQ Backend API" cmd /k "cd backend && npm.cmd start"

timeout /t 3 > nul

echo 2. Starting Frontend Web Application on http://localhost:5173 ...
start "MeetingIQ Frontend App" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo =========================================================================
echo  Services launched successfully!
echo  Backend API: http://localhost:8080/api
echo  Frontend UI: http://localhost:5173
echo =========================================================================
echo.
echo Browser will now open http://localhost:5173 ...
start http://localhost:5173
pause
