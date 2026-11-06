/**
 * ResourceX – Resource Details Logic
 */
let currentResource = null;
let currentReviews = [];

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  const params = new URLSearchParams(window.location.search);
  const resourceId = params.get('id') || 'r001';

  await loadResourceDetails(resourceId);
});

async function loadResourceDetails(id) {
  const loadingEl = document.getElementById('loading-state');
  const errorEl = document.getElementById('error-state');
  const contentEl = document.getElementById('content-state');

  try {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.add('hidden');

    currentResource = await API.resources.get(id);
    currentReviews = await API.resources.getReviews(id);

    renderDetails(currentResource);
    renderReviews(currentReviews);
    loadRelatedResources(currentResource);

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load resource:', err);
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
  }
}

function renderDetails(r) {
  document.title = `${r.title} – ResourceX`;
  document.getElementById('breadcrumb-title').textContent = r.title;
  document.getElementById('resource-title').textContent = r.title;
  document.getElementById('resource-department').textContent = r.department || r.category;
  document.getElementById('resource-date').textContent = `Added ${timeAgo(r.createdAt)}`;
  document.getElementById('resource-description').textContent = r.description;

  // Rating stars
  const ratingStars = renderStars(r.rating || 5);
  document.getElementById('rating-stars-summary').innerHTML = `
    ${ratingStars}
    <span style="font-weight:600;margin-left:4px">${(r.rating || 5.0).toFixed(1)}</span>
    <span class="text-muted">(${r.reviewCount || 0} reviews)</span>
  `;

  // Gallery
  const mainGallery = document.getElementById('gallery-main-view');
  const thumbsGallery = document.getElementById('gallery-thumbs-list');
  const images = r.images && r.images.length > 0 ? r.images : [r.thumbnail || getCategoryFallbackImage(r.category)];

  mainGallery.innerHTML = `<img id="main-preview-img" src="${images[0]}" alt="${escapeHtml(r.title)}" onerror="this.src='https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80'"/>`;
  
  if (images.length > 1) {
    thumbsGallery.innerHTML = images.map((img, idx) => `
      <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${img}', this)">
        <img src="${img}" alt="Thumbnail ${idx + 1}"/>
      </div>
    `).join('');
    thumbsGallery.classList.remove('hidden');
  } else {
    thumbsGallery.classList.add('hidden');
  }

  // Badges
  const badgeContainer = document.getElementById('badge-container');
  let typeBadge = r.type === 'digital' ? '<span class="badge badge-info">Digital Resource</span>' : '<span class="badge badge-primary">Physical Item</span>';
  let modeBadge = `<span class="badge badge-${r.exchangeMode === 'free' ? 'success' : r.exchangeMode === 'borrow' ? 'warning' : 'primary'}">${r.exchangeMode.toUpperCase()}</span>`;
  let availBadge = `<span class="badge badge-${r.status === 'available' ? 'success' : 'neutral'}">${r.status.toUpperCase()}</span>`;
  badgeContainer.innerHTML = `${typeBadge} ${modeBadge} ${availBadge}`;

  // Specs Grid
  const specGrid = document.getElementById('spec-grid');
  const specs = [
    { label: 'Category', val: r.category ? r.category.toUpperCase() : 'General' },
    { label: 'Resource Type', val: r.type === 'digital' ? 'Digital Download/View' : 'Physical Handover' },
    { label: 'Condition', val: r.type === 'physical' ? (r.condition || 'Good').toUpperCase() : 'N/A (Digital)' },
    { label: 'Subject / Course', val: r.subject || r.department || 'All Campus' },
    { label: 'Availability', val: r.status === 'available' ? 'Available Now' : 'Reserved / Unavailable' },
    { label: 'Pickup / Access', val: r.type === 'digital' ? 'Instant Online Access' : (r.location || 'Campus Library') }
  ];
  specGrid.innerHTML = specs.map(s => `
    <div class="meta-spec-item">
      <span class="meta-spec-label">${escapeHtml(s.label)}</span>
      <span class="meta-spec-val">${escapeHtml(s.val)}</span>
    </div>
  `).join('');

  // Tags
  const tagsList = document.getElementById('tags-list');
  if (r.tags && r.tags.length > 0) {
    tagsList.innerHTML = r.tags.map(t => `<a href="browse.html?search=${encodeURIComponent(t)}" class="tag">${escapeHtml(t)}</a>`).join('');
    document.getElementById('tags-wrapper').classList.remove('hidden');
  } else {
    document.getElementById('tags-wrapper').classList.add('hidden');
  }

  // Fulfillment card (Physical location or Digital Access)
  const fulfillmentCard = document.getElementById('fulfillment-card');
  if (r.type === 'digital') {
    fulfillmentCard.innerHTML = `
      <h3 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--space-2)">Digital Resource Access</h3>
      <p class="text-sm text-muted" style="margin-bottom:var(--space-4)">Permitted academic material shared for authorized campus study and research.</p>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);background:var(--bg-muted);border-radius:var(--radius-lg)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="font-size:1.5rem">📄</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm)">${r.fileType || 'PDF Document'} • ${r.fileSize || '3.4 MB'}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Verified format • Safe download</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="downloadDigitalResource('${r.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Access & Download
        </button>
      </div>
    `;
  } else {
    fulfillmentCard.innerHTML = `
      <h3 style="font-size:var(--text-lg);font-weight:600;margin-bottom:var(--space-2)">Physical Handover Location</h3>
      <p class="text-sm text-muted" style="margin-bottom:var(--space-4)">Meet directly on campus at safe, verified student hub locations.</p>
      <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:var(--bg-muted);border-radius:var(--radius-lg)">
        <div style="font-size:1.5rem">📍</div>
        <div>
          <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(r.location || 'Campus Central Library – Study Area')}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">Safe Zone • Peer Handover Protocol</div>
        </div>
      </div>
    `;
  }

  // Sidebar Price & Exchange Info
  const modeLabels = { free: 'Free Sharing', borrow: 'Peer Borrowing', sell: 'For Sale' };
  document.getElementById('sidebar-exchange-label').textContent = modeLabels[r.exchangeMode] || r.exchangeMode;

  const priceEl = document.getElementById('sidebar-price');
  const depositEl = document.getElementById('sidebar-deposit');
  if (r.exchangeMode === 'free') {
    priceEl.textContent = 'FREE';
    depositEl.textContent = 'No fees or charges';
  } else if (r.exchangeMode === 'borrow') {
    priceEl.textContent = r.price ? formatCurrency(r.price) + ' / week' : 'FREE Borrow';
    depositEl.textContent = r.deposit ? `Security Deposit: ${formatCurrency(r.deposit)}` : 'No deposit required';
  } else {
    priceEl.textContent = formatCurrency(r.price || 0);
    depositEl.textContent = 'One-time student purchase';
  }

  // Render Action Buttons conditionally based on type, mode, and availability
  renderActionButtons(r);

  // Owner details
  document.getElementById('owner-avatar').textContent = r.owner?.name ? r.owner.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'OX';
  document.getElementById('owner-name').textContent = r.owner?.name || 'Campus Student';
  document.getElementById('owner-role-dept').textContent = `${r.owner?.role === 'faculty' ? 'Faculty Member' : 'Student'} • ${r.owner?.department || r.department || 'Campus'}`;
  document.getElementById('owner-rating').textContent = `★ ${(r.owner?.rating || 4.8).toFixed(1)} Contributor rating`;

  // Wishlist state
  updateWishlistButton(r.id);
}

