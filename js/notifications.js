/**
 * ResourceX – Notifications Logic
 */

let allNotifications = [];
let currentNotifFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('notifications');

  await loadNotifications();
});

async function loadNotifications() {
  const loading = document.getElementById('loading-state');
  try {
    loading.classList.remove('hidden');
    allNotifications = await API.notifications.list();
    updateUnreadCount();
    renderNotifications();
  } catch (err) {
    console.error('Failed to load notifications:', err);
    Toast.show('Error loading notifications', 'danger');
  } finally {
    loading.classList.add('hidden');
  }
}

function updateUnreadCount() {
  const unread = allNotifications.filter(n => !n.read).length;
  document.getElementById('unread-count').textContent = unread;
}

function filterNotifs(filter) {
  currentNotifFilter = filter;
  ['all', 'unread', 'reservation', 'match', 'reminder'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) {
      if (f === filter) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notifs-list');
  const empty = document.getElementById('empty-state');
  const card = document.getElementById('notifs-card');

  let filtered = allNotifications;

  if (currentNotifFilter === 'unread') {
    filtered = filtered.filter(n => !n.read);
  } else if (currentNotifFilter !== 'all') {
    filtered = filtered.filter(n => n.type === currentNotifFilter);
  }

  if (!filtered || filtered.length === 0) {
    card.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  card.classList.remove('hidden');
  empty.classList.add('hidden');

  const icons = {
    reservation: '📅',
    match: '⚡',
    reminder: '⏰',
    transaction: '💳',
    system: '📢'
  };

  container.innerHTML = filtered.map(n => `
    <div class="notification-item ${n.read ? '' : 'unread'}" id="notif-${n.id}" onclick="handleNotificationClick('${n.id}', '${n.link || ''}')">
      <div class="notification-icon" style="background:var(--bg-muted);display:flex;align-items:center;justify-content:center;font-size:1.25rem">
        ${icons[n.type] || '🔔'}
      </div>
      <div class="notification-body">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div class="notification-title">${escapeHtml(n.title)}</div>
          <span class="notification-time">${timeAgo(n.createdAt)}</span>
        </div>
        <div class="notification-text" style="margin-top:2px">${escapeHtml(n.message)}</div>
      </div>
      ${!n.read ? `
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); markSingleRead('${n.id}')" title="Mark as read" style="font-size:11px;padding:2px 8px">
          Mark Read
        </button>
      ` : ''}
    </div>
  `).join('');
}

async function markSingleRead(id) {
  await API.notifications.markRead(id);
  const notif = allNotifications.find(n => n.id === id);
  if (notif) notif.read = true;
  updateUnreadCount();
  renderNotifications();
}

async function handleMarkAllRead() {
  await API.notifications.markAllRead();
  allNotifications.forEach(n => n.read = true);
  updateUnreadCount();
  renderNotifications();
  Toast.show('All notifications marked as read', 'info');
}

function handleNotificationClick(id, link) {
  markSingleRead(id);
  if (link) {
    window.location.href = link;
  }
}
