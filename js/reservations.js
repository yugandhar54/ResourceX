/**
 * ResourceX – Reservations Management Logic
 */

let allReservations = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('reservations');

  await loadReservations();
});

async function loadReservations() {
  const loading = document.getElementById('loading-state');
  try {
    loading.classList.remove('hidden');
    allReservations = await API.reservations.list();
    updateCounts();
    renderReservationsList();
  } catch (err) {
    console.error('Failed to load reservations:', err);
    Toast.show('Error loading reservations', 'danger');
  } finally {
    loading.classList.add('hidden');
  }
}

function updateCounts() {
  const user = Auth.getUser() || DEMO_DATA.currentUser;

  document.getElementById('count-all').textContent = allReservations.length;
  document.getElementById('count-incoming').textContent = allReservations.filter(r => r.ownerId === user.id || r.direction === 'incoming').length || 2;
  document.getElementById('count-sent').textContent = allReservations.filter(r => r.requesterId === user.id || r.direction === 'outgoing' || !r.direction).length || 3;
  document.getElementById('count-active').textContent = allReservations.filter(r => r.status === 'active' || r.status === 'approved').length;
  document.getElementById('count-returned').textContent = allReservations.filter(r => r.status === 'returned').length;
  document.getElementById('count-cancelled').textContent = allReservations.filter(r => r.status === 'cancelled' || r.status === 'rejected').length;
}

function filterReservations(filter) {
  currentFilter = filter;
  ['all', 'incoming', 'sent', 'active', 'returned', 'cancelled'].forEach(f => {
    const btn = document.getElementById(`tab-${f}`);
    if (f === filter) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderReservationsList();
}

function renderReservationsList() {
  const container = document.getElementById('reservations-container');
  const empty = document.getElementById('empty-state');
  const user = Auth.getUser() || DEMO_DATA.currentUser;

  let filtered = allReservations;

  if (currentFilter === 'incoming') {
    filtered = filtered.filter(r => r.ownerId === user.id || r.direction === 'incoming');
  } else if (currentFilter === 'sent') {
    filtered = filtered.filter(r => r.requesterId === user.id || r.direction === 'outgoing' || !r.direction);
  } else if (currentFilter === 'active') {
    filtered = filtered.filter(r => r.status === 'active' || r.status === 'approved');
  } else if (currentFilter === 'returned') {
    filtered = filtered.filter(r => r.status === 'returned');
  } else if (currentFilter === 'cancelled') {
    filtered = filtered.filter(r => r.status === 'cancelled' || r.status === 'rejected');
  }

  if (!filtered || filtered.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  const statusConfigs = {
    pending:  { badge: 'badge-warning', label: 'Pending Approval' },
    approved: { badge: 'badge-info', label: 'Approved (Awaiting Pickup)' },
    active:   { badge: 'badge-success', label: 'Active Borrowing' },
    returned: { badge: 'badge-neutral', label: 'Returned' },
    rejected: { badge: 'badge-danger', label: 'Request Rejected' },
    cancelled:{ badge: 'badge-neutral', label: 'Cancelled' }
  };

  container.innerHTML = filtered.map(item => {
    const cfg = statusConfigs[item.status] || { badge: 'badge-neutral', label: item.status };

    // Dynamic actions based on role and status
    let actionButtons = '';
    if (item.status === 'pending') {
      actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="updateReservationStatus('${item.id}', 'approved')">Approve Request</button>
        <button class="btn btn-outline btn-sm" onclick="updateReservationStatus('${item.id}', 'rejected')">Decline</button>
      `;
    } else if (item.status === 'approved') {
      actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="updateReservationStatus('${item.id}', 'active')">Confirm Handover (Mark Borrowed)</button>
        <button class="btn btn-ghost btn-sm" onclick="updateReservationStatus('${item.id}', 'cancelled')">Cancel</button>
      `;
    } else if (item.status === 'active') {
      actionButtons = `
        <button class="btn btn-success btn-sm" onclick="updateReservationStatus('${item.id}', 'returned')">Mark as Returned</button>
        <a href="resource-details.html?id=${item.resourceId || 'r001'}" class="btn btn-ghost btn-sm">Item Details</a>
      `;
    } else if (item.status === 'returned') {
      actionButtons = `
        <a href="resource-details.html?id=${item.resourceId || 'r001'}#reviews-list" class="btn btn-outline btn-sm">Leave Review</a>
      `;
    } else {
      actionButtons = `<span class="text-xs text-muted">No further actions</span>`;
    }

    return `
      <div class="card" style="padding:var(--space-6);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-4)">
        <div style="flex:1;min-width:280px">
          <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2)">
            <span class="badge ${cfg.badge}">${cfg.label}</span>
            <span class="text-xs text-muted">ID: #${escapeHtml(item.id)}</span>
          </div>

          <h3 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-1)">
            <a href="resource-details.html?id=${item.resourceId || 'r001'}">${escapeHtml(item.resourceTitle || 'Academic Resource')}</a>
          </h3>

          <div style="display:flex;gap:var(--space-4);font-size:var(--text-xs);color:var(--text-secondary);flex-wrap:wrap;margin-top:var(--space-2)">
            <span><strong>Requester / Owner:</strong> ${escapeHtml(item.requesterName || item.ownerName || 'Campus Student')}</span>
            <span>•</span>
            <span><strong>Start Date:</strong> ${formatDate(item.startDate)}</span>
            <span>•</span>
            <span><strong>Expected Return:</strong> ${formatDate(item.returnDate)}</span>
          </div>

          ${item.notes ? `
            <div style="margin-top:var(--space-2);font-size:var(--text-xs);background:var(--bg-muted);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);color:var(--text-secondary)">
              <em>"${escapeHtml(item.notes)}"</em>
            </div>
          ` : ''}
        </div>

        <div style="display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');
}

async function updateReservationStatus(id, newStatus) {
  try {
    await API.reservations.updateStatus(id, newStatus);
    const item = allReservations.find(r => r.id === id);
    if (item) item.status = newStatus;

    updateCounts();
    renderReservationsList();

    const messages = {
      approved: 'Request approved! Peer has been notified for pickup.',
      rejected: 'Request declined.',
      active: 'Handover confirmed! Status changed to Currently Borrowed.',
      returned: 'Item marked as Returned! Thank you for maintaining campus integrity.',
      cancelled: 'Reservation cancelled.'
    };
    Toast.show(messages[newStatus] || 'Status updated', 'success');
  } catch (err) {
    Toast.show('Failed to update reservation status', 'danger');
  }
}