function renderActionButtons(r) {
  const container = document.getElementById('primary-action-container');
  const isAvailable = r.status === 'available';

  if (!isAvailable) {
    container.innerHTML = `
      <div class="alert alert-warning" style="font-size:var(--text-sm);margin:0">
        This resource is currently <strong>${r.status}</strong>. You can save it to your wishlist to get notified when it becomes available.
      </div>
      <button class="btn btn-secondary" disabled style="width:100%">Currently Unavailable</button>
    `;
    return;
  }

  let html = '';
  if (r.type === 'digital') {
    html += `
      <button class="btn btn-primary btn-lg" style="width:100%" onclick="downloadDigitalResource('${r.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Access Digital Resource
      </button>
    `;
  } else if (r.exchangeMode === 'borrow') {
    html += `
      <button class="btn btn-primary btn-lg" style="width:100%" onclick="openBorrowModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Request to Borrow
      </button>
      <button class="btn btn-outline" style="width:100%" onclick="openReserveModal()">
        Reserve for Later Date
      </button>
    `;
  } else if (r.exchangeMode === 'sell') {
    html += `
      <button class="btn btn-primary btn-lg" style="width:100%" onclick="openBuyModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Buy Resource (${formatCurrency(r.price || 0)})
      </button>
    `;
  } else {
    // Free sharing
    html += `
      <button class="btn btn-primary btn-lg" style="width:100%" onclick="openBorrowModal(true)">
        Request Free Resource
      </button>
    `;
  }

  container.innerHTML = html;
}

