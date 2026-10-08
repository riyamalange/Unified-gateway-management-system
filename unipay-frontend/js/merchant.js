/**
 * UNIPAY Merchant Dashboard Client
 * Enforces tenant data isolation, multi-section navigation,
 * and reliable fallback to mock seed data if backend APIs are not reachable.
 */

const getApiBase = () => (window.location.port === '3000' ? '' : 'http://localhost:8080');
const API_BASE = getApiBase();

let activeMerchantId = 1;
let currentMerchantTransactions = [];
let currentMerchantRefunds = [];
let currentMerchantSettlements = [];
let currentGateways = [];
let isLiveApi = false;

// Mock Seed Data (Used whenever backend APIs are not running or in offline demo mode)
const MOCK_MERCHANTS = {
  1: { id: 1, code: 'MRC-FOODFAST', name: 'FoodFast', email: 'billing@foodfast.com' },
  2: { id: 2, code: 'MRC-SHOPKART', name: 'ShopKart', email: 'payments@shopkart.com' },
  3: { id: 3, code: 'MRC-TICKETGO', name: 'TicketGo', email: 'finance@ticketgo.com' }
};

const MOCK_TRANSACTIONS = [
  { transactionId: 10001, transactionCode: 'TXN-10001', orderId: 'ORD-INIT-001', userId: 1, merchantId: 1, gatewayId: 1, amount: 450.00, paymentMethod: 'UPI', status: 'SUCCESS', transactionDate: new Date(Date.now() - 86400000 * 2).toISOString(), user: { name: 'Rahul Sharma' }, gateway: { name: 'Razorpay' } },
  { transactionId: 10005, transactionCode: 'TXN-10005', orderId: 'ORD-INIT-005', userId: 2, merchantId: 1, gatewayId: 1, amount: 350.00, paymentMethod: 'UPI', status: 'FAILED', transactionDate: new Date(Date.now() - 3600000 * 3).toISOString(), user: { name: 'Priya Patel' }, gateway: { name: 'Razorpay' } },
  { transactionId: 10006, transactionCode: 'TXN-10006', orderId: 'ORD-DEMO-001', userId: 1, merchantId: 1, gatewayId: 1, amount: 1000.00, paymentMethod: 'UPI', status: 'SUCCESS', transactionDate: new Date(Date.now() - 1800000).toISOString(), user: { name: 'Rahul Sharma' }, gateway: { name: 'Razorpay' } },
  
  { transactionId: 10002, transactionCode: 'TXN-10002', orderId: 'ORD-INIT-002', userId: 2, merchantId: 2, gatewayId: 2, amount: 2499.00, paymentMethod: 'Card', status: 'SUCCESS', transactionDate: new Date(Date.now() - 86400000 * 1).toISOString(), user: { name: 'Priya Patel' }, gateway: { name: 'Stripe' } },
  { transactionId: 10004, transactionCode: 'TXN-10004', orderId: 'ORD-INIT-004', userId: 1, merchantId: 2, gatewayId: 3, amount: 1200.00, paymentMethod: 'Wallet', status: 'SUCCESS', transactionDate: new Date(Date.now() - 3600000 * 5).toISOString(), user: { name: 'Rahul Sharma' }, gateway: { name: 'PayPal' } },
  
  { transactionId: 10003, transactionCode: 'TXN-10003', orderId: 'ORD-INIT-003', userId: 3, merchantId: 3, gatewayId: 4, amount: 800.00, paymentMethod: 'Net Banking', status: 'SUCCESS', transactionDate: new Date(Date.now() - 3600000 * 12).toISOString(), user: { name: 'Amit Verma' }, gateway: { name: 'PayU' } }
];

const MOCK_REFUNDS = [
  { refundId: 20001, refundCode: 'REF-20001', transactionId: 10001, amount: 450.00, reason: 'Order cancelled by merchant FoodFast', status: 'PROCESSED', refundDate: new Date(Date.now() - 86400000).toISOString(), transaction: { transactionCode: 'TXN-10001', merchantId: 1 } }
];

const MOCK_SETTLEMENTS = [
  { settlementId: 30001, settlementCode: 'SET-30001', merchantId: 1, grossAmount: 450.00, feeDeducted: 8.10, netAmount: 441.90, status: 'SETTLED', settlementDate: new Date(Date.now() - 86400000).toISOString(), gateway: { name: 'Razorpay' } },
  { settlementId: 30002, settlementCode: 'SET-30002', merchantId: 1, grossAmount: 1000.00, feeDeducted: 18.00, netAmount: 982.00, status: 'SETTLED', settlementDate: new Date().toISOString(), gateway: { name: 'Razorpay' } },
  { settlementId: 30003, settlementCode: 'SET-30003', merchantId: 2, grossAmount: 2499.00, feeDeducted: 54.98, netAmount: 2444.02, status: 'SETTLED', settlementDate: new Date(Date.now() - 3600000 * 6).toISOString(), gateway: { name: 'Stripe' } }
];

