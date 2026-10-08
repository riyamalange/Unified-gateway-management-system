import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  User as UserIcon,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  merchantId?: number;
}

interface Transaction {
  transactionId: number;
  transactionCode: string;
  orderId: string;
  userId: number;
  merchantId: number;
  gatewayId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  gatewayReference: string;
  responseMessage: string;
  transactionDate: string;
  user?: { name: string; email: string };
  merchant?: { name: string; merchantCode: string };
  gateway?: { name: string; code: string };
}

interface Gateway {
  gatewayId: number;
  name: string;
  code: string;
  status: string;
  feePercent: number;
}

interface Merchant {
  merchantId: number;
  merchantCode: string;
  name: string;
  email: string;
  apiKey: string;
  status: string;
}

interface Refund {
  refundId: number;
  refundCode: string;
  transactionId: number;
  transactionCode?: string;
  customerName?: string;
  merchantName?: string;
  amount: number;
  reason: string;
  status: string; // PENDING, COMPLETED, REJECTED
  refundDate: string;
  transaction?: Transaction;
}

interface Settlement {
  settlementId: number;
  settlementCode: string;
  merchantId: number;
  grossAmount: number;
  feeDeducted: number;
  netAmount: number;
  status: string;
  settlementDate: string;
  gateway?: { name: string };
}

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('unipay_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [suggestedPasswordNotice, setSuggestedPasswordNotice] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active section tabs within each role dashboard
  const [customerTab, setCustomerTab] = useState<'payment' | 'refund' | 'history'>('payment');
  const [merchantTab, setMerchantTab] = useState<'dashboard' | 'transactions' | 'refunds' | 'settlements' | 'gateways'>('dashboard');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'merchants' | 'transactions' | 'gateways' | 'refunds' | 'settlements'>('dashboard');

  // Customer Payment Form State
  const [orderId, setOrderId] = useState('ORD-DEMO-001');
  const [amount, setAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);

  // Customer Refund Request State
  const [refundTxnCode, setRefundTxnCode] = useState('TXN-10001');
  const [refundAmount, setRefundAmount] = useState('450');
  const [refundReason, setRefundReason] = useState('Order cancelled');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccessResult, setRefundSuccessResult] = useState<any>(null);
  const [userRefunds, setUserRefunds] = useState<Refund[]>([]);

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [merchantSummary, setMerchantSummary] = useState<any>(null);
  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [adminMerchantFilter, setAdminMerchantFilter] = useState('ALL');

  // Save session
  const saveSession = (user: AuthUser | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('unipay_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('unipay_session');
    }
  };

  // Fetch role-specific data
  const fetchData = async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      if (currentUser.role === 'CUSTOMER') {
        const [txRes, refRes] = await Promise.all([
          fetch(`/api/users/${currentUser.userId}/transactions`).then(r => r.ok ? r.json() : []),
          fetch(`/api/users/${currentUser.userId}/refunds`).then(r => r.ok ? r.json() : [])
        ]);
        setTransactions(txRes);
        setUserRefunds(refRes);
      } else if (currentUser.role === 'MERCHANT') {
        const mId = currentUser.merchantId || 1;
        const [sumRes, txnRes, setRes, gRes, refRes] = await Promise.all([
          fetch(`/api/merchants/${mId}/summary`).then(r => r.ok ? r.json() : null),
          fetch(`/api/merchants/${mId}/transactions`).then(r => r.ok ? r.json() : []),
          fetch(`/api/merchants/${mId}/settlements`).then(r => r.ok ? r.json() : []),
          fetch(`/api/gateways`).then(r => r.ok ? r.json() : []),
          fetch(`/api/merchants/${mId}/refunds`).then(r => r.ok ? r.json() : [])
        ]);
        setMerchantSummary(sumRes);
        setTransactions(txnRes);
        setSettlements(setRes);
        setGateways(gRes);
        setRefunds(refRes);
      } else if (currentUser.role === 'ADMIN') {
        const [sumRes, txnRes, mRes, gRes, refRes] = await Promise.all([
          fetch(`/api/admin/summary`).then(r => r.ok ? r.json() : null),
          fetch(`/api/admin/transactions`).then(r => r.ok ? r.json() : []),
          fetch(`/api/admin/merchants`).then(r => r.ok ? r.json() : []),
          fetch(`/api/admin/gateways`).then(r => r.ok ? r.json() : []),
          fetch(`/api/admin/refunds`).then(r => r.ok ? r.json() : [])
        ]);
        setAdminSummary(sumRes);
        setTransactions(txnRes);
        setMerchants(mRes);
        setGateways(gRes);
        setRefunds(refRes);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const user: AuthUser = {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
          merchantId: data.merchantId || (data.role === 'MERCHANT' ? 1 : undefined)
        };
        saveSession(user);
        // Reset inputs
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setAuthError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setAuthError('Unable to connect to UNIPAY server. Please ensure backend is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Signup
  const generateSecurePassword = (length = 12): string => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    const getRandomChar = (charset: string) => charset[Math.floor(Math.random() * charset.length)];

    // Ensure at least one uppercase, lowercase, number, and symbol
    const passwordChars = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(numbers),
      getRandomChar(symbols),
    ];

    while (passwordChars.length < length) {
      passwordChars.push(getRandomChar(allChars));
    }

    // Shuffle characters
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    return passwordChars.join('');
  };

  const handleSuggestPassword = () => {
    const pwd = generateSecurePassword(12);
    setSignupPassword(pwd);
    setSignupConfirm(pwd);
    setShowSignupPassword(true);
    setSuggestedPasswordNotice('Strong password generated and filled in both fields!');
    setTimeout(() => {
      setSuggestedPasswordNotice('');
    }, 6000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (signupPassword !== signupConfirm) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          confirmPassword: signupConfirm
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const user: AuthUser = {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: 'CUSTOMER'
        };
        saveSession(user);
      } else {
        setAuthError(data.message || 'Signup failed');
      }
    } catch (err) {
      setAuthError('Unable to reach UNIPAY server.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    saveSession(null);
    setPaymentReceipt(null);
  };

  // Handle Customer Payment
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPaymentLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim(),
          amount: parseFloat(amount),
          paymentMethod,
          userId: currentUser.userId,
          merchantId: 1 // Associated with FoodFast merchant context
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'SUCCESS') {
        setPaymentReceipt(data);
        // Generate next suggested order code
        setOrderId(`ORD-DEMO-${Math.floor(100 + Math.random() * 900)}`);
        await fetchData();
      } else {
        alert(`Payment Failed: ${data.error || data.message || 'Unable to route payment'}`);
      }
    } catch (err) {
      alert('Payment processing failed. Could not communicate with server.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle Customer Refund Request
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setRefundError('');
    setRefundLoading(true);

    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionCode: refundTxnCode.trim(),
          amount: parseFloat(refundAmount),
          reason: refundReason,
          userId: currentUser.userId
        })
      });

      const data = await res.json();
      if (res.ok && (data.success || data.status === 'PENDING')) {
        setRefundSuccessResult(data);
        await fetchData();
      } else {
        setRefundError(data.error || data.message || 'Refund request failed. Verify transaction details.');
      }
    } catch (err) {
      setRefundError('Unable to connect to UNIPAY server. Please ensure backend is running.');
    } finally {
      setRefundLoading(false);
    }
  };

  // Handle Merchant / Admin Approve Refund (PENDING -> COMPLETED)
  const handleApproveRefund = async (refundId: number) => {
    try {
      const res = await fetch(`/api/refunds/${refundId}/approve`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve refund');
      }
    } catch (err) {
      alert('Network error while approving refund');
    }
  };

  // Handle Merchant / Admin Reject Refund (PENDING -> REJECTED)
  const handleRejectRefund = async (refundId: number) => {
    try {
      const res = await fetch(`/api/refunds/${refundId}/reject`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reject refund');
      }
    } catch (err) {
      alert('Network error while rejecting refund');
    }
  };

  // Handle Gateway Active/Inactive Toggle (Admin)
  const toggleGateway = async (gatewayId: number) => {
    try {
      const res = await fetch(`/api/gateways/${gatewayId}/status`, { method: 'PUT' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      alert('Failed to update gateway status');
    }
  };

  // Quick fill helper for evaluation demo accounts
  const fillQuickAccount = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  // =========================================================================
  // VIEW 1: LOGIN / SIGN UP (Displayed when user is NOT logged in)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Brand Logo & Name */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white font-extrabold text-2xl shadow-sm mb-3">
              U
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">UNIPAY</h1>
            <p className="text-sm text-slate-500 mt-1">Unified Payment Gateway Platform</p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : 'Sign In'}
              </button>

              {/* Demo Accounts Bar */}
              <div className="pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block mb-2 font-medium">Quick Demo Accounts:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('rahul@gmail.com', '12345')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    Rahul (Customer)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('merchant@gmail.com', '123')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-medium cursor-pointer"
                  >
                    FoodFast (Merchant)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin@gmail.com', '098')}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg font-medium cursor-pointer"
                  >
                    Admin
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. rahul@gmail.com"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestPassword}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 bg-blue-50/50 transition-colors cursor-pointer"
                    title="Generate a random, secure 8+ character password"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Suggest Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 8 characters recommended"
                    required
                    minLength={4}
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={4}
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {suggestedPasswordNotice && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{suggestedPasswordNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(signupPassword)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 ml-2 cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'Creating Account...' : 'Sign Up as Customer'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CUSTOMER DASHBOARD (Role: CUSTOMER)
  // =========================================================================
  if (currentUser.role === 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        {/* Customer Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                U
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">UNIPAY</span>
                <span className="ml-2 text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  Customer Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Welcome, <strong className="text-slate-900">{currentUser.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Customer Main Layout */}
        <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setCustomerTab('payment')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                customerTab === 'payment'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Make a Payment
            </button>
            <button
              onClick={() => setCustomerTab('history')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                customerTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Payment History
            </button>
            <button
              onClick={() => {
                setCustomerTab('refund');
                setRefundError('');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                customerTab === 'refund'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Request Refund
            </button>
          </div>

          {customerTab === 'payment' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Make a Payment</h2>
              <p className="text-xs text-slate-500 mb-6">
                Enter order details. UNIPAY automatically selects and routes to the appropriate payment provider.
              </p>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Amount (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none font-medium"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {paymentLoading ? 'Routing & Processing...' : 'PAY NOW'}
                </button>
              </form>
            </div>
          ) : customerTab === 'refund' ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Request Refund</h2>
                <p className="text-xs text-slate-500 mb-6">
                  Submit a refund request for a successful transaction. The request will be recorded with status PENDING for merchant review.
                </p>

                {refundError && (
                  <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{refundError}</span>
                  </div>
                )}

                {/* Refund Success Banner as requested */}
                {refundSuccessResult && (
                  <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Refund Request Submitted
                    </div>
                    <div className="text-xs space-y-1 text-slate-700">
                      <div>Transaction: <strong className="font-mono text-slate-900">{refundSuccessResult.transactionCode}</strong></div>
                      <div>Refund Amount: <strong className="text-slate-900">₹{parseFloat(String(refundSuccessResult.amount)).toLocaleString('en-IN')}</strong></div>
                      <div>Status: <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">{refundSuccessResult.status}</span></div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRefundSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Transaction Code
                    </label>
                    <input
                      type="text"
                      value={refundTxnCode}
                      onChange={(e) => setRefundTxnCode(e.target.value)}
                      placeholder="e.g. TXN-10001"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-600 outline-none"
                    />

                    {/* Quick pick pills from eligible customer transactions */}
                    {transactions.filter(t => t.status === 'SUCCESS').length > 0 && (
                      <div className="mt-2 text-xs flex flex-wrap items-center gap-1.5 text-slate-500">
                        <span>Select eligible:</span>
                        {transactions.filter(t => t.status === 'SUCCESS').slice(0, 3).map(t => (
                          <button
                            key={t.transactionId}
                            type="button"
                            onClick={() => {
                              setRefundTxnCode(t.transactionCode || `TXN-${t.transactionId}`);
                              setRefundAmount(String(t.amount));
                            }}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] cursor-pointer"
                          >
                            {t.transactionCode || `TXN-${t.transactionId}`} (₹{t.amount})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Refund Amount (INR ₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      min="1"
                      step="0.01"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Reason
                    </label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-blue-600 outline-none font-medium"
                    >
                      <option value="Order cancelled">Order cancelled</option>
                      <option value="Duplicate payment">Duplicate payment</option>
                      <option value="Payment issue">Payment issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={refundLoading}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {refundLoading ? 'Validating & Submitting...' : 'REQUEST REFUND'}
                  </button>
                </form>
              </div>

              {/* Customer's Refund History */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Your Refund Requests</h3>
                  <button onClick={fetchData} className="text-slate-500 hover:text-blue-600 p-1">
                    <RotateCcw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Refund ID</th>
                        <th className="p-3.5">Transaction Code</th>
                        <th className="p-3.5">Refund Amount</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userRefunds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No refund requests yet.
                          </td>
                        </tr>
                      ) : (
                        userRefunds.map((r) => (
                          <tr key={r.refundId}>
                            <td className="p-3.5 font-mono font-bold text-slate-900">{r.refundCode}</td>
                            <td className="p-3.5 font-mono text-slate-700">{r.transactionCode || r.transaction?.transactionCode || `TXN-${r.transactionId}`}</td>
                            <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(r.amount)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5 text-slate-600">{r.reason}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500">{new Date(r.refundDate).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Your Past Transactions</h3>
                <button onClick={fetchData} className="text-slate-500 hover:text-blue-600 p-1">
                  <RotateCcw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Transaction ID</th>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Gateway</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date / Time</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No transactions found. Make a payment above!
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.transactionId} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{t.transactionCode || `TXN-${t.transactionId}`}</td>
                          <td className="p-3.5 text-slate-700">{t.orderId}</td>
                          <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(t.amount)).toLocaleString('en-IN')}</td>
                          <td className="p-3.5 font-medium">{t.paymentMethod}</td>
                          <td className="p-3.5 font-bold text-blue-700">{t.gateway?.name || 'Razorpay'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                              t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{new Date(t.transactionDate).toLocaleString()}</td>
                          <td className="p-3.5">
                            {t.status === 'SUCCESS' && (
                              <button
                                onClick={() => {
                                  setRefundTxnCode(t.transactionCode || `TXN-${t.transactionId}`);
                                  setRefundAmount(String(t.amount));
                                  setRefundSuccessResult(null);
                                  setRefundError('');
                                  setCustomerTab('refund');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                              >
                                Request Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Clean Payment Result Modal */}
        {paymentReceipt && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                ✓
              </div>
              <h3 className="text-lg font-black text-center text-slate-900">Payment Successful</h3>
              <div className="text-2xl font-black text-center text-blue-600 my-2">
                ₹{parseFloat(String(paymentReceipt.amount)).toLocaleString('en-IN')}
              </div>

              <div className="divide-y divide-slate-100 text-xs mt-4">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900">{paymentReceipt.transactionCode}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Order ID</span>
                  <span className="font-medium text-slate-900">{paymentReceipt.orderId}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-900">{paymentReceipt.paymentMethod}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Gateway</span>
                  <span className="font-bold text-blue-700">{paymentReceipt.gateway}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600">{paymentReceipt.status}</span>
                </div>
              </div>

              <button
                onClick={() => setPaymentReceipt(null)}
                className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MERCHANT DASHBOARD (Role: MERCHANT)
  // =========================================================================
  if (currentUser.role === 'MERCHANT') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        {/* Merchant Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                U
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">UNIPAY</span>
                <span className="ml-2 text-xs bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                  Merchant Portal: FoodFast
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Logged in as: <strong className="text-slate-900">{currentUser.email}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
          {/* Merchant Sidebar Navigation */}
          <aside className="w-full md:w-56 shrink-0 bg-white rounded-2xl border border-slate-200 p-3 h-fit space-y-1">
            <button
              onClick={() => setMerchantTab('dashboard')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                merchantTab === 'dashboard' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setMerchantTab('transactions')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                merchantTab === 'transactions' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setMerchantTab('refunds')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                merchantTab === 'refunds' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Refunds
            </button>
            <button
              onClick={() => setMerchantTab('settlements')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                merchantTab === 'settlements' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Settlements
            </button>
            <button
              onClick={() => setMerchantTab('gateways')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                merchantTab === 'gateways' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Gateways
            </button>
          </aside>

          {/* Merchant Content Area */}
          <main className="flex-1 space-y-6">
            {merchantTab === 'dashboard' && (
              <>
                {/* KPI Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Total Transactions</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {merchantSummary ? merchantSummary.totalTransactions : transactions.length}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-emerald-600 uppercase">Successful</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {merchantSummary ? merchantSummary.successfulPayments : transactions.filter(t => t.status === 'SUCCESS').length}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-rose-600 uppercase">Failed</div>
                    <div className="text-2xl font-black text-rose-600 mt-1">
                      {merchantSummary ? merchantSummary.failedPayments : transactions.filter(t => t.status === 'FAILED').length}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-bold text-amber-600 uppercase">Pending</div>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                      {merchantSummary ? merchantSummary.pendingPayments : 0}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
                    <div className="text-[11px] font-bold text-blue-600 uppercase">Total Volume</div>
                    <div className="text-xl font-black text-blue-600 mt-1">
                      ₹{parseFloat(String(merchantSummary?.totalPaymentVolume || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Recent Merchant Transactions */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Recent Transactions (FoodFast)</h3>
                    <button
                      onClick={() => setMerchantTab('transactions')}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Transaction ID</th>
                          <th className="p-3.5">Order ID</th>
                          <th className="p-3.5">Customer Name</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Method</th>
                          <th className="p-3.5">Gateway</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Date / Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.slice(0, 5).map((t) => (
                          <tr key={t.transactionId} className="hover:bg-slate-50">
                            <td className="p-3.5 font-mono font-bold text-slate-900">{t.transactionCode || `TXN-${t.transactionId}`}</td>
                            <td className="p-3.5 text-slate-700">{t.orderId}</td>
                            <td className="p-3.5 font-bold text-slate-900">{t.user?.name || 'Customer'}</td>
                            <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(t.amount)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5 font-medium">{t.paymentMethod}</td>
                            <td className="p-3.5 font-bold text-blue-700">{t.gateway?.name || 'Gateway'}</td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                                t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500">{new Date(t.transactionDate).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {merchantTab === 'transactions' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-900 text-sm">Store Transactions (FoodFast)</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search order or customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium"
                    >
                      <option value="ALL">All Status</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Transaction ID</th>
                        <th className="p-3.5">Order ID</th>
                        <th className="p-3.5">Customer Name</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Payment Method</th>
                        <th className="p-3.5">Gateway</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions
                        .filter(t => {
                          const matchesQuery = !searchQuery ||
                            t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.transactionCode.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
                          return matchesQuery && matchesStatus;
                        })
                        .map((t) => (
                          <tr key={t.transactionId} className="hover:bg-slate-50">
                            <td className="p-3.5 font-mono font-bold text-slate-900">{t.transactionCode || `TXN-${t.transactionId}`}</td>
                            <td className="p-3.5 text-slate-700">{t.orderId}</td>
                            <td className="p-3.5 font-bold text-slate-900">{t.user?.name || 'Customer'}</td>
                            <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(t.amount)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5 font-medium">{t.paymentMethod}</td>
                            <td className="p-3.5 font-bold text-blue-700">{t.gateway?.name || 'Gateway'}</td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                                t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500">{new Date(t.transactionDate).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {merchantTab === 'refunds' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Refund Management (FoodFast)</h3>
                  <button onClick={fetchData} className="text-slate-500 hover:text-blue-600 p-1">
                    <RotateCcw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Refund ID</th>
                        <th className="p-3.5">Transaction Code</th>
                        <th className="p-3.5">Customer Name</th>
                        <th className="p-3.5">Refund Amount</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {refunds.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-slate-400">No refunds recorded.</td></tr>
                      ) : (
                        refunds.map((r) => {
                          const isPending = r.status === 'PENDING';
                          const custName = r.customerName || r.transaction?.user?.name || 'Rahul Sharma';
                          return (
                            <tr key={r.refundId} className="hover:bg-slate-50">
                              <td className="p-3.5 font-mono font-bold text-slate-900">{r.refundCode}</td>
                              <td className="p-3.5 font-mono text-slate-700">{r.transactionCode || r.transaction?.transactionCode || `TXN-${r.transactionId}`}</td>
                              <td className="p-3.5 font-semibold text-slate-900">{custName}</td>
                              <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(r.amount)).toLocaleString('en-IN')}</td>
                              <td className="p-3.5 text-slate-600">{r.reason}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                  r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-500">{new Date(r.refundDate).toLocaleString()}</td>
                              <td className="p-3.5">
                                {isPending ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleApproveRefund(r.refundId)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                                    >
                                      APPROVE REFUND
                                    </button>
                                    <button
                                      onClick={() => handleRejectRefund(r.refundId)}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                                    >
                                      REJECT REFUND
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    {r.status === 'COMPLETED' ? 'Approved ✓' : 'Rejected ✕'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {merchantTab === 'settlements' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">Settlement Payouts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Settlement ID</th>
                        <th className="p-3.5">Gross Amount</th>
                        <th className="p-3.5">Fee Deducted</th>
                        <th className="p-3.5">Net Payout</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {settlements.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No settlements recorded.</td></tr>
                      ) : (
                        settlements.map((s) => (
                          <tr key={s.settlementId}>
                            <td className="p-3.5 font-mono font-bold text-slate-900">{s.settlementCode}</td>
                            <td className="p-3.5">₹{parseFloat(String(s.grossAmount)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5 text-rose-600">₹{parseFloat(String(s.feeDeducted)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5 font-bold text-emerald-600">₹{parseFloat(String(s.netAmount)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{s.status}</span></td>
                            <td className="p-3.5 text-slate-500">{new Date(s.settlementDate).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {merchantTab === 'gateways' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gateways.map((g) => (
                  <div key={g.gatewayId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">{g.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        g.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {g.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div>Code: <strong>{g.code}</strong></div>
                      <div>Processing Fee: <strong>{g.feePercent}%</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: ADMIN DASHBOARD (Role: ADMIN)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              U
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">UNIPAY</span>
              <span className="ml-2 text-xs bg-indigo-50 text-indigo-800 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Administrator: <strong className="text-slate-900">{currentUser.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
        {/* Admin Sidebar Navigation */}
        <aside className="w-full md:w-56 shrink-0 bg-white rounded-2xl border border-slate-200 p-3 h-fit space-y-1">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setAdminTab('merchants')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'merchants' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Merchants
          </button>
          <button
            onClick={() => setAdminTab('transactions')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'transactions' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setAdminTab('gateways')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'gateways' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Gateways
          </button>
          <button
            onClick={() => setAdminTab('refunds')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'refunds' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Refunds
          </button>
          <button
            onClick={() => setAdminTab('settlements')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminTab === 'settlements' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Settlements
          </button>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 space-y-6">
          {adminTab === 'dashboard' && (
            <>
              {/* Admin KPI Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Total Merchants</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {adminSummary ? adminSummary.totalMerchants : merchants.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Connected Gateways</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {adminSummary ? adminSummary.totalGateways : gateways.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Total Transactions</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {adminSummary ? adminSummary.totalTransactions : transactions.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-blue-600 uppercase">Total Volume</div>
                  <div className="text-xl font-black text-blue-600 mt-1">
                    ₹{parseFloat(String(adminSummary?.totalPaymentVolume || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* System Transactions */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">System-Wide Recent Transactions</h3>
                  <button
                    onClick={() => setAdminTab('transactions')}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Transaction ID</th>
                        <th className="p-3.5">Merchant</th>
                        <th className="p-3.5">Customer</th>
                        <th className="p-3.5">Order ID</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Gateway</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 6).map((t) => (
                        <tr key={t.transactionId} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{t.transactionCode || `TXN-${t.transactionId}`}</td>
                          <td className="p-3.5 font-semibold text-amber-700">{t.merchant?.name || 'FoodFast'}</td>
                          <td className="p-3.5 font-medium text-slate-900">{t.user?.name || 'Customer'}</td>
                          <td className="p-3.5 text-slate-700">{t.orderId}</td>
                          <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(t.amount)).toLocaleString('en-IN')}</td>
                          <td className="p-3.5 font-medium">{t.paymentMethod}</td>
                          <td className="p-3.5 font-bold text-blue-700">{t.gateway?.name || 'Gateway'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                              t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{new Date(t.transactionDate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminTab === 'merchants' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Registered Merchants</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Merchant ID</th>
                      <th className="p-3.5">Merchant Code</th>
                      <th className="p-3.5">Business Name</th>
                      <th className="p-3.5">Billing Email</th>
                      <th className="p-3.5">API Key</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {merchants.map((m) => (
                      <tr key={m.merchantId}>
                        <td className="p-3.5 font-bold">{m.merchantId}</td>
                        <td className="p-3.5 font-mono">{m.merchantCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">{m.name}</td>
                        <td className="p-3.5 text-slate-600">{m.email}</td>
                        <td className="p-3.5 font-mono text-slate-500">{m.apiKey}</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{m.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === 'transactions' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 text-sm">System-Wide Transactions</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by order or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                  <select
                    value={adminMerchantFilter}
                    onChange={(e) => setAdminMerchantFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium"
                  >
                    <option value="ALL">All Merchants</option>
                    <option value="FoodFast">FoodFast</option>
                    <option value="ShopKart">ShopKart</option>
                    <option value="TicketGo">TicketGo</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Transaction ID</th>
                      <th className="p-3.5">Merchant</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Gateway</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions
                      .filter(t => {
                        const matchesQuery = !searchQuery ||
                          t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.transactionCode.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesMerchant = adminMerchantFilter === 'ALL' || (t.merchant?.name || '') === adminMerchantFilter;
                        return matchesQuery && matchesMerchant;
                      })
                      .map((t) => (
                        <tr key={t.transactionId} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{t.transactionCode || `TXN-${t.transactionId}`}</td>
                          <td className="p-3.5 font-semibold text-amber-700">{t.merchant?.name || 'FoodFast'}</td>
                          <td className="p-3.5 font-medium text-slate-900">{t.user?.name || 'Customer'}</td>
                          <td className="p-3.5 text-slate-700">{t.orderId}</td>
                          <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(t.amount)).toLocaleString('en-IN')}</td>
                          <td className="p-3.5 font-medium">{t.paymentMethod}</td>
                          <td className="p-3.5 font-bold text-blue-700">{t.gateway?.name || 'Gateway'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                              t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{new Date(t.transactionDate).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === 'gateways' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gateways.map((g) => {
                const isActive = g.status === 'ACTIVE';
                return (
                  <div key={g.gatewayId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">{g.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {g.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div>Code: <strong>{g.code}</strong></div>
                      <div>Processing Fee: <strong>{g.feePercent}%</strong></div>
                      <div className="text-blue-600 font-medium">
                        {g.code === 'RAZORPAY' && 'Preferred for UPI'}
                        {g.code === 'STRIPE' && 'Preferred for Card'}
                        {g.code === 'PAYU' && 'Preferred for Net Banking & Wallet'}
                        {g.code === 'PAYPAL' && 'Preferred for PayPal'}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleGateway(g.gatewayId)}
                      className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isActive ? 'Deactivate Gateway' : 'Activate Gateway'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {adminTab === 'refunds' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">System Refunds Audit Across All Merchants</h3>
                <button onClick={fetchData} className="text-slate-500 hover:text-blue-600 p-1">
                  <RotateCcw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Refund ID</th>
                      <th className="p-3.5">Transaction</th>
                      <th className="p-3.5">Merchant</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Reason</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">No refunds recorded.</td>
                      </tr>
                    ) : (
                      refunds.map((r) => {
                        const isPending = r.status === 'PENDING';
                        const custName = r.customerName || r.transaction?.user?.name || 'Customer';
                        const merchName = r.merchantName || r.transaction?.merchant?.name || 'FoodFast';
                        return (
                          <tr key={r.refundId} className="hover:bg-slate-50">
                            <td className="p-3.5 font-mono font-bold text-slate-900">{r.refundCode}</td>
                            <td className="p-3.5 font-mono text-slate-700">{r.transactionCode || r.transaction?.transactionCode || `TXN-${r.transactionId}`}</td>
                            <td className="p-3.5 font-semibold text-amber-700">{merchName}</td>
                            <td className="p-3.5 font-medium text-slate-900">{custName}</td>
                            <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(String(r.amount)).toLocaleString('en-IN')}</td>
                            <td className="p-3.5 text-slate-600">{r.reason}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500">{new Date(r.refundDate).toLocaleString()}</td>
                            <td className="p-3.5">
                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveRefund(r.refundId)}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                  >
                                    APPROVE
                                  </button>
                                  <button
                                    onClick={() => handleRejectRefund(r.refundId)}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                  >
                                    REJECT
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">{r.status}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === 'settlements' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">System-Wide Settlements</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Settlement ID</th>
                      <th className="p-3.5">Merchant</th>
                      <th className="p-3.5">Gross Amount</th>
                      <th className="p-3.5">Fee Deducted</th>
                      <th className="p-3.5">Net Payout</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3.5 font-mono font-bold">SET-30001</td>
                      <td className="p-3.5 font-semibold text-amber-700">FoodFast</td>
                      <td className="p-3.5">₹450.00</td>
                      <td className="p-3.5 text-rose-600">₹8.10</td>
                      <td className="p-3.5 font-bold text-emerald-600">₹441.90</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">SETTLED</span></td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono font-bold">SET-30002</td>
                      <td className="p-3.5 font-semibold text-amber-700">ShopKart</td>
                      <td className="p-3.5">₹2,499.00</td>
                      <td className="p-3.5 text-rose-600">₹54.98</td>
                      <td className="p-3.5 font-bold text-emerald-600">₹2,444.02</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">SETTLED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
