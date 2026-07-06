'use strict';

(function () {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function switchTab(tabName) {
    tabBtns.forEach(btn => {
      const active = btn.dataset.tab === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });
    tabPanels.forEach(panel => {
      const active = panel.id === 'tab-' + tabName;
      panel.hidden = !active;
    });
    if (tabName === 'listings') renderListings();
    if (tabName === 'orders') renderOrders();
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === '1') switchTab('dashboard');
    if (e.key === '2') switchTab('listings');
    if (e.key === '3') switchTab('orders');
    if (e.key === '4') switchTab('analytics');
    if (e.key === 'r' || e.key === 'R') location.reload();
    if (e.key === 's' || e.key === 'S') location.href = '/settings';
  });

  // On Vacation toggle
  const vacationToggle = document.getElementById('vacationToggle');
  if (vacationToggle) {
    vacationToggle.checked = localStorage.getItem('onVacation') === '1';
    vacationToggle.addEventListener('change', () => {
      localStorage.setItem('onVacation', vacationToggle.checked ? '1' : '0');
    });
  }

  // Listings
  let allListings = [];
  let listingsPage = 1;
  const LISTINGS_PAGE_SIZE = 5;

  async function loadListings() {
    if (allListings.length) return;
    const res = await fetch('/api/mock/listings');
    allListings = await res.json();
  }

  function renderListings() {
    loadListings().then(() => {
      applyListingsFilter();
    });
  }

  function applyListingsFilter() {
    const q = (document.getElementById('listingsSearch')?.value || '').toLowerCase();
    const sort = document.getElementById('listingsSort')?.value || 'title';
    let data = allListings.filter(l => l.title.toLowerCase().includes(q));
    data = data.slice().sort((a, b) => {
      if (sort === 'price') return a.price - b.price;
      if (sort === 'views') return b.views - a.views;
      if (sort === 'quantity') return b.quantity - a.quantity;
      return a.title.localeCompare(b.title);
    });
    const total = data.length;
    const pages = Math.ceil(total / LISTINGS_PAGE_SIZE);
    if (listingsPage > pages) listingsPage = 1;
    const slice = data.slice((listingsPage - 1) * LISTINGS_PAGE_SIZE, listingsPage * LISTINGS_PAGE_SIZE);

    const tbody = document.getElementById('listingsTbody');
    if (tbody) {
      tbody.innerHTML = slice.map(l => `
        <tr>
          <td>${escHtml(l.title)}</td>
          <td>$${l.price.toFixed(2)}</td>
          <td>${l.quantity}</td>
          <td>${l.views}</td>
          <td><span class="badge badge-${l.status}">${l.status}</span></td>
        </tr>`).join('');
    }

    const pag = document.getElementById('listingsPagination');
    if (pag) {
      pag.innerHTML = `
        <button id="pagPrev" ${listingsPage <= 1 ? 'disabled' : ''}>← Prev</button>
        <span class="page-info">Page ${listingsPage} of ${pages || 1}</span>
        <button id="pagNext" ${listingsPage >= pages ? 'disabled' : ''}>Next →</button>`;
      pag.querySelector('#pagPrev')?.addEventListener('click', () => { listingsPage--; applyListingsFilter(); });
      pag.querySelector('#pagNext')?.addEventListener('click', () => { listingsPage++; applyListingsFilter(); });
    }
  }

  document.getElementById('listingsSearch')?.addEventListener('input', () => { listingsPage = 1; applyListingsFilter(); });
  document.getElementById('listingsSort')?.addEventListener('change', () => { listingsPage = 1; applyListingsFilter(); });

  // Orders
  const ORDERS_PAGE_SIZE = 10;
  let allOrders = [];
  let ordersPage = 1;
  let filteredOrders = [];

  async function loadOrders() {
    if (allOrders.length) return;
    // Prefer inline data injected by server for faster first render
    if (window.__ORDERS_DATA__ && window.__ORDERS_DATA__.length) {
      allOrders = window.__ORDERS_DATA__;
      return;
    }
    const res = await fetch('/api/mock/orders');
    allOrders = await res.json();
  }

  function renderOrders() {
    loadOrders().then(() => {
      applyOrdersFilter();
    });
  }

  function applyOrdersFilter() {
    const search = (document.getElementById('orders-search')?.value || '').toLowerCase();
    const sortVal = document.getElementById('orders-sort')?.value || 'date-desc';
    const status = document.getElementById('ordersStatusFilter')?.value || '';
    const from = document.getElementById('ordersDateFrom')?.value || '';
    const to = document.getElementById('ordersDateTo')?.value || '';

    let data = allOrders.filter(o => {
      if (search && !o.buyerName.toLowerCase().includes(search) && !o.id.toLowerCase().includes(search)) return false;
      if (status && o.status !== status) return false;
      if (from && o.date < from) return false;
      if (to && o.date > to) return false;
      return true;
    });

    // Sort
    data = data.slice().sort((a, b) => {
      if (sortVal === 'date-asc') return a.date.localeCompare(b.date);
      if (sortVal === 'total-desc') return b.total - a.total;
      if (sortVal === 'total-asc') return a.total - b.total;
      // date-desc (default)
      return b.date.localeCompare(a.date);
    });

    filteredOrders = data;
    ordersPage = 1;
    renderOrdersPage();
  }

  function renderOrdersPage() {
    const total = filteredOrders.length;
    const pages = Math.ceil(total / ORDERS_PAGE_SIZE) || 1;
    if (ordersPage > pages) ordersPage = pages;
    if (ordersPage < 1) ordersPage = 1;

    const start = (ordersPage - 1) * ORDERS_PAGE_SIZE;
    const end = Math.min(start + ORDERS_PAGE_SIZE, total);
    const slice = filteredOrders.slice(start, end);

    const tbody = document.getElementById('ordersTbody');
    if (tbody) {
      tbody.innerHTML = slice.map(o => `
        <tr data-order-id="${escHtml(o.id)}" style="cursor:pointer">
          <td>${escHtml(o.id)}</td>
          <td>${escHtml(o.buyerName)}</td>
          <td>${escHtml(o.date)}</td>
          <td>${o.itemCount}</td>
          <td>$${o.total.toFixed(2)}</td>
          <td><span class="badge badge-${o.status}">${o.status}</span></td>
        </tr>`).join('');
      tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', () => openModal(row.dataset.orderId));
      });
    }

    const pageInfo = document.getElementById('orders-page-info');
    if (pageInfo) {
      if (total === 0) {
        pageInfo.textContent = 'No orders found';
      } else {
        pageInfo.textContent = `Showing ${start + 1}–${end} of ${total}`;
      }
    }

    const prevBtn = document.getElementById('orders-prev');
    const nextBtn = document.getElementById('orders-next');
    if (prevBtn) prevBtn.disabled = ordersPage <= 1;
    if (nextBtn) nextBtn.disabled = ordersPage >= pages;
  }

  // Pagination button listeners
  document.getElementById('orders-prev')?.addEventListener('click', () => {
    if (ordersPage > 1) { ordersPage--; renderOrdersPage(); }
  });
  document.getElementById('orders-next')?.addEventListener('click', () => {
    const pages = Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE) || 1;
    if (ordersPage < pages) { ordersPage++; renderOrdersPage(); }
  });

  // Search and sort listeners
  document.getElementById('orders-search')?.addEventListener('input', applyOrdersFilter);
  document.getElementById('orders-sort')?.addEventListener('change', applyOrdersFilter);
  document.getElementById('ordersStatusFilter')?.addEventListener('change', applyOrdersFilter);
  document.getElementById('ordersDateFrom')?.addEventListener('change', applyOrdersFilter);
  document.getElementById('ordersDateTo')?.addEventListener('change', applyOrdersFilter);

  // Modal
  const modal = document.getElementById('orderModal');
  const modalClose = document.getElementById('modalClose');

  function formatShippingAddress(addr) {
    if (!addr) return '—';
    if (typeof addr === 'string') return escHtml(addr);
    const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
    return parts.map(p => escHtml(p)).join(', ');
  }

  function openModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order || !modal) return;
    document.getElementById('modalTitle').textContent = 'Order ' + order.id;
    document.getElementById('modalBody').innerHTML = `
      <p><strong>Buyer:</strong> ${escHtml(order.buyerName)}</p>
      <p><strong>Date:</strong> ${escHtml(order.date)}</p>
      <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
      <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
      <p><strong>Shipping Address:</strong> ${formatShippingAddress(order.shippingAddress)}</p>
      <p><strong>Notes:</strong> ${order.notes ? escHtml(order.notes) : '—'}</p>
      <h3 style="margin-top:16px">Items</h3>
      <ul style="padding-left:20px;line-height:2">
        ${order.items.map(i => `<li>${escHtml(i.title)} × ${i.qty}</li>`).join('')}
      </ul>`;
    modal.hidden = false;
  }

  if (modalClose) modalClose.addEventListener('click', () => { modal.hidden = true; });
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal && !modal.hidden) modal.hidden = true; });

  // Export CSV
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    // Export the current filteredOrders (all pages, not just visible page)
    const data = filteredOrders.length > 0 ? filteredOrders : allOrders;
    const headers = ['Order ID', 'Buyer', 'Date', 'Items', 'Total', 'Status', 'Shipping Address', 'Notes'];
    const rows = data.map(o => [
      o.id,
      o.buyerName,
      o.date,
      o.itemCount,
      o.total.toFixed(2),
      o.status,
      typeof o.shippingAddress === 'object'
        ? [o.shippingAddress.street, o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.zip, o.shippingAddress.country].filter(Boolean).join(', ')
        : (o.shippingAddress || ''),
      o.notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