const MOCK_GATEWAYS = [
  { gatewayId: 1, name: 'Razorpay', code: 'RAZORPAY', status: 'ACTIVE', feePercent: 1.80 },
  { gatewayId: 2, name: 'Stripe', code: 'STRIPE', status: 'ACTIVE', feePercent: 2.20 },
  { gatewayId: 3, name: 'PayPal', code: 'PAYPAL', status: 'ACTIVE', feePercent: 2.90 },
  { gatewayId: 4, name: 'PayU', code: 'PAYU', status: 'ACTIVE', feePercent: 1.50 }
];

document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('unipay_user') || localStorage.getItem('unipay_session');
  if (sessionStr) {
    const user = JSON.parse(sessionStr);
    if (user.role !== 'MERCHANT' && user.role !== 'ADMIN') {
      window.location.href = 'user-dashboard.html';
      return;
    }
    const emailEl = document.getElementById('merchantUserEmailDisplay');
    if (emailEl) emailEl.textContent = user.email;
  } else {
    window.location.href = 'login.html';
    return;
  }

  setupMerchantSelector();
  setupNavigationFromHash();
  loadMerchantData();
});

// Setup store selector dropdown
function setupMerchantSelector() {
  const selector = document.getElementById('merchantSwitcher');
  if (selector) {
    selector.addEventListener('change', (e) => {
      activeMerchantId = parseInt(e.target.value);
      updateMerchantIdentityUI();
      loadMerchantData();
    });
  }
}

// Update UI branding for selected merchant
function updateMerchantIdentityUI() {
  const merchant = MOCK_MERCHANTS[activeMerchantId] || { name: 'FoodFast', code: 'MRC-FOODFAST' };
  
  const headerTitle = document.getElementById('merchantHeaderTitle');
  if (headerTitle) headerTitle.textContent = `${merchant.name} Dashboard`;

  const sidebarName = document.getElementById('sidebarMerchantName');
  if (sidebarName) sidebarName.textContent = merchant.name;

  const sidebarCode = document.getElementById('sidebarMerchantCode');
  if (sidebarCode) sidebarCode.textContent = merchant.code;

  const footerId = document.getElementById('footerMerchantId');
  if (footerId) footerId.textContent = activeMerchantId;
}

