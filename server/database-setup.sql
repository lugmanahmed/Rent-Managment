-- Rent Management System - MySQL Database Setup
-- Run this script in your MySQL database to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS rent_management;
USE rent_management;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(20),
    id_card_number VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    legacy_role ENUM('admin', 'property_manager', 'accountant') DEFAULT 'property_manager',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    last_logout TIMESTAMP NULL,
    is_online BOOLEAN DEFAULT FALSE,
    session_token VARCHAR(255),
    session_expires TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    lock_until TIMESTAMP NULL,
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('house', 'apartment', 'commercial') NOT NULL,
    street VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    island VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Maldives',
    number_of_floors INT NOT NULL,
    number_of_rental_units INT NOT NULL,
    bedrooms INT,
    bathrooms INT,
    square_feet INT,
    year_built INT,
    description TEXT,
    status ENUM('occupied', 'vacant', 'maintenance', 'renovation') DEFAULT 'vacant',
    photos JSON,
    amenities JSON,
    assigned_manager_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_manager_id) REFERENCES users(id)
);

-- Create rental_units table
CREATE TABLE IF NOT EXISTS rental_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_number VARCHAR(20) NOT NULL,
    property_id INT NOT NULL,
    floor INT NOT NULL,
    bedrooms INT NOT NULL,
    bathrooms INT NOT NULL,
    square_feet INT,
    monthly_rent DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MVR',
    status ENUM('available', 'occupied', 'maintenance', 'renovation') DEFAULT 'available',
    amenities JSON,
    photos JSON,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    id_type ENUM('passport', 'national_id') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(50) DEFAULT 'Maldives',
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MVR',
    security_deposit DECIMAL(10,2) DEFAULT 0,
    agreement_file_name VARCHAR(255),
    agreement_file_path VARCHAR(500),
    agreement_uploaded_at TIMESTAMP NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_email VARCHAR(100),
    status ENUM('active', 'inactive', 'terminated', 'pending') DEFAULT 'pending',
    notes JSON,
    occupation VARCHAR(100),
    employer VARCHAR(100),
    employer_contact VARCHAR(100),
    pets JSON,
    documents JSON,
    created_by_id INT NOT NULL,
    assigned_manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (assigned_manager_id) REFERENCES users(id)
);

-- Create payment_types table
CREATE TABLE IF NOT EXISTS payment_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create payment_modes table
CREATE TABLE IF NOT EXISTS payment_modes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10),
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    rental_unit_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MVR',
    payment_type_id INT NOT NULL,
    payment_mode_id INT NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    reference VARCHAR(100),
    notes TEXT,
    receipt_number VARCHAR(50),
    receipt_path VARCHAR(500),
    created_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (rental_unit_id) REFERENCES rental_units(id),
    FOREIGN KEY (payment_type_id) REFERENCES payment_types(id),
    FOREIGN KEY (payment_mode_id) REFERENCES payment_modes(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Insert default data
INSERT IGNORE INTO roles (name, description, permissions) VALUES
('admin', 'System Administrator', '["all"]'),
('property_manager', 'Property Manager', '["properties", "tenants", "payments", "reports"]'),
('accountant', 'Accountant', '["payments", "reports"]');

INSERT IGNORE INTO payment_types (name, description) VALUES
('Rent', 'Monthly rent payment'),
('Security Deposit', 'Security deposit payment'),
('Late Fee', 'Late payment fee'),
('Maintenance Fee', 'Maintenance and repair fee'),
('Utility Fee', 'Utility bill payment');

INSERT IGNORE INTO payment_modes (name, description) VALUES
('Cash', 'Cash payment'),
('Bank Transfer', 'Bank transfer payment'),
('Check', 'Check payment'),
('Credit Card', 'Credit card payment'),
('Mobile Payment', 'Mobile payment (M-Paisa, etc.)');

INSERT IGNORE INTO currencies (code, name, symbol, is_default, exchange_rate) VALUES
('MVR', 'Maldivian Rufiyaa', 'Rf', TRUE, 1.0000),
('USD', 'US Dollar', '$', FALSE, 15.42),
('EUR', 'Euro', '€', FALSE, 16.85);

-- Create default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role_id, legacy_role, is_active) VALUES
('Admin User', 'admin@rentmanagement.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'admin', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_properties_assigned_manager ON properties(assigned_manager_id);
CREATE INDEX idx_rental_units_property_id ON rental_units(property_id);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);

-- Show completion message
SELECT 'Database setup completed successfully!' as message;
