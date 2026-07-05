'use strict';

(function () {
  const ORANGE = '#F1641E';
  const DARK = '#222222';
  const MUTED = '#D4D4D4';
  const SUCCESS = '#4CAF50';

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

    // Top listings horizontal bar
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

    // Revenue by month line
    const revMonthCtx = document.getElementById('revenueMonthChart');
    if (revMonthCtx) {
      new Chart(revMonthCtx, {
        type: 'line',
        data: {
          labels: analytics.revenueByMonth.map(m => m.month),
          datasets: [{
            label: 'Revenue ($)',
            data: analytics.revenueByMonth.map(m => m.revenue),
            borderColor: SUCCESS,
            backgroundColor: SUCCESS + '22',
            tension: 0.3,
            fill: true,
          }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }
  });
})();
