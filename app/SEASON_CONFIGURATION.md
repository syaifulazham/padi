# Season Configuration Feature

## Overview
Complete season configuration management system that allows administrators to configure:
- **Season details** (year, number, name, code)
- **Opening price** per kg
- **Deduction rates** (stored as JSON for different quality issues)
- **Operating mode** (LIVE for production, DEMO for training)

## Features Implemented

### 1. Database Schema Enhancement

**Migration:** `/migrations/008_add_season_config_fields.sql`

**Added Columns to `harvesting_seasons` table:**
```sql
- year INT UNSIGNED                      -- Season year (e.g., 2024)
- season_number INT UNSIGNED             -- Season sequence (e.g., 1, 2)
- opening_price_per_kg DECIMAL(10,2)    -- Base price per kg
- deduction_config JSON                  -- Deduction rates configuration
- mode ENUM('LIVE', 'DEMO')              -- Operating mode
```

**Index Added:**
```sql
CREATE INDEX idx_mode ON harvesting_seasons(mode);
```

### 2. Deduction Configuration Structure

**JSON Format:**
```json
[
  {
    "type": "Wap Basah",
    "percentage_5": 0.05,
    "percentage_10": 0.10,
    "percentage_15": 0.15
  },
  {
    "type": "Hampa",
    "percentage_5": 0.03,
    "percentage_10": 0.06,
    "percentage_15": 0.09
  },
  {
    "type": "Rusak",
    "percentage_5": 0.04,
    "percentage_10": 0.08,
    "percentage_15": 0.12
  },
  {
    "type": "Kapur",
    "percentage_5": 0.02,
    "percentage_10": 0.04,
    "percentage_15": 0.06
  }
]
```

**Default Deduction Types:**
1. **Wap Basah** (Wet/Moisture)
   - 5% threshold: 5% deduction
   - 10% threshold: 10% deduction
   - 15% threshold: 15% deduction

2. **Hampa** (Empty grains)
   - 5% threshold: 3% deduction
   - 10% threshold: 6% deduction
   - 15% threshold: 9% deduction

3. **Rusak** (Damaged)
   - 5% threshold: 4% deduction
   - 10% threshold: 8% deduction
   - 15% threshold: 12% deduction

4. **Kapur** (Chalky)
   - 5% threshold: 2% deduction
   - 10% threshold: 4% deduction
   - 15% threshold: 6% deduction

### 3. Operating Modes

#### LIVE Mode
- **Purpose:** Production environment
- **Characteristics:**
  - Real transactions
  - Affects actual inventory
  - Financial records
  - Permanent database entries

#### DEMO Mode
- **Purpose:** Training and demonstration
- **Characteristics:**
  - Training purposes
  - Testing new features
  - User training sessions
  - Can be used for demonstrations without affecting real data

**Use Cases:**
- Training new staff
- Demonstrating system to stakeholders
- Testing configurations
- Practice runs before actual season

### 4. Backend API

**File:** `/app/electron/database/queries/seasons.js`

**Functions:**

#### `getAll(filters)`
Get all seasons with optional filters.

**Filters:**
- `status` - Filter by season status (planned, active, closed, cancelled)
- `mode` - Filter by operating mode (LIVE, DEMO)
- `year` - Filter by year

**Returns:**
```javascript
{
  success: true,
  data: [
    {
      season_id: 1,
      season_code: '2024-S1',
      season_name: 'Musim 1/2024',
      year: 2024,
      season_number: 1,
      opening_price_per_kg: 1.80,
      deduction_config: [...],
      mode: 'LIVE',
      status: 'active',
      ...
    }
  ]
}
```

#### `getById(seasonId)`
Get detailed season information by ID.

#### `create(seasonData)`
Create a new season.

**Required Fields:**
```javascript
{
  season_code: '2024-S1',
  season_name: 'Musim 1/2024',
  year: 2024,
  season_number: 1,
  opening_price_per_kg: 1.80,
  deduction_config: [...],
  mode: 'LIVE',
  season_type_id: 1,
  start_date: '2024-01-01',
  end_date: '2024-06-30',
  status: 'planned'
}
```

#### `update(seasonId, seasonData)`
Update existing season configuration.

#### `getActive()`
Get the currently active season.

#### `getSeasonTypes()`
Get available season types (Production, Demo, Training).

### 5. Frontend UI Component

**File:** `/app/src/components/Settings/SeasonConfig.jsx`

**Features:**

#### Season List View
- Table displaying all seasons
- Columns: Code, Season Name, Mode, Opening Price, Period, Status, Quantities
- Color-coded mode tags (LIVE = green, DEMO = orange)
- Status indicators
- Actions: View, Edit

