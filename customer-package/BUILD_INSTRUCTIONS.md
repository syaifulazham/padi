# Build Instructions for Customer Installation Package

## Prerequisites

Before building the installation package, ensure you have:
- Node.js 18+ installed
- npm 9+ installed
- All dependencies installed (`npm install` in app folder)

---

## Build Process

### Step 1: Build React Frontend

```bash
cd /Users/azham/a-job/repo/padi/app
npm run build
```

This creates the production build in `app/build/` directory.

### Step 2: Build Electron Installers

#### For Windows (64-bit)
```bash
npm run build:electron -- --win --x64
```

Output: `app/dist/Paddy-Collection-Center-Setup-1.0.0.exe`

#### For macOS (Intel & Apple Silicon)
```bash
npm run build:electron -- --mac --x64 --arm64
```

Output: `app/dist/Paddy-Collection-Center-1.0.0.dmg`

#### For Linux (AppImage)
```bash
npm run build:electron -- --linux
```

Output: `app/dist/Paddy-Collection-Center-1.0.0.AppImage`

#### For All Platforms
```bash
npm run build:electron -- --win --mac --linux
```

---

## Creating Customer Package

### Step 3: Organize Files

Create a customer distribution folder structure:

```
customer-package/
├── Paddy-Collection-Center-Setup.exe    (Windows installer)
├── Paddy-Collection-Center.dmg          (macOS installer - optional)
├── Paddy-Collection-Center.AppImage     (Linux installer - optional)
├── database-setup/
│   ├── migrations/
│   │   ├── create_users_table.sql
│   │   ├── create_paddy_products_system.sql
│   │   ├── add_deduction_config_to_purchases.sql
│   │   ├── update_receipt_number_generation.sql
│   │   ├── create_sales_number_generation.sql
│   │   └── (all other migration files)
│   ├── setup_database.bat               (Windows)
│   ├── setup_database.sh                (macOS/Linux)
│   └── .env.example
├── CUSTOMER_INSTALLATION.md             (Installation guide)
├── RELEASE_NOTES.md                     (What's new)
├── LICENSE.txt
└── README.txt
```

### Step 4: Package Database Setup

```bash
cd /Users/azham/a-job/repo/padi

# Create customer package folder
mkdir -p customer-package/database-setup

# Copy database setup files
cp -r database-setup/* customer-package/database-setup/

# Copy installers
cp app/dist/Paddy-Collection-Center-Setup-*.exe customer-package/ 2>/dev/null || true
cp app/dist/Paddy-Collection-Center-*.dmg customer-package/ 2>/dev/null || true
cp app/dist/Paddy-Collection-Center-*.AppImage customer-package/ 2>/dev/null || true

# Copy documentation
cp CUSTOMER_INSTALLATION.md customer-package/
cp LICENSE customer-package/LICENSE.txt 2>/dev/null || echo "MIT License" > customer-package/LICENSE.txt
```

### Step 5: Create README.txt

Create a simple README.txt for customers:

```txt
PADDY COLLECTION CENTER - INSTALLATION PACKAGE

Thank you for choosing Paddy Collection Center!

QUICK START:
1. Install MySQL 8.0+ (if not already installed)
2. Run database-setup/setup_database.bat (Windows) or .sh (Mac/Linux)
3. Install the application by running the installer
4. Launch and login with username: admin, password: admin123
5. Change the admin password immediately!

For detailed instructions, see CUSTOMER_INSTALLATION.md

SUPPORT:
Email: support@paddycenter.com
Phone: [Your phone number]

VERSION: 1.0.0
BUILD DATE: [Current date]
```

---

## Automated Build Script

Create `build-customer-package.sh`:

