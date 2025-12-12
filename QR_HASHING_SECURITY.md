# QR Code Hashing Security Implementation

## Overview

**IMPORTANT LEGAL COMPLIANCE**: QR codes from government-issued subsidy cards are **NEVER** stored directly in the database. Only cryptographic hashes are stored, ensuring compliance with data protection regulations while maintaining verification capability.

## Why Hash QR Codes?

1. **Legal Compliance**: Government-issued codes may be protected by law
2. **Data Protection**: Prevents unauthorized access to sensitive codes
3. **Privacy**: Original codes cannot be recovered from hashes
4. **Verification**: Can still verify if a scanned code matches stored record

## Technical Implementation

### Algorithm: HMAC-SHA256

- **Hash Function**: SHA-256 (256-bit output)
- **Method**: HMAC (Hash-based Message Authentication Code)
- **Key**: Secret key from environment variable
- **Output**: 64-character hexadecimal string

### Security Features

1. **One-way hashing**: Cannot reverse hash to get original QR code
2. **Keyed hashing**: Uses secret key, so same QR code produces different hash with different key
3. **Constant-time comparison**: Prevents timing attacks during verification
4. **256-bit security**: Extremely resistant to brute-force attacks

## Setup

### 1. Generate Secret Key

Generate a cryptographically secure random key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add to Environment

Add the generated key to `/Users/azham/a-job/repo/padi/app/.env`:

```env
QR_HASH_SECRET=45d82f499583dce15dff675ac6fe5ae3e80c5cc5d0497a10a3eefc83ca46726e
```

**⚠️ CRITICAL**: 
- Keep this secret secure
- Never commit to version control
- Minimum 32 characters (64 recommended)
- Changing this key will invalidate all existing hashes

### 3. Backup Strategy

Before changing the secret key, document the old key securely for potential recovery scenarios. Consider:
- Encrypted offline backup
- Secure key management system
- Access control procedures

## How It Works

### Data Flow

```
User enters QR code → Frontend sends raw code to backend → 
Backend hashes with secret key → Only hash stored in database
```

### Verification Flow

```
User scans QR code → Frontend sends raw code to backend →
Backend hashes code → Compares hash with stored hash → Match/No Match
```

### What Gets Stored

| Field | Storage Method | Example |
|-------|---------------|---------|
| Raw QR Code | **NEVER STORED** | ❌ Not in database |
| Hashed QR Code | Stored in `qr_hashcode` | `3f7a8c9d2e1b...` (64 chars) |
| Subsidy Card Image | Stored as file | `farmerId_timestamp.png` |

## Code Structure

### Backend Hash Utility

**File**: `/Users/azham/a-job/repo/padi/app/electron/utils/qrHasher.js`

```javascript
const qrHasher = require('./utils/qrHasher');

// Hash a QR code
const hash = qrHasher.hash(rawQrCode);
// Returns: '3f7a8c9d2e1b4f6a8c9d2e1b4f6a8c9d...' (64 chars)

// Verify a QR code
const isValid = qrHasher.verify(rawQrCode, storedHash);
// Returns: true or false
```

### Automatic Hashing

Hashing happens **automatically** in the backend service:

**File**: `/Users/azham/a-job/repo/padi/app/electron/database/queries/farmerDocuments.js`

All operations automatically hash QR codes:
- `create()` - Hashes before inserting
- `update()` - Hashes before updating
- `findByHashcode()` - Hashes search term before querying

## Usage Examples

### Upload Subsidy Card with QR Code

```javascript
// Frontend sends raw QR code
await window.electronAPI.farmerDocuments.create({
  farmer_id: 123,
  document_type: 'subsidy_card',
  document_name: 'subsidy_card.png',
  file_path: '/path/to/image.png',
  qr_hashcode: 'ABC123XYZ789...' // Raw code from QR scanner
});

// Backend automatically:
// 1. Hashes 'ABC123XYZ789...' → '3f7a8c9d...'
// 2. Stores only the hash
// 3. Original code discarded
```

### Search by QR Code

```javascript
// Frontend sends raw QR code
const result = await window.electronAPI.farmerDocuments.findByHashcode(
  'ABC123XYZ789...' // Raw scanned code
);

// Backend automatically:
// 1. Hashes the search term
// 2. Searches for matching hash
// 3. Returns farmer if found
```