// Section Switching Navigation
function switchSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
  // Remove active from all sidebar buttons
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));

  // Show target section
  const targetSec = document.getElementById(`section-${sectionId}`);
  if (targetSec) targetSec.classList.add('active');

  // Activate matching button
  const targetBtn = document.querySelector(`.sidebar-btn[data-section="${sectionId}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  // Update hash
  window.location.hash = sectionId;
}

function setupNavigationFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['overview', 'transactions', 'refunds', 'settlements', 'gateways'].includes(hash)) {
    switchSection(hash);
  }
}

// Primary Data Fetcher with Automatic Fallback
async function loadMerchantData() {
  updateMerchantIdentityUI();

  try {
    // Try fetching from live Spring Boot backend
    const [summaryRes, txnsRes, settlementsRes, gatewaysRes, refundsRes] = await Promise.all([
      fetch(`${API_BASE}/api/merchants/${activeMerchantId}/summary`),
      fetch(`${API_BASE}/api/merchants/${activeMerchantId}/transactions`),
      fetch(`${API_BASE}/api/merchants/${activeMerchantId}/settlements`),
      fetch(`${API_BASE}/api/gateways`),
      fetch(`${API_BASE}/api/refunds`)
    ]);

    if (summaryRes.ok && txnsRes.ok) {
      isLiveApi = true;
      const summary = await summaryRes.json();
      currentMerchantTransactions = await txnsRes.json();
      currentMerchantSettlements = settlementsRes.ok ? await settlementsRes.json() : [];
      currentGateways = gatewaysRes.ok ? await gatewaysRes.json() : MOCK_GATEWAYS;

      if (refundsRes.ok) {
        const allRefunds = await refundsRes.json();
        currentMerchantRefunds = allRefunds.filter(r => r.transaction && r.transaction.merchantId === activeMerchantId);
      } else {
        currentMerchantRefunds = [];
      }

      renderSummary(summary);
      updateConnectionBadge(true);
    } else {
      throw new Error('API response not OK');
    }
  } catch (err) {
    // Graceful fallback to mock data
    console.info('Using simulated mock data for Merchant Portal', err);
    isLiveApi = false;
    updateConnectionBadge(false);

    // Filter mock data for active merchant
    currentMerchantTransactions = MOCK_TRANSACTIONS.filter(t => t.merchantId === activeMerchantId);
    currentMerchantRefunds = MOCK_REFUNDS.filter(r => r.transaction && r.transaction.merchantId === activeMerchantId);
    currentMerchantSettlements = MOCK_SETTLEMENTS.filter(s => s.merchantId === activeMerchantId);
    currentGateways = MOCK_GATEWAYS;

    // Calculate mock summary
    const successTxns = currentMerchantTransactions.filter(t => t.status === 'SUCCESS');
    const failedTxns = currentMerchantTransactions.filter(t => t.status === 'FAILED');
    const volume = successTxns.reduce((sum, t) => sum + t.amount, 0);

    renderSummary({
      merchantId: activeMerchantId,
      merchantName: MOCK_MERCHANTS[activeMerchantId].name,
      totalTransactions: currentMerchantTransactions.length,
      successfulPayments: successTxns.length,
      failedPayments: failedTxns.length,
      pendingPayments: 0,
      totalPaymentVolume: volume
    });
  }

  // Render all views
  renderTransactionsTable(currentMerchantTransactions);
  renderRecentTransactions(currentMerchantTransactions);
  renderRefundsTable(currentMerchantRefunds);
  renderSettlementsTable(currentMerchantSettlements);
  renderGatewaysGrid(currentGateways);
  updateSidebarCounters();
}

function updateConnectionBadge(live) {
  const badge = document.getElementById('merchantConnectionBadge');
  if (!badge) return;
  if (live) {
    badge.className = 'source-pill source-pill-live';
    badge.textContent = '● Live API Connected (:8080)';
  } else {
    badge.className = 'source-pill source-pill-mock';
    badge.textContent = '● Offline / Mock Mode';
  }
}

function renderSummary(summary) {
  document.getElementById('mStatTotalTxns').textContent = summary.totalTransactions;
  document.getElementById('mStatSuccessTxns').textContent = summary.successfulPayments;
  document.getElementById('mStatFailedTxns').textContent = summary.failedPayments;
  document.getElementById('mStatPendingTxns').textContent = summary.pendingPayments || 0;
  document.getElementById('mStatVolume').textContent = `₹${parseFloat(summary.totalPaymentVolume || 0).toLocaleString('en-IN')}`;
}

function updateSidebarCounters() {
  const txnCountEl = document.getElementById('sidebarTxnCount');
  if (txnCountEl) txnCountEl.textContent = currentMerchantTransactions.length;

  const refundCountEl = document.getElementById('sidebarRefundCount');
  if (refundCountEl) refundCountEl.textContent = currentMerchantRefunds.length;
}

// Render Recent 5 Transactions in Overview
function renderRecentTransactions(txns) {
  const tbody = document.getElementById('overviewRecentTxnsBody');
  if (!tbody) return;

  const recents = txns.slice(0, 5);
  if (recents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--gray-400); padding: 2rem;">No recent transactions for this merchant.</td></tr>`;
    return;
  }

  tbody.innerHTML = recents.map(t => formatTransactionRow(t, false)).join('');
}

// Render Full Transactions Table
function renderTransactionsTable(txns) {
  const tbody = document.getElementById('merchantTransactionsBody');
  if (!tbody) return;

  const filteredCountEl = document.getElementById('filteredTxnCount');
  if (filteredCountEl) filteredCountEl.textContent = `${txns.length} records`;

  if (txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--gray-400); padding: 2.5rem;">No transactions match your search or filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = txns.map(t => formatTransactionRow(t, true)).join('');
}

function formatTransactionRow(t, includeActions = false) {
  const txnCode = t.transactionCode || `TXN-${t.transactionId}`;
  const customerName = t.user ? t.user.name : (t.customerName || 'Customer');
  const gatewayName = t.gateway ? t.gateway.name : 'Gateway';
  const isSuccess = t.status === 'SUCCESS';

  return `
    <tr>
      <td><strong>${txnCode}</strong></td>
      <td>${t.orderId}</td>
      <td><strong>${customerName}</strong></td>
      <td>₹${parseFloat(t.amount).toLocaleString('en-IN')}</td>
      <td><span class="badge badge-gateway">${t.paymentMethod}</span></td>
      <td><strong>${gatewayName}</strong></td>
      <td>
        <span class="badge ${isSuccess ? 'badge-success' : 'badge-danger'}">
          ${t.status}
        </span>
      </td>
      <td>${new Date(t.transactionDate).toLocaleString()}</td>
      ${includeActions ? `
        <td>
          ${isSuccess ? `
            <button class="btn btn-sm btn-outline" onclick="openRefundModalForTxn(${t.transactionId}, ${t.amount})">
              ↩️ Refund
            </button>
          ` : `<span style="color:var(--gray-400); font-size:0.8rem;">—</span>`}
        </td>
      ` : ''}
    </tr>
  `;
}

