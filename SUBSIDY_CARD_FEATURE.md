# Subsidy Card Image & QR Hashcode Feature

## Overview
This feature allows storing subsidy card images for farmers along with their QR code hashcodes (200+ character strings) in the database.

## Database Schema

### Table: `farmer_documents`
Extended to support subsidy card images with QR hashcodes.

**New/Modified Columns:**
- `qr_hashcode` VARCHAR(500) - Stores the QR code hashcode from subsidy card
- `document_type` ENUM - Added 'subsidy_card' as a new document type

**Index:**
- `idx_qr_hashcode` - For quick lookups by QR hashcode

## Implementation Details

### 1. Database Layer
**File:** `/migrations/013_add_subsidy_card_support.sql`
- Adds `qr_hashcode` column to `farmer_documents` table
- Extends `document_type` enum to include 'subsidy_card'
- Creates index on qr_hashcode for fast searches

### 2. Backend Service
**File:** `/app/electron/database/queries/farmerDocuments.js`

**Key Functions:**
- `getByFarmerId(farmerId)` - Get all documents for a farmer
- `getSubsidyCard(farmerId)` - Get subsidy card for specific farmer
- `findByHashcode(hashcode)` - Search farmer by QR hashcode
- `create(documentData)` - Upload new document
- `update(documentId, data)` - Update QR hashcode
- `delete(documentId)` - Delete document and file

### 3. Electron IPC Handlers
**File:** `/app/electron/main.js`

**Handlers Added:**
- `farmerDocuments:getByFarmerId`
- `farmerDocuments:getSubsidyCard`
- `farmerDocuments:findByHashcode`
- `farmerDocuments:create`
- `farmerDocuments:update`
- `farmerDocuments:delete`
- `farmerDocuments:uploadImage` - Handles image file upload
- `farmerDocuments:getImage` - Retrieves image as base64

**Image Storage:**
Images are stored in: `{userData}/uploads/subsidy_cards/`
Filename format: `{farmerId}_{timestamp}.png`

### 4. Frontend Components

#### SubsidyCardUpload Component
**File:** `/app/src/components/Farmers/SubsidyCardUpload.jsx`

**Features:**
- Upload subsidy card image (any image format)
- Preview uploaded image
- Enter/update QR hashcode (up to 500 characters)
- Delete subsidy card
- Shows upload date and hashcode preview

**Props:**
- `farmerId` - ID of the farmer (required)
- `onUploadSuccess` - Callback after successful upload

#### Integration in AddFarmerModal
**File:** `/app/src/components/Farmers/AddFarmerModal.jsx`

**Changes:**
- Added Tabs component for better organization
- Two tabs: "Farmer Details" and "Subsidy Card"
- Subsidy Card tab shows SubsidyCardUpload component
- Note: Farmer must be saved before uploading subsidy card

## Usage

### 1. Upload Subsidy Card
1. Create/Edit a farmer
2. Click "Subsidy Card" tab
3. Optionally enter QR hashcode first
4. Click "Upload Subsidy Card Image"
5. Select image file

### 2. Update QR Hashcode
1. Open farmer in edit mode
2. Go to "Subsidy Card" tab
3. Enter/modify QR hashcode in input field
4. Click "Update QR Hashcode"

### 3. Search by QR Hashcode
```javascript
const result = await window.electronAPI.farmerDocuments.findByHashcode(hashcode);
if (result.success) {
  console.log('Farmer found:', result.data);
  // result.data contains farmer info and document details
}
```

### 4. Get Subsidy Card for Farmer
```javascript
const result = await window.electronAPI.farmerDocuments.getSubsidyCard(farmerId);
if (result.success) {
  console.log('Subsidy card:', result.data);
  // Contains file_path, qr_hashcode, upload_date, etc.
}
```

## API Reference

### Backend Service (farmerDocuments.js)

```javascript
// Get all documents for a farmer
farmerDocuments.getByFarmerId(farmerId)
// Returns: { success: true, data: [documents] }

// Get subsidy card only
farmerDocuments.getSubsidyCard(farmerId)
// Returns: { success: true, data: document } or { success: false, error: string }

// Find farmer by QR hashcode
farmerDocuments.findByHashcode(hashcode)
// Returns: { success: true, data: { farmer info + document info } }

// Create document
farmerDocuments.create({
  farmer_id: number,
  document_type: 'subsidy_card',
  document_name: string,
  file_path: string,
  file_size: number,
  qr_hashcode: string (optional),
  notes: string (optional)
})

// Update document
farmerDocuments.update(documentId, {
  document_name: string,
  qr_hashcode: string,
  notes: string
})

// Delete document
farmerDocuments.delete(documentId)
```

### Frontend API (window.electronAPI)

```javascript
// Upload image
await window.electronAPI.farmerDocuments.uploadImage(farmerId, base64ImageData)
// Returns: { success: true, data: { filePath, fileName, fileSize } }

// Get image as base64
await window.electronAPI.farmerDocuments.getImage(filePath)
// Returns: { success: true, data: 'data:image/png;base64,...' }

// All other methods same as backend
await window.electronAPI.farmerDocuments.getByFarmerId(farmerId)
await window.electronAPI.farmerDocuments.getSubsidyCard(farmerId)
await window.electronAPI.farmerDocuments.findByHashcode(hashcode)
await window.electronAPI.farmerDocuments.create(data)
await window.electronAPI.farmerDocuments.update(id, data)
await window.electronAPI.farmerDocuments.delete(id)
```

## Database Migration

**Migration File:** `/migrations/013_add_subsidy_card_support.sql`

**To Run:**
```bash
mysql -uazham -pDBAzham231 paddy_collection_db < migrations/013_add_subsidy_card_support.sql
```

**Status:** ✅ Already executed

## Security Considerations

1. **File Storage:** Images stored in app's userData directory (secure, user-specific)
2. **Path Validation:** No user-provided paths accepted, all generated server-side
3. **QR Hashcode:** Indexed for fast lookups, up to 500 characters
4. **Cascade Delete:** Documents automatically deleted when farmer is deleted

## Future Enhancements

Potential improvements:
1. QR code scanner integration to auto-extract hashcode from image
2. Image compression to reduce storage
3. Multiple subsidy card versions (history)
4. Bulk QR code verification
5. Export subsidy cards for printing

## Notes

- Only one active subsidy card per farmer (latest one shown)
- Previous subsidy cards can be kept by not deleting them
- QR hashcode is optional but recommended for verification
- Supported image formats: PNG, JPG, JPEG, WebP, etc.
- Maximum hashcode length: 500 characters
