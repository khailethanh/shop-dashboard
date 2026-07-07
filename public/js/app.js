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
    if (tabName === 'reviews') renderReviews();
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === '1') switchTab('dashboard');
    if (e.key === '2') switchTab('listings');
    if (e.key === '3') switchTab('orders');
    if (e.key === '4') switchTab('analytics');
    if (e.key === '5') switchTab('reviews');
    if (e.key === 'r' || e.key === 'R') location.reload();
    if (e.key === 's' || e.key === 'S') location.href = '/settings';
  });

  // Shop switcher — submit form on select change
  const shopSwitcher = document.getElementById('shopSwitcher');
  if (shopSwitcher) {
    shopSwitcher.addEventListener('change', () => {
      const form = shopSwitcher.closest('form');
      if (form) form.submit();
    });
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
      updateOverdueBadge();
      updateDashboardCards();
    });
  }

  // Compute overdue: pending + order_date > 3 days ago
  function isOverdue(order) {
    if (order.status !== 'pending') return false;
    const dateStr = order.date || order.order_date;
    if (!dateStr) return false;
    const orderDate = new Date(dateStr);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return orderDate < threeDaysAgo;
  }

  function updateOverdueBadge() {
    const badge = document.getElementById('overdue-badge');
    if (!badge) return;
    const count = allOrders.filter(isOverdue).length;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function updateDashboardCards() {
    // Pending fulfillment count
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    const pendingEl = document.getElementById('pending-fulfillment-count');
    if (pendingEl) pendingEl.textContent = pendingCount;

    // Avg rating from __REVIEWS__
    const reviews = window.__REVIEWS__ || [];
    const avgRatingEl = document.getElementById('avg-rating-value');
    const avgRatingSubEl = document.getElementById('avg-rating-sub');
    if (avgRatingEl && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
      avgRatingEl.textContent = avg.toFixed(1);
      const unresponded = reviews.filter(r => !r.shop_response).length;
      if (avgRatingSubEl) avgRatingSubEl.textContent = `unresponded: ${unresponded}`;
    } else if (avgRatingEl) {
      avgRatingEl.textContent = '—';
    }
  }

  // Pending fulfillment card — click to filter Orders tab to pending
  document.getElementById('pending-fulfillment-card')?.addEventListener('click', () => {
    switchTab('orders');
    const statusFilter = document.getElementById('ordersStatusFilter');
    if (statusFilter) {
      statusFilter.value = 'pending';
      applyOrdersFilter();
    }
  });

  function applyOrdersFilter() {
    const search = (document.getElementById('orders-search')?.value || '').toLowerCase();
    const sortVal = document.getElementById('orders-sort')?.value || 'date-desc';
    const status = document.getElementById('ordersStatusFilter')?.value || '';
    const from = document.getElementById('ordersDateFrom')?.value || '';
    const to = document.getElementById('ordersDateTo')?.value || '';

    let data = allOrders.filter(o => {
      const buyerName = o.buyerName || o.buyer_name || '';
      const orderId = String(o.id || '');
      if (search && !buyerName.toLowerCase().includes(search) && !orderId.toLowerCase().includes(search)) return false;
      if (status && o.status !== status) return false;
      const dateVal = o.date || o.order_date || '';
      if (from && dateVal < from) return false;
      if (to && dateVal > to) return false;
      return true;
    });

    // Sort
    data = data.slice().sort((a, b) => {
      const aDate = a.date || a.order_date || '';
      const bDate = b.date || b.order_date || '';
      const aTotal = a.total || a.total_price || 0;
      const bTotal = b.total || b.total_price || 0;
      if (sortVal === 'date-asc') return aDate.localeCompare(bDate);
      if (sortVal === 'total-desc') return bTotal - aTotal;
      if (sortVal === 'total-asc') return aTotal - bTotal;
      // date-desc (default)
      return bDate.localeCompare(aDate);
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
      tbody.innerHTML = slice.map(o => {
        const orderId = o.id || '';
        const buyerName = o.buyerName || o.buyer_name || '';
        const dateVal = o.date || o.order_date || '';
        const itemCount = o.itemCount || (o.items ? o.items.length : 0);
        const total = o.total || o.total_price || 0;
        const overdue = isOverdue(o);
        const statusCell = `<span class="badge badge-${o.status}">${o.status}</span>${overdue ? ' <span class="overdue-badge">Overdue</span>' : ''}`;
        return `
          <tr data-order-id="${escHtml(String(orderId))}" style="cursor:pointer">
            <td class="checkbox-col"><input type="checkbox" class="order-checkbox" data-order-id="${escHtml(String(orderId))}" aria-label="Select order ${escHtml(String(orderId))}"></td>
            <td>${escHtml(String(orderId))}</td>
            <td>${escHtml(buyerName)}</td>
            <td>${escHtml(dateVal)}</td>
            <td>${itemCount}</td>
            <td>$${Number(total).toFixed(2)}</td>
            <td>${statusCell}</td>
          </tr>`;
      }).join('');

      // Row click opens modal (but not checkbox clicks)
      tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.type === 'checkbox') return;
          openModal(row.dataset.orderId);
        });
      });

      // Checkbox change updates bulk bar
      tbody.querySelectorAll('.order-checkbox').forEach(cb => {
        cb.addEventListener('change', updateBulkBar);
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

    // Reset select-all checkbox
    const selectAll = document.getElementById('orders-select-all');
    if (selectAll) selectAll.checked = false;
    updateBulkBar();
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

  // Bulk select — header checkbox
  document.getElementById('orders-select-all')?.addEventListener('change', function () {
    const checkboxes = document.querySelectorAll('#ordersTbody .order-checkbox');
    checkboxes.forEach(cb => { cb.checked = this.checked; });
    updateBulkBar();
  });

  function getSelectedOrderIds() {
    return Array.from(document.querySelectorAll('#ordersTbody .order-checkbox:checked'))
      .map(cb => cb.dataset.orderId);
  }

  function updateBulkBar() {
    const selected = getSelectedOrderIds();
    const bar = document.getElementById('bulk-action-bar');
    const countEl = document.getElementById('bulk-selected-count');
    if (bar) bar.style.display = selected.length > 0 ? '' : 'none';
    if (countEl) countEl.textContent = `${selected.length} selected`;
  }

  // Bulk process button
  document.getElementById('bulk-process-btn')?.addEventListener('click', async () => {
    const ids = getSelectedOrderIds();
    if (!ids.length) return;
    try {
      const res = await fetch('/orders/bulk-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ids.map(id => Number(id)) }),
      });
      if (!res.ok) throw new Error('Server error');
      // Refresh orders
      allOrders = [];
      await loadOrders();
      applyOrdersFilter();
      updateOverdueBadge();
      updateDashboardCards();
    } catch (err) {
      alert('Failed to update orders: ' + err.message);
    }
  });

  // Modal
  const modal = document.getElementById('orderModal');
  const modalClose = document.getElementById('modalClose');
  let currentModalOrderId = null;

  function formatShippingAddress(addr) {
    if (!addr) return '—';
    if (typeof addr === 'string') return escHtml(addr);
    const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
    return parts.map(p => escHtml(p)).join(', ');
  }

  function openModal(orderId) {
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (!order || !modal) return;
    currentModalOrderId = orderId;

    const buyerName = order.buyerName || order.buyer_name || '';
    const dateVal = order.date || order.order_date || '';
    const total = order.total || order.total_price || 0;
    const items = order.items || [];
    const shippingAddress = order.shippingAddress || order.shipping_address;
    const notes = order.notes;

    document.getElementById('modalTitle').textContent = 'Order ' + orderId;
    document.getElementById('modalBody').innerHTML = `
      <p><strong>Buyer:</strong> ${escHtml(buyerName)}</p>
      <p><strong>Date:</strong> ${escHtml(dateVal)}</p>
      <p><strong>Status:</strong> <span class="badge badge-${order.status}">${order.status}</span></p>
      <p><strong>Total:</strong> $${Number(total).toFixed(2)}</p>
      <p><strong>Shipping Address:</strong> ${formatShippingAddress(shippingAddress)}</p>
      <p><strong>Notes:</strong> ${notes ? escHtml(notes) : '—'}</p>
      <h3 style="margin-top:16px">Items</h3>
      <ul style="padding-left:20px;line-height:2">
        ${items.map(i => `<li>${escHtml(i.title)} × ${i.qty}</li>`).join('')}
      </ul>`;

    // Show fulfillment fields if status is pending or processing
    const fulfillmentFields = document.getElementById('fulfillment-fields');
    const fulfillmentMsg = document.getElementById('fulfillment-msg');
    const carrierInput = document.getElementById('fulfillment-carrier');
    const trackingInput = document.getElementById('fulfillment-tracking');

    if (fulfillmentFields) {
      if (order.status === 'pending' || order.status === 'processing') {
        fulfillmentFields.style.display = '';
        // Pre-fill existing values if any
        if (carrierInput) carrierInput.value = order.carrier || '';
        if (trackingInput) trackingInput.value = order.tracking_number || '';
        if (fulfillmentMsg) fulfillmentMsg.textContent = '';
      } else {
        fulfillmentFields.style.display = 'none';
      }
    }

    modal.hidden = false;
  }

  if (modalClose) modalClose.addEventListener('click', () => { modal.hidden = true; });
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal && !modal.hidden) modal.hidden = true; });

  // Mark as Shipped button
  document.getElementById('mark-shipped-btn')?.addEventListener('click', async () => {
    if (!currentModalOrderId) return;
    const carrier = document.getElementById('fulfillment-carrier')?.value.trim() || '';
    const tracking = document.getElementById('fulfillment-tracking')?.value.trim() || '';
    const msgEl = document.getElementById('fulfillment-msg');

    try {
      const res = await fetch(`/orders/${currentModalOrderId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier, tracking_number: tracking }),
      });
      if (!res.ok) throw new Error('Server error');

      // Update local data
      const order = allOrders.find(o => String(o.id) === String(currentModalOrderId));
      if (order) {
        order.status = 'shipped';
        order.carrier = carrier;
        order.tracking_number = tracking;
        order.fulfilled_at = new Date().toISOString();
      }

      if (msgEl) msgEl.textContent = 'Marked as shipped!';

      // Hide fulfillment fields after shipping
      const fulfillmentFields = document.getElementById('fulfillment-fields');
      if (fulfillmentFields) fulfillmentFields.style.display = 'none';

      // Update status in modal body
      const modalBody = document.getElementById('modalBody');
      if (modalBody) {
        const statusBadge = modalBody.querySelector('.badge');
        if (statusBadge) {
          statusBadge.className = 'badge badge-shipped';
          statusBadge.textContent = 'shipped';
        }
      }

      // Refresh orders table
      renderOrdersPage();
      updateOverdueBadge();
      updateDashboardCards();
    } catch (err) {
      if (msgEl) msgEl.textContent = 'Error: ' + err.message;
    }
  });

  // Export CSV
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    // Export the current filteredOrders (all pages, not just visible page)
    const data = filteredOrders.length > 0 ? filteredOrders : allOrders;
    const headers = ['Order ID', 'Buyer', 'Date', 'Items', 'Total', 'Status', 'Shipping Address', 'Notes'];
    const rows = data.map(o => {
      const buyerName = o.buyerName || o.buyer_name || '';
      const dateVal = o.date || o.order_date || '';
      const itemCount = o.itemCount || (o.items ? o.items.length : 0);
      const total = o.total || o.total_price || 0;
      const shippingAddress = o.shippingAddress || o.shipping_address;
      return [
        o.id,
        buyerName,
        dateVal,
        itemCount,
        Number(total).toFixed(2),
        o.status,
        typeof shippingAddress === 'object'
          ? [shippingAddress.street, shippingAddress.city, shippingAddress.state, shippingAddress.zip, shippingAddress.country].filter(Boolean).join(', ')
          : (shippingAddress || ''),
        o.notes || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    });

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

  // ---- Reviews ----
  let allReviews = [];
  let filteredReviews = [];

  function loadReviewsData() {
    if (!allReviews.length) {
      allReviews = (window.__REVIEWS__ || []).slice();
    }
  }

  function starsHtml(rating) {
    let html = '<span class="star-rating">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star${i <= rating ? ' filled' : ''}" aria-hidden="true">${i <= rating ? '★' : '☆'}</span>`;
    }
    html += '</span>';
    return html;
  }

  function renderReviewCard(review) {
    const flagged = Number(review.flagged) === 1;
    const responded = !!review.shop_response;
    const dateStr = review.review_date ? new Date(review.review_date).toLocaleDateString() : '';
    return `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-header">
          <span class="review-buyer">${escHtml(review.buyer_name || 'Anonymous')}</span>
          ${starsHtml(review.rating || 0)}
          <span class="review-date">${escHtml(dateStr)}</span>
          ${flagged ? '<span class="flag-badge">Needs attention</span>' : ''}
        </div>
        <div class="review-text">${escHtml(review.review_text || '')}</div>
        ${responded ? `
          <div class="review-response">
            <strong>Your response:</strong>
            <p>${escHtml(review.shop_response)}</p>
          </div>` : ''}
        <div class="review-actions">
          <textarea class="review-response-input input" placeholder="Write a response…" rows="3">${escHtml(review.shop_response || '')}</textarea>
          <button class="btn btn-primary review-respond-btn" data-review-id="${review.id}">Save Response</button>
          <button class="btn review-flag-btn ${flagged ? 'btn-danger' : 'btn-outline'}" data-review-id="${review.id}">
            ${flagged ? 'Unflag' : 'Flag'}
          </button>
        </div>
      </div>`;
  }

  function renderReviews() {
    loadReviewsData();
    applyReviewsFilter();
    updateDashboardCards();
  }

  function applyReviewsFilter() {
    const ratingFilter = document.getElementById('reviews-filter-rating')?.value || '';
    const respondedFilter = document.getElementById('reviews-filter-responded')?.value || '';
    const flaggedFilter = document.getElementById('reviews-filter-flagged')?.value || '';

    filteredReviews = allReviews.filter(r => {
      if (ratingFilter && String(r.rating) !== ratingFilter) return false;
      if (respondedFilter === 'responded' && !r.shop_response) return false;
      if (respondedFilter === 'not_responded' && r.shop_response) return false;
      if (flaggedFilter === 'flagged' && Number(r.flagged) !== 1) return false;
      return true;
    });

    const listEl = document.getElementById('reviews-list');
    const emptyEl = document.getElementById('reviews-empty');

    if (filteredReviews.length === 0) {
      if (listEl) listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = '';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      if (listEl) {
        listEl.innerHTML = filteredReviews.map(r => renderReviewCard(r)).join('');

        // Attach respond button handlers
        listEl.querySelectorAll('.review-respond-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const reviewId = btn.dataset.reviewId;
            const card = listEl.querySelector(`.review-card[data-review-id="${reviewId}"]`);
            const textarea = card?.querySelector('.review-response-input');
            const response = textarea?.value.trim() || '';
            if (!response) return;

            try {
              const res = await fetch(`/reviews/${reviewId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response }),
              });
              if (!res.ok) throw new Error('Server error');

              // Update local data
              const review = allReviews.find(r => String(r.id) === String(reviewId));
              if (review) {
                review.shop_response = response;
                review.responded_at = new Date().toISOString();
              }

              // Re-render
              applyReviewsFilter();
              updateDashboardCards();
            } catch (err) {
              alert('Failed to save response: ' + err.message);
            }
          });
        });

        // Attach flag button handlers
        listEl.querySelectorAll('.review-flag-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const reviewId = btn.dataset.reviewId;

            try {
              const res = await fetch(`/reviews/${reviewId}/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              });
              if (!res.ok) throw new Error('Server error');
              const data = await res.json();

              // Update local data
              const review = allReviews.find(r => String(r.id) === String(reviewId));
              if (review) {
                review.flagged = data.flagged ? 1 : 0;
              }

              // Re-render
              applyReviewsFilter();
            } catch (err) {
              alert('Failed to update flag: ' + err.message);
            }
          });
        });
      }
    }
  }

  // Reviews filter listeners
  document.getElementById('reviews-filter-rating')?.addEventListener('change', applyReviewsFilter);
  document.getElementById('reviews-filter-responded')?.addEventListener('change', applyReviewsFilter);
  document.getElementById('reviews-filter-flagged')?.addEventListener('change', applyReviewsFilter);

  // Initialize dashboard cards on page load
  updateDashboardCards();

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