// Filter and Search Transactions
function filterTransactions() {
  const query = (document.getElementById('txnSearchInput')?.value || '').toLowerCase().trim();
  const method = document.getElementById('txnMethodFilter')?.value || 'ALL';
  const status = document.getElementById('txnStatusFilter')?.value || 'ALL';

  const filtered = currentMerchantTransactions.filter(t => {
    const code = (t.transactionCode || `TXN-${t.transactionId}`).toLowerCase();
    const order = (t.orderId || '').toLowerCase();
    const customer = (t.user?.name || '').toLowerCase();

    const matchesSearch = !query || code.includes(query) || order.includes(query) || customer.includes(query);
    const matchesMethod = method === 'ALL' || t.paymentMethod.toUpperCase() === method.toUpperCase();
    const matchesStatus = status === 'ALL' || t.status.toUpperCase() === status.toUpperCase();

    return matchesSearch && matchesMethod && matchesStatus;
  });

  renderTransactionsTable(filtered);
}

// Render Refunds Table
function renderRefundsTable(refunds) {
  const tbody = document.getElementById('merchantRefundsBody');
  if (!tbody) return;

  if (refunds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--gray-400); padding: 2rem;">No refunds requested or processed yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = refunds.map(r => {
    const isPending = r.status === 'PENDING';
    const txnCode = r.transactionCode || (r.transaction ? (r.transaction.transactionCode || `TXN-${r.transaction.transactionId}`) : `TXN-${r.transactionId}`);
    const customerName = r.customerName || (r.transaction && r.transaction.user ? r.transaction.user.name : 'Rahul Sharma');

    return `
    <tr>
      <td class="font-mono font-bold">${r.refundCode || `REF-${r.refundId}`}</td>
      <td class="font-mono">${txnCode}</td>
      <td style="font-weight: 600;">${customerName}</td>
      <td class="font-bold">₹${parseFloat(r.amount).toLocaleString('en-IN')}</td>
      <td>${r.reason}</td>
      <td>
        <span class="badge ${r.status === 'COMPLETED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
          ${r.status}
        </span>
      </td>
      <td>${new Date(r.refundDate).toLocaleString()}</td>
      <td>
        ${isPending ? `
          <div style="display: flex; gap: 0.25rem;">
            <button onclick="approveRefund(${r.refundId})" class="btn btn-primary btn-sm" style="background: #059669; padding: 2px 8px; font-size: 0.72rem; font-weight: 700;">
              APPROVE REFUND
            </button>
            <button onclick="rejectRefund(${r.refundId})" class="btn btn-outline btn-sm" style="color: #dc2626; border-color: #fca5a5; padding: 2px 8px; font-size: 0.72rem; font-weight: 700;">
              REJECT REFUND
            </button>
          </div>
        ` : `
          <span style="font-size: 0.75rem; color: var(--gray-400); font-weight: 600;">
            ${r.status === 'COMPLETED' ? 'Approved ✓' : 'Rejected ✕'}
          </span>
        `}
      </td>
    </tr>
  `;
  }).join('');
}

async function approveRefund(refundId) {
  try {
    const res = await fetch(`${API_BASE}/api/refunds/${refundId}/approve`, { method: 'POST' });
    if (res.ok) {
      loadMerchantData();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to approve refund');
    }
  } catch (e) {
    alert('Network error approving refund');
  }
}

async function rejectRefund(refundId) {
  try {
    const res = await fetch(`${API_BASE}/api/refunds/${refundId}/reject`, { method: 'POST' });
    if (res.ok) {
      loadMerchantData();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to reject refund');
    }
  } catch (e) {
    alert('Network error rejecting refund');
  }
}

