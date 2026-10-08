/**
 * UNIPAY Customer Portal Client
 */

const getApiBase = () => (window.location.port === '3000' ? '' : 'http://localhost:8080');
const API_BASE = getApiBase();

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check session
  const stored = localStorage.getItem('unipay_user') || localStorage.getItem('unipay_session');
  if (stored) {
    currentUser = JSON.parse(stored);
    if (currentUser.role !== 'CUSTOMER') {
      window.location.href = currentUser.role === 'ADMIN' ? 'admin-dashboard.html' : 'merchant-dashboard.html';
      return;
    }
  } else {
    // If opened directly without logging in, redirect to login page
    window.location.href = 'login.html';
    return;
  }

  // Display user name
  const userNameEl = document.getElementById('customerNameDisplay');
  if (userNameEl) userNameEl.textContent = currentUser.name || 'Rahul Sharma';

  loadUserTransactions();
  loadUserRefunds();

  const form = document.getElementById('paymentForm');
  if (form) form.addEventListener('submit', handlePaymentSubmit);

  const refundForm = document.getElementById('refundForm');
  if (refundForm) refundForm.addEventListener('submit', handleRefundSubmit);
});

function switchCustomerTab(tab) {
  const pSec = document.getElementById('sectionPayment');
  const rSec = document.getElementById('sectionRefund');
  const hSec = document.getElementById('sectionHistory');

  const pBtn = document.getElementById('tabPaymentBtn');
  const rBtn = document.getElementById('tabRefundBtn');
  const hBtn = document.getElementById('tabHistoryBtn');

  if (pSec) pSec.style.display = tab === 'payment' ? 'block' : 'none';
  if (rSec) rSec.style.display = tab === 'refund' ? 'block' : 'none';
  if (hSec) hSec.style.display = tab === 'history' ? 'block' : 'none';

  if (pBtn) {
    pBtn.className = tab === 'payment' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  }
  if (rBtn) {
    rBtn.className = tab === 'refund' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  }
  if (hBtn) {
    hBtn.className = tab === 'history' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  }

  if (tab === 'refund') {
    loadUserRefunds();
  } else if (tab === 'history') {
    loadUserTransactions();
  }
}