#### Create/Edit Modal
**Basic Information:**
- Season Code (e.g., 2024-S1)
- Season Name (e.g., Musim 1/2024)
- Year (2024)
- Season Number (1, 2, 3...)
- Opening Price (RM/kg)

**Configuration:**
- Season Type (Production, Demo, Training)
- Operating Mode (LIVE / DEMO radio buttons)
- Season Period (Date range picker)
- Status (Planned, Active, Closed, Cancelled)
- Target Quantity (kg)

**Deduction Configuration:**
- Dynamic form list for multiple deduction types
- Each type has:
  - Type name (e.g., Wap Basah)
  - 5% threshold deduction rate
  - 10% threshold deduction rate
  - 15% threshold deduction rate

**Notes Field:**
- Additional notes about the season

### 6. Navigation

**Menu Path:** Settings > Season Config

**Location:** Left sidebar under Settings submenu

### 7. IPC Handlers

**Registered in:** `/app/electron/main.js`

```javascript
seasons:getAll
seasons:getById
seasons:create
seasons:update
seasons:getActive
seasons:getSeasonTypes
```

**Exposed in:** `/app/electron/preload.js`

```javascript
window.electronAPI.seasons = {
  getAll: (filters) => ...,
  getById: (id) => ...,
  create: (data) => ...,
  update: (id, data) => ...,
  getActive: () => ...,
  getSeasonTypes: () => ...
}
```

## Usage Examples

### 1. Create a New Production Season

**Steps:**
1. Navigate to **Settings > Season Config**
2. Click **"Create New Season"**
3. Fill in:
   - Code: `2024-S1`
   - Name: `Musim 1/2024`
   - Year: `2024`
   - Season Number: `1`
   - Opening Price: `RM 1.85`
   - Mode: **LIVE**
   - Type: `Production`
   - Period: `01/01/2024 - 30/06/2024`
   - Status: `Planned`
   - Target: `50000 kg`
4. Configure deductions (use defaults or customize)
5. Click **"Create"**

**Result:**
- New season created
- Ready for activation
- Can start recording purchases/sales

### 2. Create a Training Season

**Steps:**
1. Same as above, but:
   - Mode: **DEMO**
   - Type: `Training`
   - Name: `Training Season 2024`

**Result:**
- Safe environment for training
- No impact on real inventory
- Can practice workflows

### 3. Update Deduction Rates

**Steps:**
1. Find the season in the table
2. Click **Edit** icon
3. Scroll to **Deduction Configuration**
4. Modify rates:
   - Example: Change Wap Basah 5% from 0.05 to 0.06
5. Click **"Update"**

**Result:**
- New deduction rates applied
- Affects future transactions only
- Historical data unchanged

### 4. View Season Details

**Steps:**
1. Click **View** icon on any season
2. Modal opens in read-only mode
3. Review all configurations
4. Click **"Close"**

## Integration with Other Modules

### Purchases Module
- Uses `opening_price_per_kg` as base price
- Applies `deduction_config` rates during purchase calculation
- Checks season `mode` to determine data handling

### Sales Module
- Links sales to specific season
- Tracks quantities against season targets
- Mode determines transaction permanence

### Inventory Module
- Groups stock by season
- Mode affects inventory reporting
- DEMO mode can be filtered out from real stock

### Reports Module
- Season-based reporting
- Can filter by mode (LIVE only or include DEMO)
- Year and season number for time-series analysis

## Database Queries

### Get Active LIVE Season
```sql
SELECT * FROM harvesting_seasons
WHERE status = 'active' AND mode = 'LIVE'
ORDER BY start_date DESC
LIMIT 1;
```

### Get All DEMO Seasons for Training
```sql
SELECT * FROM harvesting_seasons
WHERE mode = 'DEMO'
ORDER BY year DESC, season_number DESC;
```

### Get Season with Deduction Config
```sql
SELECT 
  season_id,
  season_code,
  opening_price_per_kg,
  deduction_config,
  mode
FROM harvesting_seasons
WHERE season_id = ?;
```

**Parse JSON in Application:**
```javascript
const season = result.data;
const deductions = JSON.parse(season.deduction_config);

// Find Wap Basah rate
const wapBasah = deductions.find(d => d.type === 'Wap Basah');
const rate5 = wapBasah.percentage_5; // 0.05
```

## Validation Rules

### Season Code
- Format: `YYYY-SN` (e.g., `2024-S1`)
- Must be unique
- Cannot be changed after creation

### Year
- Range: 2020 - 2100
- Must be reasonable current/future year

### Season Number
- Range: 1 - 10
- Sequential numbering recommended

### Opening Price
- Must be > 0
- Decimal (2 places)
- In RM/kg

### Deduction Rates
- Range: 0.00 - 1.00 (0% - 100%)
- Typically: 0.01 - 0.20 (1% - 20%)
- Must be reasonable percentages

