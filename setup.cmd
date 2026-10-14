@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
node scripts/setup.mjs
if errorlevel 1 goto failed
call npm run register
if errorlevel 1 goto failed
echo Ready. Run start.cmd / Hazir. start.cmd calistirin.
pause
exit /b 0
:missing
echo Install Node.js 24 LTS from https://nodejs.org then reopen this file.
:failed
echo Setup stopped. Read the README troubleshooting section.
pause
exit /b 1
