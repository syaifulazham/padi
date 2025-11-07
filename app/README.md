# Paddy Harvest Collection Center - Electron App

Desktop application for managing paddy harvest collection operations.

## 🚀 Tech Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **MySQL2** - Database driver
- **SerialPort** - Weighbridge integration

## 📁 Project Structure

```
app/
├── electron/                 # Electron main process
│   ├── main.js              # Main electron process
│   ├── preload.js           # IPC bridge
│   ├── database/            # Database layer
│   │   ├── connection.js    # MySQL connection pool
│   │   └── queries/         # Database queries
│   │       ├── farmers.js
│   │       └── purchases.js
│   └── hardware/            # Hardware integration
│       └── weighbridge.js   # Serial port weighbridge
├── src/                     # React frontend
│   ├── components/          # React components
│   │   ├── Dashboard/
│   │   ├── Farmers/
│   │   ├── Purchases/
│   │   ├── Sales/
│   │   ├── Inventory/
│   │   ├── Reports/
│   │   ├── Settings/
│   │   └── Layout/
│   ├── styles/             # CSS styles
│   ├── App.jsx             # Main app component
│   └── main.jsx            # React entry point
├── public/                 # Static assets
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── .env.example            # Environment template

## 🛠️ Setup

### Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ running
- Database already set up (from parent ../migrations/)

### Installation

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```
   This runs both React dev server (port 5173) and Electron

### Alternative: Start separately

```bash
# Terminal 1 - React dev server
npm run dev:react

# Terminal 2 - Electron (after React is ready)
npm run dev:electron
```

## 📦 Building

Build for production:

```bash
# Build React app
npm run build

# Package Electron app
npm run build:electron
```

Output will be in `dist/` folder.

## 🔌 Available APIs

The Electron app exposes these APIs via `window.electronAPI`:

### Database
- `testConnection()` - Test DB connection

### Farmers
- `farmers.getAll(filters)` - Get all farmers
- `farmers.getById(id)` - Get farmer by ID
- `farmers.create(data)` - Create farmer
- `farmers.update(id, data)` - Update farmer
- `farmers.delete(id)` - Delete farmer
- `farmers.search(query)` - Search farmers

### Purchases
- `purchases.create(data)` - Create purchase
- `purchases.getAll(filters)` - Get purchases
- `purchases.getById(id)` - Get purchase by ID
- `purchases.getByReceipt(number)` - Get by receipt

### Weighbridge
- `weighbridge.read()` - Read weight
- `weighbridge.connect()` - Connect to weighbridge
- `weighbridge.disconnect()` - Disconnect

## 🖥️ Features

### Implemented
✅ Database connection with MySQL pool  
✅ Farmer management (CRUD)  
✅ Purchase transaction creation  
✅ Weighbridge serial port integration  
✅ Automatic calculation of penalties  
✅ Dashboard with statistics  
✅ Responsive UI with Ant Design  

### Coming Soon
⏳ Sales management  
⏳ Inventory tracking  
⏳ Receipt printing  
⏳ Reports and analytics  
⏳ User authentication  
⏳ Settings management  

## 🔧 Configuration

### Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=paddy_collection_db
DB_USER=azham
DB_PASSWORD=your_password

# Weighbridge
WEIGHBRIDGE_PORT=COM3        # Windows: COM3, Linux: /dev/ttyUSB0
WEIGHBRIDGE_BAUD_RATE=9600

# Printer
DEFAULT_PRINTER="Epson LQ-310"
AUTO_PRINT=true
```

### Weighbridge Setup

The weighbridge service reads weight data from serial port. Make sure:
1. Weighbridge is connected to correct COM port
2. Baud rate matches your device (usually 9600)
3. Driver is installed (Windows may need USB-to-Serial driver)

## 🐛 Troubleshooting

### Database Connection Failed
- Check MySQL is running: `mysql -u azham -p`
- Verify credentials in `.env`
- Test with: `mysql -h localhost -u azham -p paddy_collection_db`

### Weighbridge Not Reading
- Check COM port in Device Manager (Windows) or `ls /dev/tty*` (Linux)
- Verify baud rate setting
- Test connection with terminal app like PuTTY

### Build Errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📝 Development Notes

- React dev server runs on http://localhost:5173
- Hot reload enabled for React components
- Electron needs restart for backend changes
- Database queries are in `electron/database/queries/`
- Add new IPC handlers in `electron/main.js` and `electron/preload.js`

## 🚀 Deployment

### Windows
```bash
npm run build
npm run build:electron
# Output: dist/Paddy Collection Center Setup.exe
```

### macOS
```bash
npm run build
npm run build:electron
# Output: dist/Paddy Collection Center.dmg
```

### Linux
```bash
npm run build
npm run build:electron
# Output: dist/Paddy-Collection-Center.AppImage
```

## 📄 License

MIT

## 👥 Support

For issues or questions, check:
- Database documentation in `../README.md`
- Migration files in `../migrations/`
- Setup scripts in `../scripts/`
