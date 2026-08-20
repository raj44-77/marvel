/* ============================================
   MARVEL — contacts.js
   Contacts page logic
   ============================================ */

// -------- DEMO DATA --------
const defaultContacts = [
  {
    id: 'c1', name: 'Vision', phone: '+91 98765 00001', avatar: 'V', color: '#4a90d9',
    status: 'online', lastSeen: 'now', bio: 'AI Synthezoid · Avenger',
    category: 'Avengers', favorite: true
  },
  {
    id: 'c2', name: 'Wanda', phone: '+91 98765 00002', avatar: 'W', color: '#e01a2b',
    status: 'online', lastSeen: 'now', bio: 'Scarlet Witch · Avenger',
    category: 'Avengers', favorite: true
  },
  {
    id: 'c3', name: 'Tony Stark', phone: '+91 98765 00003', avatar: 'T', color: '#f0c040',
    status: 'offline', lastSeen: '2h ago', bio: 'Genius Billionaire · Stark Industries',
    category: 'Avengers', favorite: true
  },
  {
    id: 'c4', name: 'Natasha', phone: '+91 98765 00004', avatar: 'N', color: '#b0b0b8',
    status: 'away', lastSeen: '30m ago', bio: 'Black Widow · Avenger',
    category: 'Avengers', favorite: false
  },
  {
    id: 'c5', name: 'Pepper Potts', phone: '+91 98765 00005', avatar: 'P', color: '#e0a0b0',
    status: 'online', lastSeen: 'now', bio: 'CEO · Stark Industries',
    category: 'Stark Industries', favorite: false
  },
  {
    id: 'c6', name: 'Happy Hogan', phone: '+91 98765 00006', avatar: 'H', color: '#c0a060',
    status: 'offline', lastSeen: '1d ago', bio: 'Head of Security · Stark Industries',
    category: 'Stark Industries', favorite: false
  }
];

let contacts = [];

// -------- DOM REFS --------
const contactGroups = document.getElementById('contactGroups');
const contactSearch = document.getElementById('contactSearch');
const emptyContacts = document.getElementById('emptyContacts');
const addContactBtn = document.getElementById('addContactBtn');

// -------- INIT --------
function initContacts() {
  loadContacts();
  renderContacts();
  bindEvents();
}

function loadContacts() {
  const saved = localStorage.getItem('marvel_contacts');
  contacts = saved ? JSON.parse(saved) : [...defaultContacts];
  if (!saved) localStorage.setItem('marvel_contacts', JSON.stringify(contacts));
}

function saveContacts() {
  localStorage.setItem('marvel_contacts', JSON.stringify(contacts));
}

