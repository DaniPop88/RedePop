'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";

// Multiple fallback URLs for manifest loading
const MANIFEST_URLS = [
  // Primary: Current jsDelivr URL
  "https://cdn.jsdelivr.net/gh/DaniPop88/RedePop@802e4f4bb53a9e10a76191186d6509cadffc2dc9/manifest.json",
  // Fallback 1: GitHub raw content
  "https://raw.githubusercontent.com/DaniPop88/RedePop/main/manifest.json",
  // Fallback 2: Different jsDelivr endpoint
  "https://cdn.jsdelivr.net/gh/DaniPop88/RedePop@main/manifest.json",
  // Fallback 3: Local file (absolute URL)
  `${window.location.origin}/manifest.json`
];

// Configuration for loading
const LOADING_CONFIG = {
  timeout: 10000, // 10 seconds per URL attempt
  maxRetries: 3, // Maximum retries per URL
  retryDelay: 1000, // Initial retry delay (1 second)
  backoffFactor: 2 // Exponential backoff multiplier
};

// Maintain backward compatibility
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL || MANIFEST_URLS[0];

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

/* ========================================
   ENHANCED MANIFEST LOADING WITH FALLBACKS
======================================== */

// Helper function to create timeout promise
function createTimeoutPromise(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = LOADING_CONFIG.timeout) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'default', // Use default cache strategy instead of 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Helper function to retry with exponential backoff
async function retryWithBackoff(fn, maxRetries, initialDelay, backoffFactor) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break; // No more retries
      }
      
      const delay = initialDelay * Math.pow(backoffFactor, attempt);
      console.warn(`Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Enhanced manifest loader with multiple URLs and retry logic
async function loadManifestFromUrl(url, urlIndex, totalUrls) {
  const loadingDetails = document.getElementById('loading-details');
  
  try {
    // Handle relative URLs for loading details display
    let displayUrl;
    try {
      displayUrl = new URL(url).hostname;
    } catch {
      displayUrl = 'servidor local'; // For relative URLs like "./manifest.json"
    }
    
    if (loadingDetails) {
      loadingDetails.textContent = `Tentativa ${urlIndex + 1}/${totalUrls}: ${displayUrl}...`;
    }
    
    console.log(`Trying to load manifest from: ${url}`);
    
    // Attempt to load with retries
    const response = await retryWithBackoff(
      () => fetchWithTimeout(url, {}, LOADING_CONFIG.timeout),
      LOADING_CONFIG.maxRetries,
      LOADING_CONFIG.retryDelay,
      LOADING_CONFIG.backoffFactor
    );
    
    const manifest = await response.json();
    console.log(`Successfully loaded manifest from: ${url}`);
    return manifest;
    
  } catch (error) {
    console.warn(`Failed to load manifest from ${url}:`, error.message);
    throw error;
  }
}

async function loadCatalog() {
  const catalog = document.getElementById('catalog');
  const loadingDiv = document.getElementById('catalog-loading');
  const loadingDetails = document.getElementById('loading-details');
  
  // Show loading indicator
  if (loadingDiv) {
    loadingDiv.style.display = 'block';
  }
  catalog.innerHTML = ''; // Clear any previous content
  
  let lastError;
  
  // Try each URL in sequence
  for (let i = 0; i < MANIFEST_URLS.length; i++) {
    const url = MANIFEST_URLS[i];
    
    try {
      const manifest = await loadManifestFromUrl(url, i, MANIFEST_URLS.length);
      
      // Successfully loaded manifest
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
      
      // baseUrl opsional (fallback ke string kosong)
      const baseUrl = (manifest.baseUrl || '').trim();
      const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];
      
      // render tiap tier
      tiers.forEach(tier => {
        const section = buildTierSection(tier, baseUrl);
        catalog.appendChild(section);
      });
      
      console.log(`Catalog loaded successfully from URL ${i + 1}/${MANIFEST_URLS.length}`);
      return; // Success! Exit function
      
    } catch (error) {
      lastError = error;
      console.error(`Failed to load from URL ${i + 1}:`, error.message);
      
      // Continue to next URL unless this is the last one
      if (i < MANIFEST_URLS.length - 1) {
        if (loadingDetails) {
          try {
            const hostname = new URL(url).hostname;
            loadingDetails.textContent = `Falha no ${hostname}. Tentando próximo...`;
          } catch {
            loadingDetails.textContent = `Falha no servidor local. Tentando próximo...`;
          }
        }
        // Small delay before trying next URL
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // If we get here, all URLs failed
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }
  
  console.error('All manifest URLs failed:', lastError);
  
  // Show enhanced error message with retry option
  catalog.innerHTML = `
    <div class="error-message">
      <p><strong>Falha ao carregar catálogo</strong></p>
      <p>Não foi possível conectar aos servidores. Isso pode ser devido a:</p>
      <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
        <li>Problemas de conexão com a internet</li>
        <li>Bloqueios de rede ou firewall</li>
        <li>Servidores temporariamente indisponíveis</li>
      </ul>
      <button class="retry-button" onclick="loadCatalog()">
        Tentar Novamente
      </button>
      <p style="font-size: 0.8rem; margin-top: 15px; color: #888;">
        Erro técnico: ${lastError.message}
      </p>
    </div>
  `;
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
