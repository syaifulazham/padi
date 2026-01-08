@echo off
echo ================================================
echo Paddy Collection Center - Emergency Cleanup
echo ================================================
echo.
echo This will remove all traces of old installation
echo.
pause

echo.
echo Step 1: Stopping all processes...
taskkill /F /IM "Paddy Collection Center.exe" 2>nul
taskkill /F /IM "Paddy Collection Center Setup.exe" 2>nul
taskkill /F /IM "electron.exe" 2>nul
taskkill /F /IM "Un_A.exe" 2>nul
timeout /t 3 >nul

echo Step 2: Removing installation folders...
rd /s /q "C:\Program Files\Paddy Collection Center" 2>nul
rd /s /q "C:\Program Files (x86)\Paddy Collection Center" 2>nul
rd /s /q "%LOCALAPPDATA%\Paddy Collection Center" 2>nul
rd /s /q "%LOCALAPPDATA%\Programs\Paddy Collection Center" 2>nul
rd /s /q "%APPDATA%\Paddy Collection Center" 2>nul

echo Step 3: Cleaning temporary files...
del /f /q "%TEMP%\nsis*.*" 2>nul
del /f /q "%TEMP%\*paddy*.*" 2>nul

echo.
echo ================================================
echo Cleanup completed!
echo ================================================
echo.
echo NEXT STEPS:
echo 1. Close this window
echo 2. Restart your computer (IMPORTANT!)
echo 3. Do NOT use the installer
echo 4. Extract "Paddy Collection Center 1.0.0.exe" (portable version)
echo 5. Copy to C:\PaddyCollectionCenter
echo 6. Create .env file (instructions included)
echo 7. Run the portable .exe
echo.
echo No installation needed!
echo.
pause
