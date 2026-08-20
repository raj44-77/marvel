/* ============================================
   MARVEL — utils.js
   Shared utility functions
   ============================================ */

// -------- FORMAT TIME --------
function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

// -------- FORMAT DATE --------
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// -------- FORMAT FULL DATE --------
function formatFullDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// -------- GENERATE UNIQUE ID --------
function generateId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// -------- DEBOUNCE --------
function debounce(fn, delay = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// -------- THROTTLE --------
function throttle(fn, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// -------- COPY TO CLIPBOARD --------
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
    return true;
  } catch (err) {
    showToast('Failed to copy', 'error');
    return false;
  }
}

// -------- TRUNCATE TEXT --------
function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// -------- RANDOM COLOR --------
function randomColor() {
  const colors = [
    '#e01a2b', '#4a90d9', '#f0c040', '#6bc5a0', 
    '#a070d0', '#e0a0b0', '#c0a060', '#d07040'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// -------- GET INITIALS --------
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// -------- VALIDATE PHONE --------
function validatePhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const indianRegex = /^(\+91)?[6-9]\d{9}$/;
  const internationalRegex = /^\+\d{7,15}$/;
  return indianRegex.test(cleaned) || internationalRegex.test(cleaned);
}

// -------- FORMAT PHONE --------
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '+91' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = '+' + cleaned;
  return cleaned;
}

// -------- DETECT MOBILE --------
function isMobile() {
  return window.innerWidth < 720;
}

// -------- DETECT TABLET --------
function isTablet() {
  return window.innerWidth >= 720 && window.innerWidth < 1024;
}

// -------- DETECT DESKTOP --------
function isDesktop() {
  return window.innerWidth >= 1024;
}

// -------- SCROLL TO BOTTOM --------
function scrollToBottom(element) {
  if (!element) return;
  element.scrollTop = element.scrollHeight;
}

// -------- SAFE JSON PARSE --------
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}