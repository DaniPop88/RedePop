'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";
// Bisa override lewat <script> di HTML:
// <script>window.REDEPOP_MANIFEST_URL="https://cdn.jsdelivr.net/gh/DaniPop88/RedePop/manifest.json"</script>
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL || "https://cdn.jsdelivr.net/gh/DaniPop88/RedePop/manifest.json";

/* ========================================
   DOM: MODAL
======================================== */
const orderModal = document.getElementById('orderModal');
const orderModalCloseBtn = document.getElementById('orderModalCloseBtn');
const orderForm = document.getElementById('orderForm');
const orderSubmitBtn = document.getElementById('orderSubmitBtn');
const orderFormMessage = document.getElementById('orderFormMessage');

/* ========================================
   UTIL: UPDATE INFO MODAL
======================================== */
function updateOrderProductInfo(name, img, secret) {
  document.getElementById('orderProductName').textContent = name || '';
  document.getElementById('orderProductImg').src = img || '';
  document.getElementById('orderProductId').value = secret || '';
}

/* ========================================
   RENDER KATALOG DARI manifest.json
======================================== */
const catalog = document.getElementById('catalog');

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  return node;
}

function buildProductCard({ src, name, secret, isExtra }) {
  const card = el('div', `product-card${isExtra ? ' extra-product' : ''}`, { 'data-secret': secret });
  const img = el('img', 'product-img', { src, alt: name });
  const title = el('div', 'product-name', { text: name });
  card.appendChild(img);
  card.appendChild(title);
  if (isExtra) card.hidden = true;
  return card;
}

function buildTierSection(tier, baseUrl) {
  // <section class="reward-tier" data-tier="INVITE-1">
  const section = el('section', 'reward-tier', { 'data-tier': tier.id });

  // Header
  const header = el('div', 'tier-header', { text: tier.label || tier.id });
  section.appendChild(header);

  // Grid
  const grid = el('div', 'product-grid');
  section.appendChild(grid);

  // Items
  const showFirst = Number.isInteger(tier.showFirst) ? tier.showFirst : 3;
  const items = Array.isArray(tier.items) ? tier.items : [];

  items.forEach((item, idx) => {
    // item bisa {file, name} atau {url, name}
    const src = item.url ? item.url : (baseUrl + item.file);
    const name = item.name || (item.file || item.url || 'Produto');
    const isExtra = idx >= showFirst;
    const card = buildProductCard({ src, name, secret: tier.id, isExtra });
    grid.appendChild(card);
  });

  // Button Veja Mais (hanya kalau ada extra)
  if (items.length > showFirst) {
    const btn = el('button', 'veja-mais-btn', { 'data-tier': tier.id });
    btn.appendChild(el('span', 'btn-text', { text: 'VEJA MAIS' }));
    btn.appendChild(el('span', 'arrow-icon', { html: '&#9660;' }));
    section.appendChild(btn);
  }

  return section;
}

async function loadCatalog() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();

    // baseUrl opsional (fallback ke string kosong)
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];

    // bersihkan container
    catalog.innerHTML = '';

    // render tiap tier
    tiers.forEach(tier => {
      const section = buildTierSection(tier, baseUrl);
      catalog.appendChild(section);
    });
  } catch (err) {
    console.error('Gagal memuat manifest:', err);
    catalog.innerHTML = '<p style="color:red;text-align:center">Falha ao carregar catálogo. Tente novamente mais tarde.</p>';
  }
}

/* ========================================
   INTERAKSI: DELEGATION (CARD & VEJA MAIS)
======================================== */
// Klik product-card -> buka modal
document.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;

  const nameEl = card.querySelector('.product-name');
  const imgEl = card.querySelector('.product-img');
  const name = nameEl ? nameEl.textContent.trim() : '';
  const img = imgEl ? imgEl.src : '';
  const secret = card.getAttribute('data-secret') || '';

  updateOrderProductInfo(name, img, secret);
  orderModal.classList.add('active');
  orderSubmitBtn.disabled = true;
  orderFormMessage.textContent = '';
  orderForm.reset();
  isCPFValid = false; 
  isSecretCodeValid = false;
});

// Klik tombol VEJA MAIS -> toggle produk extra
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.veja-mais-btn');
  if (!btn) return;

  const tier = btn.getAttribute('data-tier');
  const section = document.querySelector(`section[data-tier="${tier}"]`);
  if (!section) return;

  const extraProducts = section.querySelectorAll('.extra-product');
  const expanded = btn.classList.toggle('expanded');

  const textSpan = btn.querySelector('.btn-text');
  const arrowSpan = btn.querySelector('.arrow-icon');
  if (textSpan && arrowSpan) {
    textSpan.textContent = expanded ? "VER MENOS" : "VEJA MAIS";
    arrowSpan.innerHTML = expanded ? '&#9650;' : '&#9660;';
  }
  extraProducts.forEach(p => p.hidden = !expanded);
});

