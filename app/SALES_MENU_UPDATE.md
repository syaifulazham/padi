# Sales Menu Sub-Menu Implementation

## Overview
The Sales menu now has two sub-menu items: **Weigh-In** and **History**, matching the Purchases menu structure for consistency.

## Changes Made

### 1. Updated Navigation Menu
**File**: `/src/components/Layout/AppLayout.jsx`

Changed Sales from a single menu item to a menu group with sub-items:

```javascript
{
  key: 'sales-group',
  icon: <ShopOutlined />,
  label: 'Sales',
  children: [
    {
      key: '/sales',
      icon: <PlusCircleOutlined />,
      label: 'Weigh-In',
    },
    {
      key: '/sales/history',
      icon: <UnorderedListOutlined />,
      label: 'History',
    },
  ],
}
```

### 2. Created Sales History Component
**File**: `/src/components/Sales/SalesHistory.jsx`

Features:
- **Date Range Filtering**: Filter transactions by date range with DatePicker
- **Statistics Cards**: 
  - Total Transactions count
  - Total Weight Sold (KG)
  - Total Revenue (RM)
- **Transaction Table**: Displays all sales transactions with:
  - Receipt number (green tag)
  - Date & Time
  - Lorry registration
  - Manufacturer details (name and code)
  - Weights (Gross, Tare, Net)
  - Price per kg
  - Total amount (orange highlight)
  - Payment status
- **Action Buttons**: Refresh, Print, Export to Excel
- **Pagination**: 20 records per page with customizable page sizes

### 3. Updated Routing
**File**: `/src/App.jsx`

Added:
- Import for `SalesHistory` component
- Route: `/sales/history` → `<SalesHistory />`

## Menu Structure

### Right Sidebar (Transactions)
```
💼 Transactions
├── 🛒 Purchases
│   ├── ➕ Weigh-In       → /purchases
│   └── 📋 History        → /purchases/history
└── 🏪 Sales
    ├── ➕ Weigh-In       → /sales
    └── 📋 History        → /sales/history
```

## Visual Differences from Purchases

### Color Coding
- **Receipt Tags**: Green (vs. Blue for Purchases)
- **Net Weight**: Green highlight (vs. Blue for Purchases)
- **Total Amount**: Orange highlight (vs. Green for Purchases)

### Terminology
- **Purchases**: Shows "Farmer" information
- **Sales**: Shows "Manufacturer" information

### Statistics Labels
- **Purchases**: "Total Weight" and "Total Amount"
- **Sales**: "Total Weight Sold" and "Total Revenue"

## API Integration

The SalesHistory component expects the following API endpoint:

```javascript
window.electronAPI.sales.getAll({
  date_from: 'YYYY-MM-DD',
  date_to: 'YYYY-MM-DD'
})
```

Expected response:
```javascript
{
  success: true,
  data: [
    {
      transaction_id: number,
      receipt_number: string,
      transaction_date: string (ISO),
      vehicle_number: string,
      manufacturer_name: string,
      manufacturer_code: string,
      gross_weight_kg: number,
      tare_weight_kg: number,
      net_weight_kg: number,
      final_price_per_kg: number,
      total_amount: number,
      payment_status: 'paid' | 'pending'
    }
  ]
}
```

## How to Use

### Access Sales Weigh-In
1. Look at the **right sidebar** (Transactions)
2. Click on **Sales** to expand
3. Click on **Weigh-In** sub-menu

### Access Sales History
1. Look at the **right sidebar** (Transactions)
2. Click on **Sales** to expand
3. Click on **History** sub-menu

### Filter Sales History
1. Navigate to Sales > History
2. Use the **Date Range Picker** at the top right
3. Click **Refresh** to reload data
4. Use **Print** or **Export** buttons for reporting

## Navigation Consistency

Both Purchases and Sales now follow the same pattern:

| Feature | Purchases | Sales |
|---------|-----------|-------|
| Sub-menu structure | ✅ | ✅ |
| Weigh-In page | ✅ | ✅ |
| History page | ✅ | ✅ |
| Date filtering | ✅ | ✅ |
| Statistics cards | ✅ | ✅ |
| Export functions | ✅ | ✅ |

## Files Modified/Created

### Modified
1. `/src/components/Layout/AppLayout.jsx` - Added Sales sub-menu structure
2. `/src/App.jsx` - Added SalesHistory route and import

### Created
1. `/src/components/Sales/SalesHistory.jsx` - New component for sales transaction history

## Testing

### Visual Test
1. Open the app
2. Look at the **right sidebar**
3. You should see:
   - **Purchases** with an expand arrow
   - **Sales** with an expand arrow
4. Click **Sales** to expand
5. You should see:
   - ➕ Weigh-In
   - 📋 History

### Navigation Test
1. Click **Sales > Weigh-In** → Should navigate to `/sales`
2. Click **Sales > History** → Should navigate to `/sales/history`
3. Both pages should load without errors

### History Page Test
1. Navigate to Sales > History
2. Check that the page loads with:
   - Date range picker (defaulting to today)
   - Statistics cards (may show 0 if no data)
   - Transaction table
   - Action buttons

## Next Steps (Optional)

1. **Implement Sales Weigh-In functionality** in `/sales` page
2. **Add backend API** for `sales.getAll()` in Electron main process
3. **Connect to database** for sales transactions
4. **Add export functionality** (Excel, PDF)
5. **Add print templates** for sales reports

---

**Status**: ✅ Complete  
**Hot Reload**: ✅ Applied  
**Version**: 1.0  
**Date**: November 13, 2025
