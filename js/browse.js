/**
 * ResourceX – Browse Page Logic
 */
let currentPage   = 1;
let currentView   = 'grid';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  // Read URL params and apply
  const params = new URLSearchParams(window.location.search);
  if (params.get('search'))   document.getElementById('browse-search').value = params.get('search');
  if (params.get('category')) {
    const radio = document.querySelector(`input[name="category"][value="${params.get('category')}"]`);
    if (radio) radio.checked = true;
  }
  if (params.get('type')) {
    const radio = document.querySelector(`input[name="type"][value="${params.get('type')}"]`);
    if (radio) radio.checked = true;
  }
  loadResources();
  initFilterDrawer();
});

function getFilters() {
  const search = document.getElementById('browse-search')?.value.trim() || '';
  const category = document.querySelector('input[name="category"]:checked')?.value || 'all';
  const type     = document.querySelector('input[name="type"]:checked')?.value || 'all';
  const avail    = document.querySelector('input[name="avail"]:checked')?.value || 'all';
  const sort     = document.getElementById('sort-select')?.value || 'relevance';
  const minPrice = document.getElementById('min-price')?.value || '';
  const maxPrice = document.getElementById('max-price')?.value || '';

  // Exchange mode checkboxes
  const exchangeModes = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);

  return { search, category, type, availability: avail, sort, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, page: currentPage, exchangeModes };
}

async function loadResources() {
  const grid = document.getElementById('resources-grid');
  grid.innerHTML = renderSkeletons(6);

  const filters = getFilters();
  const params = { ...filters, pageSize: CONFIG.DEFAULT_PAGE_SIZE };

  try {
    let result = await API.resources.list(params);

    // Apply exchange mode filter (demo only – backend would handle this)
    if (filters.exchangeModes.length > 0) {
      result.items = result.items.filter(r => filters.exchangeModes.includes(r.exchangeMode));
      result.total = result.items.length;
    }

    updateResultInfo(result.total, result.page, result.pageSize);
    updateActiveFilters(filters);

    if (result.items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <h3>No resources found</h3>
          <p>Try adjusting your search or filters to find what you're looking for.</p>
          <button class="btn btn-outline" onclick="clearAllFilters()">Clear Filters</button>
        </div>`;
      document.getElementById('pagination-container').innerHTML = '';
      return;
    }

    grid.innerHTML = result.items.map(r => renderResourceCard(r, '../')).join('');
    grid.className = `resource-grid${currentView === 'list' ? ' list-view' : ''}`;

    // Pagination
    document.getElementById('pagination-container').innerHTML = renderPagination(result.page, result.totalPages, 'goToPage');
  } catch (err) {
    grid.innerHTML = `<div class="alert alert-error" style="grid-column:1/-1"><div class="alert-body">Failed to load resources: ${escapeHtml(err.message)}</div></div>`;
  }
}

function applyFilters() {
  currentPage = 1;
  loadResources();
}

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 400);
}

function goToPage(page) {
  currentPage = page;
  loadResources();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setView(view) {
  currentView = view;
  document.getElementById('grid-view-btn').classList.toggle('active', view === 'grid');
  document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
  document.getElementById('grid-view-btn').setAttribute('aria-pressed', view === 'grid');
  document.getElementById('list-view-btn').setAttribute('aria-pressed', view === 'list');
  const grid = document.getElementById('resources-grid');
  grid.className = `resource-grid${view === 'list' ? ' list-view' : ''}`;
}

function clearAllFilters() {
  document.getElementById('browse-search').value = '';
  document.querySelectorAll('input[name="category"]')[0].checked = true;
  document.querySelectorAll('input[name="type"]')[0].checked = true;
  document.querySelectorAll('input[name="avail"]')[0].checked = true;
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  document.getElementById('sort-select').value = 'relevance';
  applyFilters();
}

function updateResultInfo(total, page, pageSize) {
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  const el = document.getElementById('result-info');
  if (el) el.innerHTML = total === 0 ? 'No results found' : `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> resources`;
}

function updateActiveFilters(filters) {
  const bar = document.getElementById('active-filters-bar');
  if (!bar) return;
  const tags = [];
  if (filters.search)   tags.push({ label: `"${filters.search}"`, clear: () => { document.getElementById('browse-search').value = ''; applyFilters(); } });
  if (filters.category !== 'all') tags.push({ label: filters.category, clear: () => { document.querySelector('input[name="category"][value="all"]').checked = true; applyFilters(); } });
  if (filters.type !== 'all')     tags.push({ label: filters.type, clear: () => { document.querySelector('input[name="type"][value="all"]').checked = true; applyFilters(); } });

  bar.innerHTML = tags.map((t, i) => `
    <span class="active-filter-tag">
      ${escapeHtml(t.label)}
      <button onclick="clearTag(${i})" aria-label="Remove filter ${escapeHtml(t.label)}">✕</button>
    </span>
  `).join('');
  bar._tags = tags;
}

function clearTag(i) {
  const tags = document.getElementById('active-filters-bar')._tags;
  if (tags && tags[i]) tags[i].clear();
}

function initFilterDrawer() {
  document.getElementById('filter-trigger')?.addEventListener('click', () => {
    document.getElementById('filter-drawer').classList.add('open');
    document.getElementById('filter-backdrop').classList.add('show');
    document.getElementById('filter-trigger').setAttribute('aria-expanded', 'true');
  });
  document.getElementById('close-drawer')?.addEventListener('click', closeFilterDrawer);
}

function closeFilterDrawer() {
  document.getElementById('filter-drawer')?.classList.remove('open');
  document.getElementById('filter-backdrop')?.classList.remove('show');
  document.getElementById('filter-trigger')?.setAttribute('aria-expanded', 'false');
}
