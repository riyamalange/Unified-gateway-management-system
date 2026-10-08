-- Initial Seed Data for UNIPAY (inserts ignored if already present)
INSERT IGNORE INTO users (user_id, name, email, password, role) VALUES
(1, 'Rahul Sharma', 'rahul@gmail.com', '12345', 'CUSTOMER'),
(2, 'FoodFast Merchant', 'merchant@gmail.com', '123', 'MERCHANT'),
(3, 'UNIPAY Administrator', 'admin@gmail.com', '098', 'ADMIN'),
(4, 'Priya Patel', 'priya@gmail.com', '12345', 'CUSTOMER'),
(5, 'Amit Verma', 'amit@gmail.com', '12345', 'CUSTOMER');

INSERT IGNORE INTO merchants (merchant_id, merchant_code, name, email, api_key, status) VALUES
(1, 'MRC-FOODFAST', 'FoodFast', 'billing@foodfast.com', 'key_live_fdft99281', 'ACTIVE'),
(2, 'MRC-SHOPKART', 'ShopKart', 'payments@shopkart.com', 'key_live_shkp33718', 'ACTIVE'),
(3, 'MRC-TICKETGO', 'TicketGo', 'finance@ticketgo.com', 'key_live_tktg44092', 'ACTIVE');

INSERT IGNORE INTO payment_gateways (gateway_id, name, code, status, fee_percent) VALUES
(1, 'Razorpay', 'RAZORPAY', 'ACTIVE', 1.80),
(2, 'Stripe', 'STRIPE', 'ACTIVE', 2.20),
(3, 'PayPal', 'PAYPAL', 'ACTIVE', 2.90),
(4, 'PayU', 'PAYU', 'ACTIVE', 1.50);

INSERT IGNORE INTO admins (admin_id, name, email, password, role) VALUES
(1, 'UNIPAY Admin', 'admin@unipay.com', 'admin123', 'SUPER_ADMIN');

INSERT IGNORE INTO transactions (transaction_id, transaction_code, order_id, user_id, merchant_id, gateway_id, amount, payment_method, status, gateway_reference, response_message) VALUES
(10001, 'TXN-10001', 'ORD-INIT-001', 1, 1, 1, 450.00, 'UPI', 'SUCCESS', 'rzp_pay_9981827', 'Payment simulated successfully via Razorpay Adapter'),
(10002, 'TXN-10002', 'ORD-INIT-002', 2, 2, 2, 2499.00, 'Card', 'SUCCESS', 'ch_stripe_339182', 'Payment simulated successfully via Stripe Adapter'),
(10003, 'TXN-10003', 'ORD-INIT-003', 3, 3, 4, 800.00, 'Net Banking', 'SUCCESS', 'payu_nb_881729', 'Payment simulated successfully via PayU Adapter'),
(10004, 'TXN-10004', 'ORD-INIT-004', 1, 2, 3, 1200.00, 'Wallet', 'SUCCESS', 'pp_wlt_771928', 'Payment simulated successfully via PayPal Adapter'),
(10005, 'TXN-10005', 'ORD-INIT-005', 2, 1, 1, 350.00, 'UPI', 'FAILED', 'rzp_err_002911', 'Gateway simulation reported insufficient balance');

INSERT IGNORE INTO refunds (refund_id, refund_code, transaction_id, amount, reason, status) VALUES
(20001, 'REF-20001', 10001, 450.00, 'Order cancelled', 'PENDING');

INSERT IGNORE INTO settlements (settlement_id, settlement_code, merchant_id, gateway_id, gross_amount, fee_deducted, net_amount, status) VALUES
(30001, 'SET-30001', 1, 1, 450.00, 8.10, 441.90, 'SETTLED'),
(30002, 'SET-30002', 2, 2, 2499.00, 54.98, 2444.02, 'SETTLED');
