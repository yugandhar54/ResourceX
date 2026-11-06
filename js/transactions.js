/**
 * ResourceX – Transactions History Logic
 */

let allTransactions = [];
let currentTxFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();
  renderDashboardSidebar('transactions');

  await loadTransactions();
});

async function loadTransactions() {
  const loading = document.getElementById('loading-state');
  try {
    loading.classList.remove('hidden');
    allTransactions = await API.transactions.list();
    renderTransactions();
  } catch (err) {
    console.error('Failed to load transactions:', err);
    Toast.show('Error loading transaction history', 'danger');
  } finally {
    loading.classList.add('hidden');
  }
}

function filterTransactions(filter) {
  currentTxFilter = filter;
  ['all', 'borrow', 'lend', 'buy', 'sell'].forEach(f => {
    const btn = document.getElementById(`tab-tx-${f}`);
    if (f === filter) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderTransactions();
}

function renderTransactions() {
  const tbody = document.getElementById('transactions-tbody');
  const empty = document.getElementById('empty-state');
  const card = document.getElementById('transactions-card');
  const search = (document.getElementById('tx-search')?.value || '').toLowerCase().trim();

  let filtered = allTransactions;

  if (currentTxFilter !== 'all') {
    filtered = filtered.filter(t => t.type === currentTxFilter);
  }

  if (search) {
    filtered = filtered.filter(t => 
      (t.resourceTitle && t.resourceTitle.toLowerCase().includes(search)) ||
      (t.counterpart && t.counterpart.toLowerCase().includes(search)) ||
      (t.id && t.id.toLowerCase().includes(search))
    );
  }

  if (!filtered || filtered.length === 0) {
    card.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  card.classList.remove('hidden');
  empty.classList.add('hidden');

  const typeBadges = {
    buy:    '<span class="badge badge-danger">Purchase</span>',
    sell:   '<span class="badge badge-success">Sale</span>',
    borrow: '<span class="badge badge-primary">Borrow</span>',
    lend:   '<span class="badge badge-info">Lend</span>'
  };

  tbody.innerHTML = filtered.map(tx => `
    <tr>
      <td style="font-family:monospace;font-weight:600;font-size:var(--text-xs)">
        #${escapeHtml(tx.id)}
      </td>
      <td>
        ${typeBadges[tx.type] || `<span class="badge">${tx.type}</span>`}
      </td>
      <td>
        <a href="resource-details.html?id=${tx.resourceId || 'r001'}" style="font-weight:600;font-size:var(--text-sm)">
          ${escapeHtml(tx.resourceTitle || 'Academic Resource')}
        </a>
      </td>
      <td style="font-size:var(--text-sm)">
        ${escapeHtml(tx.counterpart || 'Campus Peer')}
      </td>
      <td style="font-size:var(--text-xs);color:var(--text-secondary)">
        ${formatDate(tx.date)}
      </td>
      <td style="font-weight:700;font-size:var(--text-sm);color:${tx.amount > 0 ? 'var(--primary)' : 'var(--text-muted)'}">
        ${tx.amount > 0 ? formatCurrency(tx.amount) : 'FREE'}
      </td>
      <td>
        <span class="badge badge-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'neutral'}">
          ${tx.status.toUpperCase()}
        </span>
      </td>
      <td style="text-align:right">
        <button class="btn btn-ghost btn-sm" onclick="viewReceipt('${tx.id}')" title="View details">
          Receipt
        </button>
      </td>
    </tr>
  `).join('');
}

function viewReceipt(txId) {
  const tx = allTransactions.find(t => t.id === txId);
  if (!tx) return;

  const modal = document.getElementById('modal-receipt');
  const body = document.getElementById('receipt-modal-content');

  body.innerHTML = `
    <div style="background:var(--bg-muted);padding:var(--space-4);border-radius:var(--radius-lg);margin-bottom:var(--space-4)">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
        <span class="text-xs text-muted">TRANSACTION ID:</span>
        <span style="font-family:monospace;font-weight:700">#${tx.id}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
        <span class="text-xs text-muted">DATE & TIME:</span>
        <span style="font-size:var(--text-xs)">${new Date(tx.date).toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span class="text-xs text-muted">TYPE:</span>
        <span style="text-transform:uppercase;font-weight:600;font-size:var(--text-xs)">${tx.type}</span>
      </div>
    </div>

    <div style="margin-bottom:var(--space-4)">
      <h4 style="font-size:var(--text-sm);font-weight:700;margin-bottom:var(--space-2)">Resource Details</h4>
      <div style="font-weight:600;font-size:var(--text-base);color:var(--text-primary)">${escapeHtml(tx.resourceTitle)}</div>
      <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Campus Verified Handover Record</div>
    </div>

    <div style="border-top:1px dashed var(--border-color);border-bottom:1px dashed var(--border-color);padding:var(--space-3) 0;margin-bottom:var(--space-4)">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);font-size:var(--text-sm)">
        <span>Peer Member:</span>
        <span style="font-weight:600">${escapeHtml(tx.counterpart)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--text-sm)">
        <span>Status:</span>
        <span class="badge badge-success">${tx.status.toUpperCase()}</span>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:var(--text-lg);font-weight:800">
      <span>Total Amount:</span>
      <span style="color:var(--primary)">${tx.amount > 0 ? formatCurrency(tx.amount) : 'FREE ($0.00)'}</span>
    </div>

    <div style="margin-top:var(--space-4);text-align:center;font-size:var(--text-xs);color:var(--text-muted)">
      ResourceX Academic Marketplace • Campus Verification ID #${tx.id}
    </div>
  `;

  modal.classList.add('active');
}

function closeReceiptModal() {
  document.getElementById('modal-receipt')?.classList.remove('active');
}

function exportTransactionsCSV() {
  if (!allTransactions.length) {
    Toast.show('No transactions to export', 'info');
    return;
  }
  let csv = 'TransactionID,Type,ResourceTitle,Counterpart,Date,Amount,Status\n';
  allTransactions.forEach(t => {
    csv += `"${t.id}","${t.type}","${t.resourceTitle.replace(/"/g, '""')}","${t.counterpart}","${t.date}",${t.amount},"${t.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ResourceX_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.show('Transaction log exported successfully!', 'success');
}
