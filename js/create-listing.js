/**
 * ResourceX – Create & Edit Resource Listing Logic
 */

let isEditMode = false;
let editingResourceId = null;
let uploadedImages = [];
let formIsDirty = false;

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar(window.location.pathname.includes('edit-listing') ? 'my-resources' : 'create-listing');

  const params = new URLSearchParams(window.location.search);
  editingResourceId = params.get('id');

  if (window.location.pathname.includes('edit-listing') || editingResourceId) {
    isEditMode = true;
    await loadExistingResource(editingResourceId || 'r001');
  }

  // Track dirty form
  document.getElementById('listing-form')?.addEventListener('input', () => {
    formIsDirty = true;
  });

  window.addEventListener('beforeunload', (e) => {
    if (formIsDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});

/* ── Load Resource for Edit Mode ── */
async function loadExistingResource(id) {
  try {
    const r = await API.resources.get(id);
    if (!r) throw new Error('Resource not found');

    document.getElementById('res-title').value = r.title || '';
    document.getElementById('res-category').value = r.category || '';
    document.getElementById('res-department').value = r.department || r.subject || '';
    document.getElementById('res-desc').value = r.description || '';
    document.getElementById('res-tags').value = (r.tags || []).join(', ');

    selectResourceType(r.type || 'physical');
    selectExchangeMode(r.exchangeMode || 'free');

    if (r.price) document.getElementById('res-price').value = r.price;
    if (r.deposit) document.getElementById('res-deposit').value = r.deposit;
    if (r.condition && document.getElementById('res-condition')) {
      document.getElementById('res-condition').value = r.condition;
    }
    if (r.location && document.getElementById('res-location')) {
      document.getElementById('res-location').value = r.location;
    }
    if (r.status && document.getElementById('res-status')) {
      document.getElementById('res-status').value = r.status;
    }

    if (r.images && r.images.length > 0) {
      uploadedImages = [...r.images];
      renderImagePreviews();
    } else if (r.thumbnail) {
      uploadedImages = [r.thumbnail];
      renderImagePreviews();
    }

    formIsDirty = false;
  } catch (err) {
    console.error('Failed to load listing for edit:', err);
    Toast.show('Could not load listing data. Redirecting...', 'danger');
    setTimeout(() => { window.location.href = 'my-resources.html'; }, 1500);
  }
}

/* ── Resource Type Selector ── */
function selectResourceType(type) {
  document.getElementById('resource-type').value = type;
  const optPhys = document.getElementById('opt-type-physical');
  const optDigi = document.getElementById('opt-type-digital');

  const groupCond = document.getElementById('group-condition');
  const groupLoc = document.getElementById('group-location');
  const secImg = document.getElementById('section-image-upload');
  const secDigi = document.getElementById('section-digital-upload');

  if (type === 'digital') {
    optPhys.classList.remove('selected');
    optDigi.classList.add('selected');
    if (groupCond) groupCond.classList.add('hidden');
    if (groupLoc) groupLoc.classList.add('hidden');
    if (secDigi) secDigi.classList.remove('hidden');
  } else {
    optPhys.classList.add('selected');
    optDigi.classList.remove('selected');
    if (groupCond) groupCond.classList.remove('hidden');
    if (groupLoc) groupLoc.classList.remove('hidden');
    if (secDigi) secDigi.classList.add('hidden');
  }
}

/* ── Exchange Mode Selector ── */
function selectExchangeMode(mode) {
  document.getElementById('exchange-mode').value = mode;

  ['free', 'borrow', 'sell'].forEach(m => {
    const el = document.getElementById(`opt-mode-${m}`);
    if (el) {
      if (m === mode) el.classList.add('selected');
      else el.classList.remove('selected');
    }
  });

  const grpPrice = document.getElementById('group-price');
  const grpDeposit = document.getElementById('group-deposit');
  const grpDuration = document.getElementById('group-duration');
  const inputPrice = document.getElementById('res-price');

  if (mode === 'free') {
    grpPrice.classList.add('hidden');
    grpDeposit.classList.add('hidden');
    grpDuration.classList.add('hidden');
    if (inputPrice) inputPrice.removeAttribute('required');
  } else if (mode === 'borrow') {
    grpPrice.classList.remove('hidden');
    grpDeposit.classList.remove('hidden');
    grpDuration.classList.remove('hidden');
    if (inputPrice) {
      inputPrice.placeholder = 'e.g. 0 for free borrow, or small weekly fee';
      inputPrice.removeAttribute('required');
    }
  } else if (mode === 'sell') {
    grpPrice.classList.remove('hidden');
    grpDeposit.classList.add('hidden');
    grpDuration.classList.add('hidden');
    if (inputPrice) {
      inputPrice.placeholder = 'Selling price ($)';
      inputPrice.setAttribute('required', 'true');
    }
  }
}

/* ── Image File Handling ── */
function handleImageSelection(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;

  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      Toast.show(`File "${file.name}" exceeds 5MB limit.`, 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push(e.target.result);
      renderImagePreviews();
      formIsDirty = true;
    };
    reader.readAsDataURL(file);
  });

  input.value = '';
}

function removeImagePreview(index) {
  uploadedImages.splice(index, 1);
  renderImagePreviews();
  formIsDirty = true;
}

