import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for frontend flexibility
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Serve the vanilla HTML/CSS/JS frontend files under /unipay-frontend
app.use('/unipay-frontend', express.static(path.join(__dirname, 'unipay-frontend')));

// ==============================================================================
// IN-MEMORY RELATIONAL DATABASE (Mirroring MySQL `unipay` Schema & Seed Data)
// ==============================================================================
interface UserRecord {
  userId: number;
  name: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  merchantId?: number;
  createdAt: string;
}

interface MerchantRecord {
  merchantId: number;
  merchantCode: string;
  name: string;
  email: string;
  apiKey: string;
  status: string;
  createdAt: string;
}

interface GatewayRecord {
  gatewayId: number;
  name: string;
  code: string;
  status: string; // ACTIVE or INACTIVE
  feePercent: number;
  createdAt: string;
}

interface AdminRecord {
  adminId: number;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

interface TransactionRecord {
  transactionId: number;
  transactionCode: string;
  orderId: string;
  userId: number;
  merchantId: number;
  gatewayId: number;
  amount: number;
  paymentMethod: string;
  status: string; // SUCCESS, FAILED, PENDING
  gatewayReference: string;
  responseMessage: string;
  transactionDate: string;
}

interface RefundRecord {
  refundId: number;
  refundCode: string;
  transactionId: number;
  amount: number;
  reason: string;
  status: string;
  refundDate: string;
}

interface SettlementRecord {
  settlementId: number;
  settlementCode: string;
  merchantId: number;
  gatewayId: number;
  grossAmount: number;
  feeDeducted: number;
  netAmount: number;
  status: string;
  settlementDate: string;
}

// Seed initial state
const db = {
  users: [
    { userId: 1, name: 'Rahul Sharma', email: 'rahul@gmail.com', password: '12345', role: 'CUSTOMER', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { userId: 2, name: 'FoodFast Merchant', email: 'merchant@gmail.com', password: '123', role: 'MERCHANT', merchantId: 1, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { userId: 3, name: 'UNIPAY Administrator', email: 'admin@gmail.com', password: '098', role: 'ADMIN', createdAt: new Date(Date.now() - 86400000 * 15).toISOString() },
    { userId: 4, name: 'Priya Patel', email: 'priya@gmail.com', password: '12345', role: 'CUSTOMER', createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    { userId: 5, name: 'Amit Verma', email: 'amit@gmail.com', password: '12345', role: 'CUSTOMER', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
  ] as UserRecord[],

  merchants: [
    { merchantId: 1, merchantCode: 'MRC-FOODFAST', name: 'FoodFast', email: 'billing@foodfast.com', apiKey: 'key_live_fdft99281', status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { merchantId: 2, merchantCode: 'MRC-SHOPKART', name: 'ShopKart', email: 'payments@shopkart.com', apiKey: 'key_live_shkp33718', status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { merchantId: 3, merchantCode: 'MRC-TICKETGO', name: 'TicketGo', email: 'finance@ticketgo.com', apiKey: 'key_live_tktg44092', status: 'ACTIVE', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() }
  ] as MerchantRecord[],

  gateways: [
    { gatewayId: 1, name: 'Razorpay', code: 'RAZORPAY', status: 'ACTIVE', feePercent: 1.80, createdAt: new Date().toISOString() },
    { gatewayId: 2, name: 'Stripe', code: 'STRIPE', status: 'ACTIVE', feePercent: 2.20, createdAt: new Date().toISOString() },
    { gatewayId: 3, name: 'PayPal', code: 'PAYPAL', status: 'ACTIVE', feePercent: 2.90, createdAt: new Date().toISOString() },
    { gatewayId: 4, name: 'PayU', code: 'PAYU', status: 'ACTIVE', feePercent: 1.50, createdAt: new Date().toISOString() }
  ] as GatewayRecord[],

  admins: [
    { adminId: 1, name: 'UNIPAY Administrator', email: 'admin@gmail.com', password: '098', role: 'ADMIN', createdAt: new Date().toISOString() }
  ] as AdminRecord[],

  transactions: [
    { transactionId: 10001, transactionCode: 'TXN-10001', orderId: 'ORD-INIT-001', userId: 1, merchantId: 1, gatewayId: 1, amount: 450.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_9981827', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 86400000 * 2).toISOString() },
    { transactionId: 10002, transactionCode: 'TXN-10002', orderId: 'ORD-INIT-002', userId: 4, merchantId: 2, gatewayId: 2, amount: 2499.00, paymentMethod: 'Card', status: 'SUCCESS', gatewayReference: 'ch_stripe_339182', responseMessage: 'Payment simulated successfully via Stripe Adapter', transactionDate: new Date(Date.now() - 86400000 * 1).toISOString() },
    { transactionId: 10003, transactionCode: 'TXN-10003', orderId: 'ORD-INIT-003', userId: 5, merchantId: 3, gatewayId: 4, amount: 800.00, paymentMethod: 'Net Banking', status: 'SUCCESS', gatewayReference: 'payu_nb_881729', responseMessage: 'Payment simulated successfully via PayU Adapter', transactionDate: new Date(Date.now() - 86400000 * 1).toISOString() },
    { transactionId: 10004, transactionCode: 'TXN-10004', orderId: 'ORD-INIT-004', userId: 1, merchantId: 2, gatewayId: 3, amount: 1200.00, paymentMethod: 'Wallet', status: 'SUCCESS', gatewayReference: 'pp_wlt_771928', responseMessage: 'Payment simulated successfully via PayPal Adapter', transactionDate: new Date(Date.now() - 3600000 * 4).toISOString() },
    { transactionId: 10005, transactionCode: 'TXN-10005', orderId: 'ORD-INIT-005', userId: 4, merchantId: 1, gatewayId: 1, amount: 350.00, paymentMethod: 'UPI', status: 'FAILED', gatewayReference: 'rzp_err_002911', responseMessage: 'Gateway simulation reported insufficient balance', transactionDate: new Date(Date.now() - 3600000 * 2).toISOString() },
    { transactionId: 10006, transactionCode: 'TXN-10006', orderId: 'ORD-HIST-006', userId: 1, merchantId: 1, gatewayId: 1, amount: 1250.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_772183', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 3600000 * 6).toISOString() },
    { transactionId: 10007, transactionCode: 'TXN-10007', orderId: 'ORD-HIST-007', userId: 4, merchantId: 1, gatewayId: 1, amount: 980.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_661902', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 86400000 * 1).toISOString() },
    { transactionId: 10008, transactionCode: 'TXN-10008', orderId: 'ORD-HIST-008', userId: 5, merchantId: 2, gatewayId: 2, amount: 2200.00, paymentMethod: 'Card', status: 'SUCCESS', gatewayReference: 'ch_stripe_551029', responseMessage: 'Payment simulated successfully via Stripe Adapter', transactionDate: new Date(Date.now() - 86400000 * 2).toISOString() },
    { transactionId: 10009, transactionCode: 'TXN-10009', orderId: 'ORD-HIST-009', userId: 1, merchantId: 1, gatewayId: 1, amount: 820.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_441829', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 86400000 * 3).toISOString() },
    { transactionId: 10010, transactionCode: 'TXN-10010', orderId: 'ORD-HIST-010', userId: 4, merchantId: 3, gatewayId: 1, amount: 1150.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_331902', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 86400000 * 3).toISOString() },
    { transactionId: 10011, transactionCode: 'TXN-10011', orderId: 'ORD-HIST-011', userId: 5, merchantId: 1, gatewayId: 2, amount: 690.00, paymentMethod: 'Card', status: 'SUCCESS', gatewayReference: 'ch_stripe_229103', responseMessage: 'Payment simulated successfully via Stripe Adapter', transactionDate: new Date(Date.now() - 86400000 * 4).toISOString() },
    { transactionId: 10012, transactionCode: 'TXN-10012', orderId: 'ORD-HIST-012', userId: 1, merchantId: 2, gatewayId: 2, amount: 1950.00, paymentMethod: 'Card', status: 'SUCCESS', gatewayReference: 'ch_stripe_118274', responseMessage: 'Payment simulated successfully via Stripe Adapter', transactionDate: new Date(Date.now() - 86400000 * 4).toISOString() },
    { transactionId: 10013, transactionCode: 'TXN-10013', orderId: 'ORD-HIST-013', userId: 4, merchantId: 1, gatewayId: 1, amount: 520.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_990182', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 86400000 * 5).toISOString() },
    { transactionId: 10014, transactionCode: 'TXN-10014', orderId: 'ORD-HIST-014', userId: 5, merchantId: 3, gatewayId: 4, amount: 900.00, paymentMethod: 'Net Banking', status: 'SUCCESS', gatewayReference: 'payu_nb_771829', responseMessage: 'Payment simulated successfully via PayU Adapter', transactionDate: new Date(Date.now() - 86400000 * 5).toISOString() },
    { transactionId: 10015, transactionCode: 'TXN-10015', orderId: 'ORD-HIST-015', userId: 1, merchantId: 1, gatewayId: 1, amount: 380.00, paymentMethod: 'UPI', status: 'SUCCESS', gatewayReference: 'rzp_pay_882910', responseMessage: 'Payment simulated successfully via Razorpay Adapter', transactionDate: new Date(Date.now() - 86400000 * 6).toISOString() },
    { transactionId: 10016, transactionCode: 'TXN-10016', orderId: 'ORD-HIST-016', userId: 4, merchantId: 2, gatewayId: 2, amount: 1450.00, paymentMethod: 'Card', status: 'SUCCESS', gatewayReference: 'ch_stripe_661902', responseMessage: 'Payment simulated successfully via Stripe Adapter', transactionDate: new Date(Date.now() - 86400000 * 6).toISOString() }
  ] as TransactionRecord[],

  refunds: [
    { refundId: 20001, refundCode: 'REF-20001', transactionId: 10001, amount: 450.00, reason: 'Order cancelled', status: 'PENDING', refundDate: new Date(Date.now() - 86400000).toISOString() }
  ] as RefundRecord[],

  settlements: [
    { settlementId: 30001, settlementCode: 'SET-30001', merchantId: 1, gatewayId: 1, grossAmount: 450.00, feeDeducted: 8.10, netAmount: 441.90, status: 'SETTLED', settlementDate: new Date(Date.now() - 86400000).toISOString() },
    { settlementId: 30002, settlementCode: 'SET-30002', merchantId: 2, gatewayId: 2, grossAmount: 2499.00, feeDeducted: 54.98, netAmount: 2444.02, status: 'SETTLED', settlementDate: new Date(Date.now() - 3600000 * 6).toISOString() }
  ] as SettlementRecord[]
};

let nextTxnId = 10017;
let nextUserId = 10;
let nextRefundId = 20002;

// Helper to populate relations
function enrichTransaction(t: TransactionRecord) {
  const user = db.users.find(u => u.userId === t.userId);
  const merchant = db.merchants.find(m => m.merchantId === t.merchantId);
  const gateway = db.gateways.find(g => g.gatewayId === t.gatewayId);
  return {
    ...t,
    user: user ? { userId: user.userId, name: user.name, email: user.email } : null,
    merchant: merchant ? { merchantId: merchant.merchantId, name: merchant.name, merchantCode: merchant.merchantCode } : null,
    gateway: gateway ? { gatewayId: gateway.gatewayId, name: gateway.name, code: gateway.code } : null
  };
}

// ==============================================================================
// REST APIs (Exact match with Spring Boot Backend Controllers)
// ==============================================================================

// 1. Auth APIs
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  // Normal signup is STRICTLY CUSTOMER
  const newUser: UserRecord = {
    userId: nextUserId++,
    name,
    email,
    password,
    role: 'CUSTOMER',
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);

  return res.json({
    success: true,
    message: 'User registered successfully',
    userId: newUser.userId,
    name: newUser.name,
    email: newUser.email,
    role: 'CUSTOMER'
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Check users table (determines role from database)
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  if (user) {
    return res.json({
      success: true,
      message: 'Login successful',
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      merchantId: user.merchantId || 1
    });
  }

  // Fallback check in admin table
  const admin = db.admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
  if (admin) {
    return res.json({
      success: true,
      message: 'Admin login successful',
      userId: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: 'ADMIN',
      merchantId: 1
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid email or password' });
});

// 2. Routing Engine & Payment Processing
function routePayment(paymentMethod: string): GatewayRecord {
  const method = (paymentMethod || '').trim().toUpperCase();
  let preferredCode = 'RAZORPAY';

  if (method === 'UPI') preferredCode = 'RAZORPAY';
  else if (method.includes('CARD')) preferredCode = 'STRIPE';
  else if (method.includes('NET') || method.includes('BANK')) preferredCode = 'PAYU';
  else if (method.includes('WALLET')) preferredCode = 'PAYU';
  else if (method === 'PAYPAL') preferredCode = 'PAYPAL';

  // Check if preferred is ACTIVE
  const preferred = db.gateways.find(g => g.code.toUpperCase() === preferredCode && g.status === 'ACTIVE');
  if (preferred) return preferred;

  // Failover to any ACTIVE gateway
  const activeFallback = db.gateways.find(g => g.status === 'ACTIVE');
  if (activeFallback) return activeFallback;

  throw new Error('All payment gateways are currently INACTIVE.');
}

app.post('/api/payments', (req: Request, res: Response) => {
  try {
    const { orderId, amount, paymentMethod, userId } = req.body;

    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'orderId, amount, and paymentMethod are required' });
    }

    const numericAmount = parseFloat(amount);
    const targetUserId = userId || 1;
    // Always associates with the context merchant (FoodFast - ID 1) as required
    const targetMerchantId = req.body.merchantId || 1;

    const user = db.users.find(u => u.userId === targetUserId) || db.users[0];
    const merchant = db.merchants.find(m => m.merchantId === targetMerchantId) || db.merchants[0];

    // Determine gateway via Routing Engine
    const gateway = routePayment(paymentMethod);

    // Gateway simulation
    const refCode = `${gateway.code.toLowerCase()}_pay_${Math.floor(100000 + Math.random() * 900000)}`;
    const txnCode = `TXN-${nextTxnId}`;

    const newTxn: TransactionRecord = {
      transactionId: nextTxnId++,
      transactionCode: txnCode,
      orderId,
      userId: user.userId,
      merchantId: merchant.merchantId,
      gatewayId: gateway.gatewayId,
      amount: numericAmount,
      paymentMethod,
      status: 'SUCCESS',
      gatewayReference: refCode,
      responseMessage: `Payment simulated successfully via ${gateway.name} Adapter for Order ${orderId}`,
      transactionDate: new Date().toISOString()
    };

    db.transactions.unshift(newTxn);

    // Auto-create settlement entry for reconciliation
    const feeRate = gateway.feePercent / 100;
    const fee = parseFloat((numericAmount * feeRate).toFixed(2));
    const net = parseFloat((numericAmount - fee).toFixed(2));
    db.settlements.unshift({
      settlementId: 30000 + db.settlements.length + 1,
      settlementCode: `SET-${30000 + db.settlements.length + 1}`,
      merchantId: merchant.merchantId,
      gatewayId: gateway.gatewayId,
      grossAmount: numericAmount,
      feeDeducted: fee,
      netAmount: net,
      status: 'SETTLED',
      settlementDate: new Date().toISOString()
    });

    return res.json({
      transactionId: newTxn.transactionId,
      transactionCode: newTxn.transactionCode,
      orderId: newTxn.orderId,
      amount: newTxn.amount,
      paymentMethod: newTxn.paymentMethod,
      gateway: gateway.name,
      status: 'SUCCESS',
      message: newTxn.responseMessage,
      customerName: user.name,
      merchantName: merchant.name,
      gatewayReference: refCode,
      transactionDate: newTxn.transactionDate
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Payment processing failed' });
  }
});

// 3. Transactions APIs
app.get('/api/transactions', (req: Request, res: Response) => {
  const result = db.transactions.map(enrichTransaction);
  res.json(result);
});

app.get('/api/transactions/:id', (req: Request, res: Response) => {
  const t = db.transactions.find(tx => tx.transactionId === parseInt(req.params.id));
  if (!t) return res.status(404).json({ error: 'Transaction not found' });
  res.json(enrichTransaction(t));
});

app.get('/api/users/:id/transactions', (req: Request, res: Response) => {
  const uid = parseInt(req.params.id);
  const result = db.transactions
    .filter(t => t.userId === uid)
    .map(enrichTransaction);
  res.json(result);
});

// 4. Merchants APIs
app.get('/api/merchants', (req: Request, res: Response) => {
  res.json(db.merchants);
});

app.get('/api/merchants/:id', (req: Request, res: Response) => {
  const m = db.merchants.find(item => item.merchantId === parseInt(req.params.id));
  if (!m) return res.status(404).json({ error: 'Merchant not found' });
  res.json(m);
});

app.get('/api/merchants/:id/transactions', (req: Request, res: Response) => {
  const mid = parseInt(req.params.id);
  const result = db.transactions
    .filter(t => t.merchantId === mid)
    .map(enrichTransaction);
  res.json(result);
});

app.get('/api/merchants/:id/settlements', (req: Request, res: Response) => {
  const mid = parseInt(req.params.id);
  const result = db.settlements
    .filter(s => s.merchantId === mid)
    .map(s => {
      const g = db.gateways.find(item => item.gatewayId === s.gatewayId);
      return { ...s, gateway: g ? { name: g.name, code: g.code } : null };
    });
  res.json(result);
});

app.get('/api/merchants/:id/summary', (req: Request, res: Response) => {
  const mid = parseInt(req.params.id);
  const merchant = db.merchants.find(m => m.merchantId === mid);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const txns = db.transactions.filter(t => t.merchantId === mid);
  const successTxns = txns.filter(t => t.status === 'SUCCESS');
  const failedTxns = txns.filter(t => t.status === 'FAILED');
  const pendingTxns = txns.filter(t => t.status === 'PENDING');
  const volume = successTxns.reduce((sum, t) => sum + t.amount, 0);

  res.json({
    merchantId: merchant.merchantId,
    merchantName: merchant.name,
    totalTransactions: txns.length,
    successfulPayments: successTxns.length,
    failedPayments: failedTxns.length,
    pendingPayments: pendingTxns.length,
    totalPaymentVolume: volume
  });
});

// 5. Gateways APIs
app.get('/api/gateways', (req: Request, res: Response) => {
  res.json(db.gateways);
});

app.put('/api/gateways/:id/status', (req: Request, res: Response) => {
  const gid = parseInt(req.params.id);
  const gateway = db.gateways.find(g => g.gatewayId === gid);
  if (!gateway) return res.status(404).json({ error: 'Gateway not found' });

  const { status } = req.body || {};
  if (status) {
    gateway.status = status.toUpperCase();
  } else {
    gateway.status = gateway.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }

  res.json(gateway);
});

// 6. Refunds APIs
app.get('/api/refunds', (req: Request, res: Response) => {
  const result = db.refunds.map(r => {
    const t = db.transactions.find(tx => tx.transactionId === r.transactionId);
    const u = t ? db.users.find(user => user.userId === t.userId) : null;
    const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;
    return {
      ...r,
      transactionCode: t ? t.transactionCode : `TXN-${r.transactionId}`,
      customerName: u ? u.name : 'Rahul Sharma',
      merchantName: m ? m.name : 'FoodFast',
      transaction: t ? enrichTransaction(t) : null
    };
  });
  res.json(result);
});

app.get('/api/users/:id/refunds', (req: Request, res: Response) => {
  const uid = parseInt(req.params.id);
  const userTxnIds = new Set(db.transactions.filter(t => t.userId === uid).map(t => t.transactionId));
  const result = db.refunds
    .filter(r => userTxnIds.has(r.transactionId))
    .map(r => {
      const t = db.transactions.find(tx => tx.transactionId === r.transactionId);
      const u = t ? db.users.find(user => user.userId === t.userId) : null;
      const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;
      return {
        ...r,
        transactionCode: t ? t.transactionCode : `TXN-${r.transactionId}`,
        customerName: u ? u.name : 'Customer',
        merchantName: m ? m.name : 'FoodFast',
        transaction: t ? enrichTransaction(t) : null
      };
    });
  res.json(result);
});

app.get('/api/merchants/:id/refunds', (req: Request, res: Response) => {
  const mid = parseInt(req.params.id);
  const merchantTxnIds = new Set(db.transactions.filter(t => t.merchantId === mid).map(t => t.transactionId));
  const result = db.refunds
    .filter(r => merchantTxnIds.has(r.transactionId))
    .map(r => {
      const t = db.transactions.find(tx => tx.transactionId === r.transactionId);
      const u = t ? db.users.find(user => user.userId === t.userId) : null;
      const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;
      return {
        ...r,
        transactionCode: t ? t.transactionCode : `TXN-${r.transactionId}`,
        customerName: u ? u.name : 'Customer',
        merchantName: m ? m.name : 'FoodFast',
        transaction: t ? enrichTransaction(t) : null
      };
    });
  res.json(result);
});

// Customer initiates refund request with strict validations
app.post('/api/refunds', (req: Request, res: Response) => {
  try {
    const { transactionCode, transactionId, amount, reason, userId } = req.body;

    // 1. Transaction exists check (by transactionCode or transactionId)
    const codeQuery = (transactionCode || '').toString().trim().toUpperCase();
    const idQuery = transactionId ? parseInt(transactionId) : NaN;

    const txn = db.transactions.find(t => 
      (codeQuery && t.transactionCode.toUpperCase() === codeQuery) ||
      (!isNaN(idQuery) && t.transactionId === idQuery) ||
      (codeQuery && `TXN-${t.transactionId}`.toUpperCase() === codeQuery)
    );

    if (!txn) {
      return res.status(404).json({
        error: `Transaction not found. Please verify the Transaction Code (e.g., TXN-10001).`
      });
    }

    // 2. Transaction belongs to logged-in customer
    if (userId !== undefined && userId !== null) {
      const parsedUserId = parseInt(userId);
      if (txn.userId !== parsedUserId) {
        return res.status(403).json({
          error: `Transaction does not belong to the logged-in customer account.`
        });
      }
    }

    // 3. Transaction status is SUCCESS
    if (txn.status !== 'SUCCESS') {
      return res.status(400).json({
        error: `Only successful transactions can be refunded. Transaction status is currently ${txn.status}.`
      });
    }

    // 4. Refund amount validation (positive and <= original transaction amount)
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: `Refund amount must be a positive number.`
      });
    }

    if (numericAmount > txn.amount) {
      return res.status(400).json({
        error: `Refund amount (₹${numericAmount}) cannot exceed the original transaction amount (₹${txn.amount}).`
      });
    }

    // Check existing non-rejected refunds for this transaction
    const existingRefundsTotal = db.refunds
      .filter(r => r.transactionId === txn.transactionId && r.status !== 'REJECTED')
      .reduce((sum, r) => sum + r.amount, 0);

    if (existingRefundsTotal + numericAmount > txn.amount) {
      return res.status(400).json({
        error: `Total refunds (₹${existingRefundsTotal + numericAmount}) would exceed original amount (₹${txn.amount}). Already refunded/pending: ₹${existingRefundsTotal}.`
      });
    }

    // 5. Valid refund reason validation
    const allowedReasons = ['Order cancelled', 'Duplicate payment', 'Payment issue', 'Other'];
    const trimmedReason = (reason || '').toString().trim();
    if (!trimmedReason || !allowedReasons.includes(trimmedReason)) {
      return res.status(400).json({
        error: `Please select a valid refund reason: ${allowedReasons.join(', ')}.`
      });
    }

    // 6. Create refund record with status = PENDING (Do NOT immediately mark as COMPLETED)
    const newRefund: RefundRecord = {
      refundId: nextRefundId++,
      refundCode: `REF-${nextRefundId}`,
      transactionId: txn.transactionId,
      amount: numericAmount,
      reason: trimmedReason,
      status: 'PENDING',
      refundDate: new Date().toISOString()
    };

    db.refunds.unshift(newRefund);

    const user = db.users.find(u => u.userId === txn.userId);
    const merchant = db.merchants.find(m => m.merchantId === txn.merchantId);

    return res.status(201).json({
      success: true,
      message: 'Refund Request Submitted',
      refundId: newRefund.refundId,
      refundCode: newRefund.refundCode,
      transactionCode: txn.transactionCode,
      transactionId: txn.transactionId,
      amount: newRefund.amount,
      status: 'PENDING',
      reason: newRefund.reason,
      customerName: user ? user.name : 'Customer',
      merchantName: merchant ? merchant.name : 'Merchant',
      refundDate: newRefund.refundDate
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Refund processing failed' });
  }
});

// Merchant / Admin approve refund: PENDING -> COMPLETED
app.post('/api/refunds/:id/approve', (req: Request, res: Response) => {
  const rid = parseInt(req.params.id);
  const refund = db.refunds.find(r => r.refundId === rid || r.refundCode === req.params.id);
  if (!refund) return res.status(404).json({ error: 'Refund record not found' });

  refund.status = 'COMPLETED';

  const t = db.transactions.find(tx => tx.transactionId === refund.transactionId);
  const u = t ? db.users.find(user => user.userId === t.userId) : null;
  const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;

  return res.json({
    ...refund,
    transactionCode: t ? t.transactionCode : `TXN-${refund.transactionId}`,
    customerName: u ? u.name : 'Customer',
    merchantName: m ? m.name : 'FoodFast',
    transaction: t ? enrichTransaction(t) : null
  });
});

// Merchant / Admin reject refund: PENDING -> REJECTED
app.post('/api/refunds/:id/reject', (req: Request, res: Response) => {
  const rid = parseInt(req.params.id);
  const refund = db.refunds.find(r => r.refundId === rid || r.refundCode === req.params.id);
  if (!refund) return res.status(404).json({ error: 'Refund record not found' });

  refund.status = 'REJECTED';

  const t = db.transactions.find(tx => tx.transactionId === refund.transactionId);
  const u = t ? db.users.find(user => user.userId === t.userId) : null;
  const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;

  return res.json({
    ...refund,
    transactionCode: t ? t.transactionCode : `TXN-${refund.transactionId}`,
    customerName: u ? u.name : 'Customer',
    merchantName: m ? m.name : 'FoodFast',
    transaction: t ? enrichTransaction(t) : null
  });
});

// Update status directly (PUT)
app.put('/api/refunds/:id/status', (req: Request, res: Response) => {
  const rid = parseInt(req.params.id);
  const refund = db.refunds.find(r => r.refundId === rid || r.refundCode === req.params.id);
  if (!refund) return res.status(404).json({ error: 'Refund record not found' });

  const { status } = req.body || {};
  if (!['PENDING', 'COMPLETED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be PENDING, COMPLETED, or REJECTED' });
  }

  refund.status = status;

  const t = db.transactions.find(tx => tx.transactionId === refund.transactionId);
  const u = t ? db.users.find(user => user.userId === t.userId) : null;
  const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;

  return res.json({
    ...refund,
    transactionCode: t ? t.transactionCode : `TXN-${refund.transactionId}`,
    customerName: u ? u.name : 'Customer',
    merchantName: m ? m.name : 'FoodFast',
    transaction: t ? enrichTransaction(t) : null
  });
});

// 7. Admin APIs
app.get('/api/admin/summary', (req: Request, res: Response) => {
  const successTxns = db.transactions.filter(t => t.status === 'SUCCESS');
  const failedTxns = db.transactions.filter(t => t.status === 'FAILED');
  const pendingTxns = db.transactions.filter(t => t.status === 'PENDING');
  const volume = successTxns.reduce((sum, t) => sum + t.amount, 0);

  res.json({
    totalMerchants: db.merchants.length,
    totalGateways: db.gateways.length,
    totalTransactions: db.transactions.length,
    successfulPayments: successTxns.length,
    failedPayments: failedTxns.length,
    pendingPayments: pendingTxns.length,
    totalPaymentVolume: volume
  });
});

app.get('/api/admin/merchants', (req: Request, res: Response) => {
  res.json(db.merchants);
});

app.get('/api/admin/transactions', (req: Request, res: Response) => {
  res.json(db.transactions.map(enrichTransaction));
});

app.get('/api/admin/gateways', (req: Request, res: Response) => {
  res.json(db.gateways);
});

app.get('/api/admin/refunds', (req: Request, res: Response) => {
  const result = db.refunds.map(r => {
    const t = db.transactions.find(tx => tx.transactionId === r.transactionId);
    const u = t ? db.users.find(user => user.userId === t.userId) : null;
    const m = t ? db.merchants.find(merc => merc.merchantId === t.merchantId) : null;
    return {
      ...r,
      transactionCode: t ? t.transactionCode : `TXN-${r.transactionId}`,
      customerName: u ? u.name : 'Customer',
      merchantName: m ? m.name : 'Merchant',
      transaction: t ? enrichTransaction(t) : null
    };
  });
  res.json(result);
});

// Setup Vite development middleware in dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const portNum = Number(PORT) || 3000;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` UNIPAY Full-Stack Server listening on 0.0.0.0:${portNum}`);
    console.log(` Spring Boot REST API mirror active on /api/*`);
    console.log(` Vanilla Frontend available on /unipay-frontend/index.html`);
    console.log(`=======================================================`);
  });
}

startServer();
