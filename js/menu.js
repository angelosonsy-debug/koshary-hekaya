const MENU_FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#1b1b21"/>
      <stop offset="100%" stop-color="#111114"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <circle cx="400" cy="270" r="110" fill="#d4a017" opacity=".12"/>
  <text x="50%" y="52%" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="#f5f5f2">Koshary Hekaya</text>
</svg>
`);

const BRANCH_STORAGE_KEY = "hekaya-selected-branch";

const branchNameEl = document.getElementById("currentBranchName");
const popup = document.getElementById("branch-popup");
const confirmBtn = document.getElementById("confirm-branch");
const cancelBtn = document.getElementById("cancel-branch");

let pendingBranch = null;

function getMenuData() {
  return window.menuData || [];
}

function loadCart() {
  const saved = localStorage.getItem("hekaya-cart");
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("hekaya-cart", JSON.stringify(state.cart));
}

function getInitialBranch() {
  const saved = localStorage.getItem(BRANCH_STORAGE_KEY);
  if (saved) return saved;

  const firstBranchBtn = document.querySelector(".branch-btn[data-branch]");
  return firstBranchBtn?.dataset.branch || "";
}

function saveBranch(branch) {
  state.branch = String(branch);
  localStorage.setItem(BRANCH_STORAGE_KEY, state.branch);
  window.selectedBranch = state.branch;
}

const state = {
  branch: getInitialBranch(),
  category: "all",
  cart: loadCart()
};

const menuGrid = document.getElementById("menu-grid");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");
const branchButtons = document.querySelectorAll(".branch-btn[data-branch]");
const filterButtons = document.querySelectorAll(".filter-btn[data-category]");
const revealItems = document.querySelectorAll(".reveal");

function money(n) {
  return `${Number(n || 0)} EGP`;
}

function getCategoryLabel(category) {
  switch (category) {
    case "offers":
      return "عروض";
    case "koshary":
      return "كشري";
    case "tawagen":
      return "طواجن";
    case "mix":
      return "مكسات";
    case "additions":
      return "إضافات";
    case "desserts":
      return "الحلو";
    case "drinks":
      return "مشروبات";
    default:
      return "";
  }
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

function updateBranchLabel() {
  if (!branchNameEl) return;
  branchNameEl.textContent = getBranchLabel(state.branch);
}

function renderBranchButtons() {
  branchButtons.forEach((btn) => {
    const isActive = String(btn.dataset.branch) === String(state.branch);
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

function renderCart() {
  const data = getMenuData();

  const items = Object.entries(state.cart)
    .map(([id, entry]) => {
      const item = data.find((x) => String(x.id) === String(id));
      if (!item) return null;
      return { ...item, qty: entry.qty || 1 };
    })
    .filter(Boolean);

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  cartCountEl.textContent = totalCount;
  cartTotalEl.textContent = money(totalPrice);

  if (!items.length) {
    cartItemsEl.innerHTML = `<div class="card empty-state">السلة فاضية حالياً.</div>`;
    return;
  }

  cartItemsEl.innerHTML = items
    .map(
      (item) => `
    <article class="cart-item">
      <div class="cart-item-media">
        <img src="${item.img || MENU_FALLBACK_IMAGE}" alt="${item.name}" loading="lazy" decoding="async">
      </div>

      <div>
        <h4>${item.name}</h4>
        <div class="cart-meta">${item.qty} × ${money(item.price)} = ${money(item.qty * item.price)}</div>
      </div>

      <div class="cart-actions">
        <button class="mini-btn minus-cart" data-id="${item.id}" type="button">-</button>
        <button class="mini-btn plus-cart" data-id="${item.id}" type="button">+</button>
        <button class="mini-btn remove-cart" data-id="${item.id}" type="button">×</button>
      </div>
    </article>
  `
    )
    .join("");
}

function getFilteredMenu() {
  const data = getMenuData();

  let items = data;

  if (state.branch) {
    items = items.filter((item) => {
      if (!item.branch) return true;
      return String(item.branch) === String(state.branch);
    });
  }

  if (state.category !== "all") {
    items = items.filter((item) => item.category === state.category);
  }

  return items;
}

function renderMenu() {
  const items = getFilteredMenu();

  menuGrid.innerHTML = items
    .map((item, index) => {
      const qty = state.cart[item.id]?.qty || 1;
      const lazyAttr = index === 0 ? "" : 'loading="lazy"';

      return `
      <article class="menu-card card" data-id="${item.id}">
        <div class="menu-media loading">
          <img
            class="menu-img"
            src="${item.img || MENU_FALLBACK_IMAGE}"
            alt="${item.name}"
            ${lazyAttr}
            decoding="async"
          >
        </div>

        <div class="menu-content">
          <div class="menu-top">
            <div>
              <span class="category-pill">${getCategoryLabel(item.category)}</span>
              <h3>${item.name}</h3>
            </div>
            <span class="price">${money(item.price)}</span>
          </div>

          <div class="quantity-control">
            <button class="quantity-btn decrease" type="button">-</button>
            <input class="quantity-input" type="text" value="${qty}" readonly>
            <button class="quantity-btn increase" type="button">+</button>
          </div>

          <button class="add-to-cart" type="button" data-id="${item.id}">
            أضف للسلة
          </button>
        </div>
      </article>
    `;
    })
    .join("");

  if (!items.length) {
    menuGrid.innerHTML = `
      <div class="card empty-state" style="grid-column:1/-1;">
        لا توجد أصناف في هذا القسم حالياً.
      </div>
    `;
  }

  hydrateMenuImages();
}

function hydrateMenuImages() {
  const wrappers = document.querySelectorAll(".menu-media");

  wrappers.forEach((wrap) => {
    const img = wrap.querySelector(".menu-img");
    if (!img) return;

    const markLoaded = () => {
      wrap.classList.add("loaded");
      wrap.classList.remove("loading");
    };

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
      return;
    }

    img.addEventListener("load", markLoaded, { once: true });
    img.addEventListener(
      "error",
      () => {
        img.src = MENU_FALLBACK_IMAGE;
        markLoaded();
      },
      { once: true }
    );
  });
}

function increaseCart(id, amount = 1) {
  if (!state.cart[id]) state.cart[id] = { qty: 0 };
  state.cart[id].qty += amount;

  if (state.cart[id].qty < 1) {
    delete state.cart[id];
  }

  saveCart();
  renderMenu();
  renderCart();
}

function setCartQty(id, qty) {
  if (qty < 1) {
    delete state.cart[id];
  } else {
    state.cart[id] = { qty };
  }

  saveCart();
  renderMenu();
  renderCart();
}

function clearCart() {
  state.cart = {};
  localStorage.removeItem("hekaya-cart");
  renderCart();
  renderMenu();
}

function closePopup() {
  if (!popup) return;
  popup.classList.remove("active");
  pendingBranch = null;
}

function openPopup(nextBranch) {
  if (!popup) {
    const ok = confirm("لو غيرت الفرع السلة هتبقى فاضية. هل تريد المتابعة؟");
    if (!ok) return false;
    clearCart();
    saveBranch(nextBranch);
    renderBranchButtons();
    updateBranchLabel();
    renderMenu();
    renderCart();
    revealOnScroll();
    return true;
  }

  pendingBranch = String(nextBranch);
  popup.classList.add("active");
  return true;
}

function setBranch(branch) {
  const nextBranch = String(branch);

  if (nextBranch === String(state.branch)) {
    updateBranchLabel();
    return;
  }

  const hasItems = Object.keys(state.cart).length > 0;

  if (hasItems) {
    openPopup(nextBranch);
    return;
  }

  saveBranch(nextBranch);
  renderBranchButtons();
  updateBranchLabel();
  renderMenu();
  renderCart();
  revealOnScroll();
}

menuGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".menu-card");
  if (!card) return;

  const id = Number(card.dataset.id);
  const input = card.querySelector(".quantity-input");
  let qty = parseInt(input.value, 10) || 1;

  if (e.target.closest(".increase")) {
    qty += 1;
    input.value = qty;
    return;
  }

  if (e.target.closest(".decrease")) {
    qty = Math.max(1, qty - 1);
    input.value = qty;
    return;
  }

  if (e.target.closest(".add-to-cart")) {
    setCartQty(id, qty);
  }
});

cartItemsEl.addEventListener("click", (e) => {
  const plus = e.target.closest(".plus-cart");
  const minus = e.target.closest(".minus-cart");
  const remove = e.target.closest(".remove-cart");

  if (plus) {
    increaseCart(Number(plus.dataset.id), 1);
  }

  if (minus) {
    const id = Number(minus.dataset.id);
    const current = state.cart[id]?.qty || 0;
    setCartQty(id, current - 1);
  }

  if (remove) {
    const id = Number(remove.dataset.id);
    delete state.cart[id];
    saveCart();
    renderMenu();
    renderCart();
  }
});

branchButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setBranch(btn.dataset.branch);
  });
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    state.category = btn.dataset.category;
    renderMenu();
    revealOnScroll();
  });
});

if (confirmBtn) {
  confirmBtn.addEventListener("click", () => {
    if (!pendingBranch) {
      closePopup();
      return;
    }

    clearCart();
    saveBranch(pendingBranch);
    renderBranchButtons();
    updateBranchLabel();
    renderMenu();
    renderCart();
    revealOnScroll();
    closePopup();
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    closePopup();
  });
}

if (popup) {
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });
}

function revealOnScroll() {
  const trigger = window.innerHeight - 120;
  revealItems.forEach((item) => {
    const top = item.getBoundingClientRect().top;
    if (top < trigger) item.classList.add("active");
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", () => {
  if (!localStorage.getItem(BRANCH_STORAGE_KEY) && state.branch) {
    saveBranch(state.branch);
  }

  renderBranchButtons();
  updateBranchLabel();
  renderMenu();
  renderCart();
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
window.selectedBranch = state.branch;