### Update QR Code

```javascript
// Frontend sends new raw QR code
await window.electronAPI.farmerDocuments.update(documentId, {
  document_name: 'subsidy_card.png',
  qr_hashcode: 'NEW_QR_CODE_HERE' // New raw code
});

// Backend automatically:
// 1. Hashes new code
// 2. Updates with hash only
// 3. Original code discarded
```

## Database Schema

### farmer_documents Table

```sql
qr_hashcode VARCHAR(500)  -- Stores 64-char hex hash
INDEX idx_qr_hashcode     -- Fast lookup by hash
```

**Note**: Field is VARCHAR(500) for future algorithm upgrades, but current hashes are exactly 64 characters.

## Security Considerations

### ✅ Protected

- Original QR codes never touch the database
- Hashes use strong cryptography (SHA-256)
- Secret key required to generate valid hashes
- Constant-time comparison prevents timing attacks

### ⚠️ Important Notes

1. **Secret Key Security**
   - Store in `.env` file (gitignored)
   - Never expose in logs or error messages
   - Rotate periodically (with migration plan)

2. **Hash Uniqueness**
   - Same QR code → Same hash (deterministic)
   - Different keys → Different hashes
   - Collision resistance: 2^256 possibilities

3. **Verification Only**
   - Cannot decrypt hash to get original QR code
   - Can only verify: "Does this code match?"
   - Rainbow table attacks prevented by HMAC

## Compliance & Legal

### Data Protection

- **GDPR/PDPA Compliant**: No personal identifiable information stored directly
- **Government Code Protection**: Original codes not stored
- **Audit Trail**: Hash allows verification without exposure
- **Right to Erasure**: Can delete hash without losing verification capability

### Logging Policy

- ✅ Log: "QR code hashed" (without the code)
- ❌ Never log: Raw QR code values
- ✅ Log: Hash comparison results
- ❌ Never log: The secret key

## Migration Notes

If you need to change the secret key:

1. **Cannot rehash existing codes** (original codes not stored)
2. **Options**:
   - Ask users to re-scan QR codes
   - Keep old key for legacy verification
   - Implement dual-key verification period

## Troubleshooting

### "No QR code found" when searching

**Cause**: Secret key might have changed  
**Fix**: Verify `QR_HASH_SECRET` matches key used during storage

### "QR_HASH_SECRET must be set" error

**Cause**: Missing or invalid secret key in `.env`  
**Fix**: Ensure `.env` has valid secret (min 32 characters)

### Hash doesn't match after re-scan

**Cause**: QR scanner returning different format  
**Fix**: Normalize QR code (trim whitespace, standardize encoding)

## Testing

### Verify Hashing Works

```javascript
const qrHasher = require('./electron/utils/qrHasher');

const testCode = 'TEST_QR_CODE_123';
const hash1 = qrHasher.hash(testCode);
const hash2 = qrHasher.hash(testCode);

console.log('Hash 1:', hash1);
console.log('Hash 2:', hash2);
console.log('Hashes match:', hash1 === hash2); // Should be true
console.log('Verification:', qrHasher.verify(testCode, hash1)); // Should be true
console.log('Wrong code:', qrHasher.verify('WRONG', hash1)); // Should be false
```

### Expected Output

```
Hash 1: 3f7a8c9d2e1b4f6a8c9d2e1b4f6a8c9d2e1b4f6a8c9d2e1b4f6a8c9d2e1b4f6a
Hash 2: 3f7a8c9d2e1b4f6a8c9d2e1b4f6a8c9d2e1b4f6a8c9d2e1b4f6a8c9d2e1b4f6a
Hashes match: true
Verification: true
Wrong code: false
```

## Summary

✅ **Legal compliance** - Original codes never stored  
✅ **Strong security** - HMAC-SHA256 with secret key  
✅ **Verification** - Can confirm code matches without storing it  
✅ **Privacy** - One-way hashing, cannot reverse  
✅ **Automatic** - All hashing happens in backend  
✅ **No frontend changes** - Frontend sends raw codes as before  

**The frontend doesn't need to know about hashing - it just works transparently in the backend.**
