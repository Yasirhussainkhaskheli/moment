(() => {
  'use strict';

  const popup = document.querySelector('[data-home-popup]');

  if (!popup) return;

  let closedForPageLoad = false;
  let openTimer = null;

  const closePopup = () => {
    closedForPageLoad = true;
    popup.hidden = true;
    document.body.classList.remove('moment-home-popup-open');
  };

  const openPopup = () => {
    if (closedForPageLoad) return;

    popup.hidden = false;
    document.body.classList.add('moment-home-popup-open');
  };

  openTimer = window.setTimeout(() => {
    openPopup();
    openTimer = null;
  }, 5000);

  popup.querySelectorAll('[data-home-popup-close]').forEach((element) => {
    element.addEventListener('click', () => {
      if (openTimer) {
        window.clearTimeout(openTimer);
        openTimer = null;
      }

      closePopup();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popup.hidden) {
      closePopup();
    }
  });

  if (window.klaviyoInitSignupForms) {
    window.klaviyoInitSignupForms(popup);
  }
})();