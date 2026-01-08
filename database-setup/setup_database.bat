@echo off
ECHO ========================================
ECHO Paddy Collection Center - Database Setup
ECHO ========================================
ECHO.

REM Change to the batch file's directory
cd /d "%~dp0"
ECHO Running from: %CD%
ECHO.

REM Check if .env file exists
IF NOT EXIST .env (
    ECHO ERROR: .env file not found!
    ECHO Please copy .env.example to .env and configure your database credentials.
    PAUSE
    EXIT /B 1
)

ECHO Reading database configuration...
FOR /F "tokens=1,2 delims==" %%A IN (.env) DO (
    IF "%%A"=="DB_HOST" SET DB_HOST=%%B
    IF "%%A"=="DB_PORT" SET DB_PORT=%%B
    IF "%%A"=="DB_USER" SET DB_USER=%%B
    IF "%%A"=="DB_PASSWORD" SET DB_PASSWORD=%%B
    IF "%%A"=="DB_NAME" SET DB_NAME=%%B
)

ECHO.
ECHO Database Configuration:
ECHO - Host: %DB_HOST%
ECHO - Port: %DB_PORT%
ECHO - Database: %DB_NAME%
ECHO - User: %DB_USER%
ECHO.

ECHO Step 1: Creating database...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

IF ERRORLEVEL 1 (
    ECHO ERROR: Failed to create database. Please check your credentials.
    PAUSE
    EXIT /B 1
)

ECHO Database created successfully!
ECHO.

ECHO Step 2: Initializing database with complete schema...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% < "init_database.sql"

IF ERRORLEVEL 1 (
    ECHO ERROR: Database initialization failed.
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO ========================================
ECHO Database setup completed!
ECHO ========================================
ECHO.
ECHO Next steps:
ECHO 1. Launch the Paddy Collection Center application
ECHO 2. Login with default credentials:
ECHO    Username: admin
ECHO    Password: admin123
ECHO 3. Change the admin password immediately!
ECHO.
PAUSE
