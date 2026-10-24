(() => {
  'use strict';
  const API = '/api';
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const notice = (message, type = 'success') => {
    let el = document.querySelector('.app-notice');
    if (!el) { el = document.createElement('div'); el.className = 'app-notice'; document.body.appendChild(el); }
    el.textContent = message; el.dataset.type = type; el.classList.add('is-visible');
    setTimeout(() => el.classList.remove('is-visible'), 4000);
  };
  const request = async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Request failed.');
    return body;
  };
  const dateLabel = value => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const slugImage = name => {
    const n = String(name).toLowerCase();
    if (n.includes('concert')) return 'images/concert.jpeg';
    if (n.includes('tech')) return 'images/conference.jpeg';
    if (n.includes('championship')) return 'images/sports.jpeg';
    if (n.includes('workshop')) return 'images/workshop.jpeg';
    if (n.includes('food')) return 'images/food.jpeg';
    return 'images/comedy.jpeg';
  };
  const currentUser = () => read('eventifyUser');

  function updateNav() {
    const user = currentUser();
    document.querySelectorAll('.nav-links').forEach(nav => {
      const links = [...nav.querySelectorAll('a')];
      const login = links.find(a => /login/i.test(a.textContent));
      const register = links.find(a => /register/i.test(a.textContent));
      if (user && login) { login.textContent = `Hi, ${(user.full_name || 'User').split(' ')[0]}`; login.href = 'index.html'; }
      if (user && register) { register.textContent = 'Log Out'; register.href = '#logout'; register.onclick = e => { e.preventDefault(); localStorage.removeItem('eventifyUser'); updateNav(); location.href = 'index.html'; }; }
    });
  }

  async function loadEvents() {
    const events = await request('/events');
    const cards = [...document.querySelectorAll('.event-card')];
    cards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.trim();
      const event = events.find(e => e.event_name.toLowerCase() === title?.toLowerCase());
      if (!event) return;
      card.dataset.eventId = event.event_id;
      const category = card.querySelector('.event-category'); if (category) category.textContent = event.category_name.toUpperCase();
      const date = card.querySelector('.event-date'); if (date) date.textContent = dateLabel(event.event_date);
      const price = card.querySelector('.price'); if (price) price.textContent = money(event.base_price);
      const description = card.querySelector('.event-card-content p:not(.event-date)'); if (description) description.textContent = event.description;
      const image = card.querySelector('img'); if (image) image.src = slugImage(event.event_name);
      card.querySelectorAll('a.btn').forEach(a => { a.href = `payment.html?event=${event.event_id}`; });
    });
    if (location.pathname.endsWith('services.html')) {
      const cardsWrap = document.querySelector('.cards');
      if (cardsWrap && cards.length === 0) {
        cardsWrap.innerHTML = events.map(e => `<article class="card event-card" data-event-id="${e.event_id}"><img src="${slugImage(e.event_name)}" alt=""><div class="event-card-content"><span class="event-category">${e.category_name.toUpperCase()}</span><h3>${e.event_name}</h3><p>${e.description}</p><p class="event-date">${dateLabel(e.event_date)}</p><div class="event-bottom"><span class="price">${money(e.base_price)}</span><a class="btn" href="payment.html?event=${e.event_id}">Book Now</a></div></div></article>`).join('');
      }
      initSearch();
    }
    return events;
  }

  function initSearch() {
    const cards = [...document.querySelectorAll('.event-card')];
    const title = document.querySelector('.section-title');
    if (!location.pathname.endsWith('services.html') || !cards.length || !title || document.querySelector('.event-filters')) return;
    const filters = document.createElement('div'); filters.className = 'event-filters';
    filters.innerHTML = '<input id="event-search" type="search" placeholder="Search events…" aria-label="Search events"><select id="event-category" aria-label="Filter by category"><option value="all">All categories</option><option>Music</option><option>Technology</option><option>Sports</option><option>Workshop</option><option>Food</option><option>Comedy</option></select><span class="event-result-count"></span>';
    title.insertAdjacentElement('afterend', filters);
    const apply = () => { const q = document.getElementById('event-search').value.toLowerCase(); const cat = document.getElementById('event-category').value.toLowerCase(); let n = 0; cards.forEach(c => { const text = c.innerText.toLowerCase(); const ok = text.includes(q) && (cat === 'all' || text.includes(cat)); c.hidden = !ok; if (ok) n++; }); document.querySelector('.event-result-count').textContent = `${n} event(s) found`; };
    filters.querySelectorAll('input,select').forEach(el => el.addEventListener('input', apply)); apply();
  }

  async function initAuth() {
    const form = document.querySelector('main form'); if (!form) return;
    if (location.pathname.endsWith('register.html')) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const fullName = document.getElementById('fullname')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const phone = document.getElementById('phone')?.value.trim();
        if (password !== confirm) return notice('Passwords do not match.', 'error');
        try {
          const result = await request('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password, phone }) });
          save('eventifyUser', result.user); notice('Account saved in MySQL. Welcome to Eventify!');
          setTimeout(() => location.href = new URLSearchParams(location.search).get('next') || 'index.html', 700);
        } catch (err) { notice(err.message, 'error'); }
      });
    } else if (location.pathname.endsWith('login.html')) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        try {
          const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('email')?.value.trim(), password: document.getElementById('password')?.value }) });
          save('eventifyUser', result.user); notice('Login verified against MySQL.');
          setTimeout(() => location.href = new URLSearchParams(location.search).get('next') || 'index.html', 700);
        } catch (err) { notice(err.message, 'error'); }
      });
    }
  }

  async function initCheckout() {
    if (!location.pathname.endsWith('payment.html')) return;
    const eventId = Number(new URLSearchParams(location.search).get('event'));
    const summary = document.querySelectorAll('.checkout-box')[0];
    const form = document.querySelector('.checkout-box form');
    if (!summary || !form) return;
    let event;
    try {
      const events = await request('/events'); event = events.find(e => e.event_id === eventId) || events[0];
      if (!event) throw new Error('No events found in the database. Run database/seed.sql first.');
    } catch (err) { summary.innerHTML = `<h2>Could not load event</h2><p>${err.message}</p>`; return; }
    if (!currentUser()) {
      notice('Please log in or register before booking.', 'error');
      setTimeout(() => location.href = `login.html?next=${encodeURIComponent(`payment.html?event=${event.event_id}`)}`, 900);
      return;
    }
    summary.innerHTML = `<div class="checkout-event"><img src="${slugImage(event.event_name)}" alt=""><div><span class="event-category">${event.category_name.toUpperCase()}</span><h3>${event.event_name}</h3><p>${dateLabel(event.event_date)} · ${event.venue_name}</p><p>${event.description}</p><p><strong>${money(event.base_price)} per ticket</strong></p></div></div><div class="seat-section"><h3>Choose your seats</h3><p class="muted">Seat availability is read from MySQL. Select seats, then use the demo payment form.</p><div class="seat-legend"><span><i class="seat-dot available"></i>Available</span><span><i class="seat-dot selected"></i>Selected</span><span><i class="seat-dot unavailable"></i>Booked</span></div><div class="seat-grid" id="seat-grid">Loading seats…</div><p class="selected-seat-label" aria-live="polite">Selected seats: none</p></div><div class="order-lines"><div><span>Ticket subtotal</span><strong id="ticket-subtotal">${money(event.base_price)}</strong></div><div><span>Booking fee</span><strong id="booking-fee">${money(50)}</strong></div><div class="order-total"><span>Total</span><strong id="grand-total">${money(Number(event.base_price)+50)}</strong></div></div><p class="demo-disclaimer">Demo payment only. Do not enter real card details. Card details are not sent to or stored in the database.</p>`;
    const grid = document.getElementById('seat-grid'); let seats = []; let chosen = [];
    const updateTotals = () => {
      const subtotal = chosen.length * Number(event.base_price); document.getElementById('ticket-subtotal').textContent = money(subtotal); document.getElementById('booking-fee').textContent = money(chosen.length ? 50 : 0); document.getElementById('grand-total').textContent = money(subtotal + (chosen.length ? 50 : 0));
      document.querySelector('.selected-seat-label').textContent = `Selected seats: ${chosen.length ? chosen.map(s => s.seat_number).join(', ') : 'none'}`;
    };
    async function refreshSeats() {
      seats = await request(`/events/${event.event_id}/seats`); chosen = [];
      grid.innerHTML = seats.map(s => `<button type="button" class="seat ${Number(s.available) ? '' : 'unavailable'}" data-seat-id="${s.seat_id}" ${Number(s.available) ? '' : 'disabled'} aria-pressed="false">${s.seat_number}</button>`).join('');
      grid.querySelectorAll('.seat:not(.unavailable)').forEach(button => button.addEventListener('click', () => {
        const id = Number(button.dataset.seatId); const seat = seats.find(s => s.seat_id === id);
        if (chosen.some(s => s.seat_id === id)) chosen = chosen.filter(s => s.seat_id !== id); else if (chosen.length < 6) chosen.push(seat); else return notice('Select up to 6 seats per booking.', 'error');
        button.classList.toggle('selected', chosen.some(s => s.seat_id === id)); button.setAttribute('aria-pressed', String(chosen.some(s => s.seat_id === id))); updateTotals();
      }));
      updateTotals();
    }
    try { await refreshSeats(); } catch (err) { grid.textContent = err.message; }
    const cardNumber = document.getElementById('card-number');
    cardNumber?.addEventListener('input', () => { cardNumber.value = cardNumber.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); });
    document.getElementById('expiry')?.addEventListener('input', e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = `${v.slice(0,2)}/${v.slice(2)}`; e.target.value = v; });
    document.getElementById('cvv')?.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!chosen.length) return notice('Select at least one available seat.', 'error');
      if (cardNumber && cardNumber.value.replace(/\D/g, '').length !== 16) return notice('Use a 16-digit demo card number.', 'error');
      const expiry = document.getElementById('expiry')?.value || '';
      if (expiry && !/^\d{2}\/\d{2}$/.test(expiry)) return notice('Use MM/YY for expiry.', 'error');
      const cvv = document.getElementById('cvv')?.value || '';
      if (cvv && cvv.length !== 3) return notice('Use a 3-digit demo CVV.', 'error');
      const button = form.querySelector('button[type="submit"]'); if (button) { button.disabled = true; button.textContent = 'Saving booking…'; }
      try {
        const user = currentUser();
        const booking = await request('/bookings', { method: 'POST', body: JSON.stringify({ userId: user.user_id, eventId: event.event_id, seatIds: chosen.map(s => s.seat_id), paymentMethod: 'Demo' }) });
        save('eventifyLatestBooking', { ...booking, eventId: event.event_id, eventDate: dateLabel(event.event_date), venue: event.venue_name });
        location.href = 'confirmation.html';
      } catch (err) {
        notice(err.message, 'error');
        try { await refreshSeats(); } catch (_) {}
        if (button) { button.disabled = false; button.textContent = 'Pay Now'; }
      }
    });
  }

  function initConfirmation() {
    if (!location.pathname.endsWith('confirmation.html')) return;
    const content = document.getElementById('confirmation-content'); if (!content) return;
    const b = read('eventifyLatestBooking');
    if (!b) { content.innerHTML = '<h1>No recent booking</h1><p>Choose an event to begin.</p><a class="btn" href="services.html">Explore events</a>'; return; }
    content.innerHTML = `<div class="confirmation-icon" aria-hidden="true">✓</div><p class="eyebrow">BOOKING CONFIRMED · DEMO</p><h1>You’re on the list.</h1><p class="confirmation-lead">Payment status: ${b.paymentStatus}. Your booking and payment records were saved in MySQL.</p><div class="confirmation-card"><div class="confirmation-top"><div><span class="muted">BOOKING REFERENCE</span><h2>${b.reference}</h2></div><span class="confirmation-status">Confirmed</span></div><h3>${b.eventName}</h3><p>${b.eventDate || dateLabel(b.eventDate)} · ${b.venue || ''}</p><div class="confirmation-detail"><span>Seats</span><strong>${b.seats.join(', ')}</strong></div><div class="confirmation-detail"><span>Tickets</span><strong>${b.quantity}</strong></div><div class="confirmation-detail"><span>Subtotal</span><strong>${money(b.subtotal)}</strong></div><div class="confirmation-detail"><span>Booking fee</span><strong>${money(b.fee)}</strong></div><div class="confirmation-detail"><span>Total (demo)</span><strong>${money(b.total)}</strong></div><div class="confirmation-detail"><span>Ticket IDs</span><strong>${b.tickets.map(t => t.ticketId).join(', ')}</strong></div></div><a class="btn" href="services.html">Discover more events</a> <button type="button" class="btn btn-outline" id="print-booking">Print confirmation</button>`;
    document.getElementById('print-booking')?.addEventListener('click', () => window.print());
  }

  document.addEventListener('DOMContentLoaded', async () => {
    updateNav();
    try { await loadEvents(); } catch (err) { if (location.pathname.endsWith('services.html')) notice(`Database connection unavailable: ${err.message}`, 'error'); }
    await initAuth();
    await initCheckout();
    initConfirmation();
  });
})();
