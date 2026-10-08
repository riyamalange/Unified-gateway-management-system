/**
 * UNIPAY Admin Dashboard Client
 * System-wide monitoring, multi-section navigation, gateway routing toggles,
 * and seamless fallback to mock data when backend APIs are offline.
 */

const getApiBase = () => (window.location.port === '3000' ? '' : 'http://localhost:8080');
const API_BASE = getApiBase();

let allAdminTransactions = [];
let allAdminMerchants = [];
let allAdminGateways = [];
let allAdminRefunds = [];
let allAdminSettlements = [];
let isLiveApi = false;

// Mock Seed Data (Used whenever backend APIs are not reachable)
const MOCK_ADMIN_MERCHANTS = [
  { merchantId: 1, merchantCode: 'MRC-FOODFAST', name: 'FoodFast', email: 'billing@foodfast.com', apiKey: 'key_live_fdft99281', status: 'ACTIVE' },
  { merchantId: 2, merchantCode: 'MRC-SHOPKART', name: 'ShopKart', email: 'payments@shopkart.com', apiKey: 'key_live_shkp33718', status: 'ACTIVE' },
  { merchantId: 3, merchantCode: 'MRC-TICKETGO', name: 'TicketGo', email: 'finance@ticketgo.com', apiKey: 'key_live_tktg44092', status: 'ACTIVE' }
];

const MOCK_ADMIN_GATEWAYS = [
  { gatewayId: 1, name: 'Razorpay', code: 'RAZORPAY', status: 'ACTIVE', feePercent: 1.80 },
  { gatewayId: 2, name: 'Stripe', code: 'STRIPE', status: 'ACTIVE', feePercent: 2.20 },
  { gatewayId: 3, name: 'PayPal', code: 'PAYPAL', status: 'ACTIVE', feePercent: 2.90 },
  { gatewayId: 4, name: 'PayU', code: 'PAYU', status: 'ACTIVE', feePercent: 1.50 }
];

const MOCK_ADMIN_TRANSACTIONS = [
  { transactionId: 10006, transactionCode: 'TXN-10006', orderId: 'ORD-DEMO-001', userId: 1, merchantId: 1, gatewayId: 1, amount: 1000.00, paymentMethod: 'UPI', status: 'SUCCESS', transactionDate: new Date(Date.now() - 1800000).toISOString(), user: { name: 'Rahul Sharma' }, merchant: { name: 'FoodFast' }, gateway: { name: 'Razorpay' } },
  { transactionId: 10001, transactionCode: 'TXN-10001', orderId: 'ORD-INIT-001', userId: 1, merchantId: 1, gatewayId: 1, amount: 450.00, paymentMethod: 'UPI', status: 'SUCCESS', transactionDate: new Date(Date.now() - 86400000 * 2).toISOString(), user: { name: 'Rahul Sharma' }, merchant: { name: 'FoodFast' }, gateway: { name: 'Razorpay' } },
  { transactionId: 10002, transactionCode: 'TXN-10002', orderId: 'ORD-INIT-002', userId: 2, merchantId: 2, gatewayId: 2, amount: 2499.00, paymentMethod: 'Card', status: 'SUCCESS', transactionDate: new Date(Date.now() - 86400000 * 1).toISOString(), user: { name: 'Priya Patel' }, merchant: { name: 'ShopKart' }, gateway: { name: 'Stripe' } },
  { transactionId: 10003, transactionCode: 'TXN-10003', orderId: 'ORD-INIT-003', userId: 3, merchantId: 3, gatewayId: 4, amount: 800.00, paymentMethod: 'Net Banking', status: 'SUCCESS', transactionDate: new Date(Date.now() - 3600000 * 12).toISOString(), user: { name: 'Amit Verma' }, merchant: { name: 'TicketGo' }, gateway: { name: 'PayU' } },
  { transactionId: 10004, transactionCode: 'TXN-10004', orderId: 'ORD-INIT-004', userId: 1, merchantId: 2, gatewayId: 3, amount: 1200.00, paymentMethod: 'Wallet', status: 'SUCCESS', transactionDate: new Date(Date.now() - 3600000 * 5).toISOString(), user: { name: 'Rahul Sharma' }, merchant: { name: 'ShopKart' }, gateway: { name: 'PayPal' } },
  { transactionId: 10005, transactionCode: 'TXN-10005', orderId: 'ORD-INIT-005', userId: 2, merchantId: 1, gatewayId: 1, amount: 350.00, paymentMethod: 'UPI', status: 'FAILED', transactionDate: new Date(Date.now() - 3600000 * 3).toISOString(), user: { name: 'Priya Patel' }, merchant: { name: 'FoodFast' }, gateway: { name: 'Razorpay' } }
];

