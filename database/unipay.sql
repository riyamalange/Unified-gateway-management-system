-- ==============================================================================
-- UNIPAY – Unified Payment Gateway
-- Complete MySQL Schema and Seed Data for Academic DBMS Evaluation
-- Compatible with MySQL 8.x / MySQL Workbench / Windows Service (MySQL267)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS unipay;
USE unipay;

-- ------------------------------------------------------------------------------
-- Table: users
-- Preserves customer information initiating payments
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS payment_gateways;
DROP TABLE IF EXISTS merchants;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Table: merchants
-- Represents client business portals integrating with UNIPAY (FoodFast, ShopKart, TicketGo)
-- ------------------------------------------------------------------------------
CREATE TABLE merchants (
    merchant_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    api_key VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Table: payment_gateways
-- Supported payment providers (Razorpay, Stripe, PayPal, PayU)
-- Status toggle controls dynamic routing availability
-- ------------------------------------------------------------------------------
CREATE TABLE payment_gateways (
    gateway_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    fee_percent DECIMAL(5,2) DEFAULT 1.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Table: admins
-- Platform administrators with system-wide oversight
-- ------------------------------------------------------------------------------
CREATE TABLE admins (
    admin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Table: transactions
-- Central transaction ledger connecting Customer, Merchant, and Gateway
-- ------------------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    order_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    gateway_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    gateway_reference VARCHAR(100),
    response_message VARCHAR(255),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_txn_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_txn_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id) ON DELETE RESTRICT,
    CONSTRAINT fk_txn_gateway FOREIGN KEY (gateway_id) REFERENCES payment_gateways(gateway_id) ON DELETE RESTRICT,
    INDEX idx_txn_user (user_id),
    INDEX idx_txn_merchant (merchant_id),
    INDEX idx_txn_gateway (gateway_id),
    INDEX idx_txn_order (order_id),
    INDEX idx_txn_status (status),
    INDEX idx_txn_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Table: refunds
-- Tracks transaction reversals and customer refund requests
-- ------------------------------------------------------------------------------
CREATE TABLE refunds (
    refund_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    refund_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ref_txn FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    INDEX idx_ref_txn (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- Table: settlements
-- Payout records reconciling merchant receivables with gateway deductions
-- ------------------------------------------------------------------------------
CREATE TABLE settlements (
    settlement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_code VARCHAR(50) NOT NULL UNIQUE,
    merchant_id BIGINT NOT NULL,
    gateway_id BIGINT NOT NULL,
    gross_amount DECIMAL(12, 2) NOT NULL,
    fee_deducted DECIMAL(12, 2) NOT NULL,
    net_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SETTLED',
    settlement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_set_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id) ON DELETE RESTRICT,
    CONSTRAINT fk_set_gateway FOREIGN KEY (gateway_id) REFERENCES payment_gateways(gateway_id) ON DELETE RESTRICT,
    INDEX idx_set_merchant (merchant_id),
    INDEX idx_set_gateway (gateway_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- SEED DATA INSERTIONS
-- ==============================================================================

-- 1. Users
INSERT INTO users (user_id, name, email, password, role, created_at) VALUES
(1, 'Rahul Sharma', 'rahul@gmail.com', '12345', 'CUSTOMER', NOW()),
(2, 'FoodFast Merchant', 'merchant@gmail.com', '123', 'MERCHANT', NOW()),
(3, 'UNIPAY Administrator', 'admin@gmail.com', '098', 'ADMIN', NOW()),
(4, 'Priya Patel', 'priya@gmail.com', '12345', 'CUSTOMER', NOW()),
(5, 'Amit Verma', 'amit@gmail.com', '12345', 'CUSTOMER', NOW());

-- 2. Merchants
INSERT INTO merchants (merchant_id, merchant_code, name, email, api_key, status, created_at) VALUES
(1, 'MRC-FOODFAST', 'FoodFast', 'billing@foodfast.com', 'key_live_fdft99281', 'ACTIVE', NOW()),
(2, 'MRC-SHOPKART', 'ShopKart', 'payments@shopkart.com', 'key_live_shkp33718', 'ACTIVE', NOW()),
(3, 'MRC-TICKETGO', 'TicketGo', 'finance@ticketgo.com', 'key_live_tktg44092', 'ACTIVE', NOW());

-- 3. Payment Gateways (All initially ACTIVE)
INSERT INTO payment_gateways (gateway_id, name, code, status, fee_percent, created_at) VALUES
(1, 'Razorpay', 'RAZORPAY', 'ACTIVE', 1.80, NOW()),
(2, 'Stripe', 'STRIPE', 'ACTIVE', 2.20, NOW()),
(3, 'PayPal', 'PAYPAL', 'ACTIVE', 2.90, NOW()),
(4, 'PayU', 'PAYU', 'ACTIVE', 1.50, NOW());

-- 4. Admins
INSERT INTO admins (admin_id, name, email, password, role, created_at) VALUES
(1, 'UNIPAY Admin', 'admin@unipay.com', 'admin123', 'SUPER_ADMIN', NOW());

-- 5. Seed Historical Transactions
INSERT INTO transactions (transaction_id, transaction_code, order_id, user_id, merchant_id, gateway_id, amount, payment_method, status, gateway_reference, response_message, transaction_date) VALUES
(10001, 'TXN-10001', 'ORD-INIT-001', 1, 1, 1, 450.00, 'UPI', 'SUCCESS', 'rzp_pay_9981827', 'Payment simulated successfully via Razorpay Adapter', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10002, 'TXN-10002', 'ORD-INIT-002', 2, 2, 2, 2499.00, 'Card', 'SUCCESS', 'ch_stripe_339182', 'Payment simulated successfully via Stripe Adapter', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10003, 'TXN-10003', 'ORD-INIT-003', 3, 3, 4, 800.00, 'Net Banking', 'SUCCESS', 'payu_nb_881729', 'Payment simulated successfully via PayU Adapter', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(10004, 'TXN-10004', 'ORD-INIT-004', 1, 2, 3, 1200.00, 'Wallet', 'SUCCESS', 'pp_wlt_771928', 'Payment simulated successfully via PayPal Adapter', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(10005, 'TXN-10005', 'ORD-INIT-005', 2, 1, 1, 350.00, 'UPI', 'FAILED', 'rzp_err_002911', 'Gateway simulation reported insufficient balance', DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 6. Seed Refunds
INSERT INTO refunds (refund_id, refund_code, transaction_id, amount, reason, status, refund_date) VALUES
(20001, 'REF-20001', 10001, 450.00, 'Order cancelled', 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 7. Seed Settlements
INSERT INTO settlements (settlement_id, settlement_code, merchant_id, gateway_id, gross_amount, fee_deducted, net_amount, status, settlement_date) VALUES
(30001, 'SET-30001', 1, 1, 450.00, 8.10, 441.90, 'SETTLED', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(30002, 'SET-30002', 2, 2, 2499.00, 54.98, 2444.02, 'SETTLED', DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- Set auto-increment offsets so new records don't collide
ALTER TABLE users AUTO_INCREMENT = 10;
ALTER TABLE merchants AUTO_INCREMENT = 10;
ALTER TABLE payment_gateways AUTO_INCREMENT = 10;
ALTER TABLE transactions AUTO_INCREMENT = 10006;
ALTER TABLE refunds AUTO_INCREMENT = 20002;
ALTER TABLE settlements AUTO_INCREMENT = 30003;
