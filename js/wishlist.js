/**
 * ResourceX – Wishlist Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('wishlist');

  await loadWishlist();
});

async function loadWishlist() {
  const loading = document.getElementById('loading-state');
  const empty = document.getElementById('empty-state');
  const grid = document.getElementById('wishlist-grid');
  const countEl = document.getElementById('wishlist-count');

  try {
    loading.classList.remove('hidden');
    const items = await API.wishlist.list();

    countEl.textContent = items.length;

    if (!items || items.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = items.map(item => `
      <div class="card" id="wishlist-item-${item.id}" style="overflow:hidden;display:flex;flex-direction:column">
        <div style="height:160px;position:relative;background:var(--bg-muted);overflow:hidden">
          <img src="${item.thumbnail || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover"/>
          <button onclick="removeWishlistItem('${item.id}')" title="Remove from wishlist" style="position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:var(--radius-full);background:rgba(0,0,0,0.6);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px">
            &times;
          </button>
          <div style="position:absolute;top:8px;left:8px">
            <span class="badge badge-${item.status === 'available' ? 'success' : 'neutral'}">${item.status.toUpperCase()}</span>
          </div>
        </div>
        <div style="padding:var(--space-4);flex:1;display:flex;flex-direction:column">
          <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:2px">
            ${escapeHtml(item.category)} • ${item.exchangeMode.toUpperCase()}
          </div>
          <h4 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-2)">
            <a href="resource-details.html?id=${item.id}">${escapeHtml(item.title)}</a>
          </h4>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:var(--space-3);border-top:1px solid var(--border-color)">
            <span style="font-weight:700;color:var(--primary);font-size:var(--text-sm)">
              ${item.exchangeMode === 'free' ? 'FREE' : formatCurrency(item.price || 0)}
            </span>
            <a href="resource-details.html?id=${item.id}" class="btn btn-primary btn-sm">
              View Item
            </a>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load wishlist:', err);
    Toast.show('Error loading saved items', 'danger');
  } finally {
    loading.classList.add('hidden');
  }
}

async function removeWishlistItem(id) {
  API.wishlist.toggle(id);
  const card = document.getElementById(`wishlist-item-${id}`);
  if (card) {
    card.remove();
  }
  const remaining = API.wishlist.getIds().length;
  document.getElementById('wishlist-count').textContent = remaining;
  Toast.show('Removed from Wishlist', 'info');

  if (remaining === 0) {
    document.getElementById('empty-state').classList.remove('hidden');
  }
}
