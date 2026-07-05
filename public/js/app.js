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

  // Demo banner
  const demoBanner = document.getElementById('demoBanner');
  if (demoBanner) {
    if (localStorage.getItem('demoBannerDismissed')) demoBanner.remove();
    const dismissBtn = document.getElementById('demoBannerDismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        localStorage.setItem('demoBannerDismissed', '1');
        demoBanner.remove();
      });
    }
  }

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
  const PAGE_SIZE = 5;

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
    const pages = Math.ceil(total / PAGE_SIZE);
    if (listingsPage > pages) listingsPage = 1;
    const slice = data.slice((listingsPage - 1) * PAGE_SIZE, listingsPage * PAGE_SIZE);

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
  let allOrders = [];

  async function loadOrders() {
    if (allOrders.length) return;
    const res = await fetch('/api/mock/orders');
    allOrders = await res.json();
  }

  function renderOrders() {
    loadOrders().then(() => {
      applyOrdersFilter();
    });
  }

  function applyOrdersFilter() {
    const status = document.getElementById('ordersStatusFilter')?.value || '';
    const from = document.getElementById('ordersDateFrom')?.value || '';
    const to = document.getElementById('ordersDateTo')?.value || '';
    let data = allOrders.filter(o => {
      if (status && o.status !== status) return false;
      if (from && o.date < from) return false;
      if (to && o.date > to) return false;
      return true;
    });

    const tbody = document.getElementById('ordersTbody');
    if (tbody) {
      tbody.innerHTML = data.map(o => `
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
  }

  document.getElementById('ordersStatusFilter')?.addEventListener('change', applyOrdersFilter);
  document.getElementById('ordersDateFrom')?.addEventListener('change', applyOrdersFilter);
  document.getElementById('ordersDateTo')?.addEventListener('change', applyOrdersFilter);

  // Modal
  const modal = document.getElementById('orderModal');
  const modalClose = document.getElementById('modalClose');

  function openModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order || !modal) return;
    document.getElementById('modalTitle').textContent = 'Order ' + order.id;
    document.getElementById('modalBody').innerHTML = `
      <p><strong>Buyer:</strong> ${escHtml(order.buyerName)}</p>
      <p><strong>Date:</strong> ${escHtml(order.date)}</p>
      <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
      <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
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

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
