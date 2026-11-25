(() => {
  const storage = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    }
  };

  const search = document.querySelector('#post-search');
  const cards = [...document.querySelectorAll('#archive-list .entry-card')];
  const chips = [...document.querySelectorAll('[data-filter]')];
  const empty = document.querySelector('#empty-state');
  let activeFilter = 'all';

  function filterPosts() {
    if (!cards.length) return;
    const term = (search?.value || '').trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matchesTerm = !term || (card.dataset.search || '').includes(term);
      const matchesType = activeFilter === 'all' || card.querySelector('.entry-tag')?.textContent.trim().toLowerCase() === activeFilter;
      card.hidden = !(matchesTerm && matchesType);
      if (!card.hidden) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
  }

  search?.addEventListener('input', filterPosts);
  chips.forEach(chip => chip.addEventListener('click', () => {
    activeFilter = chip.dataset.filter || 'all';
    chips.forEach(item => item.classList.toggle('is-on', item === chip));
    filterPosts();
  }));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && search && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      event.preventDefault(); search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === search) search.blur();
  });

  const draftForm = document.querySelector('#draft-form');
  const draftStatus = document.querySelector('#draft-status');
  const draftKey = 'museai-social-local-draft-v1';
  const savedDraft = storage.get(draftKey, null);
  if (draftForm && savedDraft) {
    for (const [name, value] of Object.entries(savedDraft)) {
      const field = draftForm.elements.namedItem(name);
      if (field && typeof value === 'string') field.value = value;
    }
    if (draftStatus) draftStatus.textContent = 'Restored the draft saved on this device.';
  }
  function collectDraft() {
    if (!draftForm) return null;
    const values = Object.fromEntries(new FormData(draftForm).entries());
    return { ...values, savedAt: new Date().toISOString(), localOnly: true };
  }
  draftForm?.addEventListener('submit', event => {
    event.preventDefault();
    const draft = collectDraft();
    if (!draftForm.reportValidity()) return;
    const saved = storage.set(draftKey, draft);
    if (draftStatus) draftStatus.textContent = saved ? 'Draft saved in this browser only. Nothing was published or sent.' : 'Browser storage is unavailable. Use Export draft JSON instead.';
  });
  document.querySelector('#export-draft')?.addEventListener('click', () => {
    const draft = collectDraft();
    if (!draftForm.reportValidity()) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${(draft.title || 'museai-social-draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'museai-social-draft'}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    if (draftStatus) draftStatus.textContent = 'Exported a JSON draft to your downloads. It is not a published post.';
  });

  const modal = document.querySelector('#room-modal');
  const roomForm = document.querySelector('#room-form');
  const roomStatus = roomForm?.querySelector('.form-status');
  const savedRooms = document.querySelector('#saved-rooms');
  const roomKey = 'museai-social-local-rooms-v1';
  const roomList = () => storage.get(roomKey, []);
  function renderRooms() {
    if (!savedRooms) return;
    const rooms = roomList();
    savedRooms.innerHTML = rooms.length ? `<strong>Room drafts on this device</strong><ul>${rooms.map(room => `<li>${escapeHtml(room.name)} · ${escapeHtml(room.subjectName)}</li>`).join('')}</ul>` : '';
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  document.querySelectorAll('[data-open-room]').forEach(button => button.addEventListener('click', () => {
    renderRooms();
    if (typeof modal?.showModal === 'function') modal.showModal();
  }));
  roomForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!roomForm.reportValidity()) return;
    const values = Object.fromEntries(new FormData(roomForm).entries());
    const labels = { 'meta-glasses': 'Meta Glasses', 'meta-ai': 'Meta AI app', 'meta-integrations': 'Meta integrations' };
    const rooms = roomList();
    rooms.push({ name: values.name.trim(), subject: values.subject, subjectName: labels[values.subject] || 'Meta integrations', savedAt: new Date().toISOString(), localOnly: true });
    const saved = storage.set(roomKey, rooms);
    if (roomStatus) roomStatus.textContent = saved ? 'Room draft saved locally. No chat was created.' : 'Browser storage is unavailable; this room draft could not be saved.';
    if (saved) { roomForm.reset(); renderRooms(); }
  });
  modal?.addEventListener('click', event => {
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });
})();


