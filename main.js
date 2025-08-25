'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL = "https://cdn.jsdelivr.net/gh/DaniPop88/RedePop@7db6c484b9f0ccd52228bb343f8b1a4216c86233/manifest.json";

/* ========================================
   DOM: MODAL
======================================== */
const orderModal = document.getElementById('orderModal');
const orderModalCloseBtn = document.getElementById('orderModalCloseBtn');
const orderForm = document.getElementById('orderForm');
const orderSubmitBtn = document.getElementById('orderSubmitBtn');
const orderFormMessage = document.getElementById('orderFormMessage');

/* ========================================
   UTIL
======================================== */
function updateOrderProductInfo(name, img, secret) {
  document.getElementById('orderProductName').textContent = name || '';
  document.getElementById('orderProductImg').src = img || '';
  document.getElementById('orderProductId').value = secret || '';
}

/* ========================================
   RENDER KATALOG
======================================== */
const catalog = document.getElementById('catalog');
function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [k,v] of Object.entries(attrs)) {
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
  const section = el('section', 'reward-tier', { 'data-tier': tier.id });
  section.appendChild(el('div', 'tier-header', { text: tier.label || tier.id }));
  const grid = el('div', 'product-grid');
  section.appendChild(grid);
  const showFirst = Number.isInteger(tier.showFirst) ? tier.showFirst : 3;
  const items = Array.isArray(tier.items) ? tier.items : [];
  items.forEach((item, idx) => {
    const src = item.url ? item.url : (baseUrl + item.file);
    const name = item.name || item.file || item.url || 'Produto';
    const isExtra = idx >= showFirst;
    grid.appendChild(buildProductCard({ src, name, secret: tier.id, isExtra }));
  });
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
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];
    catalog.innerHTML = '';
    tiers.forEach(tier => catalog.appendChild(buildTierSection(tier, baseUrl)));
  } catch (err) {
    console.error('Gagal memuat manifest:', err);
    catalog.innerHTML = '<p style="color:red;text-align:center">Falha ao carregar catálogo. Tente novamente mais tarde.</p>';
  }
}

/* ========================================
   INTERAKSI (Card / Veja Mais / Modal)
======================================== */
document.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;
  const name = card.querySelector('.product-name')?.textContent.trim() || '';
  const img = card.querySelector('.product-img')?.src || '';
  const secret = card.getAttribute('data-secret') || '';
  orderForm.reset();
  isCPFValid = false;
  isSecretCodeValid = false;
  orderFormMessage.textContent = '';
  orderSubmitBtn.disabled = true;
  document.getElementById('secretCodeStatus').innerHTML = '';
  updateOrderProductInfo(name, img, secret);
  orderModal.classList.add('active');
  // Hanya panggil kalau fungsi sudah di-set (setelah DOM ready)
  if (typeof applyGameIdRules === 'function') applyGameIdRules();
});
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
orderModalCloseBtn.addEventListener('click', () => orderModal.classList.remove('active'));

/* ========================================
   CPF Validation
======================================== */
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g,'');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i=1;i<=9;i++) sum += parseInt(cpf.substring(i-1,i))*(11-i);
  rest = sum % 11;
  rest = (rest < 2) ? 0 : 11 - rest;
  if (rest !== parseInt(cpf.substring(9,10))) return false;
  sum = 0;
  for (let i=1;i<=10;i++) sum += parseInt(cpf.substring(i-1,i))*(12-i);
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
   Nome Completo Validation
======================================== */
const fullNameInput = document.getElementById('fullName');
fullNameInput.addEventListener('input', function() {
  if (/\d/.test(this.value)) {
    this.setCustomValidity('Nome não pode conter números!');
    this.style.borderColor = '#eb0b0a';
    orderFormMessage.textContent = 'Nome não pode conter números!';
    orderFormMessage.style.color = 'red';
  } else {
    this.setCustomValidity('');
    this.style.borderColor = '';
    if (orderFormMessage.textContent === 'Nome não pode conter números!') {
      orderFormMessage.textContent = '';
      orderFormMessage.style.color = '';
    }
  }
});

