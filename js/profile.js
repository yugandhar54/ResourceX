/**
 * ResourceX – User Profile Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('profile');

  loadUserProfile();
});

function loadUserProfile() {
  const user = Auth.getUser() || DEMO_DATA.currentUser;

  // Header display
  document.getElementById('profile-name-header').textContent = user.name || 'Campus Student';
  document.getElementById('profile-role-dept').textContent = `${user.department || 'Computer Science'} • ${user.role === 'faculty' ? 'Faculty Member' : 'Student'}`;
  
  const initials = user.initials || user.name.split(' ').map(n=>n[0]).join('').slice(0,2);
  const avatarEl = document.getElementById('profile-avatar-display');
  avatarEl.textContent = initials;
  if (user.avatarUrl) {
    avatarEl.innerHTML = `<img src="${user.avatarUrl}" alt="${escapeHtml(user.name)}" style="width:100%;height:100%;border-radius:var(--radius-full);object-fit:cover"/>`;
  }

  // Form fields
  document.getElementById('prof-name').value = user.name || '';
  document.getElementById('prof-email').value = user.email || 'yugandhar23@lpu.in';
  if (document.getElementById('prof-personal-email')) {
    document.getElementById('prof-personal-email').value = user.personalEmail || '';
  }
  if (document.getElementById('prof-id')) {
    document.getElementById('prof-id').value = user.rollNumber || '12318361';
  }
  document.getElementById('prof-dept').value = user.department || 'Computer Science & Engineering';
  document.getElementById('prof-bio').value = user.bio || 'Campus scholar interested in resource sharing and research collaboration.';

  loadProfileReviews();
}

function handleAvatarChange(input) {
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    Toast.show('Avatar photo must be under 2MB', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const avatarEl = document.getElementById('profile-avatar-display');
    avatarEl.innerHTML = `<img src="${e.target.result}" alt="Avatar" style="width:100%;height:100%;border-radius:var(--radius-full);object-fit:cover"/>`;
    
    // Save to user object
    const user = Auth.getUser() || DEMO_DATA.currentUser;
    user.avatarUrl = e.target.result;
    sessionStorage.setItem('rx_user', JSON.stringify(user));

    Toast.show('Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleProfileSave(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-profile');

  const name = document.getElementById('prof-name').value.trim();
  const department = document.getElementById('prof-dept').value.trim();
  const personalEmail = document.getElementById('prof-personal-email')?.value.trim() || '';
  const rollNumber = document.getElementById('prof-id')?.value.trim() || '';
  const bio = document.getElementById('prof-bio').value.trim();

  Loading.show(btn, 'Saving...');

  setTimeout(() => {
    const user = Auth.getUser() || DEMO_DATA.currentUser;
    user.name = name;
    user.department = department;
    user.personalEmail = personalEmail;
    user.rollNumber = rollNumber;
    user.bio = bio;
    user.initials = name.split(' ').map(n=>n[0]).join('').slice(0,2);

    sessionStorage.setItem(CONFIG.STORAGE_KEYS.DEMO_USER, JSON.stringify(user));

    document.getElementById('profile-name-header').textContent = name;
    document.getElementById('profile-role-dept').textContent = `${department} • ${user.role === 'faculty' ? 'Faculty Member' : 'Student'}`;

    Loading.hide(btn);
    Toast.show('Profile changes saved successfully!', 'success');
  }, 600);
}

function loadProfileReviews() {
  const container = document.getElementById('profile-reviews-list');
  const reviews = DEMO_DATA.reviews || [];

  if (reviews.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted">No endorsements yet.</p>`;
    return;
  }

  container.innerHTML = reviews.slice(0, 3).map(rv => `
    <div style="padding:var(--space-4);background:var(--bg-muted);border-radius:var(--radius-lg)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <div class="avatar avatar-sm">${escapeHtml(rv.author ? rv.author.slice(0,2).toUpperCase() : 'ST')}</div>
          <div>
            <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(rv.author)}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Verified peer borrower</div>
          </div>
        </div>
        <div style="display:flex;gap:2px">${renderStars(rv.rating || 5)}</div>
      </div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0">
        "${escapeHtml(rv.comment)}"
      </p>
    </div>
  `).join('');
}

function handlePasswordChange(e) {
  e.preventDefault();
  const newPwd = document.getElementById('new-pwd').value;
  const confPwd = document.getElementById('conf-pwd').value;

  if (newPwd.length < 8) {
    Toast.show('Password must be at least 8 characters', 'warning');
    return;
  }

  if (newPwd !== confPwd) {
    Toast.show('Passwords do not match', 'danger');
    return;
  }

  const btn = document.getElementById('btn-change-pwd');
  Loading.show(btn, 'Updating...');
  setTimeout(() => {
    Loading.hide(btn);
    Toast.show('Password successfully updated!', 'success');
    e.target.reset();
  }, 700);
}
