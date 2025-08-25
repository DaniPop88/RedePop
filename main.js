'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";
// Bisa override lewat <script> di HTML:
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL = "https://cdn.jsdelivr.net/gh/DaniPop88/RedePop@802e4f4bb53a9e10a76191186d6509cadffc2dc9/manifest.json";

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

// Catalog loading utilities
function createCatalogSpinner() {
  return `
    <div style="text-align:center;padding:40px;">
      <svg aria-label="Carregando catálogo..." width="40" height="40" viewBox="0 0 50 50" role="img">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#eb0b0a" stroke-width="4" opacity="0.2"></circle>
        <circle cx="25" cy="25" r="20" fill="none" stroke="#eb0b0a" stroke-width="4" stroke-linecap="round" stroke-dasharray="1,150" stroke-dashoffset="0">
          <animate attributeName="stroke-dasharray" values="1,150;90,150;90,150" dur="1.4s" repeatCount="indefinite"></animate>
          <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.4s" repeatCount="indefinite"></animate>
          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1.4s" repeatCount="indefinite"></animateTransform>
        </circle>
      </svg>
      <p style="margin-top:15px;color:#666;">Carregando catálogo...</p>
    </div>
  `;
}

// CDN fallback sources
const CDN_SOURCES = [
  // Use the configured MANIFEST_URL as primary
  MANIFEST_URL,
  // Statically CDN as backup
  "https://cdn.statically.io/gh/DaniPop88/RedePop/802e4f4bb53a9e10a76191186d6509cadffc2dc9/manifest.json",
  // Raw GitHub as final fallback  
  "https://raw.githubusercontent.com/DaniPop88/RedePop/802e4f4bb53a9e10a76191186d6509cadffc2dc9/manifest.json",
  // Local fallback for testing
  "./manifest.json"
];

// Network speed detection
function detectNetworkSpeed() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return { timeout: 15000, label: 'lenta' };
    } else if (effectiveType === '3g') {
      return { timeout: 10000, label: 'média' };
    }
  }
  return { timeout: 8000, label: 'normal' };
}

