@echo off
echo Starting DiscoveryIntel...
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

if not exist "backend\.env" (
    echo Backend .env file not found.
    echo Please copy backend\.env.example to backend\.env and configure it.
    exit /b 1
)

if not exist "frontend\.env.local" (
    echo Frontend .env.local file not found.
    echo Please copy frontend\.env.example to frontend\.env.local and configure it.
    exit /b 1
)

echo Installing dependencies...
if not exist "node_modules" (
    call npm install
)

if not exist "shared\node_modules" (
    cd shared && call npm install && cd ..
)

if not exist "backend\node_modules" (
    cd backend && call npm install && cd ..
)

if not exist "frontend\node_modules" (
    cd frontend && call npm install && cd ..
)

echo Building shared types...
cd shared && call npm run build && cd ..

echo.
echo Setup complete!
echo.
echo Starting services...
echo   - Backend will run on http://localhost:3001
echo   - Frontend will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop all services
echo.

call npm run dev
