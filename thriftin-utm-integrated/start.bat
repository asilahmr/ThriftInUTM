@echo off
setlocal enabledelayedexpansion
title Thriftin UTM - Tunnel Setup

echo ====================================
echo Thriftin UTM - Cloudflare Tunnel Setup
echo ====================================
echo.

echo [1/2] Starting Cloudflare Tunnel in new window...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3000"

echo.
echo [2/2] Waiting 10 seconds for tunnel to start...
timeout /t 10 /nobreak >nul

echo.
echo ====================================
echo Please check the Cloudflare Tunnel window
echo Copy the URL (looks like: https://xxx.trycloudflare.com)
echo ====================================
echo.

set /p TUNNEL_URL="Paste the tunnel URL here: "

echo !TUNNEL_URL! | findstr /C:"trycloudflare.com" >nul
if !errorlevel! neq 0 (
    echo.
    echo WARNING: URL doesn't contain 'trycloudflare.com'
    echo Please make sure you copied the correct URL
    pause
)

echo.
echo Updating backend\.env with new URL...

set "ENV_FILE=backend\.env"

if exist "%ENV_FILE%" (
    set "TEMP_FILE=backend\.env.tmp"
    set "FOUND=0"
    
    (
        for /f "usebackq tokens=* delims=" %%a in ("%ENV_FILE%") do (
            set "line=%%a"
            echo !line! | findstr /B "BASE_URL=" >nul
            if !errorlevel! equ 0 (
                echo BASE_URL=!TUNNEL_URL!
                set "FOUND=1"
            ) else (
                echo %%a
            )
        )
        
        if !FOUND! equ 0 echo BASE_URL=!TUNNEL_URL!
    ) > "!TEMP_FILE!"
    
    move /y "!TEMP_FILE!" "%ENV_FILE%" >nul
    echo Successfully updated BASE_URL in .env
) else (
    (
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=admin123
        echo DB_NAME=thriftin_utm
        echo EMAIL_USER=angiewongsiaw@graduate.utm.my
        echo EMAIL_PASS=ojit yekm jlpr jeit
        echo BASE_URL=!TUNNEL_URL!
        echo PORT=3000
    ) > "%ENV_FILE%"
    echo Created new .env file
)

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Tunnel URL: !TUNNEL_URL!
echo.
echo Next steps:
echo 1. Keep the Cloudflare Tunnel window open
echo 2. Open a new command prompt and run:
echo    cd backend
echo    node server.js
echo.
pause

endlocal