```bash
#!/bin/bash

echo "========================================="
echo "Building Customer Installation Package"
echo "========================================="
echo ""

# Set version
VERSION="1.0.0"
BUILD_DATE=$(date +%Y-%m-%d)
PACKAGE_NAME="Paddy-Collection-Center-v${VERSION}"

# Clean previous builds
echo "Step 1: Cleaning previous builds..."
rm -rf customer-package
rm -rf app/dist
rm -rf app/build

# Build React frontend
echo ""
echo "Step 2: Building React frontend..."
cd app
npm run build

if [ $? -ne 0 ]; then
    echo "ERROR: React build failed!"
    exit 1
fi

# Build Electron for Windows
echo ""
echo "Step 3: Building Electron installer for Windows..."
npm run build:electron -- --win --x64

if [ $? -ne 0 ]; then
    echo "WARNING: Windows build may have failed"
fi

# Back to root
cd ..

# Create package structure
echo ""
echo "Step 4: Creating package structure..."
mkdir -p customer-package/database-setup/migrations

# Copy installers
echo "Step 5: Copying installers..."
cp app/dist/*.exe customer-package/ 2>/dev/null || echo "No Windows installer found"
cp app/dist/*.dmg customer-package/ 2>/dev/null || echo "No macOS installer found"
cp app/dist/*.AppImage customer-package/ 2>/dev/null || echo "No Linux installer found"

# Copy database setup
echo "Step 6: Copying database setup..."
cp database-setup/setup_database.bat customer-package/database-setup/
cp database-setup/setup_database.sh customer-package/database-setup/
cp database-setup/.env.example customer-package/database-setup/
cp app/electron/database/migrations/*.sql customer-package/database-setup/migrations/

# Make scripts executable
chmod +x customer-package/database-setup/setup_database.sh

# Copy documentation
echo "Step 7: Copying documentation..."
cp CUSTOMER_INSTALLATION.md customer-package/

# Create README.txt
cat > customer-package/README.txt << EOF
PADDY COLLECTION CENTER - INSTALLATION PACKAGE

Version: ${VERSION}
Build Date: ${BUILD_DATE}

QUICK START:
1. Install MySQL 8.0+ (if not already installed)
2. Configure database-setup/.env file
3. Run database-setup/setup_database.bat (Windows) or .sh (Mac/Linux)
4. Install the application by running the installer
5. Launch and login with username: admin, password: admin123
6. Change the admin password immediately!

For detailed instructions, see CUSTOMER_INSTALLATION.md

SUPPORT:
Email: support@example.com
Phone: [Your phone number]

COPYRIGHT (C) 2026 - All Rights Reserved
EOF

# Create LICENSE.txt if it doesn't exist
if [ ! -f customer-package/LICENSE.txt ]; then
    echo "MIT License" > customer-package/LICENSE.txt
fi

# Create zip archive
echo ""
echo "Step 8: Creating distribution archive..."
cd customer-package
zip -r "../${PACKAGE_NAME}.zip" .
cd ..

echo ""
echo "========================================="
echo "Build Complete!"
echo "========================================="
echo ""
echo "Package created: ${PACKAGE_NAME}.zip"
echo "Package location: $(pwd)/${PACKAGE_NAME}.zip"
echo ""
echo "Contents:"
ls -lh customer-package/
echo ""
echo "Next steps:"
echo "1. Test the installation on a clean system"
echo "2. Distribute ${PACKAGE_NAME}.zip to customer"
echo "3. Provide support contact information"
echo ""
```

Save this as `build-customer-package.sh` and make it executable:

```bash
chmod +x build-customer-package.sh
```

---

## Build Commands Quick Reference

```bash
# Full build for Windows customers
cd /Users/azham/a-job/repo/padi
./build-customer-package.sh

# Or manual build:
cd app
npm run build
npm run build:electron -- --win
cd ..
# Then organize files manually
```

---

## Testing the Package

Before distributing to customers:

1. **Extract the package** on a clean test system
2. **Follow customer installation guide** exactly
3. **Verify all features**:
   - Database setup completes without errors
   - Application installs and launches
   - Login works with default credentials
   - Weighbridge connection (if applicable)
   - Printer configuration
   - Create test transaction
   - Print test receipt
4. **Check logs** for any errors
5. **Test on different OS versions** if possible

---

## Distribution Checklist

- [ ] Version number updated in package.json
- [ ] React frontend built successfully
- [ ] Electron installer created
- [ ] Database migrations copied
- [ ] Documentation included
- [ ] Installation tested on clean system
- [ ] All features verified working
- [ ] Support contact information added
- [ ] License file included
- [ ] Package compressed (.zip)
- [ ] MD5/SHA256 checksum created
- [ ] Release notes prepared

---

## Version Management

Update version in `app/package.json`:

```json
{
  "name": "paddy-collection-center",
  "version": "1.0.0",  // <-- Update this
  "description": "Paddy Harvest Collection Center Management System"
}
```

Use semantic versioning:
- **1.0.0** - Initial release
- **1.0.1** - Bug fixes
- **1.1.0** - New features
- **2.0.0** - Breaking changes

---

## File Size Reference

Typical package sizes:
- Windows installer: ~150-200 MB
- macOS DMG: ~150-200 MB
- Linux AppImage: ~150-200 MB
- Database migrations: <1 MB
- Total package (Windows only): ~200 MB
- Complete package (all platforms): ~600 MB

---

## Troubleshooting Build Issues

### "electron-builder not found"
```bash
cd app
npm install electron-builder --save-dev
```

### "Build fails on macOS"
- May need to install Xcode Command Line Tools
- `xcode-select --install`

### "Windows build on macOS fails"
- Install wine: `brew install wine`
- Or build on Windows system

### "Out of memory during build"
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

**Last Updated:** January 2026
**For Version:** 1.0.0
