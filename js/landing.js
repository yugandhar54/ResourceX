/**
 * ResourceX – Landing Page JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  loadFeaturedResources();
  renderHowSteps('share');
});

/* ── Featured Resources ── */
async function loadFeaturedResources() {
  const grid = document.getElementById('featured-resources-grid');
  if (!grid) return;
  grid.innerHTML = renderSkeletons(6);

  try {
    const result = await API.resources.list({ sort: 'newest', pageSize: 6 });
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    result.items.forEach(r => {
      const div = document.createElement('div');
      div.innerHTML = renderResourceCard(r, './');
      frag.appendChild(div.firstElementChild);
    });
    grid.appendChild(frag);
    grid.className = 'grid-auto';
  } catch (e) {
    grid.innerHTML = `<div class="alert alert-error" style="grid-column:1/-1"><div class="alert-body">Unable to load resources.</div></div>`;
  }
}

/* ── Search ── */
function doSearch() {
  const q  = document.getElementById('main-search-input').value.trim();
  const cat = document.getElementById('main-search-category').value;
  const type = document.getElementById('main-search-type').value;
  const params = new URLSearchParams();
  if (q)    params.set('search', q);
  if (cat && cat !== 'all') params.set('category', cat);
  if (type && type !== 'all') params.set('type', type);
  window.location.href = `./pages/browse.html?${params.toString()}`;
}

function quickSearch(term) {
  document.getElementById('main-search-input').value = term;
  doSearch();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'main-search-input') {
    doSearch();
  }
});

/* ── How It Works Steps ── */
const howSteps = {
  share: [
    { num: 1, title: 'Create an Account', body: 'Register with your institutional email to verify your campus identity.' },
    { num: 2, title: 'List Your Resource', body: 'Fill in the title, description, category, condition, and choose how you want to share it.' },
    { num: 3, title: 'Set Exchange Mode', body: 'Choose Free Share, Borrow/Lend, or Buy/Sell. Add a price or deposit if needed.' },
    { num: 4, title: 'Receive Requests', body: 'Approve or reject incoming borrow or purchase requests from your dashboard.' },
  ],
  borrow: [
    { num: 1, title: 'Search or Browse', body: 'Use the search bar or browse by category to find what you need.' },
    { num: 2, title: 'Check Availability', body: 'Filter by availability and read the resource details and owner information.' },
    { num: 3, title: 'Submit a Request', body: 'Send a borrow request with your proposed dates and a note to the owner.' },
    { num: 4, title: 'Coordinate & Collect', body: 'Once approved, coordinate pickup or digital access with the owner.' },
  ],
  match: [
    { num: 1, title: 'Submit a Requirement', body: 'Describe what you need — subject, category, preferred mode, and keywords.' },
    { num: 2, title: 'Match Algorithm Runs', body: 'The system searches listed resources by title, tags, category, and preference overlap.' },
    { num: 3, title: 'Review Your Matches', body: 'See ranked suggestions with a relevance score and the reasons they matched.' },
    { num: 4, title: 'Connect with Owners', body: 'Directly request or reserve the matched resources from the matches page.' },
  ],
};

function switchHowTab(type, btn) {
  document.querySelectorAll('.how-tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  renderHowSteps(type);
}

function renderHowSteps(type) {
  const container = document.getElementById('how-steps');
  if (!container) return;
  const steps = howSteps[type] || howSteps.share;
  container.innerHTML = steps.map(s => `
    <div class="step-card">
      <div class="step-num">${s.num}</div>
      <h4>${escapeHtml(s.title)}</h4>
      <p>${escapeHtml(s.body)}</p>
    </div>
  `).join('');
}