(() => {
  const gateForm = document.querySelector('#age-gate-form');
  const gatePanel = document.querySelector('#age-gate-panel');
  const options = document.querySelector('#provider-options');
  if (!gateForm || !gatePanel || !options) return;

  const AGE_KEY = 'museai-social-age-confirmed-v1';
  const PAYPAL_CLIENT_ID = 'BAA_ndqaWMyQwTnDZ0LXwLQ22jdJo9uxkeXYqmBbF-hD41HMiZ83mvOcx1Kti0b6ZfXfje7Q1ievNaS8Ok';
  const PAYPAL_PLAN_ID = 'P-4FD24238VX4902214NK2XP2Y';
  const STRIPE_BUTTON_ID = 'buy_btn_1UJKaaJaRf233kfWKZ81fcIe';
  const STRIPE_PUBLISHABLE_KEY = 'pk_live_51UIdAGJaRf233kfWlFacR31IYVGdjCVAttNFzIgQGXQzrUdc894iJcBqamRZNwF11z2AN5kvjyzitor462f2egVI00UmKj0sd8';
  let providersStarted = false;

  function setStatus(id, message) {
    const node = document.getElementById(id);
    if (node) node.textContent = message;
  }

  function loadPaypal() {
    const slot = document.querySelector('#paypal-subscription-buttons');
    const fallback = 'PayPal checkout could not load. Check your connection or try another provider.';
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&vault=true&intent=subscription`;
    script.async = true;
    script.onload = () => {
      if (!window.paypal?.Buttons || !slot) {
        setStatus('paypal-status', fallback);
        return;
      }
      slot.replaceChildren();
      window.paypal.Buttons({
        style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe' },
        createSubscription: (data, actions) => actions.subscription.create({ plan_id: PAYPAL_PLAN_ID, quantity: 1 }),
        onApprove: () => setStatus('paypal-status', 'PayPal returned an approval. Review and finish the provider’s on-screen confirmation.'),
        onError: () => setStatus('paypal-status', 'PayPal could not complete this step. Review the provider message or choose another option.')
      }).render('#paypal-subscription-buttons').catch(() => setStatus('paypal-status', fallback));
    };
    script.onerror = () => setStatus('paypal-status', fallback);
    document.head.appendChild(script);
  }

  function loadStripe() {
    const slot = document.querySelector('#stripe-buy-button-slot');
    const fallback = 'Stripe checkout could not load. Check your connection or choose another provider.';
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    script.onload = () => {
      if (!slot || !customElements.get('stripe-buy-button')) {
        setStatus('stripe-status', fallback);
        return;
      }
      slot.replaceChildren();
      const button = document.createElement('stripe-buy-button');
      button.setAttribute('buy-button-id', STRIPE_BUTTON_ID);
      button.setAttribute('publishable-key', STRIPE_PUBLISHABLE_KEY);
      slot.append(button);
    };
    script.onerror = () => setStatus('stripe-status', fallback);
    document.head.appendChild(script);
  }

  function revealProviders() {
    gatePanel.hidden = true;
    options.hidden = false;
    if (providersStarted) return;
    providersStarted = true;
    loadPaypal();
    loadStripe();
  }

  gateForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!gateForm.reportValidity()) {
      setStatus('gate-status', 'Check the box to confirm you are at least 18 years old.');
      return;
    }
    try { sessionStorage.setItem(AGE_KEY, 'yes'); } catch { /* The providers still load for this page view. */ }
    revealProviders();
  });

  let alreadyConfirmed = false;
  try { alreadyConfirmed = sessionStorage.getItem(AGE_KEY) === 'yes'; } catch { /* Treat unavailable storage as unconfirmed. */ }
  if (alreadyConfirmed) revealProviders();
})();
