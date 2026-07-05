'use strict';

(function () {
  const KEYS = ['shopName', 'currency', 'dateFormat', 'etsyApiKey'];

  function loadSettings() {
    KEYS.forEach(key => {
      const val = localStorage.getItem('setting_' + key);
      if (val === null) return;
      const el = document.getElementById(key) || document.querySelector(`[name="${key}"][value="${val}"]`);
      if (!el) return;
      if (el.type === 'radio') {
        const radio = document.querySelector(`[name="${key}"][value="${val}"]`);
        if (radio) radio.checked = true;
      } else {
        el.value = val;
      }
    });
  }

  function saveSettings() {
    KEYS.forEach(key => {
      const el = document.getElementById(key);
      if (el && el.type !== 'radio') {
        localStorage.setItem('setting_' + key, el.value);
      } else {
        const radio = document.querySelector(`[name="${key}"]:checked`);
        if (radio) localStorage.setItem('setting_' + key, radio.value);
      }
    });
    showToast();
  }

  function showToast() {
    const toast = document.getElementById('settingsToast');
    if (!toast) return;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 3000);
  }

  document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
  loadSettings();
})();
