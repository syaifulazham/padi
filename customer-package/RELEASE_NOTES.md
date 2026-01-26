# Release Notes - Version 1.0.0

**Release Date:** 2026-01-27

## 🎉 New Features

### Receipt Management
- Payment status labels changed to "Need Update" / "Updated"
- Amount field remains empty when deduction is 0%
- Effective Weight column added showing weight after deductions
- Number formatting with thousand separators (###,###.00)
- Rounding implemented for effective weight (nearest integer)

### Weigh-In Process
- Effective weight calculation with rounding
- Real-time preview of deductions and amounts
- Improved weighing out wizard with better validation

### Purchase & Sales Management
- Updated receipt numbering format: P/<season_code>/<season_number><year>/<running_number>
- Sales numbering format: S/<season_code>/<season_number><year>/<running_number>
- Demo mode suffix support (-demo)
- Enhanced deduction configuration
- Rounded weight calculations throughout transaction flow

### User Interface
- Consistent number formatting across all weight and amount displays
- Improved statistics boxes in Receipt Management
- Better form validation and error messages
- Enhanced table columns and filters

## 🐛 Bug Fixes

- Fixed foreign key constraint errors in purchase creation
- Corrected authenticated user ID usage in transactions
- Fixed amount calculation to use rounded effective weight
- Resolved display issues in payment status labels

## 🔧 Improvements

- Database performance optimizations
- Better error handling and logging
- Improved receipt generation
- Enhanced data validation

## 📊 Database Changes

- Added effective_weight_kg column to purchase_transactions
- Updated stored procedures for receipt/sales number generation
- Enhanced deduction configuration storage
- Improved indexes for better performance

## ⚠️ Breaking Changes

None - This version is fully compatible with existing data

## 🔄 Migration Notes

Database will automatically update when application starts.
No manual intervention required.

## 📝 Known Issues

None at this time

## 🚀 Coming Soon

- Advanced reporting features
- Mobile app companion
- Multi-language support
- Enhanced analytics dashboard

## 📞 Support

For assistance with this release, contact:
- Technical Support: support@example.com
- Documentation: See CUSTOMER_INSTALLATION.md

---

**Full Changelog:** https://github.com/yourrepo/padi/releases/tag/v1.0.0