function switchGalleryImage(url, thumbEl) {
  const mainImg = document.getElementById('main-preview-img');
  if (mainImg) mainImg.src = url;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function getCategoryFallbackImage(category) {
  const mapping = {
    books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    notes: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    lab: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80'
  };
  return mapping[category] || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80';
}

function renderReviews(reviews) {
  const container = document.getElementById('reviews-list');
  const countText = document.getElementById('reviews-count-text');

  if (!reviews || reviews.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm" style="padding:var(--space-4) 0">No reviews yet for this resource. Be the first to share your experience!</p>`;
    countText.textContent = 'No reviews yet';
    return;
  }

  countText.textContent = `${reviews.length} community review${reviews.length > 1 ? 's' : ''}`;
  container.innerHTML = reviews.map(rv => `
    <div class="review-item">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <div class="avatar avatar-sm">${escapeHtml(rv.author ? rv.author.slice(0, 2).toUpperCase() : 'ST')}</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(rv.author || 'Campus Student')}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">${formatDate(rv.date || new Date().toISOString())}</div>
          </div>
        </div>
        <div style="display:flex;gap:2px">${renderStars(rv.rating || 5)}</div>
      </div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0">${escapeHtml(rv.comment)}</p>
    </div>
  `).join('');
}

async function loadRelatedResources(r) {
  const grid = document.getElementById('related-resources-grid');
  try {
    const res = await API.resources.list({ category: r.category, pageSize: 4 });
    const related = (res.items || []).filter(item => item.id !== r.id).slice(0, 4);
    if (related.length === 0) {
      grid.parentElement.classList.add('hidden');
      return;
    }
    grid.innerHTML = related.map(item => renderResourceCard(item)).join('');
  } catch (e) {
    console.error('Failed to load related:', e);
  }
}

/* ── Wishlist Toggle ── */
function updateWishlistButton(id) {
  const isWish = API.wishlist.isWishlisted(id);
  const icon = document.getElementById('wishlist-icon');
  const label = document.getElementById('wishlist-label');
  if (isWish) {
    icon.style.fill = 'var(--color-danger-500)';
    icon.style.stroke = 'var(--color-danger-500)';
    label.textContent = 'Saved';
  } else {
    icon.style.fill = 'none';
    icon.style.stroke = 'currentColor';
    label.textContent = 'Save';
  }
}

function handleDetailsWishlist() {
  if (!currentResource) return;
  const added = API.wishlist.toggle(currentResource.id);
  updateWishlistButton(currentResource.id);
  Toast.show(added ? 'Saved to your Wishlist!' : 'Removed from Wishlist', 'success');
}

/* ── Modals & Action Handlers ── */
function openBorrowModal(isFree = false) {
  const modal = document.getElementById('modal-reserve');
  const title = document.getElementById('reserve-modal-title');
  const sub = document.getElementById('reserve-modal-sub');
  title.textContent = isFree ? 'Request Free Resource' : 'Request to Borrow';
  sub.textContent = isFree ? 'Notify the owner to arrange pickup for this free resource.' : 'Submit your borrowing request to the owner.';

  // Default dates
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  document.getElementById('res-start-date').value = today;
  document.getElementById('res-return-date').value = nextWeek;

  modal.classList.add('active');
}

function openReserveModal() {
  openBorrowModal(false);
  document.getElementById('reserve-modal-title').textContent = 'Reserve Resource for Later';
}

function openBuyModal() {
  const modal = document.getElementById('modal-buy');
  document.getElementById('buy-item-name').textContent = currentResource.title;
  document.getElementById('buy-item-price').textContent = formatCurrency(currentResource.price || 0);
  document.getElementById('buy-item-location').textContent = currentResource.location || 'Campus Central Library';
  modal.classList.add('active');
}

function openContactOwnerModal() {
  const modal = document.getElementById('modal-contact');
  document.getElementById('contact-owner-display').value = `${currentResource.owner?.name || 'Owner'} (${currentResource.title})`;
  modal.classList.add('active');
}

function openReviewModal() {
  const modal = document.getElementById('modal-review');
  setReviewRating(5);
  document.getElementById('review-comment').value = '';
  modal.classList.add('active');
}

function openReportModal() {
  const modal = document.getElementById('modal-report');
  document.getElementById('report-reason').value = '';
  document.getElementById('report-details').value = '';
  modal.classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('active');
}

/* ── Modal Submit Handlers ── */
async function handleReserveSubmit(e) {
  e.preventDefault();
  const startDate = document.getElementById('res-start-date').value;
  const returnDate = document.getElementById('res-return-date').value;
  const notes = document.getElementById('res-notes').value;

  try {
    Loading.show(document.getElementById('btn-submit-reservation'), 'Submitting...');
    await API.reservations.create({
      resourceId: currentResource.id,
      resourceTitle: currentResource.title,
      startDate,
      returnDate,
      notes
    });
    closeModal('modal-reserve');
    const user = Auth.getUser();
    const mail = user?.personalEmail || user?.email || 'your email';
    Toast.show(`Reservation request submitted! The owner was notified, and approval updates will be delivered to your personal email (${mail}).`, 'success');
  } catch (err) {
    Toast.show(err.message || 'Failed to submit reservation', 'danger');
  } finally {
    Loading.hide(document.getElementById('btn-submit-reservation'));
  }
}

async function confirmPurchase() {
  const pickupTime = document.getElementById('buy-pickup-time').value;
  if (!pickupTime) {
    Toast.show('Please provide a preferred handover time.', 'warning');
    return;
  }
  closeModal('modal-buy');
  Toast.show('Purchase request confirmed! The owner has been notified to meet at ' + pickupTime, 'success');
}

function handleContactSubmit(e) {
  e.preventDefault();
  const user = Auth.getUser();
  const personalMail = user?.personalEmail || user?.email || 'your registered personal email';
  closeModal('modal-contact');
  Toast.show(`Message sent to ${currentResource.owner?.name || 'contributor'}! Any replies and meetup details will be delivered to your personal email (${personalMail}).`, 'success');
}

function setReviewRating(rating) {
  document.getElementById('review-rating-val').value = rating;
  const stars = document.querySelectorAll('#star-picker span');
  stars.forEach((s, idx) => {
    s.style.color = idx < rating ? 'var(--color-warning-500)' : 'var(--text-muted)';
  });
}

function handleReviewSubmit(e) {
  e.preventDefault();
  const rating = parseInt(document.getElementById('review-rating-val').value, 10);
  const comment = document.getElementById('review-comment').value;

  const newReview = {
    id: 'rev_' + Date.now(),
    resourceId: currentResource.id,
    author: Auth.getUser()?.name || 'You',
    rating,
    comment,
    date: new Date().toISOString()
  };

  currentReviews.unshift(newReview);
  renderReviews(currentReviews);
  closeModal('modal-review');
  Toast.show('Thank you! Your review has been published.', 'success');
}

function handleReportSubmit(e) {
  e.preventDefault();
  closeModal('modal-report');
  Toast.show('Listing report submitted. Our campus moderators will review it promptly.', 'info');
}

function downloadDigitalResource(id) {
  Toast.show('Initiating secure download of permitted academic material...', 'info');
  setTimeout(() => {
    window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
  }, 1000);
}
