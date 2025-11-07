# Security Configuration

## 👥 User Roles

### Role Permissions

| Role | Access Level |
|------|-------------|
| **Admin** | Full access (SELECT, INSERT, UPDATE, DELETE) |
| **Manager** | Read/Write (SELECT, INSERT, UPDATE) |
| **Operator** | Limited write (transactions only) |
| **Accountant** | Read-only financial data |
| **Viewer** | Read-only all data |

## 🔐 User Creation

### Application User
```sql
CREATE USER 'paddy_app'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT SELECT, INSERT, UPDATE ON paddy_collection_db.* TO 'paddy_app'@'localhost';
GRANT EXECUTE ON paddy_collection_db.* TO 'paddy_app'@'localhost';
FLUSH PRIVILEGES;
```

### Operator User
```sql
CREATE USER 'paddy_operator'@'localhost' IDENTIFIED BY 'OperatorPass789!';
GRANT SELECT ON paddy_collection_db.* TO 'paddy_operator'@'localhost';
GRANT INSERT, UPDATE ON paddy_collection_db.purchase_transactions TO 'paddy_operator'@'localhost';
FLUSH PRIVILEGES;
```

---
**See comprehensive blueprint for complete security configuration**
