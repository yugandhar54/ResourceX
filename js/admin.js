/**
 * ResourceX – Campus Administration Logic
 * Manages admin dashboard metrics, moderation queue, user management, and Chart.js analytics.
 */

/* ══════════════════════════════════════════════════════════════
   1. ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
async function initAdminDashboard() {
  if (typeof Auth !== 'undefined' && !Auth.requireAdmin()) return;
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-dashboard');

  const adminUser = (typeof Auth !== 'undefined' && Auth.getUser()) || null;
  const displayEl = document.getElementById('admin-user-display');
  if (displayEl && adminUser) {
    displayEl.textContent = adminUser.name || adminUser.email || 'Campus Admin';
  }

  await renderAdminDashboardStats();
  await loadAdminResources();
  renderDashboardApprovalList();
  renderAdminOverviewCharts();
}

async function renderAdminDashboardStats() {
  try {
    const [allRes, users] = await Promise.all([
      API.admin.resources(),
      API.users.list().catch(() => DEMO_DATA.users || []),
    ]);

    const resList = Array.isArray(allRes) ? allRes : (allRes.items || []);
    const userList = Array.isArray(users) ? users : [];

    const totalRes = resList.length;
    const physCount = resList.filter(r => r.type === 'physical').length;
    const digiCount = resList.filter(r => r.type === 'digital').length;
    const pendCount = resList.filter(r => r.status === 'pending').length;

    const elTotal = document.getElementById('adm-res-count');
    if (elTotal) elTotal.textContent = totalRes.toLocaleString();

    const elPhys = document.getElementById('adm-phys-count');
    if (elPhys) elPhys.textContent = physCount.toLocaleString();

    const elDigi = document.getElementById('adm-digi-count');
    if (elDigi) elDigi.textContent = digiCount.toLocaleString();

    const elPend = document.getElementById('adm-pending-count');
    if (elPend) elPend.textContent = pendCount;

    const elBtnPend = document.getElementById('btn-pending-count');
    if (elBtnPend) elBtnPend.textContent = pendCount;

    const elUsers = document.getElementById('adm-users-count');
    if (elUsers) elUsers.textContent = userList.length.toLocaleString();

    // Active reservations count (real data only)
    let activeReservationsCount = 0;
    try {
      const resData = await API.reservations.list().catch(() => []);
      const localRes = JSON.parse(localStorage.getItem('rx_reservations') || '[]');
      const allReservations = [...(Array.isArray(resData) ? resData : []), ...localRes];
      activeReservationsCount = allReservations.filter(r => r.status === 'active' || r.status === 'approved').length;
    } catch (_) {}
    const elActiveRes = document.getElementById('adm-active-res');
    if (elActiveRes) elActiveRes.textContent = activeReservationsCount.toLocaleString();

    // Completed exchanges / transactions count (real data only)
    let completedTxCount = 0;
    try {
      const txData = await API.transactions.list().catch(() => []);
      const localTx = JSON.parse(localStorage.getItem('rx_transactions') || '[]');
      const allTx = [...(Array.isArray(txData) ? txData : []), ...localTx];
      completedTxCount = allTx.filter(t => t.status === 'completed').length;
    } catch (_) {}
    const elTx = document.getElementById('adm-tx-count');
    if (elTx) elTx.textContent = completedTxCount.toLocaleString();

    // Real reported content count (from actual user reports)
    let pendingReportsCount = 0;
    try {
      const reports = JSON.parse(localStorage.getItem('rx_reports') || '[]');
      pendingReportsCount = reports.filter(r => r.status !== 'dismissed' && r.status !== 'resolved').length;
    } catch (_) {}
    const elReports = document.getElementById('adm-reports-count');
    if (elReports) elReports.textContent = pendingReportsCount.toLocaleString();
  } catch (err) {
    console.warn('Dashboard stats warning:', err);
  }
}

function renderAdminOverviewCharts() {
  // Chart 1: Categories
  const ctxCat = document.getElementById('chart-category');
  if (ctxCat && window.Chart) {
    new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Books & Texts', 'Electronics & Kits', 'Study Notes', 'Lab Apparatus', 'Calculators & Tech'],
        datasets: [{
          data: [42, 28, 15, 10, 5],
          backgroundColor: ['#2563eb', '#0d9488', '#f59e0b', '#10b981', '#8b5cf6'],
          borderWidth: 2,
          borderColor: 'transparent'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // Chart 2: Monthly Trends
  const ctxTrends = document.getElementById('chart-trends');
  if (ctxTrends && window.Chart) {
    new Chart(ctxTrends, {
      type: 'line',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'Borrowings',
            data: [120, 150, 180, 310, 480, 560],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'New Listings',
            data: [90, 110, 130, 260, 390, 440],
            borderColor: '#0d9488',
            backgroundColor: 'transparent',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   1.1 RESOURCE APPROVAL QUEUE (DASHBOARD)
   ══════════════════════════════════════════════════════════════ */
