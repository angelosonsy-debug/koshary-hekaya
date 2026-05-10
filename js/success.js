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

  const EMAILJS_SERVICE_ID = 'service_hegpf09';
  const EMAILJS_TEMPLATE_ID = 'template_nl536eh';
  const EMAILJS_PUBLIC_KEY = '-oXpizJj1WzSIenoa';

  const orderNumberKey = 'hekaya-order-number';
  const emailSentKey = () => `hekaya-email-sent-${generateOrderNumber()}`;

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

    const cached = localStorage.getItem(orderNumberKey);
    if (cached) return cached;

    const number = `HK-${Math.floor(100000 + Math.random() * 900000)}`;
    localStorage.setItem(orderNumberKey, number);
    return number;
  }

  function getBranchLabel() {
    return (
      checkoutData.branchLabel ||
      (checkoutData.branch === '4'
        ? 'فرع القوصية'
        : checkoutData.branch === '5'
          ? 'فرع أسيوط'
          : '—')
    );
  }

  function getAreaLabel() {
    return checkoutData.area || '—';
  }

  function getPaymentLabel() {
    if (checkoutData.paymentMethod === 'cash') return 'نقدي عند الاستلام';
    if (checkoutData.paymentMethod === 'vodafone') return 'فودافون كاش';
    return '—';
  }

  function getPaymentStateLabel() {
    if (checkoutData.paymentMethod === 'cash') return 'جاهز للتجهيز';
    if (checkoutData.paymentMethod === 'vodafone') {
      return paymentData.transactionId ? 'تم تأكيد الدفع' : 'في انتظار تأكيد الدفع';
    }
    return '—';
  }

  function buildItemsText(items) {
    return items
      .map((item) => `- ${item.name} × ${item.qty}`)
      .join('\n');
  }

  async function sendOrderEmail() {
    const orderNumber = generateOrderNumber();
    const items = getCartItems();
    const subtotal =
      typeof checkoutData.subtotal === 'number'
        ? checkoutData.subtotal
        : items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const deliveryFee =
      typeof checkoutData.deliveryFee === 'number'
        ? checkoutData.deliveryFee
        : (subtotal >= 150 ? 0 : 15);

    const total =
      typeof checkoutData.total === 'number'
        ? checkoutData.total
        : subtotal + deliveryFee;

    const paymentState = getPaymentStateLabel();
    const itemsText = buildItemsText(items);

    const sentKey = `hekaya-email-sent-${orderNumber}`;
    if (localStorage.getItem(sentKey) === '1') return;

    if (!window.emailjs) return;

    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

    const templateParams = {
      order_number: orderNumber,
      customer_name: checkoutData.fullName || '—',
      customer_phone: checkoutData.phone || '—',
      customer_address: checkoutData.address || '—',
      branch: getBranchLabel(),
      area: getAreaLabel(),
      payment_method: getPaymentLabel(),
      payment_state: paymentState,
      transaction_id: paymentData.transactionId || '—',
      payer_phone: paymentData.payerPhone || '—',
      delivery_fee: money(deliveryFee),
      subtotal: money(subtotal),
      total: money(total),
      eta_label: checkoutData.etaLabel || '—',
      items: itemsText,
      notes: checkoutData.notes || '—',
      landmark: checkoutData.landmark || '—',
      created_at: checkoutData.createdAt || new Date().toISOString()
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      localStorage.setItem(sentKey, '1');
    } catch (error) {
      console.error('EmailJS send failed:', error);
    }
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
            <strong>${getBranchLabel()}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px;">
            <span style="color: var(--text-muted);">المنطقة</span>
            <strong>${getAreaLabel()}</strong>
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
    customerBranchEl.textContent = getBranchLabel();

    paymentMethodEl.textContent = getPaymentLabel();

    if (orderStatusEl) {
      orderStatusEl.textContent = getPaymentStateLabel();
    }
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
      if (orderStatusEl) orderStatusEl.textContent = 'في الطريق';
    } else if (remainingMs <= 20 * 60 * 1000) {
      if (orderStatusEl) orderStatusEl.textContent = 'في الطريق';
    } else {
      if (orderStatusEl) orderStatusEl.textContent = 'جاري التجهيز';
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

  window.addEventListener('load', async () => {
    orderNumberEl.textContent = generateOrderNumber();
    renderSummary();
    setCustomerInfo();
    handleReveal();

    if (checkoutData.cart) {
      localStorage.removeItem('hekaya-cart');
    }

    await sendOrderEmail();
  });

  window.addEventListener('scroll', () => {
    revealItems.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight - 120) {
        el.classList.add('active');
      }
    });
  });

  const devName = document.getElementById('developer-name');
  if (devName) {
    devName.addEventListener('click', function (e) {
      const heartCount = 15;
      for (let i = 0; i < heartCount; i++) {
        createHeart(e.clientX, e.clientY);
      }
    });
  }

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