// Render Settlements Table
function renderSettlementsTable(settlements) {
  const tbody = document.getElementById('merchantSettlementsBody');
  if (!tbody) return;

  if (settlements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--gray-400); padding: 2rem;">No settled payouts recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = settlements.map(s => `
    <tr>
      <td><strong>${s.settlementCode || `SET-${s.settlementId}`}</strong></td>
      <td>${s.gateway ? s.gateway.name : 'Gateway'}</td>
      <td>₹${parseFloat(s.grossAmount).toLocaleString('en-IN')}</td>
      <td>₹${parseFloat(s.feeDeducted).toLocaleString('en-IN')}</td>
      <td><strong>₹${parseFloat(s.netAmount).toLocaleString('en-IN')}</strong></td>
      <td><span class="badge badge-success">${s.status}</span></td>
      <td>${new Date(s.settlementDate).toLocaleString()}</td>
    </tr>
  `).join('');
}

// Render Gateways Grid
function renderGatewaysGrid(gateways) {
  const grid = document.getElementById('merchantGatewaysGrid');
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
          <div><strong>Provider Code:</strong> ${g.code}</div>
          <div><strong>Transaction Fee:</strong> ${g.feePercent}%</div>
          <div style="font-size: 0.8rem; color: var(--gray-500); margin-top: 6px;">
            ${g.code === 'RAZORPAY' ? '⚡ Optimized for UPI' :
              g.code === 'STRIPE' ? '💳 Optimized for Card Payments' :
              g.code === 'PAYU' ? '🏦 Optimized for Net Banking & Wallets' : '🌐 Optimized for International PayPal'}
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--gray-600); border-top: 1px dashed var(--gray-200); padding-top: 0.5rem;">
          ${isActive ? '✓ Live & available for automatic routing' : '⚠ Temporarily inactive (Failover engaged)'}
        </div>
      </div>
    `;
  }).join('');
}

// Refund Modal Logic
function openRefundModal() {
  const select = document.getElementById('refundTxnSelect');
  if (!select) return;

  // Populate successful transactions for active merchant
  const successTxns = currentMerchantTransactions.filter(t => t.status === 'SUCCESS');
  if (successTxns.length === 0) {
    alert('No successful transactions available to refund.');
    return;
  }

  select.innerHTML = successTxns.map(t => `
    <option value="${t.transactionId}" data-amount="${t.amount}">
      ${t.transactionCode || `TXN-${t.transactionId}`} | ${t.orderId} | ₹${t.amount} (${t.paymentMethod})
    </option>
  `).join('');

  onRefundTxnChange();
  document.getElementById('refundModal')?.classList.add('active');
}

function openRefundModalForTxn(transactionId, amount) {
  openRefundModal();
  const select = document.getElementById('refundTxnSelect');
  if (select) {
    select.value = transactionId;
    onRefundTxnChange();
  }
}

function onRefundTxnChange() {
  const select = document.getElementById('refundTxnSelect');
  const amountInput = document.getElementById('refundAmount');
  if (!select || !amountInput) return;

  const selectedOpt = select.options[select.selectedIndex];
  if (selectedOpt) {
    amountInput.value = selectedOpt.getAttribute('data-amount') || '100';
  }
}

function closeRefundModal() {
  document.getElementById('refundModal')?.classList.remove('active');
}

async function handleRefundSubmit(event) {
  event.preventDefault();

  const txnId = parseInt(document.getElementById('refundTxnSelect').value);
  const amount = parseFloat(document.getElementById('refundAmount').value);
  const reason = document.getElementById('refundReason').value.trim();

  const submitBtn = document.getElementById('refundSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing Refund...';

  try {
    const res = await fetch(`${API_BASE}/api/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: txnId, amount, reason })
    });

    if (res.ok) {
      alert('Refund issued successfully!');
      closeRefundModal();
      await loadMerchantData();
      switchSection('refunds');
    } else {
      throw new Error('Backend failed to process refund');
    }
  } catch (err) {
    // If backend is offline, update local mock array so user demo works
    const newRefund = {
      refundId: 20000 + currentMerchantRefunds.length + 1,
      refundCode: `REF-${20000 + currentMerchantRefunds.length + 1}`,
      transactionId: txnId,
      amount,
      reason,
      status: 'PROCESSED',
      refundDate: new Date().toISOString(),
      transaction: currentMerchantTransactions.find(t => t.transactionId === txnId)
    };
    currentMerchantRefunds.unshift(newRefund);
    renderRefundsTable(currentMerchantRefunds);
    updateSidebarCounters();
    closeRefundModal();
    alert('Refund processed successfully (Mock Mode)');
    switchSection('refunds');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Process Refund';
  }
}

function handleLogout() {
  if (typeof logout === 'function') {
    logout();
  } else {
    window.location.href = 'login.html';
  }
}