/* ========================================
   Game ID Validation (dipindah inisialisasi setelah DOM siap)
======================================== */
let platformSelect;  // akan diisi setelah DOM ready
let gameIdInput;

const RULE_GROUP_A = new Set(['POPBRA','POP888','POP678','POPPG','POP555','POPLUA','POPBEM','POPCEU']);
const RULE_GROUP_B = new Set(['POPDEZ','POPWB','POPBOA']);

function getGameIdConfig() {
  // Jika belum siap (dipanggil sangat awal) kembalikan default
  if (!platformSelect) {
    return { regex:/^\d{4,12}$/, min:4, max:12, msg:'Selecione a plataforma para validar o ID de Jogo' };
  }
  const platform = platformSelect.value;
  if (RULE_GROUP_A.has(platform)) {
    return { regex:/^\d{4,8}$/, min:4, max:8, msg:`ID de Jogo (${platform}) precisa 4-8 dígitos numéricos, sem espaço!` };
  }
  if (RULE_GROUP_B.has(platform)) {
    return { regex:/^\d{9,12}$/, min:9, max:12, msg:`ID de Jogo (${platform}) precisa 9-12 dígitos numéricos, sem espaço!` };
  }
  return { regex:/^\d{4,12}$/, min:4, max:12, msg:'Selecione a plataforma para validar o ID de Jogo' };
}
function applyGameIdRules() {
  const { min, max } = getGameIdConfig();
  if (!gameIdInput) return;
  gameIdInput.setAttribute('minlength', String(min));
  gameIdInput.setAttribute('maxlength', String(max));
  gameIdInput.setAttribute('pattern', `\\d{${min},${max}}`);
  gameIdInput.placeholder = `Digite ${min}-${max} dígitos numéricos`;
  validateGameId();
}
function validateGameId() {
  if (!gameIdInput) return;
  const { regex, msg } = getGameIdConfig();
  const value = gameIdInput.value.trim();
  if (!value) {
    gameIdInput.setCustomValidity('');
    gameIdInput.style.borderColor = '';
    if (orderFormMessage.textContent.startsWith('ID de Jogo')) orderFormMessage.textContent = '';
    return;
  }
  if (!/^\d+$/.test(value)) {
    const m = 'ID de Jogo deve conter apenas números.';
    gameIdInput.setCustomValidity(m);
    gameIdInput.style.borderColor = '#eb0b0a';
    orderFormMessage.textContent = m;
    orderFormMessage.style.color = 'red';
    return;
  }
  if (!regex.test(value)) {
    gameIdInput.setCustomValidity(msg);
    gameIdInput.style.borderColor = '#eb0b0a';
    orderFormMessage.textContent = msg;
    orderFormMessage.style.color = 'red';
    return;
  }
  gameIdInput.setCustomValidity('');
  gameIdInput.style.borderColor = '';
  if (orderFormMessage.textContent === msg || orderFormMessage.textContent.startsWith('ID de Jogo')) {
    orderFormMessage.textContent = '';
    orderFormMessage.style.color = '';
  }
}

/* ========================================
   Secret Code Validation
======================================== */
const secretCodeInput = document.getElementById('secretCode');
const secretCodeStatus = document.getElementById('secretCodeStatus');
function showSpinner() {
  secretCodeStatus.innerHTML = `
    <svg aria-label="Validando..." width="22" height="22" viewBox="0 0 50 50" role="img">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#eb0b0a" stroke-width="6" opacity="0.2"></circle>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#eb0b0a" stroke-width="6" stroke-linecap="round" stroke-dasharray="1,150" stroke-dashoffset="0">
        <animate attributeName="stroke-dasharray" values="1,150;90,150;90,150" dur="1.4s" repeatCount="indefinite"></animate>
        <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.4s" repeatCount="indefinite"></animate>
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1.4s" repeatCount="indefinite"></animateTransform>
      </circle>
    </svg>`;
}
function showCheck() {
  secretCodeStatus.innerHTML = `<ion-icon name="checkmark-circle" style="color:#28c650;font-size:1.6em"></ion-icon>`;
}
function showWarning() {
  secretCodeStatus.innerHTML = `<ion-icon name="warning" style="color:#eb0b0a;font-size:1.6em"></ion-icon>`;
}
function clearStatus() { secretCodeStatus.innerHTML = ""; }