### Date Range
- End date must be after start date
- Cannot overlap with same year/season number
- Typically 3-6 months duration

## Best Practices

### 1. Season Planning
- Create seasons in advance (status: Planned)
- Activate only when ready to start operations
- Close season only after all transactions completed

### 2. Mode Usage
- Use LIVE for all production operations
- Create separate DEMO seasons for training
- Clearly name DEMO seasons (e.g., "Training Q1 2024")

### 3. Deduction Configuration
- Review deduction rates annually
- Consult with quality control team
- Document rate changes in notes
- Keep historical seasons for reference

### 4. Price Management
- Set opening price based on market rates
- Update before activating season
- Cannot change after transactions started

### 5. Training Protocol
- Create dedicated DEMO season for training
- Practice all workflows in DEMO mode
- Clear DEMO data periodically
- Switch to LIVE only when confident

## Troubleshooting

### Issue: Cannot see Season Config menu
**Solution:** Check that route is added in `App.jsx` and menu in `AppLayout.jsx`

### Issue: Deduction config not saving
**Solution:** Ensure JSON format is correct, check browser console for errors

### Issue: Season types not loading
**Solution:** 
- Check database has season_type_config records
- Verify `status = 'active'` in database
- Check backend console for SQL errors

### Issue: Cannot edit active season
**Solution:** Some fields locked for active/closed seasons to maintain data integrity

### Issue: DEMO mode not working
**Solution:** 
- Verify mode is set to 'DEMO' in database
- Check application logic respects mode flag
- Ensure UI shows correct mode indicator

## Testing Scenarios

### ✅ Test 1: Create LIVE Season
1. Create new season with LIVE mode
2. Verify saved to database
3. Check mode tag is green
4. Verify can be activated

### ✅ Test 2: Create DEMO Season
1. Create new season with DEMO mode
2. Verify mode tag is orange
3. Create test purchase in DEMO season
4. Verify doesn't affect LIVE inventory

### ✅ Test 3: Edit Deduction Rates
1. Open existing season for edit
2. Modify Wap Basah rates
3. Save changes
4. Reload page and verify rates persisted

### ✅ Test 4: View Season Details
1. Click view on any season
2. Verify all fields display correctly
3. Verify deduction config shows properly
4. Verify cannot edit in view mode

### ✅ Test 5: Filter by Mode
1. Create both LIVE and DEMO seasons
2. Filter by mode
3. Verify correct seasons shown

## Security Considerations

### Access Control
- Only admins should access Season Config
- Sensitive pricing information
- Protect from unauthorized modifications

### Data Integrity
- Lock editing after significant transactions
- Audit trail for price changes
- Prevent deletion of seasons with data

### Mode Separation
- Ensure LIVE and DEMO data never mix
- Clear indicators throughout UI
- Reports should default to LIVE only

## Future Enhancements

### Potential Additions:
1. **Bulk import** - Import seasons from CSV/Excel
2. **Clone season** - Copy configuration to new season
3. **Price history** - Track price changes over time
4. **Advanced deductions** - More complex calculation rules
5. **Season comparison** - Compare performance across seasons
6. **Auto-activation** - Activate season on start date
7. **Auto-closure** - Close season after end date
8. **Email notifications** - Notify on season status changes
9. **Multi-region** - Different configs per region
10. **Weather integration** - Link to weather data

## Files Modified/Created

### Backend:
1. `/migrations/008_add_season_config_fields.sql` - Database migration
2. `/app/electron/database/queries/seasons.js` - Seasons service (NEW)
3. `/app/electron/main.js` - Added IPC handlers
4. `/app/electron/preload.js` - Exposed seasons API

### Frontend:
5. `/app/src/components/Settings/SeasonConfig.jsx` - Season Config UI (NEW)
6. `/app/src/App.jsx` - Added route
7. `/app/src/components/Layout/AppLayout.jsx` - Added menu item

### Documentation:
8. `/app/SEASON_CONFIGURATION.md` - This file

## Summary

The Season Configuration feature provides comprehensive management of harvesting seasons with:

✅ **Flexible Configuration** - Year, number, price, deductions  
✅ **Mode Support** - LIVE for production, DEMO for training  
✅ **JSON Deductions** - Structured deduction rates  
✅ **Full CRUD** - Create, Read, Update seasons  
✅ **UI Integration** - Clean, intuitive interface  
✅ **Data Integrity** - Validated inputs, proper constraints  
✅ **Training Support** - Safe DEMO environment  

---

**Status:** ✅ Implemented and Active  
**Version:** 1.0  
**Date:** November 13, 2025

**Season configuration is now available in Settings > Season Config!** 🌾