const MOCK_ADMIN_REFUNDS = [
  { refundId: 20001, refundCode: 'REF-20001', transactionId: 10001, amount: 450.00, reason: 'Order cancelled by merchant FoodFast', status: 'PROCESSED', refundDate: new Date(Date.now() - 86400000).toISOString(), transaction: { transactionCode: 'TXN-10001' } }
];

const MOCK_ADMIN_SETTLEMENTS = [
  { settlementId: 30001, settlementCode: 'SET-30001', merchantId: 1, merchantName: 'FoodFast', gatewayName: 'Razorpay', grossAmount: 450.00, feeDeducted: 8.10, netAmount: 441.90, status: 'SETTLED', settlementDate: new Date(Date.now() - 86400000).toISOString() },
  { settlementId: 30002, settlementCode: 'SET-30002', merchantId: 1, merchantName: 'FoodFast', gatewayName: 'Razorpay', grossAmount: 1000.00, feeDeducted: 18.00, netAmount: 982.00, status: 'SETTLED', settlementDate: new Date().toISOString() },
  { settlementId: 30003, settlementCode: 'SET-30003', merchantId: 2, merchantName: 'ShopKart', gatewayName: 'Stripe', grossAmount: 2499.00, feeDeducted: 54.98, netAmount: 2444.02, status: 'SETTLED', settlementDate: new Date(Date.now() - 3600000 * 6).toISOString() }
];

document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('unipay_user') || localStorage.getItem('unipay_session');
  if (sessionStr) {
    const user = JSON.parse(sessionStr);
    if (user.role !== 'ADMIN') {
      window.location.href = user.role === 'MERCHANT' ? 'merchant-dashboard.html' : 'user-dashboard.html';
      return;
    }
    const emailEl = document.getElementById('adminUserEmailDisplay');
    if (emailEl) emailEl.textContent = user.email;
  } else {
    window.location.href = 'login.html';
    return;
  }

  setupNavigationFromHash();
  loadAdminData();
});

// Section Switching Navigation
function switchSection(sectionId) {
  document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));

  const targetSec = document.getElementById(`section-${sectionId}`);
  if (targetSec) targetSec.classList.add('active');

  const targetBtn = document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  window.location.hash = sectionId;
}

function setupNavigationFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['overview', 'merchants', 'transactions', 'gateways', 'refunds', 'settlements'].includes(hash)) {
    switchSection(hash);
  }
}

