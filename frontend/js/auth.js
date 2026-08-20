/* ============================================
   MARVEL � auth.js
   Login & Signup with password
   ============================================ */
var API_BASE = window.location.protocol + '//' + window.location.hostname + ':8000/api/v1';
// DOM refs
var loginPhone = document.getElementById('loginPhone');
var loginPassword = document.getElementById('loginPassword');
var loginBtn = document.getElementById('loginBtn');
var loginError = document.getElementById('loginError');
var loginCard = document.querySelector('.login-card');
var signupName = document.getElementById('signupName');
var signupPhone = document.getElementById('signupPhone');
var signupPassword = document.getElementById('signupPassword');
var signupUsername = document.getElementById('signupUsername');
var signupStatus = document.getElementById('signupStatus');
var signupBtn = document.getElementById('signupBtn');
var signupError = document.getElementById('signupError');
var signupCard = document.querySelector('.signup-card');
function validatePhone(phone) {
  var cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned) || /^\+\d{7,15}$/.test(cleaned);
}
function formatPhone(phone) {
  var cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '+91' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = '+' + cleaned;
  return cleaned;
}
// -------- LOGIN --------
if (loginBtn) {
  loginBtn.addEventListener('click', function() {
    try {
      var testCtx = new (window.AudioContext || window.webkitAudioContext)();
      testCtx.resume();
      var osc = testCtx.createOscillator();
      var gain = testCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, testCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(testCtx.destination);
      osc.start();
      osc.stop(testCtx.currentTime + 0.1);
    } catch(e) { console.log('Audio test failed', e); }
    var phone = loginPhone ? loginPhone.value.trim() : '';
    var password = loginPassword ? loginPassword.value : '';
    if (loginError) loginError.classList.add('hidden');
    if (!phone) {
      if (loginError) { loginError.textContent = 'Phone number is required'; loginError.classList.remove('hidden'); }
      return;
    }
    if (!validatePhone(phone)) {
      if (loginError) { loginError.textContent = 'Enter a valid phone number'; loginError.classList.remove('hidden'); }
      return;
    }
    if (!password) {
      if (loginError) { loginError.textContent = 'Password is required'; loginError.classList.remove('hidden'); }
      return;
    }
    if (loginCard) loginCard.classList.add('loading');
    loginBtn.disabled = true;
    fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formatPhone(phone), password: password })
    })
    .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
    .then(function(result) {
      if (!result.ok) throw new Error(result.data.detail || 'Login failed');
      if (Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
  localStorage.setItem('marvel_token', result.data.token);
      localStorage.setItem('marvel_user', JSON.stringify(result.data.user));
      if (loginCard) loginCard.classList.add('success');
      showToast('Connected to MARVEL network', 'success');
      setTimeout(function() {
        try { var ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch(e) {} window.location.href = '/pages/transition.html';
      }, 500);
    })
    .catch(function(err) {
      if (loginError) { loginError.textContent = err.message; loginError.classList.remove('hidden'); }
      if (loginCard) loginCard.classList.remove('loading');
      loginBtn.disabled = false;
    });
  });
  loginPhone.addEventListener('keydown', function(e) { if (e.key === 'Enter') loginBtn.click(); });
  if (loginPassword) loginPassword.addEventListener('keydown', function(e) { if (e.key === 'Enter') loginBtn.click(); });
}
// -------- SIGNUP --------
if (signupBtn) {
  signupBtn.addEventListener('click', function() {
    var name = signupName ? signupName.value.trim() : '';
    var phone = signupPhone ? signupPhone.value.trim() : '';
    var password = signupPassword ? signupPassword.value : '';
    var username = signupUsername ? signupUsername.value.trim() : '';
    var status = signupStatus ? signupStatus.value.trim() : '';
    if (signupError) signupError.classList.add('hidden');
    if (!name || name.length < 2) {
      if (signupError) { signupError.textContent = 'Name required (min 2 chars)'; signupError.classList.remove('hidden'); }
      return;
    }
    if (!validatePhone(phone)) {
      if (signupError) { signupError.textContent = 'Enter a valid phone number'; signupError.classList.remove('hidden'); }
      return;
    }
    if (!password || password.length < 6) {
      if (signupError) { signupError.textContent = 'Password must be at least 6 characters'; signupError.classList.remove('hidden'); }
      return;
    }
    if (signupCard) signupCard.classList.add('loading');
    signupBtn.disabled = true;
    fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formatPhone(phone),
        password: password,
        display_name: name,
        username: username || null,
        status_text: status || ''
      })
    })
    .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
    .then(function(result) {
      if (!result.ok) throw new Error(result.data.detail || 'Registration failed');
      if (Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
  localStorage.setItem('marvel_token', result.data.token);
      localStorage.setItem('marvel_user', JSON.stringify(result.data.user));
      if (signupCard) signupCard.classList.add('success');
      showToast('Identity created. Welcome to MARVEL.', 'success');
      setTimeout(function() {
        try { var ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch(e) {} window.location.href = '/pages/transition.html';
      }, 500);
    })
    .catch(function(err) {
      if (signupError) { signupError.textContent = err.message; signupError.classList.remove('hidden'); }
      if (signupCard) signupCard.classList.remove('loading');
      signupBtn.disabled = false;
    });
  });
}
// Toast fallback
function showToast(message, type) {
  var container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toasts';
    container.id = 'toasts';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  var labels = { info: 'INFO', success: 'SUCCESS', error: 'ERROR', warn: 'WARNING' };
  toast.innerHTML = '<div class="mono">' + (labels[type] || 'INFO') + '</div><div>' + message + '</div>';
  container.appendChild(toast);
  setTimeout(function() { toast.classList.add('fade-out'); setTimeout(function() { toast.remove(); }, 300); }, 3000);
}