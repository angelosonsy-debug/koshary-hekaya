(() => {
  const checkoutData = JSON.parse(localStorage.getItem('hekaya-checkout') || '{}');
  const paymentData = JSON.parse(localStorage.getItem('hekaya-payment') || '{}');

  const summaryItems = document.getElementById('summaryItems');
  const totalEl = document.getElementById('total');
  const paymentForm = document.getElementById('paymentForm');
  const copyWalletBtn = document.getElementById('copyWalletBtn');
  const revealItems = document.querySelectorAll('.reveal');

  if (!summaryItems || !totalEl) return;

  function money(n) {
    return `${Number(n || 0)} EGP`;
  }

  function getCartItems() {
    const cart = checkoutData.cart || [];
    return Array.isArray(cart) ? cart : [];
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
      totalEl.textContent = money(0);
      return;
    }

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

    totalEl.textContent = money(total);
  }

  copyWalletBtn?.addEventListener('click', async () => {
    const walletSpan = document.querySelector('.wallet-number span');
  const wallet = walletSpan ? walletSpan.innerText.trim() : '01030932362';

    try {
      await navigator.clipboard.writeText(wallet);
      copyWalletBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ';
      setTimeout(() => {
        copyWalletBtn.innerHTML = '<i class="fa-regular fa-copy"></i> نسخ الرقم';
      }, 1800);
    } catch {
      alert(`انسخ الرقم يدويًا: ${wallet}`);
    }
  });

  paymentForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const transactionId = document.getElementById('transactionId')?.value.trim();
    const payerPhone = document.getElementById('payerPhone')?.value.trim();
    const paymentNote = document.getElementById('paymentNote')?.value.trim() || '';

    if (!transactionId || !payerPhone) {
      alert('املأ رقم العملية ورقم الموبايل الأول.');
      return;
    }

    const paymentPayload = {
      method: 'vodafone',
      transactionId,
      payerPhone,
      paymentNote,
      orderNumber: checkoutData.orderNumber || paymentData.orderNumber || '',
      confirmedAt: new Date().toISOString()
    };

    localStorage.setItem('hekaya-payment', JSON.stringify(paymentPayload));
    window.location.href = 'success.html';
  });

  function revealOnScroll() {
    const trigger = window.innerHeight - 120;
    revealItems.forEach(item => {
      if (item.getBoundingClientRect().top < trigger) {
        item.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll);
  window.addEventListener('load', () => {
    renderSummary();
    revealOnScroll();
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
  });
})();