// Tutup modal
orderModalCloseBtn.addEventListener('click', () => orderModal.classList.remove('active'));

/* ========================================
   CPF Validation
======================================== */
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g,'');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0, rest;
  
  // Validasi digit pertama (posisi 10)
  for (let i=1; i<=9; i++) sum += parseInt(cpf.substring(i-1,i)) * (11-i);
  rest = sum % 11;
  rest = (rest < 2) ? 0 : 11 - rest;
  if (rest !== parseInt(cpf.substring(9,10))) return false;
  
  // Validasi digit kedua (posisi 11)
  sum = 0;
  for (let i=1; i<=10; i++) sum += parseInt(cpf.substring(i-1,i)) * (12-i);
  rest = sum % 11;
  rest = (rest < 2) ? 0 : 11 - rest;
  if (rest !== parseInt(cpf.substring(10,11))) return false;
  
  return true;
}

let isCPFValid = false, isSecretCodeValid = false;
const cpfInput = document.getElementById('cpf');
cpfInput.addEventListener('blur', validateAndUpdateCPF);
cpfInput.addEventListener('input', validateAndUpdateCPF);
function validateAndUpdateCPF() {
  if (!validateCPF(this.value)) {
    isCPFValid = false;
    orderFormMessage.textContent = 'CPF inválido!';
    orderFormMessage.style.color = 'red';
  } else {
    isCPFValid = true;
    if (orderFormMessage.textContent === 'CPF inválido!') {
      orderFormMessage.textContent = '';
      orderFormMessage.style.color = '';
    }
  }
  updateOrderSubmitBtn();
}

/* ========================================
   Secret Code Validation
======================================== */
document.getElementById('secretCode').addEventListener('input', async function () {
  const secretCode = this.value.trim();
  const productId = document.getElementById('orderProductId').value;
  if (secretCode.length > 4 && productId) {
    try {
      const res = await fetch(`${BACKEND_URL}/validate?product_id=${encodeURIComponent(productId)}&secret_code=${encodeURIComponent(secretCode)}`);
      const result = await res.json();
      if (result.status === "valid") {
        isSecretCodeValid = true;
        orderFormMessage.textContent = 'Código válido! Você pode enviar.';
        orderFormMessage.style.color = 'green';
      } else {
        isSecretCodeValid = false;
        orderFormMessage.textContent = 'Código inválido ou já utilizado!';
        orderFormMessage.style.color = 'red';
      }
    } catch (err) {
      isSecretCodeValid = false;
      orderFormMessage.textContent = 'Erro ao validar código!';
      orderFormMessage.style.color = 'red';
    }
  } else {
    isSecretCodeValid = false;
    orderFormMessage.textContent = '';
  }
  updateOrderSubmitBtn();
});

function updateOrderSubmitBtn() {
  orderSubmitBtn.disabled = !(isCPFValid && isSecretCodeValid);
}

/* ========================================
   Submit Order
======================================== */
orderForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  orderSubmitBtn.disabled = true;
  orderFormMessage.textContent = 'Enviando...';

  const productName = document.getElementById('orderProductName').textContent.trim();
  const productImg = document.getElementById('orderProductImg').src;
  if (!productName) {
    orderFormMessage.textContent = "Erro: Produto não detectado.";
    orderFormMessage.style.color = "red";
    orderSubmitBtn.disabled = false;
    return;
  }

  const data = {
    productId: document.getElementById('orderProductId').value,
    productName,
    productImg,
    fullName: document.getElementById('fullName').value,
    cpf: document.getElementById('cpf').value,
    phone: document.getElementById('phone').value,
    gameId: document.getElementById('gameId').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    secretCode: document.getElementById('secretCode').value
  };

  try {
    const res = await fetch(`${BACKEND_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.status === "success" || result.success) {
      orderFormMessage.textContent = 'Pedido enviado com sucesso!';
      orderFormMessage.style.color = 'green';
      setTimeout(() => orderModal.classList.remove('active'), 2000);
    } else {
      orderFormMessage.textContent = result.message || 'Falha ao enviar!';
      orderFormMessage.style.color = 'red';
    }
  } catch (err) {
    orderFormMessage.textContent = 'Erro ao enviar pedido!';
    orderFormMessage.style.color = 'red';
  }
});

/* ========================================
   BOOTSTRAP: MULAIKAN
======================================== */
document.addEventListener('DOMContentLoaded', loadCatalog);
