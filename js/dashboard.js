/**
 * ResourceX – Student & Faculty Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('dashboard');

  const user = Auth.getUser() || DEMO_DATA.currentUser;
  loadDashboardData(user);
});

async function loadDashboardData(user) {
  // Set User Profile headers
  document.getElementById('user-display-name').textContent = user.name || 'Campus Student';
  document.getElementById('welcome-heading').innerHTML = `Welcome back, <span id="user-display-name">${escapeHtml(user.name || 'Campus Member')}</span>!`;
  document.getElementById('welcome-subtext').textContent = `${user.role === 'faculty' ? 'Faculty Member' : 'Student'} • ${user.department || 'Computer Science & Engineering'}`;

  try {
    // 1. Load Resources
    const allResourcesRes = await API.resources.list({ pageSize: 50 });
    const allResources = allResourcesRes.items || DEMO_DATA.resources;
    
    // In demo mode, filter resources owned by current user or assign a subset
    const myListed = allResources.filter(r => r.owner?.id === user.id || r.owner?.name === user.name || ['r001', 'r003', 'r006'].includes(r.id));
    const saleItems = myListed.filter(r => r.exchangeMode === 'sell');

    // 2. Load Reservations
    const reservations = await API.reservations.list();
    const activeRes = reservations.filter(r => r.status === 'active' || r.status === 'approved');
    const pendingRes = reservations.filter(r => r.status === 'pending');

    // 3. Load Transactions
    const transactions = await API.transactions.list();
    const completedTx = transactions.filter(t => t.status === 'completed');

    // 4. Load Notifications & Wishlist
    const notifications = await API.notifications.list();
    const unreadNotifs = notifications.filter(n => !n.read);
    const wishlistIds = API.wishlist.getIds();

    // Populate Metrics
    document.getElementById('stat-listed').textContent = myListed.length;
    document.getElementById('stat-borrowed').textContent = activeRes.length;
    document.getElementById('stat-pending').textContent = pendingRes.length;
    document.getElementById('stat-completed').textContent = completedTx.length;
    document.getElementById('stat-sale-items').textContent = `${saleItems.length} Items`;
    document.getElementById('stat-wishlist').textContent = `${wishlistIds.length} Items`;
    document.getElementById('stat-unread-notifs').textContent = `${unreadNotifs.length} New`;

    // Render Reservations widget
    renderReservationsWidget(reservations.slice(0, 4));

    // Render Activity feed
    renderActivityFeed(notifications.slice(0, 5));

    // Render My Resources Preview
    renderMyResourcesPreview(myListed.slice(0, 3));

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    Toast.show('Error loading some dashboard widgets', 'warning');
  }
}

function renderReservationsWidget(list) {
  const container = document.getElementById('dashboard-reservations-list');
  if (!list || list.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted" style="padding:var(--space-4) 0">No active or pending reservations.</p>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const statusBadges = {
      pending:  '<span class="badge badge-warning">Pending Approval</span>',
      approved: '<span class="badge badge-info">Approved / Ready</span>',
      active:   '<span class="badge badge-success">Currently Borrowed</span>',
      returned: '<span class="badge badge-neutral">Returned</span>'
    };
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3);background:var(--bg-muted);border-radius:var(--radius-lg);gap:var(--space-3)">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:var(--text-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${escapeHtml(item.resourceTitle || 'Academic Resource')}
          </div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">
            Dates: ${formatDate(item.startDate)} → ${formatDate(item.returnDate)}
          </div>
        </div>
        <div>
          ${statusBadges[item.status] || `<span class="badge">${item.status}</span>`}
        </div>
      </div>
    `;
  }).join('');
}

function renderActivityFeed(notifications) {
  const container = document.getElementById('dashboard-activity-feed');
  if (!notifications || notifications.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted" style="padding:var(--space-4) 0">No recent campus activity.</p>`;
    return;
  }

  const icons = {
    reservation: '📅',
    match: '⚡',
    reminder: '⏰',
    transaction: '💳',
    system: '📢'
  };

  container.innerHTML = notifications.map(n => `
    <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--border-color)">
      <div style="font-size:1.25rem;line-height:1;margin-top:2px">${icons[n.type] || '🔔'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:var(--text-sm);font-weight:600">${escapeHtml(n.title)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:1px">${escapeHtml(n.message)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">${timeAgo(n.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

function renderMyResourcesPreview(list) {
  const container = document.getElementById('my-resources-preview-grid');
  if (!list || list.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted">You haven't listed any resources yet. Click "Share Resource" to begin!</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="card" style="padding:var(--space-4);display:flex;gap:var(--space-3);align-items:center">
      <img src="${item.thumbnail || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'}" alt="${escapeHtml(item.title)}" style="width:56px;height:56px;border-radius:var(--radius-md);object-fit:cover;flex-shrink:0"/>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:var(--text-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${escapeHtml(item.title)}
        </div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">
          ${item.exchangeMode.toUpperCase()} • ${item.status.toUpperCase()}
        </div>
        <div style="margin-top:var(--space-2);display:flex;gap:var(--space-2)">
          <a href="edit-listing.html?id=${item.id}" class="text-xs text-primary font-semibold">Edit</a>
          <span>•</span>
          <a href="resource-details.html?id=${item.id}" class="text-xs text-secondary">View</a>
        </div>
      </div>
    </div>
  `).join('');
}