// Primary Data Fetcher with Fallback
async function loadAdminData() {
  try {
    const [summaryRes, merchantsRes, txnsRes, gatewaysRes, refundsRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/summary`),
      fetch(`${API_BASE}/api/admin/merchants`),
      fetch(`${API_BASE}/api/admin/transactions`),
      fetch(`${API_BASE}/api/admin/gateways`),
      fetch(`${API_BASE}/api/admin/refunds`)
    ]);

    if (summaryRes.ok && txnsRes.ok) {
      isLiveApi = true;
      const summary = await summaryRes.json();
      allAdminMerchants = await merchantsRes.json();
      allAdminTransactions = await txnsRes.json();
      allAdminGateways = await gatewaysRes.json();
      allAdminRefunds = refundsRes.ok ? await refundsRes.json() : [];

      // Settlements constructed from transactions or mock
      allAdminSettlements = MOCK_ADMIN_SETTLEMENTS;

      renderAdminSummary(summary);
      updateConnectionBadge(true);
    } else {
      throw new Error('Backend response not OK');
    }
  } catch (err) {
    console.info('Using simulated mock data for Admin Console', err);
    isLiveApi = false;
    updateConnectionBadge(false);

    allAdminMerchants = MOCK_ADMIN_MERCHANTS;
    allAdminTransactions = MOCK_ADMIN_TRANSACTIONS;
    allAdminGateways = MOCK_ADMIN_GATEWAYS;
    allAdminRefunds = MOCK_ADMIN_REFUNDS;
    allAdminSettlements = MOCK_ADMIN_SETTLEMENTS;

    const successTxns = allAdminTransactions.filter(t => t.status === 'SUCCESS');
    const failedTxns = allAdminTransactions.filter(t => t.status === 'FAILED');
    const volume = successTxns.reduce((sum, t) => sum + t.amount, 0);

    renderAdminSummary({
      totalMerchants: allAdminMerchants.length,
      totalGateways: allAdminGateways.length,
      totalTransactions: allAdminTransactions.length,
      successfulPayments: successTxns.length,
      failedPayments: failedTxns.length,
      pendingPayments: 0,
      totalPaymentVolume: volume
    });
  }

  // Render all views
  renderRecentTransactions(allAdminTransactions);
  renderAllTransactions(allAdminTransactions);
  renderMerchantsTable(allAdminMerchants);
  renderGatewaysGrid(allAdminGateways);
  renderRefundsTable(allAdminRefunds);
  renderSettlementsTable(allAdminSettlements);
  updateSidebarCounters();
}

function updateConnectionBadge(live) {
  const badge = document.getElementById('adminConnectionBadge');
  if (!badge) return;
  if (live) {
    badge.className = 'source-pill source-pill-live';
    badge.textContent = '● Live API Connected (:8080)';
  } else {
    badge.className = 'source-pill source-pill-mock';
    badge.textContent = '● Offline / Mock Mode';
  }
}

function renderAdminSummary(summary) {
  document.getElementById('aStatMerchants').textContent = summary.totalMerchants;
  document.getElementById('aStatGateways').textContent = summary.totalGateways;
  document.getElementById('aStatTransactions').textContent = summary.totalTransactions;
  document.getElementById('aStatSuccess').textContent = summary.successfulPayments;
  document.getElementById('aStatFailed').textContent = summary.failedPayments;
  document.getElementById('aStatPending').textContent = summary.pendingPayments || 0;
  document.getElementById('aStatVolume').textContent = `₹${parseFloat(summary.totalPaymentVolume || 0).toLocaleString('en-IN')}`;
}

function updateSidebarCounters() {
  const mCount = document.getElementById('sidebarMerchantsCount');
  if (mCount) mCount.textContent = allAdminMerchants.length;

  const tCount = document.getElementById('sidebarTxnsCount');
  if (tCount) tCount.textContent = allAdminTransactions.length;

  const rCount = document.getElementById('sidebarRefundsCount');
  if (rCount) rCount.textContent = allAdminRefunds.length;
}

// Render Recent 5 Transactions in Overview
function renderRecentTransactions(txns) {
  const tbody = document.getElementById('adminRecentTxnsBody');
  if (!tbody) return;

  const recents = txns.slice(0, 5);
  tbody.innerHTML = recents.map(t => formatTransactionRow(t)).join('');
}

// Render Full Global Transactions Table
function renderAllTransactions(txns) {
  const tbody = document.getElementById('adminTransactionsBody');
  if (!tbody) return;

  const countEl = document.getElementById('adminFilteredCount');
  if (countEl) countEl.textContent = `${txns.length} records`;

  if (txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--gray-400); padding: 2rem;">No system transactions matching query.</td></tr>`;
    return;
  }

  tbody.innerHTML = txns.map(t => formatTransactionRow(t)).join('');
}

function formatTransactionRow(t) {
  const txnCode = t.transactionCode || `TXN-${t.transactionId}`;
  const merchantName = t.merchant ? t.merchant.name : 'FoodFast';
  const customerName = t.user ? t.user.name : (t.customerName || 'Customer');
  const gatewayName = t.gateway ? t.gateway.name : 'Gateway';
  const isSuccess = t.status === 'SUCCESS';

  return `
    <tr>
      <td><strong>${txnCode}</strong></td>
      <td><span class="badge badge-gateway">${merchantName}</span></td>
      <td><strong>${customerName}</strong></td>
      <td>${t.orderId}</td>
      <td>₹${parseFloat(t.amount).toLocaleString('en-IN')}</td>
      <td>${t.paymentMethod}</td>
      <td><strong>${gatewayName}</strong></td>
      <td>
        <span class="badge ${isSuccess ? 'badge-success' : 'badge-danger'}">
          ${t.status}
        </span>
      </td>
      <td>${new Date(t.transactionDate).toLocaleString()}</td>
    </tr>
  `;
}

// Filter Global Transactions
function filterAdminTransactions() {
  const query = (document.getElementById('adminTxnSearchInput')?.value || '').toLowerCase().trim();
  const merchantFilter = document.getElementById('adminMerchantFilter')?.value || 'ALL';
  const methodFilter = document.getElementById('adminMethodFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('adminStatusFilter')?.value || 'ALL';

  const filtered = allAdminTransactions.filter(t => {
    const code = (t.transactionCode || `TXN-${t.transactionId}`).toLowerCase();
    const order = (t.orderId || '').toLowerCase();
    const customer = (t.user?.name || '').toLowerCase();
    const merchant = (t.merchant?.name || '').toLowerCase();

    const matchesSearch = !query || code.includes(query) || order.includes(query) || customer.includes(query) || merchant.includes(query);
    const matchesMerchant = merchantFilter === 'ALL' || (t.merchant?.name || '').toLowerCase() === merchantFilter.toLowerCase();
    const matchesMethod = methodFilter === 'ALL' || t.paymentMethod.toUpperCase() === methodFilter.toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || t.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesMerchant && matchesMethod && matchesStatus;
  });

  renderAllTransactions(filtered);
}

// Render Merchants Table
function renderMerchantsTable(merchants) {
  const tbody = document.getElementById('adminMerchantsBody');
  if (!tbody) return;

  tbody.innerHTML = merchants.map(m => `
    <tr>
      <td><strong>${m.merchantId}</strong></td>
      <td><code>${m.merchantCode}</code></td>
      <td><strong>${m.name}</strong></td>
      <td>${m.email}</td>
      <td><code style="background:var(--gray-100); padding:2px 6px; border-radius:4px;">${m.apiKey}</code></td>
      <td><span class="badge badge-success">${m.status}</span></td>
      <td>
        <a href="merchant-dashboard.html#transactions" class="btn btn-sm btn-outline">
          View Portal →
        </a>
      </td>
    </tr>
  `).join('');
}

// Render Gateways with Toggle Switcher
function renderGatewaysGrid(gateways) {
  const grid = document.getElementById('adminGatewaysGrid');
  if (!grid) return;

  grid.innerHTML = gateways.map(g => {
    const isActive = g.status === 'ACTIVE';
    return `
      <div class="gateway-card">
        <div class="gateway-header">
          <span class="gateway-name">${g.name}</span>
          <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${g.status}</span>
        </div>
        <div class="gateway-meta">
          <div><strong>Gateway Code:</strong> ${g.code}</div>
          <div><strong>Fee Commission:</strong> ${g.feePercent}% per transaction</div>
          <div style="font-size: 0.8rem; color: var(--gray-500); margin-top: 6px;">
            ${g.code === 'RAZORPAY' ? '⚡ Preferred for UPI' :
              g.code === 'STRIPE' ? '💳 Preferred for Card Payments' :
              g.code === 'PAYU' ? '🏦 Preferred for Net Banking & Wallet' : '🌐 Preferred for PayPal'}
          </div>
        </div>
        <button
          class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}"
          onclick="toggleGatewayStatus(${g.gatewayId})"
          style="width: 100%; margin-top: 0.5rem;"
        >
          ${isActive ? 'Deactivate Gateway' : 'Activate Gateway'}
        </button>
      </div>
    `;
  }).join('');
}

// Toggle Gateway Active/Inactive
async function toggleGatewayStatus(gatewayId) {
  try {
    const res = await fetch(`${API_BASE}/api/gateways/${gatewayId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      await loadAdminData();
    } else {
      throw new Error('API failed to toggle gateway');
    }
  } catch (err) {
    // Local fallback update for offline demo
    const g = allAdminGateways.find(item => item.gatewayId === gatewayId);
    if (g) {
      g.status = g.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      renderGatewaysGrid(allAdminGateways);
      alert(`Gateway ${g.name} status toggled to ${g.status} (Offline Mode)`);
    }
  }
}

// Render Refunds Table
function renderRefundsTable(refunds) {
  const tbody = document.getElementById('adminRefundsBody');
  if (!tbody) return;

  if (refunds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--gray-400); padding: 2rem;">No refunds requested yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = refunds.map(r => {
    const txnCode = r.transactionCode || (r.transaction ? (r.transaction.transactionCode || `TXN-${r.transaction.transactionId}`) : `TXN-${r.transactionId}`);
    const merchantName = r.merchantName || (r.transaction && r.transaction.merchant ? r.transaction.merchant.name : 'FoodFast');
    const customerName = r.customerName || (r.transaction && r.transaction.user ? r.transaction.user.name : 'Customer');

    return `
    <tr>
      <td class="font-mono font-bold">${r.refundCode || `REF-${r.refundId}`}</td>
      <td class="font-mono"><strong>${txnCode}</strong></td>
      <td><span class="badge badge-gateway">${merchantName}</span></td>
      <td><strong>${customerName}</strong></td>
      <td class="font-bold">₹${parseFloat(r.amount).toLocaleString('en-IN')}</td>
      <td>${r.reason}</td>
      <td>
        <span class="badge ${r.status === 'COMPLETED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
          ${r.status}
        </span>
      </td>
      <td>${new Date(r.refundDate).toLocaleString()}</td>
    </tr>
  `;
  }).join('');
}

// Render Settlements Table
function renderSettlementsTable(settlements) {
  const tbody = document.getElementById('adminSettlementsBody');
  if (!tbody) return;

  tbody.innerHTML = settlements.map(s => `
    <tr>
      <td><strong>${s.settlementCode}</strong></td>
      <td><span class="badge badge-gateway">${s.merchantName}</span></td>
      <td>${s.gatewayName}</td>
      <td>₹${parseFloat(s.grossAmount).toLocaleString('en-IN')}</td>
      <td>₹${parseFloat(s.feeDeducted).toLocaleString('en-IN')}</td>
      <td><strong>₹${parseFloat(s.netAmount).toLocaleString('en-IN')}</strong></td>
      <td><span class="badge badge-success">${s.status}</span></td>
      <td>${new Date(s.settlementDate).toLocaleString()}</td>
    </tr>
  `).join('');
}

function handleLogout() {
  if (typeof logout === 'function') {
    logout();
  } else {
    window.location.href = 'login.html';
  }
}