// -------- RENDER --------
function renderContacts(filter = '') {
  if (!contactGroups) return;

  if (contacts.length === 0) {
    contactGroups.innerHTML = '';
    emptyContacts?.classList.remove('hidden');
    return;
  }

  emptyContacts?.classList.add('hidden');

  const categories = [...new Set(contacts.map(c => c.category))];

  let hasVisible = false;

  contactGroups.innerHTML = categories.map(cat => {
    const catContacts = contacts.filter(c => {
      if (!filter) return c.category === cat;
      const q = filter.toLowerCase();
      return c.category === cat && (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });

    if (catContacts.length === 0) return '';

    hasVisible = true;
    const letter = cat.charAt(0);

    return `
      <div class="grp-letter">${letter} — ${cat.toUpperCase()}</div>
      ${catContacts.map(c => `
        <div class="ccard" data-id="${c.id}">
          <div class="avatar ${c.status === 'online' ? '' : ''}" style="--c:${c.color}">
            ${c.avatar}
            ${c.status === 'online' ? '<div class="on"></div>' : c.status === 'away' ? '<div class="away"></div>' : '<div class="off"></div>'}
          </div>
          <div style="flex:1;">
            <div class="n">${c.name}</div>
            <div class="s">${c.phone} · <span class="${c.status === 'online' ? 'online' : c.status === 'away' ? 'away' : 'offline'}">${c.status}</span></div>
          </div>
          <div class="actions-row">
            <button class="fav-star ${c.favorite ? 'active' : ''}" data-id="${c.id}" title="${c.favorite ? 'Remove from favorites' : 'Add to favorites'}">
              ${c.favorite ? '⭐' : '☆'}
            </button>
            <button class="icon-btn" data-id="${c.id}" data-action="chat" title="Open chat">💬</button>
          </div>
        </div>
      `).join('')}
    `;
  }).join('');

  if (!hasVisible && filter) {
    contactGroups.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No results</h3>
        <p>No contacts match "${filter}"</p>
      </div>
    `;
  }

  // Bind card events
  document.querySelectorAll('.ccard').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = card.dataset.id;
      window.location.href = `chat.html?contact=${id}`;
    });
  });

  document.querySelectorAll('.fav-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(star.dataset.id);
    });
  });

  document.querySelectorAll('[data-action="chat"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `chat.html?contact=${btn.dataset.id}`;
    });
  });
}

// -------- TOGGLE FAVORITE --------
function toggleFavorite(contactId) {
  const idx = contacts.findIndex(c => c.id === contactId);
  if (idx === -1) return;

  contacts[idx].favorite = !contacts[idx].favorite;
  saveContacts();
  renderContacts(contactSearch?.value || '');
  showToast(
    contacts[idx].favorite ? 'Added to favorites ⭐' : 'Removed from favorites',
    'success'
  );
}

// -------- ADD CONTACT --------
function showAddContactModal() {
  openModal(`
    <h3>Add Contact</h3>
    <p>Enter the details of the person you want to add to your private network.</p>
    <label class="field">
      <span class="mono lbl">PHONE NUMBER</span>
      <input id="newPhone" type="tel" placeholder="+91 98765 00000" maxlength="15" />
    </label>
    <label class="field">
      <span class="mono lbl">DISPLAY NAME</span>
      <input id="newName" type="text" placeholder="Name" maxlength="50" />
    </label>
    <label class="field">
      <span class="mono lbl">CATEGORY</span>
      <input id="newCategory" type="text" placeholder="General" maxlength="30" value="General" />
    </label>
    <p class="error-msg hidden" id="addError"></p>
    <div class="actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn primary" id="confirmAdd">Add Contact</button>
    </div>
  `);

  setTimeout(() => {
    document.getElementById('confirmAdd')?.addEventListener('click', addNewContact);
    document.getElementById('newPhone')?.focus();
  }, 100);
}

function addNewContact() {
  const phone = document.getElementById('newPhone')?.value.trim();
  const name = document.getElementById('newName')?.value.trim();
  const category = document.getElementById('newCategory')?.value.trim() || 'General';
  const errorEl = document.getElementById('addError');

  if (!phone || !name) {
    if (errorEl) { errorEl.textContent = 'Phone and name are required'; errorEl.classList.remove('hidden'); }
    return;
  }

  if (contacts.find(c => c.phone === phone)) {
    if (errorEl) { errorEl.textContent = 'Contact with this phone already exists'; errorEl.classList.remove('hidden'); }
    return;
  }

  contacts.push({
    id: 'c' + Date.now(),
    name,
    phone,
    avatar: name.charAt(0).toUpperCase(),
    color: randomColor(),
    status: 'offline',
    lastSeen: 'Never',
    bio: 'New contact',
    category,
    favorite: false,
    replies: ['Hey!', 'Ok.', 'Got it.', 'Thanks!']
  });

  saveContacts();
  closeModal();
  renderContacts();
  showToast(`${name} added to contacts`, 'success');
}

// -------- BIND EVENTS --------
function bindEvents() {
  addContactBtn?.addEventListener('click', showAddContactModal);

  contactSearch?.addEventListener('input', (e) => {
    renderContacts(e.target.value);
  });
}

// -------- START --------
document.addEventListener('DOMContentLoaded', initContacts);