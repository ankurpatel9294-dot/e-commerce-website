/* ShopKart UI: hash routing, listing with filters, product page, cart, wishlist, checkout, orders. */
(function () {
  const { CATEGORIES, PRODUCTS, CONFIG } = window.SK_DATA;
  const $ = (id) => document.getElementById(id);
  const app = $('app');

  /* ---------- State (cart, wishlist, orders persist on this device) ---------- */
  const KEY = 'shopkart-v1';
  const state = { cart: {}, wish: [], orders: [], coupon: '' };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* keep in memory */ } };

  const view = { q: '', sort: 'rel', minRating: 0, maxPrice: 0, brands: new Set() };
  let lastOrder = null;

  /* ---------- Helpers ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const off = (p) => Math.round((1 - p.price / p.mrp) * 100);
  const byId = (id) => PRODUCTS.find((p) => p.id === Number(id));
  const cartItems = () => Object.entries(state.cart).map(([id, qty]) => ({ p: byId(id), qty })).filter((x) => x.p);
  const cartQty = () => cartItems().reduce((s, x) => s + x.qty, 0);

  function totals() {
    const items = cartItems();
    const mrp = items.reduce((s, x) => s + x.p.mrp * x.qty, 0);
    const price = items.reduce((s, x) => s + x.p.price * x.qty, 0);
    const rate = CONFIG.coupons[state.coupon] || 0;
    const couponOff = Math.round(price * rate);
    const after = price - couponOff;
    const delivery = items.length === 0 || after >= CONFIG.freeDeliveryAbove ? 0 : CONFIG.deliveryFee;
    return { mrp, price, discount: mrp - price, couponOff, delivery, total: after + delivery, items };
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  const stars = (p) => `<span class="rate"><span class="badge">${p.rating.toFixed(1)} ★</span><span class="muted sm num">(${p.count.toLocaleString('en-IN')})</span></span>`;

  function card(p) {
    const wished = state.wish.includes(p.id);
    return `<article class="card">
      <button class="heart" data-wish="${p.id}" aria-pressed="${wished}" aria-label="${wished ? 'Remove from' : 'Add to'} wishlist">${wished ? '♥' : '♡'}</button>
      <a href="#p-${p.id}" style="text-decoration:none">
        <div class="thumb" style="--h:${p.hue}" aria-hidden="true">${p.emoji}</div>
        <div class="card-body">
          <span class="brandline">${esc(p.brand)}</span>
          <span class="pname">${esc(p.name)}</span>
          ${stars(p)}
          <span class="price"><b class="num">${inr(p.price)}</b><s class="num">${inr(p.mrp)}</s><span class="off">${off(p)}% off</span></span>
        </div>
      </a>
    </article>`;
  }

  /* ---------- Views ---------- */
  function listing(catId) {
    let items = PRODUCTS.filter((p) => !catId || p.category === catId);
    const q = view.q.trim().toLowerCase();
    if (q) items = items.filter((p) => (p.name + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(q));
    const pool = items;
    if (view.minRating) items = items.filter((p) => p.rating >= view.minRating);
    if (view.maxPrice) items = items.filter((p) => p.price <= view.maxPrice);
    if (view.brands.size) items = items.filter((p) => view.brands.has(p.brand));
    const sorters = {
      rel: null,
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rate: (a, b) => b.rating - a.rating,
      disc: (a, b) => off(b) - off(a),
    };
    if (sorters[view.sort]) items = [...items].sort(sorters[view.sort]);

    const brands = [...new Set(pool.map((p) => p.brand))].sort();
    const cat = CATEGORIES.find((c) => c.id === catId);
    const title = q ? `Results for “${esc(view.q)}”` : cat ? cat.name : 'Top deals for you';

    app.innerHTML = `
      ${!catId && !q ? `<section class="banner"><div><h1>Big Savings Days</h1><p>Up to 70% off on mobiles, laptops, fashion and more. Free delivery above ${inr(CONFIG.freeDeliveryAbove)}. Use code <b>WELCOME10</b> for 10% off.</p></div><div class="big-emoji" aria-hidden="true">🛍️</div></section>` : ''}
      <div class="layout">
        <aside class="panel filters" aria-label="Filters">
          <h2>Customer rating</h2>
          ${[4, 3].map((r) => `<label class="chk"><input type="radio" name="rating" value="${r}" ${view.minRating === r ? 'checked' : ''}> ${r}★ &amp; above</label>`).join('')}
          <label class="chk"><input type="radio" name="rating" value="0" ${!view.minRating ? 'checked' : ''}> Any</label>
          <h2>Price</h2>
          <label><span class="sm muted">Up to <b id="priceOut" class="num">${view.maxPrice ? inr(view.maxPrice) : 'any'}</b></span>
            <input type="range" id="priceRange" min="0" max="100000" step="1000" value="${view.maxPrice}" aria-label="Maximum price"></label>
          <h2>Brand</h2>
          <div class="brands">${brands.map((b) => `<label class="chk"><input type="checkbox" data-brand="${esc(b)}" ${view.brands.has(b) ? 'checked' : ''}> ${esc(b)}</label>`).join('')}</div>
        </aside>
        <section>
          <div class="sortbar">
            <div><h1 style="margin:0">${title}</h1><span class="muted sm">${items.length} product${items.length === 1 ? '' : 's'}</span></div>
            <label style="margin:0" class="sm"><span class="muted">Sort by</span>
              <select id="sort">${[['rel', 'Relevance'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['rate', 'Customer rating'], ['disc', 'Discount']].map(([v, l]) => `<option value="${v}" ${view.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          </div>
          ${items.length ? `<div class="grid">${items.map(card).join('')}</div>`
            : `<div class="panel empty"><div class="big-emoji">🔎</div><h2>No products match</h2><p class="muted">Try removing a filter or searching for something else.</p><button class="btn cart" id="clearFilters">Clear filters</button></div>`}
        </section>
      </div>`;

    app.querySelectorAll('input[name=rating]').forEach((r) => { r.onchange = () => { view.minRating = Number(r.value); listing(catId); }; });
    $('priceRange').oninput = (e) => { $('priceOut').textContent = Number(e.target.value) ? inr(e.target.value) : 'any'; };
    $('priceRange').onchange = (e) => { view.maxPrice = Number(e.target.value); listing(catId); };
    app.querySelectorAll('[data-brand]').forEach((c) => { c.onchange = () => { c.checked ? view.brands.add(c.dataset.brand) : view.brands.delete(c.dataset.brand); listing(catId); }; });
    $('sort').onchange = (e) => { view.sort = e.target.value; listing(catId); };
    const clear = $('clearFilters');
    if (clear) clear.onclick = () => { Object.assign(view, { minRating: 0, maxPrice: 0, sort: 'rel' }); view.brands.clear(); listing(catId); };
  }

  function product(id) {
    const p = byId(id);
    if (!p) return notFound();
    const cat = CATEGORIES.find((c) => c.id === p.category);
    const wished = state.wish.includes(p.id);
    const similar = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    app.innerHTML = `
      <p class="crumbs"><a href="#home">Home</a> › <a href="#c-${cat.id}">${cat.name}</a> › ${esc(p.brand)}</p>
      <div class="panel pdp">
        <div class="thumb" style="--h:${p.hue}" aria-hidden="true">${p.emoji}</div>
        <div>
          <span class="brandline">${esc(p.brand)}</span>
          <h1>${esc(p.name)}</h1>
          ${stars(p)}
          <p class="price" style="margin:12px 0 0"><b class="num" style="font-size:1.9rem">${inr(p.price)}</b><s class="num">${inr(p.mrp)}</s><span class="off">${off(p)}% off</span></p>
          <p class="muted sm" style="margin:2px 0 0">Inclusive of all taxes</p>
          <div class="pdp-actions">
            <button class="btn cart big" id="addCart">🛒 Add to cart</button>
            <button class="btn buy big" id="buyNow">⚡ Buy now</button>
            <button class="btn big" data-wish="${p.id}" aria-pressed="${wished}">${wished ? '♥ Wishlisted' : '♡ Wishlist'}</button>
          </div>
          <form class="delivery" id="pinForm"><label><span class="sm">Check delivery</span><input id="pin" inputmode="numeric" maxlength="6" placeholder="6-digit pincode" pattern="[1-9][0-9]{5}"></label><button class="btn" type="submit">Check</button></form>
          <p id="pinMsg" class="sm"></p>
          <h2>Highlights</h2>
          <ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>
      </div>
      <h2 style="margin-top:20px">Similar products</h2>
      <div class="grid">${similar.map(card).join('')}</div>`;
    $('addCart').onclick = () => { addToCart(p.id); toast('Added to cart'); };
    $('buyNow').onclick = () => { addToCart(p.id); location.hash = '#checkout'; };
    $('pinForm').onsubmit = (e) => {
      e.preventDefault();
      const ok = /^[1-9][0-9]{5}$/.test($('pin').value);
      $('pinMsg').textContent = ok ? 'Delivery in 2 to 4 days. Free delivery above ' + inr(CONFIG.freeDeliveryAbove) + '.' : 'Enter a valid 6-digit pincode.';
      $('pinMsg').style.color = ok ? 'var(--good)' : 'var(--bad)';
    };
  }

  function cartView() {
    const t = totals();
    if (!t.items.length) {
      app.innerHTML = `<div class="panel empty"><div class="big-emoji">🛒</div><h1>Your cart is empty</h1><p class="muted">Add items you like and they will show up here.</p><a class="btn cart" href="#home">Start shopping</a></div>`;
      return;
    }
    app.innerHTML = `<h1>My cart (${cartQty()})</h1>
      <div class="split">
        <section class="panel">${t.items.map(({ p, qty }) => `
          <div class="line">
            <a href="#p-${p.id}" class="thumb" style="--h:${p.hue}" aria-hidden="true" tabindex="-1">${p.emoji}</a>
            <div>
              <a href="#p-${p.id}" style="text-decoration:none"><b>${esc(p.name)}</b></a>
              <div class="muted sm">${esc(p.brand)}</div>
              <div class="price"><b class="num">${inr(p.price * qty)}</b><s class="num">${inr(p.mrp * qty)}</s><span class="off">${off(p)}% off</span></div>
              <div class="qty"><button data-dec="${p.id}" aria-label="Decrease quantity">−</button><output class="num">${qty}</output><button data-inc="${p.id}" aria-label="Increase quantity">+</button>
                <button class="btn link" data-rm="${p.id}">Remove</button><button class="btn link" data-wish="${p.id}">Wishlist</button></div>
            </div>
          </div>`).join('')}
          <div style="text-align:right;border-top:1px solid var(--border);padding-top:12px"><a class="btn buy big" href="#checkout">Place order</a></div>
        </section>
        ${summary(t, true)}
      </div>`;
    wireCart();
  }

  function summary(t, withCoupon) {
    return `<aside class="panel summary" aria-label="Price details">
      <h2 class="muted sm" style="text-transform:uppercase;letter-spacing:.06em">Price details</h2>
      <dl>
        <div class="row"><dt>Price (${cartQty()} item${cartQty() === 1 ? '' : 's'})</dt><dd class="num" style="margin:0">${inr(t.mrp)}</dd></div>
        <div class="row"><dt>Discount</dt><dd class="num" style="margin:0;color:var(--good)">− ${inr(t.discount)}</dd></div>
        ${t.couponOff ? `<div class="row"><dt>Coupon ${esc(state.coupon)}</dt><dd class="num" style="margin:0;color:var(--good)">− ${inr(t.couponOff)}</dd></div>` : ''}
        <div class="row"><dt>Delivery charges</dt><dd class="num" style="margin:0">${t.delivery ? inr(t.delivery) : '<span style="color:var(--good)">Free</span>'}</dd></div>
        <div class="row total"><dt>Total amount</dt><dd class="num" style="margin:0">${inr(t.total)}</dd></div>
      </dl>
      <p class="saving">You will save ${inr(t.discount + t.couponOff)} on this order</p>
      ${withCoupon ? `<form class="coupon" id="couponForm"><input id="couponIn" placeholder="Coupon code" value="${esc(state.coupon)}" aria-label="Coupon code"><button class="btn" type="submit">Apply</button></form><p class="muted sm" id="couponMsg">Try WELCOME10</p>` : ''}
    </aside>`;
  }

  function wireCart() {
    app.querySelectorAll('[data-inc]').forEach((b) => { b.onclick = () => { setQty(b.dataset.inc, (state.cart[b.dataset.inc] || 0) + 1); cartView(); }; });
    app.querySelectorAll('[data-dec]').forEach((b) => { b.onclick = () => { setQty(b.dataset.dec, (state.cart[b.dataset.dec] || 0) - 1); cartView(); }; });
    app.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { setQty(b.dataset.rm, 0); cartView(); }; });
    const cf = $('couponForm');
    if (cf) cf.onsubmit = (e) => {
      e.preventDefault();
      const code = $('couponIn').value.trim().toUpperCase();
      if (!code) { state.coupon = ''; save(); return cartView(); }
      if (!CONFIG.coupons[code]) { $('couponMsg').textContent = 'That coupon code is not valid.'; $('couponMsg').style.color = 'var(--bad)'; return; }
      state.coupon = code; save(); toast('Coupon applied'); cartView();
    };
  }

  function checkout() {
    const t = totals();
    if (!t.items.length) { location.hash = '#cart'; return; }
    app.innerHTML = `<h1>Checkout</h1>
      <form class="split" id="coForm">
        <div>
          <section class="panel" style="margin-bottom:16px"><h2>Delivery address</h2>
            <div class="form2">
              <label><span>Full name</span><input id="coName" required maxlength="50" autocomplete="name"></label>
              <label><span>Mobile number</span><input id="coPhone" required pattern="[6-9][0-9]{9}" maxlength="10" inputmode="numeric" autocomplete="tel-national"></label>
              <label><span>Pincode</span><input id="coPin" required pattern="[1-9][0-9]{5}" maxlength="6" inputmode="numeric" autocomplete="postal-code"></label>
              <label><span>City</span><input id="coCity" required maxlength="40" autocomplete="address-level2"></label>
              <label class="full"><span>Address</span><textarea id="coAddr" rows="2" required maxlength="160" autocomplete="street-address"></textarea></label>
            </div>
          </section>
          <section class="panel"><h2>Payment (simulated)</h2>
            <label class="pay-opt"><input type="radio" name="pay" value="UPI" checked> UPI</label>
            <label class="pay-opt"><input type="radio" name="pay" value="Card"> Credit / Debit card</label>
            <label class="pay-opt"><input type="radio" name="pay" value="Cash on delivery"> Cash on delivery</label>
            <p class="muted sm">No real payment is taken. Do not enter real card details.</p>
          </section>
        </div>
        ${summary(t, false).replace('<aside', '<aside').replace('</aside>', '<button class="btn buy big" type="submit" style="width:100%">Confirm order · ' + inr(t.total) + '</button></aside>')}
      </form>`;
    $('coForm').onsubmit = (e) => {
      e.preventDefault();
      const order = {
        id: 'OD' + Date.now().toString().slice(-9),
        at: Date.now(),
        items: t.items.map(({ p, qty }) => ({ id: p.id, name: p.name, emoji: p.emoji, qty, price: p.price })),
        total: t.total,
        pay: app.querySelector('input[name=pay]:checked').value,
        to: `${$('coName').value.trim()}, ${$('coCity').value.trim()} ${$('coPin').value}`,
      };
      state.orders.unshift(order);
      state.cart = {}; state.coupon = '';
      save(); updateBadges();
      lastOrder = order;
      location.hash = '#done';
    };
  }

  function done() {
    if (!lastOrder) { location.hash = '#orders'; return; }
    app.innerHTML = `<div class="panel success"><div class="tick">✓</div><h1>Order placed</h1>
      <p>Thank you, your order <b class="mono">${lastOrder.id}</b> is confirmed.</p>
      <p class="muted">${inr(lastOrder.total)} · ${esc(lastOrder.pay)} · arriving in 2 to 4 days</p>
      <p><a class="btn cart" href="#orders">View my orders</a> <a class="btn" href="#home">Continue shopping</a></p></div>`;
  }

  function orders() {
    app.innerHTML = `<h1>My orders</h1>` + (state.orders.length ? state.orders.map((o) => `
      <section class="panel order">
        <header><span><b class="mono">${o.id}</b> <span class="muted sm">· ${new Date(o.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></span><span class="status">Confirmed</span></header>
        ${o.items.map((i) => `<div>${i.emoji} ${esc(i.name)} <span class="muted">× ${i.qty}</span></div>`).join('')}
        <p class="muted sm" style="margin:8px 0 0">Deliver to ${esc(o.to)} · ${esc(o.pay)}</p>
        <p style="margin:4px 0 0"><b class="num">Total ${inr(o.total)}</b></p>
      </section>`).join('') : `<div class="panel empty"><div class="big-emoji">📦</div><h2>No orders yet</h2><a class="btn cart" href="#home">Start shopping</a></div>`);
  }

  function wishlist() {
    const items = state.wish.map(byId).filter(Boolean);
    app.innerHTML = `<h1>My wishlist (${items.length})</h1>` + (items.length
      ? `<div class="grid">${items.map(card).join('')}</div>`
      : `<div class="panel empty"><div class="big-emoji">♡</div><h2>Nothing saved yet</h2><p class="muted">Tap the heart on any product to save it here.</p><a class="btn cart" href="#home">Browse products</a></div>`);
  }

  function notFound() {
    app.innerHTML = `<div class="panel empty"><div class="big-emoji">🤔</div><h1>Page not found</h1><a class="btn cart" href="#home">Go home</a></div>`;
  }

  /* ---------- Actions ---------- */
  function setQty(id, qty) {
    if (qty <= 0) delete state.cart[id]; else state.cart[id] = Math.min(qty, 10);
    save(); updateBadges();
  }
  function addToCart(id) { setQty(id, (state.cart[id] || 0) + 1); }
  function toggleWish(id) {
    id = Number(id);
    const i = state.wish.indexOf(id);
    if (i >= 0) { state.wish.splice(i, 1); toast('Removed from wishlist'); } else { state.wish.push(id); toast('Added to wishlist'); }
    save(); updateBadges();
  }
  function updateBadges() {
    const c = cartQty(), w = state.wish.length;
    $('cartCount').textContent = c; $('cartCount').hidden = !c;
    $('wishCount').textContent = w; $('wishCount').hidden = !w;
  }

  /* ---------- Routing ---------- */
  function route() {
    const h = location.hash.slice(1) || 'home';
    document.querySelectorAll('.cat').forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + h)));
    if (h === 'home') listing(null);
    else if (h === 'search') listing(null);
    else if (h.startsWith('c-')) listing(h.slice(2));
    else if (h.startsWith('p-')) product(h.slice(2));
    else if (h === 'cart') cartView();
    else if (h === 'checkout') checkout();
    else if (h === 'done') done();
    else if (h === 'orders') orders();
    else if (h === 'wishlist') wishlist();
    else notFound();
    if (!h.startsWith('c-') && h !== 'home' && h !== 'search') window.scrollTo(0, 0);
  }

  // Wishlist hearts anywhere on the page.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wish]');
    if (!b) return;
    e.preventDefault();
    toggleWish(b.dataset.wish);
    route();
  });

  $('searchForm').onsubmit = (e) => {
    e.preventDefault();
    view.q = $('q').value;
    if (location.hash === '#search') route(); else location.hash = '#search';
  };

  $('catBar').innerHTML = `<a class="cat" href="#home">All</a>` + CATEGORIES.map((c) => `<a class="cat" href="#c-${c.id}">${c.icon} ${c.name}</a>`).join('');
  // Leaving search clears the query so category pages are not filtered by it.
  window.addEventListener('hashchange', () => { if (location.hash !== '#search') { view.q = ''; $('q').value = ''; } route(); });
  updateBadges();
  route();
})();
