/* ============================================
   MARVEL  chat.js (CLEAN VERSION)
   ============================================ */
var activeChat = null;
var activeView = 'messages';
var syncInterval = null;
var contacts = [];
var messages = {};
var currentUser = null;
var ws = null;
var wsReconnectTimer = null;
var typingTimer = null;
var emojiPicker = null;
var replyToMessage = null;
var API_BASE = window.location.protocol + '//' + window.location.hostname + ':8000/api/v1';
var chatList = document.getElementById('chatList');
var chatEmpty = document.getElementById('chatEmpty');
var chatHead = document.getElementById('chatHead');
var thread = document.getElementById('thread');
var detailsPane = document.getElementById('detailsPane');
var typing = document.getElementById('typing');
var typingName = document.getElementById('typingName');
var msgInput = document.getElementById('msgInput');
var sendBtn = document.getElementById('sendBtn');
var composer = document.getElementById('composer');
var navBadge = document.getElementById('navBadge');
var syncTime = document.getElementById('syncTime');
var chatSearch = document.getElementById('chatSearch');
var contactSearch = document.getElementById('contactSearch');
var contactGroups = document.getElementById('contactGroups');
var favGrid = document.getElementById('favGrid');
var mobBack = document.getElementById('mobBack');
var tabbar = document.getElementById('tabbar');
var navList = document.getElementById('navList');
var addContactBtn = document.getElementById('addContactBtn');
var logoutBtn = document.getElementById('logoutBtn');
function connectWebSocket() {
  var token = localStorage.getItem('marvel_token');
  if (!token) return;
  try {
    ws = new WebSocket('ws://' + window.location.hostname + ':8000/api/v1/ws');
    ws.onopen = function() { console.log('WS Connected'); ws.send(JSON.stringify({ token: token })); };
    ws.onmessage = function(event) {
      var data = JSON.parse(event.data);
      if (data.type === 'new_message') handleIncomingMessage(data.message);
      else if (data.type === 'typing') handleTypingIndicator(data.user_id, data.is_typing);
      else if (data.type === 'online_status') updateContactStatus(data.user_id, data.online);
    };
    ws.onclose = function() { console.log('WS Closed'); setTimeout(connectWebSocket, 3000); };
  } catch(e) {}
}
function handleIncomingMessage(msg) {
  var contactId = 'c' + msg.sender_id;
  if (!messages[contactId]) messages[contactId] = [];
  messages[contactId].push({ id: 'm' + msg.id, from: contactId, text: msg.text, time: formatTime(msg.sent_at), read: msg.is_read });
  saveData();
  var incContact = contacts.find(function(c) { return c.id === contactId; });
  if (incContact) { jarvisIncoming(incContact.name); sendBrowserNotification(incContact.avenger || incContact.name, msg.text); }
  if (activeChat === contactId) renderMessages(contactId);
  renderChatList();
  updateUnreadBadge();
}
function handleTypingIndicator(userId, isTyping) {
  var contactId = 'c' + userId;
  if (activeChat === contactId) {
    if (isTyping) { var c = contacts.find(function(x) { return x.id === contactId; }); if (c && typing && typingName) { typingName.textContent = c.name; typing.classList.remove('hidden'); } }
    else { if (typing) typing.classList.add('hidden'); }
  }
}
function updateContactStatus(userId, online) {
  var contact = contacts.find(function(c) { return c.realId === userId; });
  if (contact) { contact.status = online ? 'online' : 'offline'; renderChatList(); }
}
function sendReadReceipt(messageId) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'mark_read', message_id: messageId }));
}
function sendTypingStatus(receiverId, isTyping) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'typing', receiver_id: receiverId, is_typing: isTyping }));
}
function sendBrowserNotification(title, body) {
  if (localStorage.getItem('marvel_notifications') === 'off') return;
  if (Notification && Notification.permission === 'granted') {
    try { var n = new Notification(title, { body: body }); setTimeout(function() { n.close(); }, 5000); } catch(e) {}
  }
}
function jarvisNotify(msg) { showToast(msg, 'info'); }
function jarvisOnline(name) { showToast('JARVIS // ' + name + ' has entered the network.', 'success'); }
function jarvisOffline(name) { showToast('JARVIS // ' + name + ' has left the network.', 'warn'); }
function jarvisIncoming(name) { showToast('JARVIS // Incoming transmission from ' + name + '.', 'info'); }
function jarvisChannelEstablished() { showToast('JARVIS // Secure channel established.', 'success'); }
function buildEmojiPicker() {
  var picker = document.getElementById('emojiPicker');
  if (!picker) return;
  var emojis = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','🤨','😐','😴','🤤','😪','😷','🤒','👍','👎','👏','🙏','💪','🤝','👋','✌️','🤞','🫶','❤️','💔','🔥','✨','🎉','🎊','⭐','🌟','💫','⚡','☀️','🌙','🌈','☔','❄️','🌊','🍕','🍔','☕','🍺','🎂','🍫','😢','😭','😤','😡','🤬','😱','😳','🥺','😇','🤗','🫡','🤫','🤭','😅','😆','😉'];
  var html = '<div class="emoji-category">EMOJIS</div>';
  emojis.forEach(function(emoji) {
    html += '<button class="emoji-item" data-emoji="' + emoji + '">' + emoji + '</button>';
  });
  picker.innerHTML = html;
  picker.querySelectorAll('.emoji-item').forEach(function(btn) {
    btn.addEventListener('click', function() { if (msgInput) { msgInput.value += btn.dataset.emoji; msgInput.focus(); } });
  });
}
function toggleEmojiPicker() {
  var picker = document.getElementById('emojiPicker');
  if (!picker) return;
  if (picker.classList.contains('hidden')) {
    buildEmojiPicker();
    picker.classList.remove('hidden');
  } else {
    picker.classList.add('hidden');
  }
}
function insertEmoji(emoji) { if (!msgInput) return; msgInput.value += emoji; msgInput.focus(); }
function loadSavedWallpaper() {
  var saved = localStorage.getItem('marvel_wallpaper');
  if (saved && thread) {
    var wps = ['wallpaper-default','wallpaper-shield','wallpaper-grid','wallpaper-reactor','wallpaper-stars'];
    wps.forEach(function(w) { thread.classList.remove(w); });
    thread.classList.add(saved);
  }
}
function showWallpaperPicker() {
  var wallpapers = [
    { name: 'Default', css: 'wallpaper-default', icon: 'D' },
    { name: 'Shield', css: 'wallpaper-shield', icon: 'S' },
    { name: 'Grid', css: 'wallpaper-grid', icon: 'G' },
    { name: 'Arc Reactor', css: 'wallpaper-reactor', icon: 'A' },
    { name: 'Stars', css: 'wallpaper-stars', icon: 'X' }
  ];
  var options = '';
  wallpapers.forEach(function(w) { options += '<button class="wallpaper-option" data-wallpaper="' + w.css + '"><span class="wp-icon">' + w.icon + '</span>' + w.name + '</button>'; });
  openModal('<h3>Chat Wallpaper</h3><div class="wallpaper-grid-options">' + options + '</div><div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button></div>');
  setTimeout(function() { document.querySelectorAll('.wallpaper-option').forEach(function(btn) { btn.addEventListener('click', function() { applyWallpaper(btn.dataset.wallpaper); closeModal(); }); }); }, 100);
}
function applyWallpaper(cls) {
  localStorage.setItem('marvel_wallpaper', cls);
  var wps = ['wallpaper-default','wallpaper-shield','wallpaper-grid','wallpaper-reactor','wallpaper-stars'];
  wps.forEach(function(w) { if (thread) thread.classList.remove(w); });
  if (thread) thread.classList.add(cls);
  showToast('Wallpaper applied', 'success');
}
function setReplyTo(messageId, messageText, senderName) {
  replyToMessage = { id: messageId, text: messageText };
  var replyBar = document.getElementById('replyBar');
  if (replyBar) { replyBar.classList.remove('hidden'); document.getElementById('replyText').textContent = messageText; document.getElementById('replySender').textContent = 'Replying to ' + senderName; }
  if (msgInput) msgInput.focus();
}
function cancelReply() {
  replyToMessage = null;
  var replyBar = document.getElementById('replyBar');
  if (replyBar) replyBar.classList.add('hidden');
}
function deleteMessage(messageId, contactId) {
  if (!confirm('Delete this transmission?')) return;
  var token = getToken();
  fetch(API_BASE + '/messages/' + messageId, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
    .then(function() {
      var msgs = messages[contactId];
      if (msgs) { msgs.forEach(function(m) { if (m.id === 'm' + messageId) { m.text = 'This message was deleted'; } }); saveData(); renderMessages(contactId); showToast('Deleted', 'success'); }
    })
    .catch(function() { showToast('Failed', 'error'); });
}
function showMessageActions(messageId, messageText, isMe, contactId) {
  var actions = '<button class="opt" id="replyAction">REPLY</button>';
  if (isMe) actions += '<button class="opt danger" id="deleteAction">DELETE</button>';
  openModal('<h3>Actions</h3><div class="d-block">' + actions + '</div><div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button></div>');
  setTimeout(function() {
    var rb = document.getElementById('replyAction');
    if (rb) rb.addEventListener('click', function() { closeModal(); setReplyTo(messageId, messageText, 'Contact'); });
    var db = document.getElementById('deleteAction');
    if (db) db.addEventListener('click', function() { closeModal(); deleteMessage(messageId, contactId); });
  }, 100);
}
function showEditAvengerModal(contactId) {
  var contact = contacts.find(function(c) { return c.id === contactId; });
  if (!contact) return;
  var avengers = [
    { emoji: '&#129302;', name: 'IRON MAN' }, { emoji: '&#128737;', name: 'CAPTAIN AMERICA' }, { emoji: '&#9889;', name: 'THOR' },
    { emoji: '&#129504;', name: 'VISION' }, { emoji: '&#128375;', name: 'SPIDER-MAN' }, { emoji: '&#128994;', name: 'HULK' },
    { emoji: '&#128374;', name: 'BLACK WIDOW' }, { emoji: '&#127744;', name: 'DOCTOR STRANGE' }, { emoji: '&#127993;', name: 'HAWKEYE' },
    { emoji: '&#128171;', name: 'CAPTAIN MARVEL' }
  ];
  var options = '';
  avengers.forEach(function(a) { var sel = contact.avenger === a.name ? 'selected' : ''; options += '<button class="avenger-option ' + sel + '" data-avenger="' + a.name + '">' + a.emoji + ' ' + a.name + '</button>'; });
  openModal('<h3>Edit Avenger Identity</h3><div class="avenger-grid" id="editAvengerGrid">' + options + '</div><div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" id="saveAvengerBtn">Save</button></div>');
  var selNew = contact.avenger;
  setTimeout(function() {
    var grid = document.getElementById('editAvengerGrid');
    if (grid) grid.querySelectorAll('.avenger-option').forEach(function(btn) { btn.addEventListener('click', function() { grid.querySelectorAll('.avenger-option').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selNew = btn.dataset.avenger; }); });
    var sb = document.getElementById('saveAvengerBtn');
    if (sb) sb.addEventListener('click', function() { editAvengerIdentity(contact, selNew); });
  }, 100);
}
async function editAvengerIdentity(contact, newAvenger) {
  var token = getToken();
  try {
    var res = await fetch(API_BASE + '/contacts/' + contact.contactRowId + '/avenger', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ avenger_identity: newAvenger }) });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed');
    closeModal();
    var mc = contacts.find(function(c) { return c.id === contact.id; });
    if (mc) mc.avenger = newAvenger;
    saveData();
    renderChatList();
    if (activeChat === contact.id) { renderChatHead(mc || contact); renderDetails(mc || contact); }
    showToast('Updated', 'success');
  } catch(e) { showToast(e.message, 'error'); }
}
function clearConversation(contactId) {
  var c = contacts.find(function(x) { return x.id === contactId; });
  if (!c) return;
  if (!confirm('Delete all transmissions with ' + (c.avenger || c.name) + '?')) return;
  var token = getToken();
  fetch(API_BASE + '/messages/clear/' + c.realId, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
    .then(function() {
      messages[contactId] = [];
      saveData();
      renderMessages(contactId);

      renderChatList();
      showToast('Channel cleared', 'success');
    })
    .catch(function() { showToast('Failed', 'error'); });
}
function clearConversation(contactId) {
  var c = contacts.find(function(x) { return x.id === contactId; });
  if (!c) return;
  if (!confirm('Delete all transmissions with ' + (c.avenger || c.name) + '?')) return;
  var token = getToken();
  fetch(API_BASE + '/messages/clear/' + c.realId, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
    .then(function() {
      messages[contactId] = [];
      saveData();
      if (activeChat === contactId) renderMessages(contactId);
      renderChatList();
      showToast('Channel cleared', 'success');
    })
    .catch(function() { showToast('Failed', 'error'); });
}
function toggleBlockContact(contactId) {
  var contact = contacts.find(function(c) { return c.id === contactId; });
  if (!contact) return;
  var token = getToken();
  fetch(API_BASE + '/contacts/' + contact.contactRowId + '/block', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } })
    .then(function(res) { return res.json(); })
    .then(function() {
      contact.blocked = !contact.blocked;
      saveData();
      renderDetails(contact);
      renderChatList();
      if (activeChat === contact.id) openChat(contact.id);
      showToast(contact.blocked ? 'Blocked' : 'Unblocked', 'success');
    })
    .catch(function() { showToast('Failed', 'error'); });
}
function toggleFavorite(contactId) {
  var c = contacts.find(function(x) { return x.id === contactId; });
  if (!c) return;
  c.favorite = !c.favorite;
  saveData();
  if (activeView === 'contacts') renderContactsView();
  if (activeView === 'favorites') renderFavoritesView();
  if (activeChat === contactId) renderDetails(c);
}
function toggleDetails() { if (detailsPane) detailsPane.classList.toggle('show'); }
function markAllAsRead(contactId) {
  var msgs = messages[contactId];
  if (!msgs) return;
  msgs.forEach(function(m) { if (m.from !== 'me') m.read = true; });
  saveData();
  updateUnreadBadge();
  var c = contacts.find(function(x) { return x.id === contactId; });
  if (c) {
    var token = getToken();
    if (token) {
      fetch(API_BASE + '/messages/' + c.realId, { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function() { console.log('Backend marked as read'); })
        .catch(function(e) { console.log('Failed to mark read on backend', e); });
    }
  }
}
function updateUnreadBadge() {
  if (!navBadge) return;
  var total = 0;
  Object.values(messages).forEach(function(msgs) { total += msgs.filter(function(m) { return m.from !== 'me' && !m.read; }).length; });
  navBadge.textContent = total;
  navBadge.classList.toggle('hidden', total === 0);
}
function updateSyncTime() { if (syncTime) syncTime.textContent = formatTime(new Date()); }
async function initChat() {
  currentUser = getCurrentUser();
  var token = getToken();
  if (!token || !currentUser) { window.location.href = '/pages/login.html'; return; }
  connectWebSocket();
  await loadData();
  renderChatList();
  loadSavedWallpaper();
  updateUnreadBadge();
  bindEvents();
  syncInterval = setInterval(updateSyncTime, 30000);
}
async function loadData() {
  var token = getToken();
  try {
    var cr = await fetch(API_BASE + '/contacts', { headers: { 'Authorization': 'Bearer ' + token } });
    if (cr.ok) {
      var cd = await cr.json();
      contacts = cd.map(function(c) { return { id: 'c' + c.contact_id, name: c.contact_name || 'Unknown', phone: c.contact_phone || '', avatar: (c.contact_avatar || 'U').charAt(0), color: c.contact_color || '#e01a2b', status: c.is_online ? 'online' : 'offline', lastSeen: c.last_seen || '', bio: c.contact_status || '', category: c.category || 'General', avenger: c.avenger_identity || null, favorite: c.is_favorite || false, blocked: c.is_blocked || false, realId: c.contact_id, contactRowId: c.id }; });
    }
    for (var i = 0; i < contacts.length; i++) {
      var contact = contacts[i];
      try {
        var mr = await fetch(API_BASE + '/messages/' + contact.realId, { headers: { 'Authorization': 'Bearer ' + token } });
        if (mr.ok) {
          var md = await mr.json();
          messages[contact.id] = md.map(function(m) { return { id: 'm' + m.id, from: m.sender_id === currentUser.id ? 'me' : contact.id, text: m.deleted ? 'This message was deleted' : m.text, replyToText: m.reply_to ? getReplyText(m.reply_to) : null, time: formatTime(m.sent_at), read: m.is_read === 1 || m.is_read === true }; });
        }
      } catch(e) { messages[contact.id] = []; }
    }
    saveData();
  } catch(e) { loadLocalData(); }
}
function loadLocalData() {
  var sc = localStorage.getItem('marvel_contacts');
  var sm = localStorage.getItem('marvel_messages');
  contacts = sc ? JSON.parse(sc) : [];
  messages = sm ? JSON.parse(sm) : {};
}
function saveData() {
  localStorage.setItem('marvel_contacts', JSON.stringify(contacts));
  localStorage.setItem('marvel_messages', JSON.stringify(messages));
}
function navigateTo(view) {
  activeView = view;
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('[data-nav]').forEach(function(el) { el.classList.remove('active'); });
  var ve = document.querySelector('.view[data-view="' + view + '"]');
  if (ve) ve.classList.add('active');
  document.querySelectorAll('[data-nav="' + view + '"]').forEach(function(el) { el.classList.add('active'); });
  if (view === 'messages') renderChatList();
  if (view === 'contacts') renderContactsView();
  if (view === 'favorites') renderFavoritesView();
  if (view === 'profile') renderProfileView();
  if (view === 'settings') renderSettingsView();
}
function renderChatList(filter) {
  if (!chatList) return;
  filter = filter || '';
  var ids = [];
  contacts.forEach(function(c) { if (ids.indexOf(c.id) === -1) ids.push(c.id); });
  Object.keys(messages).forEach(function(id) { if (ids.indexOf(id) === -1) ids.push(id); });
  if (ids.length === 0) { chatList.innerHTML = '<div class="empty-state"><h3>No channels</h3><p>Recruit Avengers</p></div>'; return; }
  chatList.innerHTML = ids.map(function(id) {
    var c = contacts.find(function(x) { return x.id === id; });
    if (!c) return '';
    if (filter && c.name.toLowerCase().indexOf(filter.toLowerCase()) === -1) return '';
    var msgs = messages[id] || [];
    var last = msgs[msgs.length - 1];
    var unread = msgs.filter(function(m) { return m.from !== 'me' && !m.read; }).length;
    return '<div class="chat-item ' + (id === activeChat ? 'active' : '') + '" data-id="' + id + '">' +
      '<div class="avatar" style="--c:' + c.color + '">' + c.avatar + '</div>' +
      '<div class="ci-main"><div class="ci-top"><span class="ci-name">' + (c.avenger || c.name) + '</span><span class="ci-time">' + (last ? last.time : '') + '</span></div>' +
      '<div class="ci-real-name">' + c.name + '</div><div class="ci-msg">' + (last ? last.text : 'No transmissions') + '</div>' +
      (unread > 0 ? '<div class="pill">' + unread + '</div>' : '') + '</div></div>';
  }).join('');
  document.querySelectorAll('.chat-item').forEach(function(item) {
    item.addEventListener('click', function() { openChat(item.dataset.id); });

  });
}
function openChat(contactId) {
  activeChat = contactId;
  var c = contacts.find(function(x) { return x.id === contactId; });
  if (!c) return;
  if (chatEmpty) chatEmpty.classList.add('hidden');
  if (chatHead) chatHead.classList.remove('hidden');
  if (thread) thread.classList.remove('hidden');
  if (composer) composer.classList.remove('hidden');
  markAllAsRead(c.id);
  document.body.classList.add('chat-open');
  renderChatHead(c);
  renderMessages(contactId);
  loadSavedWallpaper();
  renderDetails(c);
  if (window.innerWidth > 768) renderChatList();
}
function renderChatHead(c) {
  if (!chatHead) return;
  chatHead.innerHTML = '<div class="avatar" style="--c:' + c.color + '">' + c.avatar + '</div>' +
    '<div><div class="ch-name">' + (c.avenger || c.name) + '</div><div class="ch-real-name">' + c.name + '</div><div class="ch-sub">' + c.status + '</div></div>' +
    '<div class="ch-actions"><button class="icon-btn" onclick="toggleDetails()">i</button></div>';
}
function renderMessages(contactId) { console.log('renderMessages called for: ' + contactId);
  var blockedContact = contacts.find(function(c) { return c.id === contactId && (c.blocked || c.blockedByThem); });
  if (blockedContact) { if (thread) thread.innerHTML = '<div class="empty-state"><p>This channel is blocked. Unblock to view transmissions.</p></div>'; return; }
  if (!thread) return;
  var msgs = messages[contactId] || [];
  if (msgs.length === 0) { thread.innerHTML = '<div class="empty-state"><p>No transmissions. Say hello!</p></div>'; return; }
  thread.innerHTML = msgs.map(function(msg) {
    var isMe = msg.from === 'me';
    return '<div class="msg ' + (isMe ? 'out' : 'in') + '" data-msgid="' + msg.id.replace('m','') + '" data-ismes="' + (isMe ? '1' : '0') + '" data-contact="' + contactId + '" data-text="' + encodeURIComponent(msg.text) + '">' +
      '<div class="bubble">' + (msg.replyToText ? '<div class="reply-quote">Replying to: ' + escapeHtml(msg.replyToText) + '</div>' : '') + escapeHtml(msg.text) + '</div>' +
      '<div class="meta"><span>' + msg.time + '</span>' + (isMe ? '<span>' + (msg.read ? 'VV' : 'V') + '</span>' : '') + '</div></div>';
  }).join('');
  thread.scrollTop = thread.scrollHeight;
}
function renderDetails(c) {
  if (!detailsPane) return;
  var msgs = messages[c.id] || [];
  detailsPane.innerHTML = '<div style="text-align:center;"><div class="avatar lg" style="--c:' + c.color + ';margin:0 auto;">' + c.avatar + '</div><h3>' + (c.avenger || c.name) + '</h3></div>' +
    '<div class="d-block"><button class="opt" onclick="showEditAvengerModal(\'' + c.id + '\')">EDIT AVENGER IDENTITY</button>' +
    '<button class="opt" onclick="showWallpaperPicker()">CHANGE WALLPAPER</button>' +
    '<button class="opt" onclick="toggleFavorite(\'' + c.id + '\')">' + (c.favorite ? 'REMOVE FROM INNER CIRCLE' : 'ADD TO INNER CIRCLE') + '</button>' +
    '<button class="opt danger" onclick="toggleBlockContact(\'' + c.id + '\')">' + (c.blocked ? 'UNBLOCK AVENGER' : 'BLOCK AVENGER') + '</button>' +
    '<button class="opt danger" onclick="clearConversation(\'' + c.id + '\')">CLEAR CHANNEL</button></div>';
}
function handleJarvisCommand(text) {
  var cmd = text.toLowerCase().trim();
  var response = '';
  if (cmd === '/help') {
    response = 'Available commands: /status /motto /avengers /time /help';
  } else if (cmd === '/status') {
    var activeCount = contacts.filter(function(c) { return c.status === 'online'; }).length;
    var unreadCount = 0;
    Object.values(messages).forEach(function(msgs) { unreadCount += msgs.filter(function(m) { return m.from !== 'me' && !m.read; }).length; });
    response = 'STARK systems online. ' + activeCount + ' active Avengers. ' + unreadCount + ' unread transmissions.';
  } else if (cmd === '/motto') {
    response = 'No feeds. No stories. No distractions. Just you and the people who matter.';
  } else if (cmd === '/avengers') {
    if (contacts.length === 0) { response = 'No Avengers in your network.'; }
    else {
      response = 'Your Avengers: ' + contacts.map(function(c) { return (c.avenger || c.name) + ' (' + c.name + ')'; }).join(', ');
    }
  } else if (cmd === '/time') {
    response = 'Current time: ' + new Date().toLocaleString();
  } else if (cmd === '/clear') {
    if (activeChat) { clearConversation(activeChat); return true; }
    else { response = 'No active channel.'; }
  } else {
    return false;
  }
  if (!messages[activeChat]) messages[activeChat] = [];
  var time = formatTime(new Date());
  messages[activeChat].push({ id: 'm' + Date.now(), from: 'jarvis', text: response, time: time, read: true, replyToText: null });
  saveData();
  renderMessages(activeChat);
  renderChatList();
  return true;
}
async function sendMessage() {
  var text = msgInput ? msgInput.value.trim() : '';
  if (text.startsWith('/') && handleJarvisCommand(text)) { msgInput.value = ''; return; }
  if (!text || !activeChat) return;
  var c = contacts.find(function(x) { return x.id === activeChat; });
  if (!c) return;
  if (!messages[activeChat]) messages[activeChat] = [];
  var time = formatTime(new Date());
  var replyText = replyToMessage ? replyToMessage.text : null;
  messages[activeChat].push({ id: 'm' + Date.now(), from: 'me', text: text, time: time, read: false, replyToText: replyText });
  msgInput.value = '';
  renderMessages(activeChat);
  renderChatList();
  saveData();
  var replyId = replyToMessage ? replyToMessage.id : null;
  cancelReply();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'send_message', receiver_id: c.realId, text: text, reply_to: replyId }));
  } else {
    var token = getToken();
    try { await fetch(API_BASE + '/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ receiver_id: c.realId, text: text, reply_to: replyId }) }); } catch(e) {}
  }
}
function renderContactsView() {
  if (!contactGroups) return;
  if (contacts.length === 0) { contactGroups.innerHTML = '<div class="empty-state"><h3>No Avengers</h3></div>'; return; }
  contactGroups.innerHTML = contacts.map(function(c) {
    return '<div class="ccard" data-id="' + c.id + '"><div class="avatar" style="--c:' + c.color + '">' + c.avatar + '</div><div><div class="n">' + (c.avenger || c.name) + '</div><div class="s">' + c.name + '</div></div></div>';
  }).join('');
  document.querySelectorAll('.ccard').forEach(function(card) {
    card.addEventListener('click', function() { openChat(card.dataset.id); navigateTo('messages'); });

  });
}
function renderFavoritesView() {
  if (!favGrid) return;
  var favs = contacts.filter(function(c) { return c.favorite; });
  if (favs.length === 0) { favGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No inner circle</h3></div>'; return; }
  favGrid.innerHTML = favs.map(function(c) { return '<div class="ccard" data-id="' + c.id + '"><div class="avatar lg" style="--c:' + c.color + '">' + c.avatar + '</div><div><div class="n">' + (c.avenger || c.name) + '</div></div></div>'; }).join('');
  document.querySelectorAll('#favGrid .ccard').forEach(function(card) { card.addEventListener('click', function() { openChat(card.dataset.id); navigateTo('messages'); }); });
}
function renderProfileView() {
  if (!currentUser) currentUser = getCurrentUser();
  if (!currentUser) return;
  var pn = document.getElementById('profName');
  var pa = document.getElementById('profAvatar');
  var ps = document.getElementById('profStatus');
  var pp = document.getElementById('profPhone');
  if (pn) pn.textContent = currentUser.display_name;
  if (pa) { pa.textContent = currentUser.avatar_letter; pa.style.setProperty('--c', currentUser.avatar_color); }
  if (ps) ps.textContent = currentUser.status_text || '';
  if (pp) pp.textContent = currentUser.phone;
}
function renderSettingsView() {
  if (!currentUser) currentUser = getCurrentUser();
  var sp = document.getElementById('setPhone');
  if (sp && currentUser) sp.textContent = currentUser.phone;
}
function showAddContactModal() {
  var avengers = ['IRON MAN','CAPTAIN AMERICA','THOR','VISION','SPIDER-MAN','HULK','BLACK WIDOW','DOCTOR STRANGE','HAWKEYE','CAPTAIN MARVEL'];
  var options = '';
  avengers.forEach(function(a) { options += '<button class="avenger-option" data-avenger="' + a + '">' + a + '</button>'; });
  openModal('<h3>Recruit Avenger</h3><label class="field"><span class="mono lbl">PHONE NUMBER</span><input id="newContactPhone" type="tel" placeholder="+91 98765 00000" /></label><div class="field"><span class="mono lbl">AVENGER IDENTITY</span><div class="avenger-grid" id="avengerGrid">' + options + '</div></div><p class="error-msg hidden" id="addContactError"></p><div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" id="confirmAddContact">Recruit</button></div>');
  var sel = null;
  setTimeout(function() {
    var grid = document.getElementById('avengerGrid');
    if (grid) grid.querySelectorAll('.avenger-option').forEach(function(btn) { btn.addEventListener('click', function() { grid.querySelectorAll('.avenger-option').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); sel = btn.dataset.avenger; }); });
    var cb = document.getElementById('confirmAddContact');
    if (cb) cb.addEventListener('click', function() { addNewContact(sel); });
  }, 100);
}
async function addNewContact(avengerIdentity) {
  var pe = document.getElementById('newContactPhone');
  var pv = pe ? pe.value.trim() : '';
  var ee = document.getElementById('addContactError');
  var token = getToken();
  if (!pv) { if (ee) { ee.textContent = 'Phone required'; ee.classList.remove('hidden'); } return; }
  if (!avengerIdentity) { if (ee) { ee.textContent = 'Choose Avenger'; ee.classList.remove('hidden'); } return; }
  try {
    var res = await fetch(API_BASE + '/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ phone: formatPhone(pv), category: 'General', avenger_identity: avengerIdentity }) });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed');
    closeModal();
    await loadData();
    renderChatList();
    showToast('Recruited!', 'success');
  } catch(e) { if (ee) { ee.textContent = e.message; ee.classList.remove('hidden'); } }
}
function showEditProfileModal() {
  if (!currentUser) currentUser = getCurrentUser();
  if (!currentUser) return;
  openModal('<h3>Edit Identity</h3><label class="field"><span class="mono lbl">NAME</span><input id="editName" value="' + escapeHtml(currentUser.display_name) + '" /></label><label class="field"><span class="mono lbl">STATUS</span><input id="editStatus" value="' + escapeHtml(currentUser.status_text || '') + '" /></label><div class="actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" id="saveProfile">Save</button></div>');
  setTimeout(function() { var sb = document.getElementById('saveProfile'); if (sb) sb.addEventListener('click', saveProfile); }, 100);
}
async function saveProfile() {
  var ne = document.getElementById('editName');
  var se = document.getElementById('editStatus');
  var token = getToken();
  if (!currentUser) currentUser = getCurrentUser();
  try {
    await fetch(API_BASE + '/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ display_name: ne ? ne.value.trim() : undefined, status_text: se ? se.value.trim() : undefined }) });
    if (ne) { currentUser.display_name = ne.value.trim(); currentUser.avatar_letter = ne.value.trim().charAt(0).toUpperCase(); }
    if (se) currentUser.status_text = se.value.trim();
    saveCurrentUser(currentUser);
    closeModal();
    renderProfileView();
    showToast('Updated', 'success');
  } catch(e) {}
}
function bindEvents() {

  var emojiBtn = document.querySelector('[data-demo="Emoji picker"]');
  if (emojiBtn) emojiBtn.addEventListener('click', function(e) { e.preventDefault(); toggleEmojiPicker(); });
  buildEmojiPicker();
  if (thread) thread.addEventListener('click', function(e) {
    var me = e.target.closest('.msg');
    if (me) {
      var msgId = me.dataset.msgid;
      var isMe = me.dataset.ismes === '1';
      var cid = me.dataset.contact;
      var text = decodeURIComponent(me.dataset.text || '');
      showMessageActions(msgId, text, isMe, cid);
    }
  });
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (msgInput) { msgInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); }); }
  if (chatSearch) chatSearch.addEventListener('input', function(e) { renderChatList(e.target.value); });
  if (navList) navList.addEventListener('click', function(e) { var li = e.target.closest('li[data-nav]'); if (li) navigateTo(li.dataset.nav); });
  if (tabbar) tabbar.addEventListener('click', function(e) { var b = e.target.closest('button[data-nav]'); if (b) navigateTo(b.dataset.nav); });
  if (mobBack) mobBack.addEventListener('click', function() {
    document.body.classList.remove('chat-open');
    if (detailsPane) detailsPane.classList.remove('show');
    if (chatHead) chatHead.classList.add('hidden');
    if (chatEmpty) chatEmpty.classList.remove('hidden');
    activeChat = null;
    navigateTo('messages');
  });
  var thanosBtn = document.getElementById('thanosBtn');
  if (thanosBtn) thanosBtn.addEventListener('click', callThanos);
  var jarvisHelpBtn = document.getElementById('jarvisHelpBtn');
  if (jarvisHelpBtn) jarvisHelpBtn.addEventListener('click', showJarvisHelp);
  var editBtn = document.getElementById('editIdentityBtn');
  if (editBtn) editBtn.addEventListener('click', showEditProfileModal);
  if (logoutBtn) logoutBtn.addEventListener('click', function() { if (confirm('Disconnect?')) { logout(); } });
  var notifToggle = document.getElementById('notifToggle');
  if (notifToggle) { var sn = localStorage.getItem('marvel_notifications'); notifToggle.checked = sn !== 'off'; notifToggle.addEventListener('change', function(e) { localStorage.setItem('marvel_notifications', e.target.checked ? 'on' : 'off'); showToast(e.target.checked ? 'Notifications on' : 'Notifications off', 'success'); }); }
  var accentSlider = document.getElementById('accentSlider');
  if (accentSlider) accentSlider.addEventListener('input', function(e) { document.documentElement.style.setProperty('--i', e.target.value / 100); });
  var compactToggle = document.getElementById('compactToggle');
  if (compactToggle) compactToggle.addEventListener('change', function(e) { document.body.classList.toggle('compact', e.target.checked); });
  document.addEventListener('click', function(e) {
    var picker = document.getElementById('emojiPicker');
    if (picker && !picker.classList.contains('hidden')) {
      if (!e.target.closest('.emoji-picker') && !e.target.closest('[data-demo="Emoji picker"]')) {
        picker.classList.add('hidden');
      }
    }
  });
}
function showJarvisHelp() {
  openModal('<h3>JARVIS Commands</h3>' +
    '<div class="d-block">' +
    '<p><b>/help</b> ? List all commands</p>' +
    '<p><b>/status</b> ? Network status</p>' +
    '<p><b>/motto</b> ? Our motto</p>' +
    '<p><b>/avengers</b> ? List your Avengers</p>' +
    '<p><b>/time</b> ? Current time</p>' +
    '<p><b>/clear</b> ? Clear this channel</p>' +
    '</div>' +
    '<div class="actions"><button class="btn primary" onclick="closeModal()">GOT IT</button></div>');
}
function callThanos() {
  if (!confirm('WARNING: This will disconnect the current session. Continue?')) return;
  var overlay = document.createElement('div');
  overlay.className = 'thanos-overlay';
  overlay.innerHTML = 
    '<div class="thanos-stones">' +
    '<div class="thanos-stone stone-space"></div>' +
    '<div class="thanos-stone stone-mind"></div>' +
    '<div class="thanos-stone stone-reality"></div>' +
    '<div class="thanos-stone stone-power"></div>' +
    '<div class="thanos-stone stone-time"></div>' +
    '</div>' +
    '<div class="thanos-snap">SNAP</div>' +
    '<div class="thanos-text">' +
    '<p class="line">THANOS PROTOCOL ACTIVATED</p>' +
    '<p class="line">50% OF ACTIVE CONNECTIONS HAVE BEEN DISCONNECTED.</p>' +
    '<p class="line">JUST KIDDING.</p>' +
    '<p class="line" style="color:var(--red);">THANOS IS NOT AWAKE YET.</p>' +
    '<p class="line">WELCOME BACK, AVENGER.</p>' +
    '</div>';
  document.body.appendChild(overlay);
  setTimeout(function() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 2s';
    setTimeout(function() { overlay.remove(); }, 2000);
  }, 20000);
}
function filterContacts(query) {
  if (!contactGroups) return;
  document.querySelectorAll('.ccard').forEach(function(card) { var n = card.querySelector('.n'); var name = n ? n.textContent.toLowerCase() : ''; card.style.display = name.indexOf(query.toLowerCase()) !== -1 || !query ? '' : 'none'; });
}
function getReplyText(replyId) {
  var found = null;
  Object.keys(messages).forEach(function(cid) {
    messages[cid].forEach(function(m) {
      if (m.id === 'm' + replyId) found = m.text;
    });
  });
  return found || 'Original message';
}
function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function formatTime(date) { var d = date instanceof Date ? date : new Date(date); if (isNaN(d.getTime())) return ''; return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }
function getToken() { return localStorage.getItem('marvel_token'); }
function getCurrentUser() { var d = localStorage.getItem('marvel_user'); return d ? JSON.parse(d) : null; }
function saveCurrentUser(u) { localStorage.setItem('marvel_user', JSON.stringify(u)); }
function formatPhone(p) { var c = p.replace(/\D/g,''); if (c.length === 10) c = '+91' + c; if (c.length === 12 && c.startsWith('91')) c = '+' + c; return c; }
function logout() { localStorage.clear(); window.location.href = '/pages/login.html'; }
document.addEventListener('DOMContentLoaded', initChat);