secretCodeInput.addEventListener('input', async function () {
  const secretCode = this.value.trim();
  const productId = document.getElementById('orderProductId').value;
  isSecretCodeValid = false;
  updateOrderSubmitBtn();
  if (secretCode.length > 4 && productId) {
    showSpinner();
    orderFormMessage.textContent = 'Validando código...';
    orderFormMessage.style.color = '#444';
    try {
      const res = await fetch(`${BACKEND_URL}/validate?product_id=${encodeURIComponent(productId)}&secret_code=${encodeURIComponent(secretCode)}`);
      const result = await res.json();
      if (result.status === "valid") {
        isSecretCodeValid = true;
        orderFormMessage.textContent = 'Código válido! Você pode enviar.';
        orderFormMessage.style.color = 'green';
        showCheck();
      } else {
        isSecretCodeValid = false;
        orderFormMessage.textContent = 'Código inválido ou já utilizado!';
        orderFormMessage.style.color = 'red';
        showWarning();
      }
    } catch {
      isSecretCodeValid = false;
      orderFormMessage.textContent = 'Erro ao validar código!';
      orderFormMessage.style.color = 'red';
      showWarning();
    }
  } else {
    isSecretCodeValid = false;
    orderFormMessage.textContent = '';
    clearStatus();
  }
  updateOrderSubmitBtn();
});

/* ========================================
   Submit Order
======================================== */
orderForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!orderForm.checkValidity() || !isCPFValid || !isSecretCodeValid) {
    orderForm.reportValidity();
    orderFormMessage.textContent = 'Verifique os campos e tente novamente.';
    orderFormMessage.style.color = 'red';
    orderSubmitBtn.disabled = false;
    return;
  }
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
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    zip: document.getElementById('zip').value.trim(),
    state: document.getElementById('state').value,
    city: document.getElementById('city').value,
    address: document.getElementById('address').value.trim(),
    neighborhood: document.getElementById('neighborhood').value.trim(),
    street: document.getElementById('street').value.trim(),
    number: document.getElementById('number').value.trim(),
    platform: document.getElementById('platform').value,
    gameId: document.getElementById('gameId').value.trim(),
    cpf: document.getElementById('cpf').value.trim(),
    secretCode: document.getElementById('secretCode').value.trim()
  };
  try {
    const response = await fetch(`${BACKEND_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.status === 'success') {
      orderFormMessage.textContent = 'Pedido enviado com sucesso! Entraremos em contato em breve.';
      orderFormMessage.style.color = 'green';
      setTimeout(() => {
        orderModal.classList.remove('active');
        orderForm.reset();
        orderSubmitBtn.disabled = true;
        orderFormMessage.textContent = '';
      }, 2500);
    } else {
      orderFormMessage.textContent = result.message || 'Erro ao enviar pedido. Tente novamente.';
      orderFormMessage.style.color = 'red';
      orderSubmitBtn.disabled = false;
    }
  } catch (err) {
    console.error('Erro ao enviar pedido:', err);
    orderFormMessage.textContent = 'Erro ao enviar. Verifique sua conexão.';
    orderFormMessage.style.color = 'red';
    orderSubmitBtn.disabled = false;
  }
});

/* ========================================
   DOM READY SETUP
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  platformSelect = document.getElementById('platform');
  gameIdInput = document.getElementById('gameId');

  if (platformSelect) {
    platformSelect.addEventListener('change', () => {
      applyGameIdRules();
      updateOrderSubmitBtn();
    });
  }
  if (gameIdInput) {
    gameIdInput.addEventListener('input', () => {
      validateGameId();
      updateOrderSubmitBtn();
    });
  }

  applyGameIdRules(); // pertama kali setelah elemen pasti ada
  loadCatalog();
});

function updateOrderSubmitBtn() {
  orderSubmitBtn.disabled = !(orderForm.checkValidity() && isCPFValid && isSecretCodeValid);
}
