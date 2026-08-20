/* ============================================
   MARVEL — app.js
   Boot sequence + shared utilities
   ============================================ */

// -------- BOOT SEQUENCE --------
function runBootSequence() {
  var boot = document.getElementById('boot');
  var bootLine = document.getElementById('bootLine');
  var bootBar = document.getElementById('bootBar');
  
  if (!boot || !bootLine || !bootBar) return;

  var steps = [
    { text: 'Initializing J.A.R.V.I.S...', progress: 15 },
    { text: 'Loading STARK protocols...', progress: 35 },
    { text: 'Establishing encrypted channel...', progress: 55 },
    { text: 'Syncing private nodes...', progress: 75 },
    { text: 'Verifying identity matrix...', progress: 90 },
    { text: 'MARVEL online.', progress: 100 }
  ];
  
  var current = 0;
  var interval = 3200 / steps.length;

  function next() {
    if (current >= steps.length) {
      boot.classList.add('done');
      setTimeout(function() {
        boot.classList.add('fade-out');
        setTimeout(function() {
          var token = localStorage.getItem('marvel_token');
          if (token) {
            window.location.href = '/pages/chat.html';
          } else {
            window.location.href = '/pages/login.html';
          }
        }, 500);
      }, 500);
      return;
    }
    bootLine.textContent = steps[current].text;
    bootBar.style.width = steps[current].progress + '%';
    current++;
    setTimeout(next, interval);
  }

  next();
}

// -------- TOAST SYSTEM --------
function showToast(message, type) {
  if (localStorage.getItem('marvel_notifications') === 'off') return;
  type = type || 'info';
  var container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toasts';
    container.id = 'toasts';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var labels = { info: 'INFO', success: 'SUCCESS', error: 'ERROR', warn: 'WARNING' };
  toast.innerHTML = '<div class="mono">' + (labels[type] || 'INFO') + '</div><div>' + message + '</div>';
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('fade-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

// -------- MODAL SYSTEM --------
function openModal(html) {
  var root = document.getElementById('modalRoot');
  if (!root) {
    root = document.createElement('div');
    root.className = 'modal-root hidden';
    root.id = 'modalRoot';
    document.body.appendChild(root);
  }
  var box = document.createElement('div');
  box.className = 'modal glass';
  box.innerHTML = html;
  root.innerHTML = '<div class="backdrop" data-close></div>';
  root.appendChild(box);
  root.classList.remove('hidden');
}

function closeModal() {
  var root = document.getElementById('modalRoot');
  if (root) root.classList.add('hidden');
}

// -------- LIGHTBOX SYSTEM --------
function openLightbox(content) {
  var lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox hidden';
    lb.id = 'lightbox';
    document.body.appendChild(lb);
  }
  lb.innerHTML = '<button class="icon-btn close" data-close>✕</button>' + content;
  lb.classList.remove('hidden');
}

function closeLightbox() {
  var lb = document.getElementById('lightbox');
  if (lb) lb.classList.add('hidden');
}

// -------- GLOBAL EVENT LISTENERS --------
document.addEventListener('click', function(e) {
  // Close modals on backdrop click
  if (e.target.classList.contains('backdrop') || e.target.hasAttribute('data-close')) {
    closeModal();
    closeLightbox();
  }
  
  // Demo buttons
  var demo = e.target.closest('[data-demo]');
  if (demo) {
    showToast(demo.getAttribute('data-demo'), 'info');
  }
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeLightbox();
  }
});

// -------- UTILITY: FORMAT TIME --------
function formatTime(date) {
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  var hours = d.getHours().toString().padStart(2, '0');
  var mins = d.getMinutes().toString().padStart(2, '0');
  return hours + ':' + mins;
}

function formatDate(date) {
  var d = date instanceof Date ? date : new Date(date);
  var today = new Date();
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// -------- START --------
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname;
  
  // Only run boot on index/home page
  if (path === '/' || path === '' || path.endsWith('index.html')) {
    runBootSequence();
  }
});