@echo off
setlocal
cd /d "%~dp0"
call npm start
if errorlevel 1 goto failed
exit /b 0
:failed
echo Start failed. Run setup.cmd first; see README troubleshooting.
pause
exit /b 1
