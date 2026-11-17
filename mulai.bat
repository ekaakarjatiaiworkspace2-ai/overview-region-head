@echo off
title EKA Business Management Platform
color 0b
echo ======================================================
echo   MENYALAKAN EKA BUSINESS MANAGEMENT PLATFORM (BSI)
echo ======================================================
echo.

:: Bersihkan proses sisa jika port masih tersangkut
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5173') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8787') do taskkill /f /pid %%a 2>nul

echo [1/2] Menyalakan Backend API Engine (Port 8787)...
start "EKA Backend API (Port 8787)" powershell -NoExit -Command "npm run dev:api"

timeout /t 2 /nobreak >nul

echo [2/2] Menyalakan Frontend Web Dashboard (Port 5173)...
echo.
echo Akses dashboard di: http://localhost:5173
echo.
npm run dev:web
