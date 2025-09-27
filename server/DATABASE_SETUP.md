# MySQL Database Setup for Rent Management System

This guide will help you set up the MySQL database for your Rent Management System using XAMPP.

## Prerequisites

1. **XAMPP installed and running**
2. **MySQL service started** in XAMPP Control Panel
3. **Node.js dependencies installed** (`npm install`)

## Setup Methods

### Method 1: Automatic Setup (Recommended)

1. **Create the database manually in phpMyAdmin:**
   - Open XAMPP Control Panel
   - Start Apache and MySQL services
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `rent_management`

2. **Configure environment variables:**
   - Copy `env.example` to `.env`
   - Update the database configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=rent_management
   DB_USER=root
   DB_PASSWORD=
   ```

3. **Run the automatic setup:**
   ```bash
   npm run setup-db
   ```

### Method 2: Manual SQL Setup

1. **Open phpMyAdmin** (http://localhost/phpmyadmin)

2. **Import the SQL file:**
   - Click on "Import" tab
   - Choose file: `database-setup.sql`
   - Click "Go" to execute

3. **Verify tables were created:**
   - Check that all tables are created in the `rent_management` database
   - Verify that default data is inserted

## Database Structure

The system creates the following tables:

- **roles** - User roles and permissions
- **users** - System users (admins, managers, accountants)
- **properties** - Property information
- **rental_units** - Individual rental units within properties
- **tenants** - Tenant information and lease details
- **payments** - Payment records
- **payment_types** - Types of payments (rent, deposit, etc.)
- **payment_modes** - Payment methods (cash, transfer, etc.)
- **currencies** - Supported currencies

## Default Data

The setup script creates:

- **3 default roles:** admin, property_manager, accountant
- **5 payment types:** Rent, Security Deposit, Late Fee, Maintenance Fee, Utility Fee
- **5 payment modes:** Cash, Bank Transfer, Check, Credit Card, Mobile Payment
- **3 currencies:** MVR (default), USD, EUR
- **1 admin user:** admin@rentmanagement.com (password: admin123)

## Troubleshooting

### Connection Issues
- Ensure MySQL service is running in XAMPP
- Check that the database `rent_management` exists
- Verify database credentials in `.env` file

### Permission Issues
- Make sure the MySQL user has CREATE, INSERT, UPDATE, DELETE permissions
- Default XAMPP MySQL user is `root` with no password

### Port Conflicts
- Default MySQL port is 3306
- If you changed the port, update `DB_PORT` in `.env`

## Environment Variables

Required database environment variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rent_management
DB_USER=root
DB_PASSWORD=
```

## Next Steps

After successful database setup:

1. **Start the server:** `npm run dev`
2. **Test the connection:** Check console for "MySQL connected successfully"
3. **Access the application:** http://localhost:3000
4. **Login with default admin:** admin@rentmanagement.com / admin123

## Support

If you encounter issues:
1. Check XAMPP MySQL service status
2. Verify database exists in phpMyAdmin
3. Check server console for error messages
4. Ensure all dependencies are installed (`npm install`)