async function handleRefundSubmit(event) {
  event.preventDefault();

  const refundBtn = document.getElementById('refundBtn');
  const origText = refundBtn.innerHTML;
  refundBtn.disabled = true;
  refundBtn.innerHTML = 'Validating & Submitting...';

  const txnCode = document.getElementById('refundTxnCode').value.trim();
  const amount = parseFloat(document.getElementById('refundAmount').value);
  const reason = document.getElementById('refundReason').value;

  try {
    const res = await fetch(`${API_BASE}/api/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionCode: txnCode,
        amount,
        reason,
        userId: currentUser.userId
      })
    });

    const data = await res.json();
    if (res.ok && (data.success || data.status === 'PENDING')) {
      // Display result box as requested
      const resultBox = document.getElementById('refundResultBox');
      if (resultBox) {
        document.getElementById('refundResultTxnCode').textContent = data.transactionCode || txnCode;
        document.getElementById('refundResultAmount').textContent = `₹${parseFloat(data.amount).toLocaleString('en-IN')}`;
        document.getElementById('refundResultStatus').textContent = data.status || 'PENDING';
        resultBox.style.display = 'block';
      }

      loadUserRefunds();
    } else {
      alert(`Refund Request Failed: ${data.error || data.message || 'Unable to submit refund request'}`);
    }
  } catch (err) {
    alert('Unable to connect to UNIPAY server. Ensure backend is running.');
  } finally {
    refundBtn.disabled = false;
    refundBtn.innerHTML = origText;
  }
}

async function loadUserRefunds() {
  const tbody = document.getElementById('userRefundsBody');
  if (!tbody || !currentUser) return;

  try {
    const res = await fetch(`${API_BASE}/api/users/${currentUser.userId}/refunds`);
    if (res.ok) {
      const refunds = await res.json();
      if (refunds.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-400); padding: 1.5rem;">No refund requests recorded.</td></tr>`;
        return;
      }

      tbody.innerHTML = refunds.map(r => `
        <tr>
          <td class="font-mono font-bold">${r.refundCode}</td>
          <td class="font-mono">${r.transactionCode || (r.transaction ? r.transaction.transactionCode : `TXN-${r.transactionId}`)}</td>
          <td class="font-bold">₹${parseFloat(r.amount).toLocaleString('en-IN')}</td>
          <td>${r.reason}</td>
          <td>
            <span class="badge ${r.status === 'COMPLETED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}">
              ${r.status}
            </span>
          </td>
          <td>${new Date(r.refundDate).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error fetching refunds', err);
  }
}

async function handlePaymentSubmit(event) {
  event.preventDefault();

  const payBtn = document.getElementById('payBtn');
  const originalText = payBtn.innerHTML;
  payBtn.disabled = true;
  payBtn.innerHTML = 'Processing...';

  const orderId = document.getElementById('orderId').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const paymentMethod = document.getElementById('paymentMethod').value;

  const payload = {
    orderId,
    amount,
    paymentMethod,
    userId: currentUser.userId,
    merchantId: 1 // Associated with FoodFast
  };

  try {
    const res = await fetch(`${API_BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.status === 'SUCCESS') {
      showReceiptModal(data);
      loadUserTransactions();
      // Generate next suggested order code
      document.getElementById('orderId').value = 'ORD-DEMO-' + Math.floor(100 + Math.random() * 900);
    } else {
      alert(`Payment Failed: ${data.message || 'Unable to process payment'}`);
    }
  } catch (err) {
    alert('Unable to connect to UNIPAY server. Ensure backend is running.');
  } finally {
    payBtn.disabled = false;
    payBtn.innerHTML = originalText;
  }
}

function showReceiptModal(txn) {
  document.getElementById('receiptTxnCode').textContent = txn.transactionCode || `TXN-${txn.transactionId}`;
  document.getElementById('receiptOrderId').textContent = txn.orderId;
  document.getElementById('receiptAmount').textContent = `₹${parseFloat(txn.amount).toLocaleString('en-IN')}`;
  document.getElementById('receiptMethod').textContent = txn.paymentMethod;
  document.getElementById('receiptGateway').textContent = txn.gateway;
  document.getElementById('receiptStatus').textContent = txn.status;

  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('active');
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.remove('active');
}

async function loadUserTransactions() {
  const tbody = document.getElementById('userTransactionsBody');
  if (!tbody || !currentUser) return;

  try {
    const res = await fetch(`${API_BASE}/api/users/${currentUser.userId}/transactions`);
    if (res.ok) {
      const transactions = await res.json();
      if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colSpan="8" style="text-align:center; color: var(--gray-400); padding: 2rem;">No past transactions found. Make a payment above!</td></tr>`;
        return;
      }

      tbody.innerHTML = transactions.map(t => {
        const txnCode = t.transactionCode || 'TXN-' + t.transactionId;
        const isSuccess = t.status === 'SUCCESS';
        return `
        <tr>
          <td class="font-mono font-bold">${txnCode}</td>
          <td>${t.orderId}</td>
          <td class="font-bold">₹${parseFloat(t.amount).toLocaleString('en-IN')}</td>
          <td>${t.paymentMethod}</td>
          <td style="color: var(--primary); font-weight: 700;">${t.gateway ? t.gateway.name : 'Razorpay'}</td>
          <td>
            <span class="badge ${isSuccess ? 'badge-success' : 'badge-danger'}">
              ${t.status}
            </span>
          </td>
          <td>${new Date(t.transactionDate).toLocaleString()}</td>
          <td>
            ${isSuccess ? `
              <button onclick="prepareRefund('${txnCode}', ${t.amount})" class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 2px 8px;">
                Request Refund
              </button>
            ` : '<span style="color: var(--gray-400); font-size: 0.75rem;">—</span>'}
          </td>
        </tr>
      `}).join('');
    }
  } catch (err) {
    console.error('Error fetching transactions', err);
  }
}

function prepareRefund(txnCode, amount) {
  const codeEl = document.getElementById('refundTxnCode');
  const amountEl = document.getElementById('refundAmount');
  if (codeEl) codeEl.value = txnCode;
  if (amountEl) amountEl.value = amount;
  switchCustomerTab('refund');
}
