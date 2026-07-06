'use strict';

(function () {
  const ORANGE = '#F1641E';
  const DARK = '#222222';
  const SUCCESS = '#4CAF50';
  const BLUE = '#1565C0';

  document.addEventListener('DOMContentLoaded', () => {
    const rev = window.__REVENUE_DATA__;
    const analytics = window.__ANALYTICS__;
    if (!rev || !analytics) return;

    // Revenue line chart (Dashboard)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
      new Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: rev.map(d => d.date),
          datasets: [{
            label: 'Revenue ($)',
            data: rev.map(d => d.revenue),
            borderColor: ORANGE,
            backgroundColor: ORANGE + '22',
            tension: 0.3,
            fill: true,
          }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }

    // Top listings by views horizontal bar
    const topCtx = document.getElementById('topListingsChart');
    if (topCtx) {
      new Chart(topCtx, {
        type: 'bar',
        data: {
          labels: analytics.topListings.map(l => l.title),
          datasets: [{
            label: 'Views',
            data: analytics.topListings.map(l => l.views),
            backgroundColor: ORANGE,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
        },
      });
    }

    // Top listings by revenue horizontal bar
    const topRevCtx = document.getElementById('topListingsByRevenueChart');
    if (topRevCtx && analytics.topListingsByRevenue) {
      new Chart(topRevCtx, {
        type: 'bar',
        data: {
          labels: analytics.topListingsByRevenue.map(l => l.title),
          datasets: [{
            label: 'Revenue ($)',
            data: analytics.topListingsByRevenue.map(l => l.revenue),
            backgroundColor: BLUE + 'cc',
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
        },
      });
    }

    // Day of week vertical bar
    const dowCtx = document.getElementById('dayOfWeekChart');
    if (dowCtx) {
      new Chart(dowCtx, {
        type: 'bar',
        data: {
          labels: analytics.byDayOfWeek.map(d => d.day),
          datasets: [{
            label: 'Orders',
            data: analytics.byDayOfWeek.map(d => d.orders),
            backgroundColor: DARK,
          }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }

    // Revenue by period (month/week/day) — with period toggle
    let currentPeriod = 'monthly';
    let revenueMonthChartInstance = null;

    function getPeriodDataset(period) {
      if (period === 'weekly' && analytics.revenueByWeek) {
        return {
          labels: analytics.revenueByWeek.map(w => w.week),
          values: analytics.revenueByWeek.map(w => w.revenue),
        };
      }
      if (period === 'daily' && rev) {
        return {
          labels: rev.map(d => d.date),
          values: rev.map(d => d.revenue),
        };
      }
      // monthly (default)
      return {
        labels: analytics.revenueByMonth.map(m => m.month),
        values: analytics.revenueByMonth.map(m => m.revenue),
      };
    }

    function computePctChange(values) {
      if (!values || values.length < 2) return 0;
      const half = Math.floor(values.length / 2);
      const first = values.slice(0, half).reduce((s, v) => s + v, 0);
      const last = values.slice(half).reduce((s, v) => s + v, 0);
      if (first === 0) return last > 0 ? 100 : 0;
      return Math.round(((last - first) / first) * 100);
    }

    function updatePctBadge(values) {
      const badge = document.getElementById('pct-change-badge');
      if (!badge) return;
      const pct = computePctChange(values);
      const prefix = pct >= 0 ? '+' : '';
      badge.textContent = prefix + pct + '%';
      badge.classList.remove('pct-positive', 'pct-negative', 'pct-neutral');
      if (pct > 0) badge.classList.add('pct-positive');
      else if (pct < 0) badge.classList.add('pct-negative');
      else badge.classList.add('pct-neutral');
    }

    function createRevenueChart(period) {
      const revMonthCtx = document.getElementById('revenueMonthChart');
      if (!revMonthCtx) return;
      if (revenueMonthChartInstance) {
        revenueMonthChartInstance.destroy();
        revenueMonthChartInstance = null;
      }
      const { labels, values } = getPeriodDataset(period);
      revenueMonthChartInstance = new Chart(revMonthCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Revenue ($)',
            data: values,
            borderColor: SUCCESS,
            backgroundColor: SUCCESS + '22',
            tension: 0.3,
            fill: true,
          }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
      updatePctBadge(values);
    }

    // Initial render
    createRevenueChart(currentPeriod);

    // Period toggle button listeners
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.dataset.period;
        if (period === currentPeriod) return;
        currentPeriod = period;
        periodBtns.forEach(b => b.classList.toggle('active', b.dataset.period === period));
        createRevenueChart(period);
      });
    });
  });
})();
