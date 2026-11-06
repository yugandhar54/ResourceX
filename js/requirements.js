/**
 * ResourceX – Requirement Submission Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('requirements');

  // Set default needed date to 7 days in future
  const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const dateInput = document.getElementById('req-date');
  if (dateInput) dateInput.value = defaultDate;

  loadExistingRequirements();
});

async function loadExistingRequirements() {
  const container = document.getElementById('user-requirements-list');
  if (!container) return;

  try {
    const list = await API.requirements.list();
    if (!list || list.length === 0) {
      container.innerHTML = `<p class="text-xs text-muted">No active requirements posted yet.</p>`;
      return;
    }

    container.innerHTML = list.map(req => `
      <div style="padding:var(--space-3);background:var(--bg-muted);border-radius:var(--radius-lg)">
        <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:2px">
          ${escapeHtml(req.title)}
        </div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);display:flex;justify-content:space-between">
          <span>${req.category ? req.category.toUpperCase() : 'General'}</span>
          <span>Needed: ${formatDate(req.neededDate || new Date().toISOString())}</span>
        </div>
        <div style="margin-top:var(--space-2);text-align:right">
          <a href="matches.html?reqId=${req.id || 'req01'}" class="btn btn-outline btn-sm" style="padding:2px 8px;font-size:11px">
            View Matches →
          </a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load requirements:', err);
  }
}

async function handleRequirementSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-req');

  const title = document.getElementById('req-title').value.trim();
  const category = document.getElementById('req-category').value;
  const description = document.getElementById('req-desc').value.trim();
  const neededDate = document.getElementById('req-date').value;
  const type = document.getElementById('req-type').value;
  const budget = document.getElementById('req-budget').value;
  const tags = (document.getElementById('req-tags').value || '').split(',').map(t => t.trim()).filter(Boolean);

  const preferredModes = [];
  if (document.getElementById('mode-free').checked) preferredModes.push('free');
  if (document.getElementById('mode-borrow').checked) preferredModes.push('borrow');
  if (document.getElementById('mode-buy').checked) preferredModes.push('sell');

  const reqData = {
    title,
    category,
    description,
    neededDate,
    type,
    budget,
    tags,
    preferredModes,
    createdAt: new Date().toISOString()
  };

  try {
    Loading.show(btn, 'Finding Matches...');
    const saved = await API.requirements.create(reqData);
    Toast.show('Requirement submitted! Generating smart matches...', 'success');

    // Save temporary requirement for immediate match viewing
    sessionStorage.setItem('current_active_requirement', JSON.stringify(saved));

    setTimeout(() => {
      window.location.href = `matches.html?reqId=${saved.id || 'new'}`;
    }, 1000);
  } catch (err) {
    Toast.show('Failed to submit requirement', 'danger');
  } finally {
    Loading.hide(btn);
  }
}
