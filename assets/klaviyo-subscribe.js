(() => {
  'use strict';

  const cleanPhoneNumber = (phone) => {
    const cleaned = phone.trim().replace(/[^\d+]/g, '');

    if (!cleaned || cleaned.startsWith('+')) return cleaned;

    if (cleaned.length === 10) return `+1${cleaned}`;

    return `+${cleaned}`;
  };

  const isValidPhoneWithCountryCode = (phone) => {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  };

  const submitKlaviyoSubscription = (publicKey, listId, { email, phone, subscriptions, customSource, sourceLabel, smsConsent }) => {
    const payload = {
      data: {
        type: 'subscription',
        attributes: {
          custom_source: customSource,
          profile: {
            data: {
              type: 'profile',
              attributes: {
                ...(email ? { email } : {}),
                ...(phone ? { phone_number: phone } : {}),
                properties: {
                  source: sourceLabel,
                  sms_consent_collected: smsConsent,
                  signup_page: window.location.pathname,
                  signup_url: window.location.href
                },
                subscriptions
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

    return fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(publicKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        revision: '2025-10-15'
      },
      body: JSON.stringify(payload)
    }).then((response) => {
      if (!response.ok && response.status !== 202) {
        throw new Error('Klaviyo subscription failed');
      }
    });
  };

  const initKlaviyoSignupForms = (root) => {
    (root || document).querySelectorAll('[data-wp-signup-form]').forEach((form) => {
      if (form.dataset.klaviyoBound) return;
      form.dataset.klaviyoBound = 'true';

      const message = form.querySelector('[data-wp-message]');
      const button = form.querySelector('[data-wp-submit-button]');
      const originalButtonText = button.textContent.trim();

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const publicKey = form.dataset.klaviyoPublicKey;
        const emailListId = form.dataset.klaviyoListId;
        const phoneListId = form.dataset.klaviyoPhoneListId;
        const customSource = form.dataset.klaviyoCustomSource || 'Shopify Signup Form';
        const sourceLabel = form.dataset.klaviyoSourceLabel || 'Website Signup';

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
          message.textContent = 'Please enter your phone number with country code, e.g. +12125551234.';
          message.classList.add('is-error');
          return;
        }

        if (phone && consentInput && !consentInput.checked) {
          message.textContent = 'Please accept SMS consent.';
          message.classList.add('is-error');
          return;
        }

        if (!publicKey || !emailListId) {
          message.textContent = 'Klaviyo settings are missing.';
          message.classList.add('is-error');
          return;
        }

        button.disabled = true;
        button.classList.add('is-loading');

        const smsOptedIn = Boolean(phone) && smsConsent === 'yes';
        const splitPhoneToOwnList = Boolean(phoneListId) && smsOptedIn;

        const requests = [
          submitKlaviyoSubscription(publicKey, emailListId, {
            email,
            phone: splitPhoneToOwnList ? undefined : (smsOptedIn ? phone : undefined),
            subscriptions: {
              email: { marketing: { consent: 'SUBSCRIBED' } },
              ...(!splitPhoneToOwnList && smsOptedIn ? { sms: { marketing: { consent: 'SUBSCRIBED' } } } : {})
            },
            customSource,
            sourceLabel,
            smsConsent
          })
        ];

        if (splitPhoneToOwnList) {
          requests.push(
            submitKlaviyoSubscription(publicKey, phoneListId, {
              email,
              phone,
              subscriptions: {
                sms: { marketing: { consent: 'SUBSCRIBED' } }
              },
              customSource,
              sourceLabel,
              smsConsent
            })
          );
        }

        try {
          await Promise.all(requests);

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
  };

  window.klaviyoInitSignupForms = initKlaviyoSignupForms;
})();
