(() => {
  const checkoutForm = document.getElementById("checkoutForm");
  const summaryItems = document.getElementById("summaryItems");
  const subtotalEl = document.getElementById("subtotal");
  const deliveryFeeEl = document.getElementById("deliveryFee");
  const totalEl = document.getElementById("total");
  const etaTextEl = document.getElementById("etaText");
  const branchSelect = document.getElementById("branch");
  const areaSelect = document.getElementById("area");
  const deliveryHint = document.getElementById("deliveryHint");
  const revealItems = document.querySelectorAll(".reveal");

  if (
    !checkoutForm ||
    !summaryItems ||
    !subtotalEl ||
    !deliveryFeeEl ||
    !totalEl ||
    !etaTextEl ||
    !branchSelect ||
    !areaSelect
  ) {
    console.log("checkout.js: not on checkout page, script halted.");
    return;
  }

  const BRANCH_STORAGE_KEY = "hekaya-selected-branch";

  function loadCart() {
    const saved = localStorage.getItem("hekaya-cart");
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  }

  function getCartItems() {
    const cartObject = loadCart();

    return Object.entries(cartObject)
      .map(([id, data]) => {
        const item = window.menuData?.find((x) => String(x.id) === String(id));
        if (!item) return null;
        return { ...item, qty: data.qty || 1 };
      })
      .filter(Boolean);
  }

  function money(n) {
    return `${Number(n || 0)} EGP`;
  }

  function calcEta(totalQty) {
    const prepMinutes = 10;
    const deliveryMinutes = Math.min(25, 10 + totalQty * 2);
    const min = prepMinutes + deliveryMinutes;
    return { min, max: min + 10 };
  }

  function generateOrderNumber() {
    return `HK-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  function getZones(branch) {
    return window.deliveryZones?.[branch] || {};
  }

  function buildAreaOptions(branch) {
    const zones = getZones(branch);
    const list = [];

    Object.entries(zones).forEach(([fee, names]) => {
      names.forEach((name) => {
        list.push({
          name,
          fee: Number(fee),
          value: `${name}__${fee}`,
        });
      });
    });

    return list;
  }

  function parseArea(val) {
    if (!val) return null;
    const [name, fee] = String(val).split("__");
    if (!name || !fee) return null;
    return { name, fee: Number(fee) };
  }

  function getBranchLabel(branch) {
    switch (String(branch)) {
      case "5":
        return "فرع أسيوط";
      case "4":
        return "فرع القوصية";
      default:
        return "—";
    }
  }

  function getSelectedBranch() {
    return localStorage.getItem(BRANCH_STORAGE_KEY) || branchSelect.value || "";
  }

  function getDeliveryFee() {
    const zone = parseArea(areaSelect.value);
    return zone ? zone.fee : 0;
  }

  function populateAreas(branch, selectedAreaValue = "") {
    areaSelect.innerHTML = "";

    if (!branch) {
      areaSelect.disabled = true;
      areaSelect.innerHTML = `<option value="">اختار الفرع الأول</option>`;
      if (deliveryHint) {
        deliveryHint.textContent = "اختار الفرع الأول علشان تظهر المناطق المتاحة.";
      }
      return;
    }

    areaSelect.disabled = false;

    const def = document.createElement("option");
    def.textContent = "اختار المنطقة";
    def.value = "";
    areaSelect.appendChild(def);

    buildAreaOptions(branch).forEach((z) => {
      const opt = document.createElement("option");
      opt.value = z.value;
      opt.textContent = `${z.name} - ${z.fee} جنيه`;
      areaSelect.appendChild(opt);
    });

    if (selectedAreaValue) {
      areaSelect.value = selectedAreaValue;
    }

    if (deliveryHint) {
      deliveryHint.textContent = "اختار المنطقة علشان نحسب رسوم التوصيل تلقائيًا.";
    }
  }

  function renderSummary() {
    const items = getCartItems();

    if (!items.length) {
      summaryItems.innerHTML = `<div class="card inner-card" style="text-align:center; padding: 20px;">السلة فاضية. ارجع للمنيو واختار الأصناف الأول.</div>`;
      subtotalEl.textContent = money(0);
      deliveryFeeEl.textContent = money(0);
      totalEl.textContent = money(0);
      etaTextEl.textContent = "—";
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const qty = items.reduce((sum, item) => sum + item.qty, 0);
    const deliveryFee = getDeliveryFee();
    const total = subtotal + deliveryFee;
    const eta = calcEta(qty);

    summaryItems.innerHTML = items
      .map(
        (item) => `
      <article class="summary-item">
        <img src="${item.img || ""}" alt="${item.name}" loading="lazy" decoding="async">
        <div>
          <h4>${item.name}</h4>
          <p>${item.qty} × ${money(item.price)}</p>
        </div>
        <strong>${money(item.qty * item.price)}</strong>
      </article>
    `
      )
      .join("");

    subtotalEl.textContent = money(subtotal);
    deliveryFeeEl.textContent = money(deliveryFee);
    totalEl.textContent = money(total);
    etaTextEl.textContent = `من ${eta.min} إلى ${eta.max} دقيقة`;
  }

  branchSelect.addEventListener("change", () => {
    if (branchSelect.disabled) return;
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    populateAreas(branchSelect.value);
    renderSummary();
  });

  areaSelect.addEventListener("change", () => {
    const zone = parseArea(areaSelect.value);

    if (zone) {
      deliveryHint.textContent = `رسوم التوصيل: ${zone.fee} جنيه`;
    }

    renderSummary();
  });

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(checkoutForm);
    const items = getCartItems();

    if (!items.length) {
      alert("السلة فاضية");
      return;
    }

    const branch = getSelectedBranch();
    if (!branch) {
      alert("اختار الفرع");
      return;
    }

    const zone = parseArea(formData.get("area"));
    if (!zone) {
      alert("اختار المنطقة");
      return;
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const qty = items.reduce((s, i) => s + i.qty, 0);
    const delivery = zone.fee;
    const total = subtotal + delivery;
    const eta = calcEta(qty);

    const payload = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      branch,
      branchLabel: getBranchLabel(branch),
      area: zone.name,
      deliveryFee: delivery,
      paymentMethod: formData.get("paymentMethod"),
      cart: items,
      subtotal,
      total,
      etaLabel: `من ${eta.min} إلى ${eta.max} دقيقة`,
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      orderPlacedAt: Date.now(),
    };

    localStorage.setItem("hekaya-checkout", JSON.stringify(payload));
    localStorage.removeItem("hekaya-cart");

    window.location.href =
      payload.paymentMethod === "vodafone" ? "payment.html" : "success.html";
  });

  function revealOnScroll() {
    const trigger = window.innerHeight - 120;
    revealItems.forEach((el) => {
      if (el.getBoundingClientRect().top < trigger) {
        el.classList.add("active");
      }
    });
  }

  window.addEventListener("load", () => {
    const savedBranch = localStorage.getItem(BRANCH_STORAGE_KEY);
    const checkoutSaved = JSON.parse(localStorage.getItem("hekaya-checkout") || "{}");

    const branch =
      savedBranch ||
      checkoutSaved.branch ||
      branchSelect.value ||
      "";

    if (branch) {
      branchSelect.value = branch;
      if (savedBranch) {
        branchSelect.disabled = true;
        if (deliveryHint) {
          deliveryHint.textContent = `الفرع ثابت من المنيو: ${getBranchLabel(branch)}`;
        }
      }
    }

    const currentAreaValue =
      checkoutSaved.area && checkoutSaved.deliveryFee
        ? `${checkoutSaved.area}__${checkoutSaved.deliveryFee}`
        : "";

    populateAreas(branch, currentAreaValue);
    renderSummary();
    revealOnScroll();
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
  window.addEventListener("scroll", revealOnScroll);
})();