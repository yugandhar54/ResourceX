/**
 * ResourceX – Campus Administration Logic
 * Manages admin dashboard metrics, moderation queue, user management, and Chart.js analytics.
 */

/* ══════════════════════════════════════════════════════════════
   1. ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
function initAdminDashboard() {
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-dashboard');

  renderAdminQuickModeration();
  renderAdminOverviewCharts();
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

function renderAdminQuickModeration() {
  const container = document.getElementById('quick-moderation-list');
  if (!container) return;

  const pending = [
    { id: 'mod_1', title: 'Signals & Systems Lecture Complete Solutions (Fall 2024)', type: 'Digital', category: 'Notes', submitter: 'David K. (EE)' },
    { id: 'mod_2', title: 'Digital Multimeter & Oscilloscope Probe Set', type: 'Physical', category: 'Lab Gear', submitter: 'Elena R. (Physics)' }
  ];

  container.innerHTML = pending.map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3) var(--space-4);background:var(--bg-muted);border-radius:var(--radius-lg);gap:var(--space-3)">
      <div>
        <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(item.title)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">
          ${item.type} • ${item.category} • Submitted by: ${escapeHtml(item.submitter)}
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn-primary btn-sm" onclick="quickApprove(this, '${item.title}')">Approve</button>
        <button class="btn btn-outline btn-sm" onclick="quickReject(this, '${item.title}')">Reject</button>
      </div>
    </div>
  `).join('');
}

function quickApprove(btn, title) {
  const row = btn.closest('div[style*="display:flex;justify-content:space-between"]');
  row.style.opacity = '0.4';
  btn.disabled = true;
  Toast.show(`Approved: "${title}" is now publicly listed!`, 'success');
}

function quickReject(btn, title) {
  const row = btn.closest('div[style*="display:flex;justify-content:space-between"]');
  row.style.opacity = '0.4';
  btn.disabled = true;
  Toast.show(`Rejected: "${title}" listing removed.`, 'info');
}

/* ══════════════════════════════════════════════════════════════
   2. ADMIN MODERATION
   ══════════════════════════════════════════════════════════════ */
let activeModTab = 'pending';

function initAdminModeration() {
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-moderation');

  document.getElementById('mod-count-pending').textContent = '2';
  document.getElementById('mod-count-reported').textContent = '1';

  renderModerationTabContent();
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

  if (activeModTab === 'pending') {
    container.innerHTML = `
      <div class="card" style="padding:var(--space-6)" id="mod-card-1">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4)">
          <div style="flex:1;min-width:280px">
            <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2)">
              <span class="badge badge-warning">Awaiting Approval</span>
              <span class="badge badge-info">DIGITAL NOTE</span>
              <span class="text-xs text-muted">Submitted 2 hours ago</span>
            </div>
            <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">
              Signals & Systems Complete Handwritten Exam Solutions
            </h3>
            <p class="text-secondary text-sm" style="margin-bottom:var(--space-3)">
              Curated student study guide containing derivations, problem step-by-through solutions, and formula summaries for EE302.
            </p>
            <div class="text-xs text-muted">
              <strong>Contributor:</strong> David K. (david.k@university.edu) • EE Department
            </div>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn btn-outline btn-sm" onclick="previewModFile()">Preview File</button>
            <button class="btn btn-primary btn-sm" onclick="resolveModItem('mod-card-1', 'approved')">Approve Listing</button>
            <button class="btn btn-danger btn-sm" onclick="resolveModItem('mod-card-1', 'rejected')">Reject</button>
          </div>
        </div>
      </div>

      <div class="card" style="padding:var(--space-6)" id="mod-card-2">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4)">
          <div style="flex:1;min-width:280px">
            <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2)">
              <span class="badge badge-warning">Awaiting Approval</span>
              <span class="badge badge-primary">PHYSICAL GEAR</span>
              <span class="text-xs text-muted">Submitted 5 hours ago</span>
            </div>
            <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">
              Digital Multimeter & High-Frequency Oscilloscope Probes
            </h3>
            <p class="text-secondary text-sm" style="margin-bottom:var(--space-3)">
              Physical apparatus in good working condition. Includes 2 probes, ground alligator clips, and instruction card.
            </p>
            <div class="text-xs text-muted">
              <strong>Contributor:</strong> Elena R. (elena.r@university.edu) • Physics Dept
            </div>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn btn-primary btn-sm" onclick="resolveModItem('mod-card-2', 'approved')">Approve Listing</button>
            <button class="btn btn-danger btn-sm" onclick="resolveModItem('mod-card-2', 'rejected')">Reject</button>
          </div>
        </div>
      </div>
    `;
  } else if (activeModTab === 'reported') {
    container.innerHTML = `
      <div class="card" style="padding:var(--space-6);border-left:4px solid var(--color-danger-500)" id="mod-report-1">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4)">
          <div style="flex:1;min-width:280px">
            <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2)">
              <span class="badge badge-danger">Policy Report</span>
              <span class="text-xs text-danger font-semibold">Flag: Potential Copyright Infringement</span>
            </div>
            <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-1)">
              Reported Item: "Organic Chemistry 8th Edition Official Publisher PDF"
            </h3>
            <p class="text-secondary text-sm" style="margin-bottom:var(--space-3)">
              <strong>Reporter's Claim:</strong> "This appears to be an unauthorized full commercial textbook reproduction rather than personal student study notes."
            </p>
            <div class="text-xs text-muted">
              Reported by anonymous campus peer on Oct 16, 2026
            </div>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn btn-outline btn-sm" onclick="dismissReport('mod-report-1')">Dismiss Claim</button>
            <button class="btn btn-danger btn-sm" onclick="removeReportedListing('mod-report-1')">Remove & Warn User</button>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="card" style="padding:var(--space-6)">
        <h4 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-4)">Recent Moderation Audit Logs</h4>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);font-size:var(--text-sm)">
          <div style="padding:var(--space-2) 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between">
            <span>Approved: <strong>TI-84 Plus CE Graphing Calculator</strong></span>
            <span class="text-muted text-xs">Yesterday by Admin</span>
          </div>
          <div style="padding:var(--space-2) 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between">
            <span>Approved: <strong>Data Structures Python Course Guide</strong></span>
            <span class="text-muted text-xs">2 days ago by Admin</span>
          </div>
          <div style="padding:var(--space-2) 0;display:flex;justify-content:space-between">
            <span>Rejected: <strong>Commercial Software Key Generator</strong> (Prohibited)</span>
            <span class="text-muted text-xs">3 days ago by Admin</span>
          </div>
        </div>
      </div>
    `;
  }
}

function previewModFile() {
  Toast.show('Opening verified document preview for moderation inspection...', 'info');
  window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
}

function resolveModItem(cardId, action) {
  const card = document.getElementById(cardId);
  if (card) card.remove();
  Toast.show(`Listing marked as ${action.toUpperCase()}. Submitter notified.`, 'success');
}

function dismissReport(id) {
  document.getElementById(id)?.remove();
  Toast.show('Report dismissed. Listing verified compliant.', 'info');
}

function removeReportedListing(id) {
  document.getElementById(id)?.remove();
  Toast.show('Listing permanently removed. Formal notice sent to user.', 'danger');
}

/* ══════════════════════════════════════════════════════════════
   3. ADMIN USERS
   ══════════════════════════════════════════════════════════════ */
let campusUsers = [];

function initAdminUsers() {
  initNavbar();
  initFooter();
  renderDashboardSidebar('admin-users');

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
            <div class="user-row-email">${escapeHtml(u.email)}</div>
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
