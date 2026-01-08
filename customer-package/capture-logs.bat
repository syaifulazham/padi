@echo off
echo ============================================
echo Paddy Collection Center - Log Capture Tool
echo ============================================
echo.
echo This will start the application and save all
echo error messages to a file called "app-log.txt"
echo.
echo Press any key to start...
pause > nul

echo.
echo Starting application with logging enabled...
echo Log file will be created at: %~dp0app-log.txt
echo.

cd /d "%~dp0"
start "" "Paddy Collection Center.exe" > app-log.txt 2>&1

echo.
echo Application started!
echo.
echo When you see the blank screen or error:
echo 1. Close the application
echo 2. Find app-log.txt in this folder
echo 3. Send app-log.txt to support
echo.
echo Press any key to exit...
pause > nul
