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

  const cleanPhoneNumber = (phone) => {
    return phone.trim().replace(/[^\d+]/g, '');
  };

  const isValidPhoneWithCountryCode = (phone) => {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  };

  document.querySelectorAll('[data-wp-signup-form]').forEach((form) => {
    const message = form.querySelector('[data-wp-message]');
    const button = form.querySelector('[data-wp-submit-button]');
    const originalButtonText = button.textContent.trim();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const publicKey = form.dataset.klaviyoPublicKey;
      const listId = form.dataset.klaviyoListId;

      const emailInput = form.querySelector('input[type="email"]');
      const phoneInput = form.querySelector('input[type="tel"]');
      const consentInput = form.querySelector('.wp-password-page__consent input');

      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? cleanPhoneNumber(phoneInput.value) : '';
      const smsConsent = consentInput && consentInput.checked ? 'yes' : 'no';

      message.className = 'wp-password-page__message';
      message.textContent = '';

      if (!email) {
        message.textContent = 'Please enter your email address.';
        message.classList.add('is-error');
        return;
      }

      if (phoneInput && phoneInput.required && !phone) {
        message.textContent = 'Please enter your phone number.';
        message.classList.add('is-error');
        return;
      }

      if (phone && !isValidPhoneWithCountryCode(phone)) {
        message.textContent = 'Please enter your phone number with country code, e.g. +923001234567.';
        message.classList.add('is-error');
        return;
      }

      if (consentInput && !consentInput.checked) {
        message.textContent = 'Please accept SMS consent.';
        message.classList.add('is-error');
        return;
      }

      if (!publicKey || !listId) {
        message.textContent = 'Klaviyo settings are missing.';
        message.classList.add('is-error');
        return;
      }

      button.disabled = true;
      button.classList.add('is-loading');

      const payload = {
        data: {
          type: 'subscription',
          attributes: {
            custom_source: 'Shopify Coming Soon Page',
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: email,
                  properties: {
                    source: 'Coming Soon Page',
                    phone_collected: phone,
                    sms_consent_collected: smsConsent,
                    signup_page: window.location.pathname,
                    signup_url: window.location.href
                  },
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
                    }
                  }
                }
              }
            }
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: listId
              }
            }
          }
        }
      };

      try {
        const response = await fetch(
          `https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(publicKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              'revision': '2025-10-15'
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok && response.status !== 202) {
          throw new Error('Klaviyo subscription failed');
        }

        form.reset();

        message.textContent = 'Thank you. You are on the early access list.';
        message.classList.add('is-success');
      } catch (error) {
        message.textContent = 'Something went wrong. Please check your details and try again.';
        message.classList.add('is-error');
      } finally {
        button.disabled = false;
        button.classList.remove('is-loading');
        button.textContent = originalButtonText;
      }
    });
  });

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