/**
 * UNIPAY Authentication Client (Academic DBMS)
 * Handles Signup, Login, and Session Storage
 */

const getApiBase = () => {
  if (window.location.port === '3000') return '';
  return 'http://localhost:8080';
};

const API_BASE = getApiBase();

function showAlert(message, type = 'error') {
  const alertEl = document.getElementById('alertBox');
  if (!alertEl) return;
  alertEl.textContent = message;
  alertEl.className = `alert alert-${type} active`;
}

function hideAlert() {
  const alertEl = document.getElementById('alertBox');
  if (alertEl) alertEl.className = 'alert';
}

// Generate random secure password (8+ characters with uppercase, lowercase, numbers, symbols)
function generateSecurePassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = upper + lower + numbers + symbols;

  const getRandomChar = (charset) => charset[Math.floor(Math.random() * charset.length)];

  // Guarantee at least 1 uppercase, 1 lowercase, 1 number, 1 symbol
  const chars = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(numbers),
    getRandomChar(symbols)
  ];

  while (chars.length < length) {
    chars.push(getRandomChar(allChars));
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

function suggestPassword() {
  const password = generateSecurePassword(12);
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  if (passwordInput && confirmInput) {
    passwordInput.value = password;
    confirmInput.value = password;
    passwordInput.type = 'text';
    confirmInput.type = 'text';

    showAlert(`Generated secure password: ${password} (applied to both fields)`, 'success');
  }
}

// Signup handler
async function handleSignup(event) {
  event.preventDefault();
  hideAlert();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showAlert('Passwords do not match');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showAlert('Registration successful! Redirecting to login...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } else {
      showAlert(data.message || 'Signup failed');
    }
  } catch (err) {
    showAlert('Unable to connect to UNIPAY Backend. Ensure Spring Boot is running on port 8080.');
  }
}

// Login handler
async function handleLogin(event) {
  event.preventDefault();
  hideAlert();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem('unipay_user', JSON.stringify({
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      showAlert(`Welcome ${data.name}! Redirecting...`, 'success');

      setTimeout(() => {
        if (data.role === 'ADMIN') {
          window.location.href = 'admin-dashboard.html';
        } else if (data.role === 'MERCHANT') {
          window.location.href = 'merchant-dashboard.html';
        } else {
          window.location.href = 'user-dashboard.html';
        }
      }, 700);
    } else {
      showAlert(data.message || 'Invalid email or password');
    }
  } catch (err) {
    showAlert('Unable to connect to UNIPAY Backend. Ensure Spring Boot is running on port 8080.');
  }
}

function fillDemoCredentials(email, password) {
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  if (emailEl) emailEl.value = email;
  if (passEl) passEl.value = password;
}

function checkAuth(requiredRole = null) {
  const userStr = localStorage.getItem('unipay_user');
  if (!userStr) {
    window.location.href = 'login.html';
    return null;
  }
  const user = JSON.parse(userStr);
  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('unipay_user');
  window.location.href = 'login.html';
}
