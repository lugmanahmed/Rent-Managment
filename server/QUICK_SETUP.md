# Quick MySQL Setup Guide

## Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Make sure both show "Running" status

## Step 2: Create Database
1. Open **phpMyAdmin**: http://localhost/phpmyadmin
2. Click **"New"** in the left sidebar
3. Database name: `rent_management`
4. Click **"Create"**

## Step 3: Import Database Structure
1. In phpMyAdmin, select the `rent_management` database
2. Click **"Import"** tab
3. Click **"Choose File"** and select `database-setup.sql`
4. Click **"Go"** to execute

## Step 4: Create Environment File
Create a file named `.env` in the server folder with this content:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rent_management
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=http://localhost:3000
```

## Step 5: Test the Setup
```bash
cd server
npm run dev
```

You should see: "MySQL connected successfully"

## Default Login
- Email: admin@rentmanagement.com
- Password: admin123

## Troubleshooting
- **Access denied**: Make sure MySQL is running in XAMPP
- **Database not found**: Create the `rent_management` database first
- **Connection failed**: Check if MySQL port 3306 is available
