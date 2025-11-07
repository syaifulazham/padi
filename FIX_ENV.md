# Quick Fix for .env Error

## The Problem
Your `.env` file has an unquoted value that bash interprets as a command:
```
DEFAULT_PRINTER=Epson LQ-310  ❌ BAD
```

The space and hyphen cause bash to try executing `LQ-310` as a command.

## The Fix

Open your `.env` file and change line 33 from:
```bash
DEFAULT_PRINTER=Epson LQ-310
```

To (with quotes):
```bash
DEFAULT_PRINTER="Epson LQ-310"
```

## Quick Command

Run this to fix it automatically:
```bash
cd /Users/azham/a-job/repo/padi
sed -i '' 's/DEFAULT_PRINTER=Epson LQ-310/DEFAULT_PRINTER="Epson LQ-310"/' .env
```

## Then Run Setup

After fixing, run the setup:
```bash
cd scripts
./setup_database.sh
```

The script will:
1. ✅ Create the database `paddy_collection_db`
2. ✅ Run all 10 migrations
3. ✅ Load sample data
4. ✅ Verify installation

## What Changed in the Script

The setup script now:
- ✅ Uses your `DB_USER` (azham) instead of root
- ✅ Creates database with `CREATE DATABASE IF NOT EXISTS`
- ✅ Better error handling for .env loading
- ✅ Clearer error messages

You're all set! 🚀