let dashApprovalTab = 'pending';

function switchDashboardApprovalTab(tab) {
  dashApprovalTab = tab;
  ['pending', 'approved', 'all'].forEach(t => {
    const btn = document.getElementById(`tab-approval-${t}`);
    if (btn) {
      if (t === tab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderDashboardApprovalList();
}

async function renderDashboardApprovalList() {
  const container = document.getElementById('quick-moderation-list');
  if (!container) return;

  if (!cachedAdminResources || cachedAdminResources.length === 0) {
    await loadAdminResources();
  }

  // Update badge and tab counters
  const pendCount = cachedAdminResources.filter(r => r.status === 'pending').length;
  const apprCount = cachedAdminResources.filter(r => r.status === 'approved' || r.status === 'available').length;
  const allCount = cachedAdminResources.length;

  const countPendEl = document.getElementById('dash-count-pending');
  if (countPendEl) countPendEl.textContent = pendCount;
  const countApprEl = document.getElementById('dash-count-approved');
  if (countApprEl) countApprEl.textContent = apprCount;
  const countAllEl = document.getElementById('dash-count-all');
  if (countAllEl) countAllEl.textContent = allCount;

  const badgePendEl = document.getElementById('dash-pending-badge');
  if (badgePendEl) {
    badgePendEl.textContent = `${pendCount} Pending`;
    badgePendEl.className = pendCount > 0 ? 'badge badge-warning' : 'badge badge-success';
  }

  // Filter by active tab
  let items = [...cachedAdminResources];
  if (dashApprovalTab === 'pending') {
    items = items.filter(r => r.status === 'pending');
  } else if (dashApprovalTab === 'approved') {
    items = items.filter(r => r.status === 'approved' || r.status === 'available');
  }

  // Search filter
  const query = (document.getElementById('dash-approval-search')?.value || '').toLowerCase().trim();
  if (query) {
    items = items.filter(r => {
      const title = (r.title || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      const name = (r.ownerName || r.owner?.name || '').toLowerCase();
      const email = (r.ownerEmail || r.owner?.email || '').toLowerCase();
      const dept = (r.ownerDept || r.owner?.department || r.department || '').toLowerCase();
      return title.includes(query) || desc.includes(query) || cat.includes(query) || name.includes(query) || email.includes(query) || dept.includes(query);
    });
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div style="padding:var(--space-8);text-align:center;background:var(--bg-muted);border-radius:var(--radius-lg);border:1px dashed var(--border-color)">
        <div style="font-size:2.2rem;margin-bottom:var(--space-2)">${dashApprovalTab === 'pending' ? '🎉' : '🔍'}</div>
        <div style="font-weight:700;font-size:var(--text-base);color:var(--text-primary);margin-bottom:4px">
          ${dashApprovalTab === 'pending' ? 'No Submissions Awaiting Approval' : 'No Resources Found'}
        </div>
        <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0;max-width:460px;margin-left:auto;margin-right:auto">
          ${dashApprovalTab === 'pending' 
            ? 'All campus submissions are currently reviewed and published! When users share a resource, it will appear here for admin approval.' 
            : 'Try adjusting your search query or switch between filter tabs to review submissions.'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(r => {
    const id = r.id || r._id;
    const isPending = r.status === 'pending';
    const isApproved = r.status === 'approved' || r.status === 'available';
    const isRejected = r.status === 'rejected';

    const ownerName = r.ownerName || r.owner?.name || 'Campus Student';
    const ownerEmail = r.ownerEmail || r.owner?.email || 'student@campus.edu';
    const ownerDept = r.ownerDept || r.owner?.department || r.department || 'General Academic';
    const ownerRoll = r.ownerRoll || r.owner?.rollNumber || '';
    const ownerPhone = r.ownerPhone || r.owner?.phone || '';
    const ownerRole = r.owner?.role || 'STUDENT';
    const ownerAvatar = r.ownerAvatar || r.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=2563eb&color=fff`;

    const imgUrl = (r.images && r.images[0]) || r.thumbnail || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80';
    const timeStr = r.createdAt ? timeAgo(r.createdAt) : 'Recently';
    const priceDisplay = r.exchangeMode === 'free' ? 'Free' : (r.exchangeMode === 'borrow' ? 'Borrow' : formatCurrency(r.price));
    const cleanTitle = (r.title || 'Resource').replace(/'/g, "\\'");

    return `
      <div class="card" id="approval-card-${id}" style="padding:var(--space-4);border:1px solid ${isPending ? 'rgba(245, 158, 11, 0.45)' : 'var(--border-color)'};background:var(--bg-surface);box-shadow:var(--shadow-sm);transition:all 0.2s">
        <div style="display:flex;gap:var(--space-3);align-items:flex-start;flex-wrap:wrap">
          
          <!-- Resource Thumbnail -->
          <div style="width:90px;height:90px;border-radius:var(--radius-md);overflow:hidden;background:var(--bg-muted);flex-shrink:0;border:1px solid var(--border-color);position:relative">
            <img src="${imgUrl}" alt="${escapeHtml(r.title)}" style="width:100%;height:100%;object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'"/>
          </div>

          <!-- Main Info -->
          <div style="flex:1;min-width:220px">
            <!-- Badges Row -->
            <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2);flex-wrap:wrap">
              ${isPending ? `
                <span class="badge badge-warning" style="font-weight:700">⏳ Awaiting Approval</span>
              ` : isApproved ? `
                <span class="badge badge-success" style="font-weight:700">✓ Live in Campus Catalog</span>
              ` : `
                <span class="badge badge-danger" style="font-weight:700">✕ Rejected</span>
              `}
              <span class="badge badge-${r.type === 'physical' ? 'primary' : 'info'}">
                ${(r.type || 'Physical').toUpperCase()}
              </span>
              <span class="badge badge-neutral">
                ${escapeHtml(r.category || 'General')}
              </span>
              <span class="badge badge-outline">
                ${priceDisplay}
              </span>
              <span style="font-size:var(--text-xs);color:var(--text-muted);margin-left:auto">
                Submitted ${timeStr}
              </span>
            </div>

            <!-- Title & Description -->
            <h4 style="font-size:var(--text-base);font-weight:700;margin:0 0 4px 0;color:var(--text-primary)">
              <a href="resource-details.html?id=${id}" target="_blank" style="color:inherit;text-decoration:none">
                ${escapeHtml(r.title)}
              </a>
            </h4>
            <p style="font-size:var(--text-xs);color:var(--text-secondary);margin:0 0 var(--space-2) 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.45">
              ${escapeHtml(r.description || 'No description provided.')}
            </p>

            <!-- Submitter (Who Shared This Resource) Admin Box -->
            <div style="background:var(--bg-muted);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:6px 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <img src="${ownerAvatar}" alt="${escapeHtml(ownerName)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--primary)"/>
              <div style="flex:1;min-width:160px">
                <div style="font-size:var(--text-xs);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                  <span>👤 ${escapeHtml(ownerName)}</span>
                  <span class="badge badge-xs badge-neutral">${escapeHtml(ownerRole.toUpperCase())}</span>
                </div>
                <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;display:flex;gap:10px;flex-wrap:wrap">
                  <span>📧 <strong>Email:</strong> ${escapeHtml(ownerEmail)}</span>
                  <span>🏛️ <strong>Dept:</strong> ${escapeHtml(ownerDept)}</span>
                  ${ownerPhone ? `<span>📞 <strong>Phone:</strong> ${escapeHtml(ownerPhone)}</span>` : (ownerRoll ? `<span>🎓 <strong>ID:</strong> ${escapeHtml(ownerRoll)}</span>` : '')}
                </div>
              </div>
            </div>
          </div>

          <!-- Approval Actions Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-2);min-width:145px;justify-content:center;margin-left:auto">
            ${isPending ? `
              <button 
                class="btn btn-primary btn-sm" 
                style="background:var(--color-success-600, #16a34a);border-color:var(--color-success-600, #16a34a);font-weight:700;box-shadow:0 2px 4px rgba(22,163,74,0.2)" 
                onclick="approveAndPublish('${id}', '${cleanTitle}')">
                ✓ Approve &amp; Publish
              </button>
              <button 
                class="btn btn-outline btn-sm" 
                style="color:var(--color-danger-600, #dc2626);border-color:var(--color-danger-600, #dc2626)" 
                onclick="rejectSubmission('${id}', '${cleanTitle}')">
                ✕ Reject Submission
              </button>
            ` : isApproved ? `
              <div style="display:flex;align-items:center;gap:6px;color:var(--color-success-600);font-size:var(--text-xs);font-weight:700;padding:5px 8px;background:rgba(22,163,74,0.08);border-radius:var(--radius-sm);justify-content:center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Available to Everyone
              </div>
              <button 
                class="btn btn-outline btn-sm" 
                onclick="revokeApproval('${id}', '${cleanTitle}')">
                Revoke Approval
              </button>
            ` : `
              <button 
                class="btn btn-primary btn-sm" 
                onclick="approveAndPublish('${id}', '${cleanTitle}')">
                ✓ Re-Approve &amp; Publish
              </button>
            `}
            <a href="resource-details.html?id=${id}" target="_blank" class="btn btn-ghost btn-xs" style="text-align:center">
              View Public Page ↗
            </a>
          </div>

        </div>
      </div>
    `;
  }).join('');
}

async function approveAndPublish(id, title) {
  try {
    await API.admin.moderate(id, 'approved');
    Toast.show(`Approved! "${title || 'Resource'}" is now live and available to everyone in the campus catalog.`, 'success');
    await loadAdminResources();
    renderDashboardApprovalList();
    renderAdminDashboardStats();
  } catch (err) {
    Toast.show('Failed to approve resource: ' + (err.message || 'Server error'), 'danger');
  }
}

async function rejectSubmission(id, title) {
  try {
    await API.admin.moderate(id, 'rejected');
    Toast.show(`Rejected: "${title || 'Resource'}" listing will not be visible to the public.`, 'info');
    await loadAdminResources();
    renderDashboardApprovalList();
    renderAdminDashboardStats();
  } catch (err) {
    Toast.show('Failed to reject resource: ' + (err.message || 'Server error'), 'danger');
  }
}

async function revokeApproval(id, title) {
  try {
    await API.admin.moderate(id, 'pending');
    Toast.show(`Approval revoked for "${title || 'Resource'}". It is now hidden from public browsing.`, 'info');
    await loadAdminResources();
    renderDashboardApprovalList();
    renderAdminDashboardStats();
  } catch (err) {
    Toast.show('Failed to revoke approval.', 'danger');
  }
}

async function renderAdminQuickModeration() {
  await renderDashboardApprovalList();
}

async function quickApprove(btn, id, title) {
  await approveAndPublish(id, title);
}

async function quickReject(btn, id, title) {
  await rejectSubmission(id, title);
}

/* ══════════════════════════════════════════════════════════════
   2. ADMIN MODERATION
   ══════════════════════════════════════════════════════════════ */
let activeModTab = 'pending';
let cachedAdminResources = [];

async function initAdminModeration() {
  if (typeof Auth !== 'undefined' && !Auth.requireAdmin()) return;
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-moderation');

  await loadAdminResources();
  renderModerationTabContent();
}

async function loadAdminResources() {
  try {
    const list = await API.admin.resources();
    cachedAdminResources = Array.isArray(list) ? list : (list.items || []);
  } catch (err) {
    console.warn('Failed to load admin resources:', err);
    cachedAdminResources = DEMO_DATA.resources || [];
  }

  const pendCount = cachedAdminResources.filter(r => r.status === 'pending').length;
  const pendEl = document.getElementById('mod-count-pending');
  if (pendEl) pendEl.textContent = pendCount;

  const repEl = document.getElementById('mod-count-reported');
  let realReportedCount = 0;
  try {
    const reports = JSON.parse(localStorage.getItem('rx_reports') || '[]');
    realReportedCount = reports.filter(r => r.status !== 'dismissed' && r.status !== 'resolved').length;
  } catch (_) {}
  if (repEl) repEl.textContent = realReportedCount;
}

function switchModTab(tab) {
  activeModTab = tab;
  ['pending', 'reported', 'resolved'].forEach(t => {
    const btn = document.getElementById(`tab-mod-${t}`);
    if (btn) {
      if (t === tab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderModerationTabContent();
}

function renderModerationTabContent() {
  const container = document.getElementById('mod-items-container');
  if (!container) return;

  if (activeModTab === 'pending') {
    // Show pending resources; if none pending, show all active resources so admin sees who shared everything
    let items = cachedAdminResources.filter(r => r.status === 'pending');
    let isShowingAll = false;
    if (items.length === 0) {
      items = cachedAdminResources;
      isShowingAll = true;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding:var(--space-8);text-align:center;color:var(--text-muted)">
          <h3>No resources in queue</h3>
          <p class="text-sm">When users share resources, they will appear here with full contributor details.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      ${isShowingAll ? `
        <div style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.25);border-radius:10px;padding:10px 16px;margin-bottom:var(--space-2);font-size:13px;display:flex;justify-content:space-between;align-items:center">
          <span>Viewing all <strong>${items.length} shared resources</strong> and contributors across campus.</span>
          <span class="badge badge-success">All Active</span>
        </div>
      ` : ''}
      ${items.map(r => {
        const id = r.id || r._id;
        const ownerName = r.ownerName || r.owner?.name || 'Campus Contributor';
        const ownerEmail = r.ownerEmail || r.owner?.email || 'N/A';
        const ownerDept = r.ownerDept || r.owner?.department || r.department || 'General';
        const ownerRoll = r.ownerRoll || r.owner?.rollNumber || '';
        const ownerPhone = r.ownerPhone || r.owner?.phone || '';
        const ownerAvatar = r.ownerAvatar || r.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=2563eb&color=fff`;
        const timeStr = r.createdAt ? timeAgo(r.createdAt) : 'Recently';
        const priceStr = formatCurrency(r.price);
        const imgUrl = (r.images && r.images[0]) || r.thumbnail || '';

        return `
          <div class="card" style="padding:var(--space-4)" id="mod-card-${id}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-3)">
              <div style="flex:1;min-width:220px">
                <!-- Badges -->
                <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2);flex-wrap:wrap">
                  <span class="badge badge-${r.status === 'approved' ? 'success' : 'warning'}">
                    ${r.status === 'approved' ? 'Active / Approved' : 'Awaiting Approval'}
                  </span>
                  <span class="badge badge-${r.type === 'physical' ? 'primary' : 'info'}">
                    ${(r.type || 'Physical').toUpperCase()}
                  </span>
                  <span class="badge badge-neutral">
                    ${r.category || 'General'}
                  </span>
                  <span class="badge badge-outline">
                    ${r.exchangeMode === 'free' ? 'Free Share' : r.exchangeMode === 'borrow' ? 'Borrow' : priceStr}
                  </span>
                  <span class="text-xs text-muted">Submitted ${timeStr}</span>
                </div>

                <!-- Title & Description -->
                <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">
                  ${escapeHtml(r.title)}
                </h3>
                <p class="text-secondary text-sm" style="margin-bottom:var(--space-3);line-height:1.5">
                  ${escapeHtml(r.description)}
                </p>

                <!-- Submitter Information Box (Admin View) -->
                <div style="background:var(--bg-secondary,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                  <img src="${ownerAvatar}" alt="${escapeHtml(ownerName)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--primary)"/>
                  <div style="flex:1;min-width:180px">
                    <div style="font-weight:700;font-size:14px;color:var(--text-primary);display:flex;align-items:center;gap:8px">
                      <span>👤 ${escapeHtml(ownerName)}</span>
                      <span class="badge badge-xs badge-neutral">${escapeHtml((r.owner?.role || 'STUDENT').toUpperCase())}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;display:flex;gap:12px;flex-wrap:wrap">
                      <span>📧 <strong>Email:</strong> ${escapeHtml(ownerEmail)}</span>
                      <span>🏛️ <strong>Dept:</strong> ${escapeHtml(ownerDept)}</span>
                      ${ownerPhone ? `<span>📞 <strong>Phone:</strong> ${escapeHtml(ownerPhone)}</span>` : (ownerRoll ? `<span>🎓 <strong>ID:</strong> ${escapeHtml(ownerRoll)}</span>` : '')}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display:flex;flex-direction:column;gap:var(--space-2);min-width:130px;margin-left:auto">
                <a href="resource-details.html?id=${id}" target="_blank" class="btn btn-outline btn-sm" style="text-align:center">
                  View Listing ↗
                </a>
                ${r.status !== 'approved' ? `
                  <button class="btn btn-primary btn-sm" onclick="resolveModItem('${id}', 'approved')">
                    ✓ Approve Listing
                  </button>
                ` : `
                  <button class="btn btn-outline btn-sm" onclick="resolveModItem('${id}', 'rejected')">
                    Revoke Approval
                  </button>
                `}
                <button class="btn btn-danger btn-sm" onclick="deleteResourceAsAdmin('${id}')">
                  Delete Listing
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  } else if (activeModTab === 'reported') {
    let pendingReports = [];
    try {
      const reports = JSON.parse(localStorage.getItem('rx_reports') || '[]');
      pendingReports = reports.filter(r => r.status !== 'dismissed' && r.status !== 'resolved');
    } catch (_) {}

    if (pendingReports.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding:var(--space-8);text-align:center;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:var(--space-2)">🛡️</div>
          <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">No Reported Content</h3>
          <p class="text-sm">There are currently no active violation reports or flagged items from campus members.</p>
        </div>
      `;
    } else {
      container.innerHTML = pendingReports.map(rep => `
        <div class="card" style="padding:var(--space-6);border-left:4px solid var(--color-danger-500)" id="mod-report-${rep.id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4)">
            <div style="flex:1;min-width:280px">
              <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2)">
                <span class="badge badge-danger">Policy Report</span>
                <span class="text-xs text-danger font-semibold">Flag: ${escapeHtml(rep.reason || 'Reported Content')}</span>
              </div>
              <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">
                Reported Item: "${escapeHtml(rep.resourceTitle || 'Resource Item')}"
              </h3>
              <p class="text-secondary text-sm" style="margin-bottom:var(--space-3)">
                <strong>Reporter's Note:</strong> "${escapeHtml(rep.details || 'No additional details provided.')}"
              </p>
              <div class="text-xs text-muted">
                Reported by ${escapeHtml(rep.reporter || 'Campus Peer')} • ${rep.createdAt ? timeAgo(rep.createdAt) : 'Recently'}
              </div>
            </div>
            <div style="display:flex;gap:var(--space-2)">
              <button class="btn btn-outline btn-sm" onclick="dismissReport('${rep.id}')">Dismiss Claim</button>
              <button class="btn btn-danger btn-sm" onclick="removeReportedListing('${rep.id}', '${rep.resourceId}')">Remove Listing</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } else {
    let auditLogs = [];
    try {
      auditLogs = JSON.parse(localStorage.getItem('rx_mod_audit') || '[]');
    } catch (_) {}

    if (auditLogs.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding:var(--space-8);text-align:center;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:var(--space-2)">📋</div>
          <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">No Audit History</h3>
          <p class="text-sm">Completed approval, rejection, and moderation actions will appear here.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card" style="padding:var(--space-6)">
          <h4 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-4)">Recent Moderation Audit Logs</h4>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);font-size:var(--text-sm)">
            ${auditLogs.map(log => `
              <div style="padding:var(--space-2) 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                <span>
                  <span class="badge badge-${log.action === 'APPROVED' ? 'success' : log.action === 'REMOVED' ? 'danger' : 'warning'} badge-xs" style="margin-right:6px">
                    ${escapeHtml(log.action)}
                  </span>
                  <strong>${escapeHtml(log.resourceTitle || 'Resource Listing')}</strong>
                </span>
                <span class="text-muted text-xs">${log.timestamp ? timeAgo(log.timestamp) : 'Recently'} by ${escapeHtml(log.by || 'Admin')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }
}

async function resolveModItem(resourceId, action) {
  try {
    await API.admin.moderate(resourceId, action);
    Toast.show(`Listing marked as ${action.toUpperCase()}. Submitter notified.`, 'success');

    try {
      const targetRes = cachedAdminResources.find(r => (r.id || r._id) === resourceId);
      const audits = JSON.parse(localStorage.getItem('rx_mod_audit') || '[]');
      audits.unshift({
        id: 'aud_' + Date.now(),
        action: action.toUpperCase(),
        resourceTitle: targetRes ? targetRes.title : 'Resource Item',
        timestamp: new Date().toISOString(),
        by: 'Admin'
      });
      localStorage.setItem('rx_mod_audit', JSON.stringify(audits.slice(0, 50)));
    } catch (_) {}

    await loadAdminResources();
    renderModerationTabContent();
  } catch (err) {
    Toast.show('Failed to update listing status.', 'danger');
  }
}

async function deleteResourceAsAdmin(resourceId) {
  if (!confirm('Are you sure you want to permanently remove this resource listing?')) return;
  try {
    const targetRes = cachedAdminResources.find(r => (r.id || r._id) === resourceId);
    await API.resources.delete(resourceId);

    try {
      const audits = JSON.parse(localStorage.getItem('rx_mod_audit') || '[]');
      audits.unshift({
        id: 'aud_' + Date.now(),
        action: 'DELETED',
        resourceTitle: targetRes ? targetRes.title : 'Resource Item',
        timestamp: new Date().toISOString(),
        by: 'Admin'
      });
      localStorage.setItem('rx_mod_audit', JSON.stringify(audits.slice(0, 50)));
    } catch (_) {}

    Toast.show('Resource listing permanently deleted.', 'info');
    await loadAdminResources();
    renderModerationTabContent();
  } catch (err) {
    Toast.show('Failed to delete listing.', 'danger');
  }
}

function dismissReport(reportId) {
  try {
    const reports = JSON.parse(localStorage.getItem('rx_reports') || '[]');
    const targetRep = reports.find(r => r.id === reportId);
    const updated = reports.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r);
    localStorage.setItem('rx_reports', JSON.stringify(updated));

    const audits = JSON.parse(localStorage.getItem('rx_mod_audit') || '[]');
    audits.unshift({
      id: 'aud_' + Date.now(),
      action: 'DISMISSED',
      resourceTitle: targetRep ? targetRep.resourceTitle : 'Reported Item',
      timestamp: new Date().toISOString(),
      by: 'Admin'
    });
    localStorage.setItem('rx_mod_audit', JSON.stringify(audits.slice(0, 50)));
  } catch (err) {
    console.warn('Error dismissing report:', err);
  }

  document.getElementById(`mod-report-${reportId}`)?.remove();
  Toast.show('Report dismissed. Listing verified compliant.', 'info');
  loadAdminResources();
  renderModerationTabContent();
}

async function removeReportedListing(reportId, resourceId) {
  try {
    if (resourceId && resourceId !== 'unknown') {
      await API.resources.delete(resourceId).catch(() => {});
    }
    const reports = JSON.parse(localStorage.getItem('rx_reports') || '[]');
    const targetRep = reports.find(r => r.id === reportId);
    const updated = reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r);
    localStorage.setItem('rx_reports', JSON.stringify(updated));

    const audits = JSON.parse(localStorage.getItem('rx_mod_audit') || '[]');
    audits.unshift({
      id: 'aud_' + Date.now(),
      action: 'REMOVED',
      resourceTitle: targetRep ? targetRep.resourceTitle : 'Reported Item',
      timestamp: new Date().toISOString(),
      by: 'Admin'
    });
    localStorage.setItem('rx_mod_audit', JSON.stringify(audits.slice(0, 50)));
  } catch (err) {
    console.warn('Error removing reported listing:', err);
  }

  document.getElementById(`mod-report-${reportId}`)?.remove();
  Toast.show('Listing permanently removed. Formal notice sent to user.', 'danger');
  loadAdminResources();
  renderModerationTabContent();
}

/* ══════════════════════════════════════════════════════════════
   3. ADMIN USERS
   ══════════════════════════════════════════════════════════════ */
let campusUsers = [];

async function initAdminUsers() {
  if (typeof Auth !== 'undefined' && !Auth.requireAdmin()) return;
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-users');

  try {
    const list = await API.users.list();
    const localUsers = JSON.parse(localStorage.getItem('rx_local_users') || '[]');
    const rawList = Array.isArray(list) ? list : [];
    const merged = [...localUsers, ...rawList];

    // Deduplicate by email
    const seen = new Set();
    campusUsers = merged.filter(u => {
      const email = (u.email || '').toLowerCase();
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    }).map(u => ({
      id: u._id || u.id,
      name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Campus Student',
      email: u.email || '',
      phone: u.phone || u.phoneNumber || '',
      dept: u.department || 'General',
      role: u.role || 'student',
      status: u.status || 'active',
      listings: u.listedCount || 0,
      rating: u.rating || 5.0,
    }));
  } catch (err) {
    console.warn('Failed to load campus users:', err);
    campusUsers = (DEMO_DATA.users || []).map(u => ({ ...u, dept: u.dept || u.department || 'General' }));
  }

  renderAdminUsersTable();
}

function renderAdminUsersTable() {
  const tbody = document.getElementById('admin-users-tbody');
  const search = (document.getElementById('admin-user-search')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('admin-user-role-filter')?.value || 'all';
  const statusFilter = document.getElementById('admin-user-status-filter')?.value || 'all';

  let filtered = campusUsers;

  if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
  if (statusFilter !== 'all') filtered = filtered.filter(u => u.status === statusFilter);
  if (search) {
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search) ||
      u.dept.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:var(--space-8);color:var(--text-muted)">
          <div style="font-size:var(--text-base);font-weight:600;margin-bottom:var(--space-1)">No users registered</div>
          <div style="font-size:var(--text-xs)">No active, pending, or suspended user accounts found.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="user-row-info">
          <div class="avatar avatar-sm">${escapeHtml(u.name.split(' ').map(n=>n[0]).join('').slice(0,2))}</div>
          <div>
            <div class="user-row-name">${escapeHtml(u.name)}</div>
            <div class="user-row-email">${escapeHtml(u.email)}${u.phone ? ` • 📞 ${escapeHtml(u.phone)}` : ''}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="badge badge-${u.role === 'faculty' ? 'info' : u.role === 'admin' ? 'primary' : 'neutral'}">
          ${u.role.toUpperCase()}
        </span>
      </td>
      <td style="font-size:var(--text-sm)">${escapeHtml(u.dept)}</td>
      <td style="font-weight:600;font-size:var(--text-sm)">${u.listings}</td>
      <td style="color:var(--color-warning-600);font-weight:600;font-size:var(--text-sm)">★ ${u.rating}</td>
      <td>
        <span class="badge badge-${u.status === 'active' ? 'success' : 'danger'}">
          ${u.status.toUpperCase()}
        </span>
      </td>
      <td style="text-align:right">
        ${u.status === 'active' ? `
          <button class="btn btn-ghost btn-sm" onclick="toggleUserStatus('${u.id}', 'suspended')" style="color:var(--color-danger-600)">
            Suspend
          </button>
        ` : `
          <button class="btn btn-ghost btn-sm" onclick="toggleUserStatus('${u.id}', 'active')" style="color:var(--color-success-600)">
            Reactivate
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

function toggleUserStatus(userId, newStatus) {
  const user = campusUsers.find(u => u.id === userId);
  if (user) {
    user.status = newStatus;
    renderAdminUsersTable();
    Toast.show(`User "${user.name}" status updated to ${newStatus.toUpperCase()}`, 'info');
  }
}

/* ══════════════════════════════════════════════════════════════
   4. ADMIN ANALYTICS
   ══════════════════════════════════════════════════════════════ */
function initAdminAnalytics() {
  if (typeof Auth !== 'undefined' && !Auth.requireAdmin()) return;
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-analytics');

  renderAnalyticsCharts();
}

function renderAnalyticsCharts() {
  if (!window.Chart) return;

  // 1. Doughnut: Category Distribution
  const ctxCat = document.getElementById('chart-cat-doughnut');
  if (ctxCat) {
    new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: ['Textbooks', 'Electronics', 'Notes & Guides', 'Lab Gear', 'Calculators', 'Stationery'],
        datasets: [{
          data: [650, 420, 380, 210, 110, 75],
          backgroundColor: ['#2563eb', '#0d9488', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }
      }
    });
  }

  // 2. Pie: Physical vs. Digital
  const ctxType = document.getElementById('chart-type-pie');
  if (ctxType) {
    new Chart(ctxType, {
      type: 'pie',
      data: {
        labels: ['Physical Resources (61%)', 'Digital Permitted Materials (39%)'],
        datasets: [{
          data: [1120, 725],
          backgroundColor: ['#2563eb', '#0d9488'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    });
  }

  // 3. Line: 6-Month Circulation Trends
  const ctxTrends = document.getElementById('chart-activity-trends');
  if (ctxTrends) {
    new Chart(ctxTrends, {
      type: 'line',
      data: {
        labels: ['May', 'Jun', 'Jul', 'Aug (Semester Start)', 'Sep', 'Oct'],
        datasets: [
          {
            label: 'Borrowings & Reservations',
            data: [140, 180, 220, 580, 890, 1120],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Requirement Postings',
            data: [45, 60, 95, 340, 480, 610],
            borderColor: '#0d9488',
            backgroundColor: 'transparent',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // 4. Bar: Departmental Demand
  const ctxDept = document.getElementById('chart-dept-demand');
  if (ctxDept) {
    new Chart(ctxDept, {
      type: 'bar',
      data: {
        labels: ['Computer Science', 'Electrical Eng', 'Mechanical Eng', 'Chemistry & Bio', 'Physics & Math', 'Civil Eng', 'Architecture'],
        datasets: [{
          label: 'Active Resource Exchanges',
          data: [680, 520, 390, 310, 280, 190, 140],
          backgroundColor: '#0d9488',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
