(() => {
  'use strict';

  const pad = (number) => String(number).padStart(2, '0');

  document.querySelectorAll('[data-wp-countdown]').forEach((countdown) => {
    const launchDateValue = countdown.dataset.launchDate;
    const launchDate = new Date(launchDateValue);
    const liveMessage = countdown.parentElement.querySelector('[data-wp-live]');

    if (!launchDateValue || Number.isNaN(launchDate.getTime())) return;

    const daysEl = countdown.querySelector('[data-days]');
    const hoursEl = countdown.querySelector('[data-hours]');
    const minutesEl = countdown.querySelector('[data-minutes]');
    const secondsEl = countdown.querySelector('[data-seconds]');

    const complete = () => {
      countdown.hidden = true;
      if (liveMessage) liveMessage.hidden = false;
    };

    const update = () => {
      const distance = launchDate.getTime() - new Date().getTime();

      if (distance <= 0) {
        complete();
        return;
      }

      daysEl.textContent = pad(Math.floor(distance / (1000 * 60 * 60 * 24)));
      hoursEl.textContent = pad(Math.floor((distance / (1000 * 60 * 60)) % 24));
      minutesEl.textContent = pad(Math.floor((distance / (1000 * 60)) % 60));
      secondsEl.textContent = pad(Math.floor((distance / 1000) % 60));
    };

    update();
    window.setInterval(update, 1000);
  });

  if (window.klaviyoInitSignupForms) {
    window.klaviyoInitSignupForms(document);
  }

  document.querySelectorAll('[data-wp-password-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const panel = toggle.parentElement.querySelector('[data-wp-password-panel]');
      if (!panel) return;

      panel.hidden = !panel.hidden;

      const input = panel.querySelector('input[type="password"]');
      if (!panel.hidden && input) input.focus();
    });
  });
})();