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
  }, 3000);

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

  const cleanPhoneNumber = (phone) => {
    return phone.trim().replace(/[^\d+]/g, '');
  };

  const isValidPhoneWithCountryCode = (phone) => {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  };

  popup.querySelectorAll('[data-wp-signup-form]').forEach((form) => {
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
})();