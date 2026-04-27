(() => {
  const checkoutData = JSON.parse(localStorage.getItem('hekaya-checkout') || '{}');
  const paymentData = JSON.parse(localStorage.getItem('hekaya-payment') || '{}');

  const summaryItems = document.getElementById('summaryItems');
  const orderNumberEl = document.getElementById('orderNumber');
  const orderStatusEl = document.getElementById('orderStatus');
  const etaTextEl = document.getElementById('etaText');
  const customerNameEl = document.getElementById('customerName');
  const customerPhoneEl = document.getElementById('customerPhone');
  const customerBranchEl = document.getElementById('customerBranch');
  const paymentMethodEl = document.getElementById('paymentMethod');

  const countdownEl = document.getElementById('countdown');
  const countdownNoteEl = document.getElementById('countdownNote');
  const progressFillEl = document.getElementById('progressFill');

  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');

  const revealItems = document.querySelectorAll('.reveal');

  if (!summaryItems || !orderNumberEl || !countdownEl) return;

  function money(n) {
    return `${Number(n || 0)} EGP`;
  }

  function getCartItems() {
    const cart = checkoutData.cart || [];
    return Array.isArray(cart) ? cart : [];
  }

  function calcEta(totalQty) {
    const prepMinutes = 10;
    const bufferMinutes = 5;
    const deliveryMinutes = Math.min(25, 10 + totalQty * 2);
    const min = prepMinutes + bufferMinutes + deliveryMinutes;
    const max = min + 10;
    return { min, max };
  }

  function generateOrderNumber() {
    if (checkoutData.orderNumber) return checkoutData.orderNumber;
    if (paymentData.orderNumber) return paymentData.orderNumber;
    return `HK-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  function renderSummary() {
    const items = getCartItems();

    const subtotal = typeof checkoutData.subtotal === 'number'
      ? checkoutData.subtotal
      : items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const deliveryFee = typeof checkoutData.deliveryFee === 'number'
      ? checkoutData.deliveryFee
      : (subtotal >= 150 ? 0 : 15);

    const total = typeof checkoutData.total === 'number'
      ? checkoutData.total
      : subtotal + deliveryFee;

    const branchLabel =
      checkoutData.branchLabel ||
      (checkoutData.branch === '4' ? 'فرع القوصية' :
       checkoutData.branch === '5' ? 'فرع أسيوط' : '—');

    const areaLabel = checkoutData.area || '—';

    if (!items.length) {
      summaryItems.innerHTML = `
        <div class="card inner-card" style="text-align:center;">
          مفيش عناصر في الطلب الحالي.
        </div>
      `;
      etaTextEl.textContent = '—';
      countdownEl.textContent = '--:--';
      countdownNoteEl.textContent = 'مفيش طلب نحسب عليه دلوقتي';
      return;
    }

    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const eta = calcEta(totalQty);

    summaryItems.innerHTML = `
      <div class="card inner-card" style="margin-bottom:12px;">
        <div style="display:grid; gap:8px;">
          <div style="display:flex; justify-content:space-between; gap:12px;">
            <span style="color: var(--text-muted);">الفرع</span>
            <strong>${branchLabel}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px;">
            <span style="color: var(--text-muted);">المنطقة</span>
            <strong>${areaLabel}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px;">
            <span style="color: var(--text-muted);">رسوم التوصيل</span>
            <strong>${money(deliveryFee)}</strong>
          </div>
        </div>
      </div>

      ${items.map(item => `
        <article class="summary-item">
          <img src="${item.img || ''}" alt="${item.name}" loading="lazy" decoding="async">
          <div>
            <h4>${item.name}</h4>
            <p>${item.qty} × ${money(item.price)}</p>
          </div>
          <strong>${money(item.qty * item.price)}</strong>
        </article>
      `).join('')}
    `;

    etaTextEl.textContent = checkoutData.etaLabel || `حوالي ${eta.min}-${eta.max} دقيقة`;
    startCountdown(checkoutData.etaMinutes || eta.min);
  }

  function setCustomerInfo() {
    customerNameEl.textContent = checkoutData.fullName || '—';
    customerPhoneEl.textContent = checkoutData.phone || '—';
    customerBranchEl.textContent =
      checkoutData.branchLabel ||
      (checkoutData.branch === '4' ? 'فرع القوصية' :
       checkoutData.branch === '5' ? 'فرع أسيوط' : '—');

    paymentMethodEl.textContent =
      checkoutData.paymentMethod === 'cash' ? 'نقدي عند الاستلام' :
      checkoutData.paymentMethod === 'vodafone' ? 'فودافون كاش' :
      '—';
  }

  function setTimelineState(remainingMs, totalMs) {
    step1?.classList.add('done');
    step2?.classList.add('active');

    if (remainingMs <= totalMs * 0.6) {
      step3?.classList.add('active');
      step2?.classList.add('done');
    }

    if (remainingMs <= totalMs * 0.2) {
      step4?.classList.add('active');
      step3?.classList.add('done');
    }

    if (remainingMs <= 0) {
      step2?.classList.add('done');
      step3?.classList.add('done');
      step4?.classList.add('active');
      orderStatusEl.textContent = 'في الطريق';
    } else if (remainingMs <= 20 * 60 * 1000) {
      orderStatusEl.textContent = 'في الطريق';
    } else {
      orderStatusEl.textContent = 'جاري التجهيز';
    }
  }

  function formatRemaining(ms) {
    if (ms <= 0) return 'وصل تقريبًا دلوقتي';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function startCountdown(etaMinutes) {
    const createdAt = checkoutData.orderPlacedAt || Date.now();
    const totalMs = Math.max(1, etaMinutes * 60 * 1000);
    const endTime = createdAt + totalMs;

    const tick = () => {
      const now = Date.now();
      const remaining = endTime - now;
      const elapsed = totalMs - Math.max(0, remaining);
      const progress = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

      countdownEl.textContent = formatRemaining(remaining);
      if (progressFillEl) progressFillEl.style.width = `${progress}%`;

      setTimelineState(remaining, totalMs);

      if (remaining <= 0) {
        countdownNoteEl.textContent = 'الطلب قرب يوصل جدًا 😄';
      } else {
        countdownNoteEl.textContent = 'الوقت المتبقي لتعبئة الكرش بنجاح';
      }
    };

    tick();
    setInterval(tick, 1000);
  }

  function handleReveal() {
    revealItems.forEach(el => el.classList.add('active'));
  }

  window.addEventListener('load', () => {
    orderNumberEl.textContent = generateOrderNumber();
    renderSummary();
    setCustomerInfo();
    handleReveal();
    localStorage.removeItem('hekaya-cart');
  });

  window.addEventListener('scroll', () => {
    revealItems.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight - 120) {
        el.classList.add('active');
      }
    });
  });
  const devName = document.getElementById('developer-name');

  devName.addEventListener('click', function(e) {
    
    const heartCount = 15; 

    for (let i = 0; i < heartCount; i++) {
      createHeart(e.clientX, e.clientY);
    }
  });



  function createHeart(clientX, clientY) {
    const heart = document.createElement('div');
    heart.classList.add('heart-particle');
    
    
    heart.innerText = '❤️'; 

    
    heart.style.left = clientX + 'px';
    heart.style.top = clientY + 'px';

    
    const size = Math.random() * 15 + 10;
    heart.style.fontSize = size + 'px';

    
    const randomX = (Math.random() - 0.5) * 100;
    heart.style.setProperty('--random-x', randomX + 'px');

    
    const duration = Math.random() * 0.4 + 0.8;
    heart.style.animationDuration = duration + 's';

    document.body.appendChild(heart);

    
    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }
})();