function renderImagePreviews() {
  const container = document.getElementById('image-previews-container');
  if (!container) return;

  container.innerHTML = uploadedImages.map((src, i) => `
    <div class="image-preview-item">
      <img src="${src}" alt="Preview ${i + 1}"/>
      <button type="button" class="image-preview-remove" onclick="removeImagePreview(${i})" title="Remove photo">&times;</button>
    </div>
  `).join('');
}

/* ── Digital File Selection ── */
function handleDigitalSelection(input) {
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    Toast.show('Digital file must be smaller than 25MB.', 'danger');
    input.value = '';
    return;
  }

  const infoEl = document.getElementById('digital-file-info');
  document.getElementById('digital-file-name').textContent = `📄 ${file.name}`;
  document.getElementById('digital-file-size').textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  infoEl.classList.remove('hidden');
  Toast.show(`Attached document: ${file.name}`, 'info');
  formIsDirty = true;
}

/* ── Form Submission ── */
async function handleListingSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-listing');

  const title = document.getElementById('res-title').value.trim();
  const category = document.getElementById('res-category').value;
  const department = document.getElementById('res-department').value.trim();
  const description = document.getElementById('res-desc').value.trim();
  const type = document.getElementById('resource-type').value;
  const exchangeMode = document.getElementById('exchange-mode').value;
  const tagsStr = document.getElementById('res-tags')?.value || '';
  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

  const priceVal = parseFloat(document.getElementById('res-price')?.value);
  const price = !isNaN(priceVal) ? priceVal : 0;

  const depositVal = parseFloat(document.getElementById('res-deposit')?.value);
  const deposit = !isNaN(depositVal) ? depositVal : 0;

  const rawCondition = document.getElementById('res-condition')?.value || 'good';
  let condition = 'Good';
  if (rawCondition === 'like-new' || rawCondition === 'Like New' || rawCondition === 'Excellent') condition = 'Excellent';
  else if (rawCondition === 'good' || rawCondition === 'Good') condition = 'Good';
  else if (rawCondition === 'fair' || rawCondition === 'Fair') condition = 'Fair';
  else if (rawCondition === 'usable' || rawCondition === 'Poor') condition = 'Fair';

  const location = document.getElementById('res-location')?.value || 'Central Library';
  const availability = document.getElementById('res-status')?.value || 'available';

  if (!title || !category || !description) {
    Toast.show('Please fill in all required fields (Title, Category, and Description).', 'warning');
    return;
  }

  const user = Auth.getUser() || DEMO_DATA.currentUser || { name: 'Campus Student', email: 'student@campus.edu' };
  const ownerName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student Contributor';
  const ownerEmail = user.email || user.personalEmail || '';
  const ownerPhone = user.phone || user.phoneNumber || '';
  const ownerDept = user.department || department || 'General';
  const ownerRoll = user.rollNumber || ownerPhone || '';
  const ownerAvatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=2563eb&color=fff`;

  const listingPayload = {
    title,
    category,
    department: ownerDept,
    description,
    type,
    exchangeMode,
    price,
    deposit,
    condition: type === 'physical' ? condition : 'N/A',
    location: type === 'physical' ? location : 'Online Download',
    tags,
    availability,
    status: isEditMode ? 'approved' : 'pending',
    images: uploadedImages.length ? uploadedImages : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
    thumbnail: uploadedImages[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    ownerId: user.id || user._id,
    ownerName,
    ownerEmail,
    ownerPhone,
    ownerDept,
    ownerRoll,
    ownerAvatar,
    owner: {
      id: user.id || user._id,
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      role: user.role || 'student',
      department: ownerDept,
      rollNumber: ownerRoll,
      avatar: ownerAvatar,
      rating: 5.0
    }
  };

  try {
    Loading.show(btn, isEditMode ? 'Updating Listing...' : 'Publishing...');
    
    if (isEditMode) {
      await API.resources.update(editingResourceId, listingPayload);
      formIsDirty = false;
      Toast.show('Listing updated successfully!', 'success');
      setTimeout(() => { window.location.href = 'my-resources.html'; }, 1000);
    } else {
      const created = await API.resources.create(listingPayload);
      formIsDirty = false;
      Toast.show('Resource submitted for admin approval! It will be visible to everyone once approved.', 'success');
      setTimeout(() => { window.location.href = 'my-resources.html'; }, 1200);
    }
  } catch (err) {
    console.error('Failed to save listing:', err);
    let msg = err.message || 'Failed to save resource listing.';
    if (err.errors && Array.isArray(err.errors) && err.errors.length) {
      msg = err.errors.map(e => e.message || e.msg || (e.field + ' is invalid')).join(', ');
    }
    Toast.show(msg, 'danger');
  } finally {
    Loading.hide(btn);
  }
}

/* ── Delete Listing ── */
async function handleDeleteResource() {
  if (!confirm('Are you sure you want to permanently remove this resource listing?')) return;
  try {
    await API.resources.delete(editingResourceId);
    formIsDirty = false;
    Toast.show('Resource listing deleted.', 'info');
    setTimeout(() => { window.location.href = 'my-resources.html'; }, 800);
  } catch (err) {
    Toast.show('Failed to delete listing.', 'danger');
  }
}
