@echo off
REM ============================================
REM Paddy Collection Center - Manual Cleanup
REM ============================================
REM Use this if normal uninstall fails
REM Run as Administrator

echo ============================================
echo Paddy Collection Center - Manual Cleanup
echo ============================================
echo.
echo This will forcefully remove:
echo - All installation files
echo - Registry entries
echo - User data
echo - Application processes
echo.
echo WARNING: This cannot be undone!
echo.
pause

echo.
echo [1/5] Stopping running processes...
taskkill /F /IM "Paddy Collection Center.exe" >nul 2>&1
timeout /t 2 >nul

echo [2/5] Removing installation directories...

REM Remove from Program Files
if exist "C:\Program Files\Paddy Collection Center" (
    echo Removing: C:\Program Files\Paddy Collection Center
    rmdir /S /Q "C:\Program Files\Paddy Collection Center"
)

if exist "C:\Program Files (x86)\Paddy Collection Center" (
    echo Removing: C:\Program Files (x86)\Paddy Collection Center
    rmdir /S /Q "C:\Program Files (x86)\Paddy Collection Center"
)

REM Remove from Local AppData
if exist "%LOCALAPPDATA%\Programs\Paddy Collection Center" (
    echo Removing: %LOCALAPPDATA%\Programs\Paddy Collection Center
    rmdir /S /Q "%LOCALAPPDATA%\Programs\Paddy Collection Center"
)

echo [3/5] Removing user data...

REM Remove AppData
if exist "%APPDATA%\Paddy Collection Center" (
    echo Removing: %APPDATA%\Paddy Collection Center
    rmdir /S /Q "%APPDATA%\Paddy Collection Center"
)

if exist "%APPDATA%\paddy-collection-center" (
    echo Removing: %APPDATA%\paddy-collection-center
    rmdir /S /Q "%APPDATA%\paddy-collection-center"
)

if exist "%LOCALAPPDATA%\Paddy Collection Center" (
    echo Removing: %LOCALAPPDATA%\Paddy Collection Center
    rmdir /S /Q "%LOCALAPPDATA%\Paddy Collection Center"
)

if exist "%LOCALAPPDATA%\paddy-collection-center-updater" (
    echo Removing: %LOCALAPPDATA%\paddy-collection-center-updater
    rmdir /S /Q "%LOCALAPPDATA%\paddy-collection-center-updater"
)

echo [4/5] Cleaning Start Menu shortcuts...

REM Remove Start Menu shortcuts
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Paddy Collection Center.lnk" (
    del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Paddy Collection Center.lnk"
)

if exist "%ProgramData%\Microsoft\Windows\Start Menu\Programs\Paddy Collection Center.lnk" (
    del /F /Q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\Paddy Collection Center.lnk"
)

echo [5/5] Cleaning registry entries...

REM Remove registry entries
reg delete "HKCU\Software\Paddy Collection Center" /f >nul 2>&1
reg delete "HKLM\Software\Paddy Collection Center" /f >nul 2>&1
reg delete "HKLM\Software\WOW6432Node\Paddy Collection Center" /f >nul 2>&1

REM Remove uninstaller registry entries
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Paddy Collection Center" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\Paddy Collection Center" /f >nul 2>&1
reg delete "HKLM\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Paddy Collection Center" /f >nul 2>&1

echo.
echo ============================================
echo Cleanup Complete!
echo ============================================
echo.
echo All files and registry entries have been removed.
echo You can now install a fresh copy of the application.
echo.
pause
