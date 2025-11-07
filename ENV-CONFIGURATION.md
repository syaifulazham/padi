# Environment Configuration Template

Copy this content to create your `.env` file in your Electron app root directory.

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================

# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=paddy_collection_db
DB_USER=paddy_app
DB_PASSWORD=YourSecurePassword123!

# Connection Pool Settings
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
DB_WAIT_FOR_CONNECTIONS=true
DB_CONNECTION_TIMEOUT=10000

# Application Settings
NODE_ENV=production
APP_PORT=3000
LOG_LEVEL=info

# File Storage
UPLOAD_DIR=./uploads
DOCUMENT_DIR=./documents
BACKUP_DIR=./backups

# Serial Port (Weighbridge)
WEIGHBRIDGE_PORT=COM3
WEIGHBRIDGE_BAUD_RATE=9600

# Print Settings
DEFAULT_PRINTER=Epson LQ-310
AUTO_PRINT=true
```

## 📝 How to Use

1. **Copy** the content above (everything between the triple backticks)
2. **Create** a new file named `.env` in your Electron app root folder
3. **Paste** the content
4. **Modify** the values to match your setup:
   - `DB_PASSWORD` - Set your actual database password
   - `WEIGHBRIDGE_PORT` - Use your actual COM port (Windows) or device path (Linux)
   - `DEFAULT_PRINTER` - Set your printer name
   - Other settings as needed

## 🔒 Security Notes

- ⚠️ **Never commit `.env` file to Git!**
- Add `.env` to your `.gitignore` file
- Keep production passwords secure
- Use different passwords for development and production

## 📋 Quick Reference

### Database Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database server address | `localhost` or `192.168.1.100` |
| `DB_PORT` | MySQL port | `3306` (default) |
| `DB_NAME` | Database name | `paddy_collection_db` |
| `DB_USER` | Database user | `paddy_app` |
| `DB_PASSWORD` | User password | Change this! |

### Connection Pool

| Variable | Description | Recommended |
|----------|-------------|-------------|
| `DB_CONNECTION_LIMIT` | Max connections | `10` |
| `DB_CONNECTION_TIMEOUT` | Timeout (ms) | `10000` |

### Serial Port (Weighbridge)

| Variable | Description | Example |
|----------|-------------|---------|
| `WEIGHBRIDGE_PORT` | COM port or device | Windows: `COM3`, Linux: `/dev/ttyUSB0` |
| `WEIGHBRIDGE_BAUD_RATE` | Baud rate | `9600` (common) |

## 🔍 Troubleshooting

### Cannot connect to database

Check:
- Is MySQL running?
- Is `DB_HOST` correct?
- Is `DB_USER` and `DB_PASSWORD` correct?
- Does the user have access to the database?

### Serial port errors

Check:
- Is the correct COM port specified?
- Is the device connected?
- Is the baud rate correct?
- On Linux, check permissions: `sudo chmod 666 /dev/ttyUSB0`

### File path errors

- Use forward slashes `/` or double backslashes `\\` on Windows
- Use relative paths from your app root
- Ensure directories exist or create them in your app

## 📦 For Different Environments

### Development (.env.development)
```env
NODE_ENV=development
DB_HOST=localhost
DB_NAME=paddy_collection_db_dev
LOG_LEVEL=debug
```

### Production (.env.production)
```env
NODE_ENV=production
DB_HOST=192.168.1.100
DB_NAME=paddy_collection_db
LOG_LEVEL=info
```

### Testing (.env.test)
```env
NODE_ENV=test
DB_HOST=localhost
DB_NAME=paddy_collection_db_test
LOG_LEVEL=error
```

## ✅ Verification

Test your configuration with this Node.js script:

```javascript
require('dotenv').config();

console.log('Environment Configuration:');
console.log('=========================');
console.log('Database Host:', process.env.DB_HOST);
console.log('Database Name:', process.env.DB_NAME);
console.log('Database User:', process.env.DB_USER);
console.log('Serial Port:', process.env.WEIGHBRIDGE_PORT);
console.log('Node Environment:', process.env.NODE_ENV);
```

Save as `test-env.js` and run: `node test-env.js`

---

**Important:** Always use environment variables for sensitive data. Never hardcode passwords in your source code!