// Fetch with timeout
async function fetchWithTimeout(url, options = {}) {
  const networkSpeed = detectNetworkSpeed();
  const timeout = options.timeout || networkSpeed.timeout;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-cache'
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Timeout após ${timeout/1000}s - conexão ${networkSpeed.label} detectada`);
    }
    throw err;
  }
}

// Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function loadCatalog() {
  // Show loading indicator
  catalog.innerHTML = createCatalogSpinner();
  
  try {
    const manifest = await retryWithBackoff(async (attempt) => {
      // Try CDN sources in order
      for (let i = 0; i < CDN_SOURCES.length; i++) {
        const url = CDN_SOURCES[i];
        const cdnName = url.includes('jsdelivr') ? 'jsDelivr' : 
                        url.includes('statically') ? 'Statically' : 'GitHub';
        
        try {
          console.log(`Tentativa ${attempt}: Carregando de ${cdnName}...`);
          const res = await fetchWithTimeout(url);
          const data = await res.json();
          console.log(`Sucesso: Manifest carregado de ${cdnName}`);
          return data;
        } catch (err) {
          console.warn(`${cdnName} falhou:`, err.message);
          if (i === CDN_SOURCES.length - 1) {
            throw new Error(`Todas as fontes CDN falharam na tentativa ${attempt}`);
          }
          // Continue to next CDN source
        }
      }
    }, 3, 1500); // 3 retries, starting with 1.5s delay

    // baseUrl opsional (fallback ke string kosong)
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];

    // bersihkan container
    catalog.innerHTML = '';

    if (tiers.length === 0) {
      catalog.innerHTML = '<p style="text-align:center;padding:40px;color:#666;">Nenhum produto encontrado no catálogo.</p>';
      return;
    }

    // render tiap tier
    tiers.forEach(tier => {
      const section = buildTierSection(tier, baseUrl);
      catalog.appendChild(section);
    });
    
    console.log(`Catálogo carregado com sucesso: ${tiers.length} categorias`);
    
  } catch (err) {
    console.error('Erro ao carregar catálogo:', err);
    
    // Show detailed error message with retry option
    const networkSpeed = detectNetworkSpeed();
    const errorHtml = `
      <div style="text-align:center;padding:40px;max-width:600px;margin:0 auto;">
        <div style="color:#eb0b0a;font-size:48px;margin-bottom:20px;">⚠️</div>
        <h3 style="color:#eb0b0a;margin-bottom:15px;">Falha ao carregar catálogo</h3>
        <p style="color:#666;margin-bottom:10px;font-size:14px;">
          <strong>Erro:</strong> ${err.message}
        </p>
        <p style="color:#666;margin-bottom:20px;font-size:14px;">
          <strong>Conexão detectada:</strong> ${networkSpeed.label}
        </p>
        <div style="margin-bottom:20px;">
          <p style="color:#666;font-size:14px;">Possíveis causas:</p>
          <ul style="text-align:left;display:inline-block;color:#666;font-size:14px;">
            <li>Conexão de internet instável</li>
            <li>CDN indisponível na sua região</li>
            <li>Firewall ou proxy bloqueando acesso</li>
          </ul>
        </div>
        <button 
          onclick="loadCatalog()" 
          style="background:#eb0b0a;color:white;border:none;padding:12px 24px;border-radius:5px;cursor:pointer;font-size:14px;"
          onmouseover="this.style.background='#d60a09'" 
          onmouseout="this.style.background='#eb0b0a'"
        >
          🔄 Tentar Novamente
        </button>
        <p style="color:#999;margin-top:15px;font-size:12px;">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    `;
    catalog.innerHTML = errorHtml;
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

  // Reset dulu supaya hidden input tidak ikut terhapus setelah diisi
  orderForm.reset();
  isCPFValid = false;
  isSecretCodeValid = false;
  orderFormMessage.textContent = '';
  orderSubmitBtn.disabled = true;

  // Bersihkan ikon/spinner secret code kalau ada
  const scStatus = document.getElementById('secretCodeStatus');
  if (scStatus) scStatus.innerHTML = '';

  // Baru isi data produk + buka modal
  updateOrderProductInfo(name, img, secret);
  orderModal.classList.add('active');

  // Re-apply aturan Game ID setelah reset
  if (typeof applyGameIdRules === 'function') applyGameIdRules();
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
   Nama Completo Validation (Tidak boleh angka)
======================================== */
const fullNameInput = document.getElementById('fullName');
fullNameInput.addEventListener('input', function() {
  // Cek jika ada angka
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
   Game ID Validation dinamis (berdasarkan platform)
   - POPBRA: 4-8 digit
   - POPDEZ: 9-12 digit
======================================== */
const platformSelect = document.getElementById('platform');
const gameIdInput = document.getElementById('gameId');

function getGameIdConfig() {
  const platform = platformSelect.value;
  if (platform === 'POPBRA','POP888','POP678','POPPG','POP555','POPLUA','POPBEM','POPCEU') {
    return {
      regex: /^\d{4,8}$/,
      min: 4,
      max: 8,
      msg: 'ID de Jogo (POPBRA) precisa 4-8 dígitos numéricos, sem espaço!'
    };
  }
  if (platform === 'POPDEZ','POPWB','POPBOA') {
    return {
      regex: /^\d{9,12}$/,
      min: 9,
      max: 12,
      msg: 'ID de Jogo (POPDEZ) precisa 9-12 dígitos numéricos, sem espaço!'
    };
  }
  // Default sementara sebelum memilih platform
  return {
    regex: /^\d{4,12}$/,
    min: 4,
    max: 12,
    msg: 'Selecione a plataforma para validar o ID de Jogo'
  };
}

function applyGameIdRules() {
  const { min, max } = getGameIdConfig();
  // Update atribut HTML supaya native validation ikut bekerja
  gameIdInput.setAttribute('minlength', String(min));
  gameIdInput.setAttribute('maxlength', String(max));
  gameIdInput.setAttribute('pattern', `\\d{${min},${max}}`);
  gameIdInput.placeholder = `Digite ${min}-${max} dígitos numéricos`;
  validateGameId();
}

function validateGameId() {
  const { regex, msg } = getGameIdConfig();
  const value = gameIdInput.value.trim();

  if (!value) {
    gameIdInput.setCustomValidity('');
    gameIdInput.style.borderColor = '';
    if (orderFormMessage.textContent.startsWith('ID de Jogo')) {
      orderFormMessage.textContent = '';
      orderFormMessage.style.color = '';
    }
    return;
  }

  if (!/^\d+$/.test(value)) {
    gameIdInput.setCustomValidity('ID de Jogo deve conter apenas números.');
    gameIdInput.style.borderColor = '#eb0b0a';
    orderFormMessage.textContent = 'ID de Jogo deve conter apenas números.';
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

// Terapkan aturan saat platform berubah dan saat user mengetik ID
platformSelect.addEventListener('change', () => {
  applyGameIdRules();
  updateOrderSubmitBtn();
});

gameIdInput.addEventListener('input', () => {
  validateGameId();
  updateOrderSubmitBtn();
});

// Inisialisasi aturan saat script dijalankan
applyGameIdRules();

/* ========================================
   Secret Code Validation
======================================== */
const secretCodeInput = document.getElementById('secretCode');
const secretCodeStatus = document.getElementById('secretCodeStatus');

function showSpinner() {
  // Animated SVG spinner (tanpa butuh CSS tambahan)
  secretCodeStatus.innerHTML = `
    <svg aria-label="Validando..." width="22" height="22" viewBox="0 0 50 50" role="img">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#eb0b0a" stroke-width="6" opacity="0.2"></circle>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#eb0b0a" stroke-width="6" stroke-linecap="round" stroke-dasharray="1,150" stroke-dashoffset="0">
        <animate attributeName="stroke-dasharray" values="1,150;90,150;90,150" dur="1.4s" repeatCount="indefinite"></animate>
        <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.4s" repeatCount="indefinite"></animate>
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1.4s" repeatCount="indefinite"></animateTransform>
      </circle>
    </svg>
  `;
}
function showCheck() {
  secretCodeStatus.innerHTML = `<ion-icon name="checkmark-circle" style="color:#28c650;font-size:1.6em"></ion-icon>`;
}
function showWarning() {
  secretCodeStatus.innerHTML = `<ion-icon name="warning" style="color:#eb0b0a;font-size:1.6em"></ion-icon>`;
}
function clearStatus() {
  secretCodeStatus.innerHTML = "";
}

secretCodeInput.addEventListener('input', async function () {
  const secretCode = this.value.trim();
  const productId = document.getElementById('orderProductId').value;

  // Saat mulai mengetik/cek ulang, matikan valid state dulu
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
    } catch (err) {
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

  // Validasi terakhir sebelum kirim
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

// Inicializar catalog
document.addEventListener('DOMContentLoaded', loadCatalog);

function updateOrderSubmitBtn() {
  orderSubmitBtn.disabled = !(orderForm.checkValidity() && isCPFValid && isSecretCodeValid);
}
