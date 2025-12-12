@echo off
REM ================================================================
REM Paddy Collection Center - Database Setup Script for Windows
REM ================================================================
REM This script will:
REM 1. Check if MySQL is installed
REM 2. Read configuration from .env file
REM 3. Create the database
REM 4. Run all migration scripts
REM ================================================================

SETLOCAL EnableDelayedExpansion

echo.
echo ================================================================
echo    Paddy Collection Center - Database Setup
echo ================================================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if MySQL is installed
echo [1/5] Checking MySQL installation...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] MySQL is not installed or not in PATH
    echo.
    echo Please install MySQL 8.0 or higher first:
    echo 1. Download from: https://dev.mysql.com/downloads/installer/
    echo 2. Install MySQL with default settings
    echo 3. Remember your root password
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)
echo [OK] MySQL is installed
echo.

REM Check if .env file exists
echo [2/5] Checking configuration file...
if not exist "..\\.env" (
    if not exist ".env" (
        echo.
        echo [ERROR] Configuration file not found
        echo.
        echo Please create .env file:
        echo 1. Copy .env.example to .env
        echo 2. Edit .env with your MySQL password
        echo 3. Run this script again
        echo.
        pause
        exit /b 1
    )
)

REM Try to find .env in parent directory or current directory
if exist "..\\.env" (
    set ENV_FILE="..\\.env"
) else (
    set ENV_FILE=".env"
)

echo [OK] Configuration file found
echo.

REM Read environment variables from .env
echo [3/5] Reading configuration...
for /f "usebackq tokens=1,2 delims==" %%a in (%ENV_FILE%) do (
    set "%%a=%%b"
)

REM Remove any quotes from variables
set DB_NAME=!DB_NAME:"=!
set DB_USER=!DB_USER:"=!
set DB_PASSWORD=!DB_PASSWORD:"=!
set DB_HOST=!DB_HOST:"=!
set DB_PORT=!DB_PORT:"=!

REM Check if required variables are set
if "!DB_NAME!"=="" (
    echo [ERROR] DB_NAME not set in .env file
    pause
    exit /b 1
)
if "!DB_USER!"=="" (
    echo [ERROR] DB_USER not set in .env file
    pause
    exit /b 1
)
if "!DB_PASSWORD!"=="" (
    echo [ERROR] DB_PASSWORD not set in .env file
    pause
    exit /b 1
)

echo [OK] Configuration loaded
echo     Database: !DB_NAME!
echo     User: !DB_USER!
echo     Host: !DB_HOST!:!DB_PORT!
echo.

REM Test MySQL connection
echo [4/5] Testing MySQL connection...
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Cannot connect to MySQL
    echo.
    echo Please check:
    echo 1. MySQL service is running
    echo 2. Username and password are correct in .env file
    echo 3. MySQL is accessible on !DB_HOST!:!DB_PORT!
    echo.
    pause
    exit /b 1
)
echo [OK] MySQL connection successful
echo.

REM Create database
echo [5/5] Setting up database...
echo.
echo Creating database: !DB_NAME!
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! -e "CREATE DATABASE IF NOT EXISTS !DB_NAME! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>error.log
if errorlevel 1 (
    echo [ERROR] Failed to create database
    type error.log
    del error.log
    pause
    exit /b 1
)
echo [OK] Database created or already exists
echo.

REM Check if migrations directory exists
if not exist "..\migrations" (
    if not exist "migrations" (
        echo [WARNING] Migrations directory not found
        echo Database created but no tables added
        echo Please run migration scripts manually
        goto :success
    )
    set MIGRATIONS_DIR=migrations
) else (
    set MIGRATIONS_DIR=..\migrations
)

REM Run migration scripts
echo Running migration scripts...
echo.

set MIGRATION_COUNT=0
for %%f in (%MIGRATIONS_DIR%\*.sql) do (
    set /a MIGRATION_COUNT+=1
    echo [!MIGRATION_COUNT!] Running: %%~nxf
    mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! !DB_NAME! < "%%f" 2>error.log
    if errorlevel 1 (
        echo     [ERROR] Failed to execute %%~nxf
        type error.log
        del error.log
        echo.
        echo [WARNING] Migration failed but continuing...
        echo.
    ) else (
        echo     [OK] Success
    )
)

if exist error.log del error.log

if !MIGRATION_COUNT!==0 (
    echo [INFO] No migration files found
) else (
    echo.
    echo [OK] Processed !MIGRATION_COUNT! migration files
)

:success
echo.
echo ================================================================
echo    Database Setup Complete!
echo ================================================================
echo.
echo Database Name: !DB_NAME!
echo Status: Ready to use
echo.
echo Next Steps:
echo 1. Install the Paddy Collection Center application
echo 2. Launch the application
echo 3. Use these credentials when prompted:
echo    - Host: !DB_HOST!
echo    - Port: !DB_PORT!
echo    - Database: !DB_NAME!
echo    - Username: !DB_USER!
echo    - Password: [your password from .env]
echo.
echo ================================================================
echo.

pause
exit /b 0
