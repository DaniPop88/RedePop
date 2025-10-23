'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL || "./manifest.json";

/* ========================================
   DYNAMIC CONFIGURATION
======================================== */
// Dynamic color schemes
const COLOR_SCHEMES = [
  { primary: '#eb0b0a', secondary: '#310404' },
  { primary: '#d32f2f', secondary: '#1b0000' },
  { primary: '#f44336', secondary: '#310404' },
  { primary: '#e53935', secondary: '#2c0000' },
  { primary: '#c62828', secondary: '#1a0000' },
];

/* ========================================
   UTILITY FUNCTIONS
======================================== */

/* ========================================
   🌍 LANGUAGE FIX: Indonesian → Portuguese
   Backend returns Indonesian messages, we translate them!
======================================== */
function translateBackendMessage(message) {
  if (!message) return message;
  
  // Indonesian to Portuguese translation map
  const translations = {
    'Code tidak ditemukan': 'Código não encontrado',
    'code tidak ditemukan': 'Código não encontrado',
    'Code sudah digunakan': 'Código já foi utilizado',
    'code sudah digunakan': 'Código já foi utilizado',
    'Code tidak valid': 'Código inválido',
    'code tidak valid': 'Código inválido',
    'Produk tidak ditemukan': 'Produto não encontrado',
    'produk tidak ditemukan': 'Produto não encontrado',
    'Error validasi': 'Erro de validação',
    'error validasi': 'Erro de validação',
    'Tidak ada data': 'Sem dados',
    'tidak ada data': 'Sem dados',
    'Gagal memproses': 'Falha ao processar',
    'gagal memproses': 'Falha ao processar',
    'Permintaan tidak valid': 'Solicitação inválida',
    'permintaan tidak valid': 'Solicitação inválida'
  };
  
  // Check if message contains any Indonesian words and translate
  for (const [indonesian, portuguese] of Object.entries(translations)) {
    if (message.toLowerCase().includes(indonesian.toLowerCase())) {
      return message.replace(new RegExp(indonesian, 'gi'), portuguese);
    }
  }
  
  return message;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function setRandomColorScheme() {
  const scheme = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
  document.documentElement.style.setProperty('--dynamic-primary', scheme.primary);
  document.documentElement.style.setProperty('--dynamic-secondary', scheme.secondary);
  document.documentElement.style.setProperty('--dynamic-gradient', 
    `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`);
}

function createIntersectionObserver() {
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.classList.add('loading');
          img.src = img.dataset.src;
          img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
          };
          img.removeAttribute('data-src');
        }
      }
    });
  }, { 
    rootMargin: '50px',
    threshold: 0.1 
  });
}

/* ========================================
   🚀 NEW: DEBOUNCE FUNCTION FOR PERFORMANCE
======================================== */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* ========================================
   DOM ELEMENTS
======================================== */
const orderModal = document.getElementById('orderModal');
const orderModalCloseBtn = document.getElementById('orderModalCloseBtn');
const orderForm = document.getElementById('orderForm');
const orderSubmitBtn = document.getElementById('orderSubmitBtn');
const orderFormMessage = document.getElementById('orderFormMessage');
const catalog = document.getElementById('catalog');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialized after DOM ready
let platformSelect;
let gameIdInput;

/* ========================================
   UTIL: UPDATE INFO MODAL
======================================== */
function updateOrderProductInfo(name, img, secret) {
  document.getElementById('orderProductName').textContent = name || '';
  document.getElementById('orderProductImg').src = img || '';
  document.getElementById('orderProductId').value = secret || '';
}

/* ========================================
   ENHANCED ELEMENT CREATION
======================================== */
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

function buildProductCard({ src, name, secret, isExtra, isFeatured }, index) {
  const cardClass = `product-card${isExtra ? ' extra-product' : ''}${isFeatured ? ' featured' : ''}`;
  const card = el('div', cardClass, { 'data-secret': secret });
  
  // Add animation delay
  card.style.animationDelay = `${index * 0.05}s`;
  
  // Featured badge
  if (isFeatured) {
    const badge = el('div', 'featured-badge', { text: '⭐' });
    card.appendChild(badge);
  }
  
  // Lazy loading image with placeholder
  const img = el('img', 'product-img', { 
    'data-src': src, 
    alt: name,
    loading: 'lazy',
    decoding: 'async',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3C/svg%3E'
  });
  
  const title = el('div', 'product-name', { text: name });
  
  card.appendChild(img);
  card.appendChild(title);
  
  if (isExtra) card.hidden = true;
  
  return card;
}

function buildTierSection(tier, baseUrl) {
  const section = el('section', 'reward-tier', { 'data-tier': tier.id });
  
  // Animation delay for tiers
  const tierIndex = parseInt(tier.id.split('-')[1]) || 1;
  section.style.animationDelay = `${tierIndex * 0.2}s`;
  
  const header = el('div', 'tier-header', { text: tier.label || tier.id });
  section.appendChild(header);
  
  const grid = el('div', 'product-grid');
  section.appendChild(grid);
  
  const showFirst = Number.isInteger(tier.showFirst) ? tier.showFirst : 3;
  let items = Array.isArray(tier.items) ? tier.items : [];

  // Randomize items
  items = shuffleArray(items);

  // Select random featured products
  const featuredCount = Math.floor(Math.random() * 2) + 1;
  const featuredIndices = new Set();
  while (featuredIndices.size < Math.min(featuredCount, Math.min(showFirst, items.length))) {
    featuredIndices.add(Math.floor(Math.random() * Math.min(showFirst, items.length)));
  }
  
  items.forEach((item, idx) => {
    const src = item.url ? item.url : (baseUrl + item.file);
    const name = item.name || item.file || item.url || 'Produto';
    const isExtra = idx >= showFirst;
    const isFeatured = featuredIndices.has(idx) && !isExtra;
    
    const card = buildProductCard({ src, name, secret: tier.id, isExtra, isFeatured }, idx);
    grid.appendChild(card);
  });
  
  if (items.length > showFirst) {
    const btn = el('button', 'veja-mais-btn', { 'data-tier': tier.id });
    btn.appendChild(el('span', 'btn-text', { text: 'VEJA MAIS' }));
    btn.appendChild(el('span', 'arrow-icon', { html: '&#9660;' }));
    section.appendChild(btn);
  }
  
  return section;
}

/* ========================================
   🚀 OPTIMIZED CATALOG LOADING
======================================== */
async function loadCatalog() {
  try {
    setRandomColorScheme();
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
    
    // 🚀 OPTIMIZED: Reduced minimum loading time from 1.5s to 800ms
    const [response] = await Promise.all([
      fetch(MANIFEST_URL, { cache: 'no-cache' }),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const manifest = await response.json();
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];
    
    catalog.innerHTML = '';
    
    // Create intersection observer for lazy loading
    const imageObserver = createIntersectionObserver();
    
    tiers.forEach(tier => {
      const tierSection = buildTierSection(tier, baseUrl);
      catalog.appendChild(tierSection);
      
      // Setup lazy loading for images in this tier
      const images = tierSection.querySelectorAll('.product-img[data-src]');
      images.forEach(img => imageObserver.observe(img));
    });
    
    // Hide loading overlay
    if (loadingOverlay) {
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 300);
    }
    
  } catch (err) {
    console.error('Gagal memuat manifest:', err);
    catalog.innerHTML = '<p style="color:red;text-align:center;padding:20px;">Falha ao carregar catálogo. Tente novamente.</p>';
    
    if (loadingOverlay) {
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 300);
      }, 100);
    }
  }
}

/* ========================================
   CPF VALIDATION
======================================== */
let isCPFValid = false;

function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0, remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/* ========================================
   PRODUCT CARD CLICK HANDLER
======================================== */
document.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;

  // Visual feedback
  card.style.transform = 'scale(0.95)';
  setTimeout(() => { card.style.transform = ''; }, 150);

  const nameEl = card.querySelector('.product-name');
  const imgEl = card.querySelector('.product-img');
  const name = nameEl ? nameEl.textContent.trim() : '';
  const img = imgEl ? (imgEl.src || imgEl.dataset.src) : '';
  const secret = card.getAttribute('data-secret') || '';

  // Reset form and validation states
  orderForm.reset();
  isCPFValid = false;
  isSecretCodeValid = false;
  orderFormMessage.textContent = '';
  orderSubmitBtn.disabled = true;

  const statusEl = document.getElementById('secretCodeStatus');
  if (statusEl) statusEl.innerHTML = '';

  updateOrderProductInfo(name, img, secret);
  orderModal.classList.add('active');

  if (typeof applyGameIdRules === 'function') {
    applyGameIdRules();
  }
});

/* ========================================
   "VEJA MAIS" TOGGLE
======================================== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.veja-mais-btn');
  if (!btn) return;

  const tierId = btn.getAttribute('data-tier');
  const section = document.querySelector(`section[data-tier="${tierId}"]`);
  if (!section) return;

  const extras = section.querySelectorAll('.extra-product');
  const expanded = btn.classList.toggle('expanded');
  const btnText = btn.querySelector('.btn-text');
  const arrowIcon = btn.querySelector('.arrow-icon');

  if (btnText && arrowIcon) {
    btnText.textContent = expanded ? 'VER MENOS' : 'VEJA MAIS';
    arrowIcon.innerHTML = expanded ? '&#9650;' : '&#9660;';
  }

  extras.forEach((card, i) => {
    if (expanded) {
      card.hidden = false;
      card.style.opacity = '1';
      card.style.transform = 'scale(1) translateY(0)';
      card.style.animationDelay = `${i * 0.1}s`;
      card.classList.add('fade-in');
    } else {
      card.hidden = true;
      card.classList.remove('fade-in');
      card.style.opacity = '';
      card.style.transform = '';
    }
  });
});

/* ========================================
   MODAL CLOSE
======================================== */
if (orderModalCloseBtn) {
  orderModalCloseBtn.addEventListener('click', () => {
    orderModal.classList.remove('active');
  });
}

/* ========================================
   GAME ID VALIDATION
======================================== */
const RULE_GROUP_A = new Set(['POPBRA', 'POP888', 'POP678', 'POPPG', 'POP555', 'POPLUA', 'POPBEM', 'POPCEU']);
const RULE_GROUP_B = new Set(['POPDEZ', 'POPWB', 'POPBOA', 'POPFLU']);

function getGameIdConfig() {
  if (!platformSelect || !platformSelect.value) {
    return {
      regex: /^\d{4,12}$/,
      min: 4,
      max: 12,
      msg: 'Selecione a plataforma para validar o ID de Jogo'
    };
  }

  const platform = platformSelect.value;

  if (RULE_GROUP_A.has(platform)) {
    return {
      regex: /^\d{4,8}$/,
      min: 4,
      max: 8,
      msg: `ID de Jogo (${platform}) precisa 4-8 dígitos numéricos, sem espaço!`
    };
  } else if (RULE_GROUP_B.has(platform)) {
    return {
      regex: /^\d{9,12}$/,
      min: 9,
      max: 12,
      msg: `ID de Jogo (${platform}) precisa 9-12 dígitos numéricos, sem espaço!`
    };
  }

  return {
    regex: /^\d{4,12}$/,
    min: 4,
    max: 12,
    msg: 'Selecione a plataforma para validar o ID de Jogo'
  };
}

function applyGameIdRules() {
  if (!gameIdInput || !platformSelect) return;

  const { min, max } = getGameIdConfig();
  gameIdInput.setAttribute('minlength', String(min));
  gameIdInput.setAttribute('maxlength', String(max));
  gameIdInput.setAttribute('pattern', `\\d{${min},${max}}`);
  gameIdInput.placeholder = `Digite ${min}-${max} dígitos numéricos`;
  validateGameId();
}

function validateGameId() {
  if (!gameIdInput || !platformSelect) return;

  const { regex, msg } = getGameIdConfig();
  const gameId = gameIdInput.value.trim();

  if (!gameId) {
    gameIdInput.setCustomValidity('');
    gameIdInput.style.borderColor = '';
    if (orderFormMessage.textContent.startsWith('ID de Jogo')) {
      orderFormMessage.textContent = '';
      orderFormMessage.style.color = '';
    }
    return;
  }

  if (!/^\d+$/.test(gameId)) {
    const errorMsg = 'ID de Jogo deve conter apenas números.';
    gameIdInput.setCustomValidity(errorMsg);
    gameIdInput.style.borderColor = '#eb0b0a';
    orderFormMessage.textContent = errorMsg;
    orderFormMessage.style.color = 'red';
    return;
  }

  if (!regex.test(gameId)) {
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
   🚀 OPTIMIZED: SECRET CODE VALIDATION WITH DEBOUNCING & CACHING
======================================== */
let isSecretCodeValid = false;
const secretCodeInput = document.getElementById('secretCode');
const secretCodeStatus = document.getElementById('secretCodeStatus');

// 🚀 Cache for validation results
const validationCache = new Map();
let validationAbortController = null;

function showSpinner() {
  if (!secretCodeStatus) return;
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
  if (!secretCodeStatus) return;
  secretCodeStatus.innerHTML = '<ion-icon name="checkmark-circle" style="color:#28c650;font-size:1.6em"></ion-icon>';
}

function showWarning() {
  if (!secretCodeStatus) return;
  secretCodeStatus.innerHTML = '<ion-icon name="warning" style="color:#eb0b0a;font-size:1.6em"></ion-icon>';
}

function clearStatus() {
  if (!secretCodeStatus) return;
  secretCodeStatus.innerHTML = "";
}

// 🚀 OPTIMIZED: Actual validation function with caching and timeout
async function performValidation(secretCode, productId) {
  // Check cache first
  const cacheKey = `${productId}-${secretCode}`;
  if (validationCache.has(cacheKey)) {
    console.log('✅ Using cached validation result');
    return validationCache.get(cacheKey);
  }

  // Cancel previous request if still pending
  if (validationAbortController) {
    validationAbortController.abort();
  }
  
  // Create new abort controller with timeout
  validationAbortController = new AbortController();
  const timeoutId = setTimeout(() => validationAbortController.abort(), 8000);

  try {
    showSpinner();
    orderFormMessage.textContent = 'Validando código...';
    orderFormMessage.style.color = '#444';

    const res = await fetch(
      `${BACKEND_URL}/validate?product_id=${encodeURIComponent(productId)}&secret_code=${encodeURIComponent(secretCode)}`,
      { 
        signal: validationAbortController.signal,
        headers: {
          'Connection': 'keep-alive'
        }
      }
    );
    
    clearTimeout(timeoutId);
    const result = await res.json();
    
    // Cache the result for 5 minutes
    validationCache.set(cacheKey, result);
    setTimeout(() => validationCache.delete(cacheKey), 5 * 60 * 1000);
    
    return result;
    
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      console.log('⏱️ Request timeout or cancelled');
      return { status: 'error', message: 'Timeout - tente novamente' };
    }
    
    console.error('❌ Validation error:', err);
    return { status: 'error', message: 'Erro de conexão' };
  }
}

// 🚀 OPTIMIZED: Debounced validation handler
const debouncedValidation = debounce(async function(secretCode, productId) {
  const result = await performValidation(secretCode, productId);
  
  if (result.status === "valid") {
    isSecretCodeValid = true;
    orderFormMessage.textContent = 'Código válido! Você pode enviar.';
    orderFormMessage.style.color = 'green';
    showCheck();
  } else if (result.status === "used") {
    isSecretCodeValid = false;
    orderFormMessage.textContent = 'Código já foi utilizado!';
    orderFormMessage.style.color = 'red';
    showWarning();
  } else {
    isSecretCodeValid = false;
    // 🌍 Translate Indonesian backend messages to Portuguese
    orderFormMessage.textContent = translateBackendMessage(result.message) || 'Código inválido!';
    orderFormMessage.style.color = 'red';
    showWarning();
  }
  
  updateOrderSubmitBtn();
}, 600); // 🚀 Wait 600ms after user stops typing

if (secretCodeInput) {
  secretCodeInput.addEventListener('input', function () {
    const secretCode = this.value.trim();
    const productId = document.getElementById('orderProductId').value;

    // Reset validation state
    isSecretCodeValid = false;
    updateOrderSubmitBtn();

    // 🚀 OPTIMIZED: Only validate when code is exactly 8 characters
    if (secretCode.length === 8 && productId) {
      clearStatus();
      orderFormMessage.textContent = 'Digite o código completo...';
      orderFormMessage.style.color = '#444';
      
      // This will wait 600ms after last keystroke
      debouncedValidation(secretCode, productId);
    } else if (secretCode.length > 0) {
      clearStatus();
      orderFormMessage.textContent = 'Código deve ter 8 caracteres';
      orderFormMessage.style.color = '#444';
    } else {
      clearStatus();
      orderFormMessage.textContent = '';
    }
  });
}

/* ========================================
   Submit Order
======================================== */
if (orderForm) {
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
        
        // Clear cache for this code since it's now used
        const cacheKey = `${data.productId}-${data.secretCode}`;
        validationCache.delete(cacheKey);
        
        setTimeout(() => {
          orderModal.classList.remove('active');
          orderForm.reset();
          orderSubmitBtn.disabled = true;
          orderFormMessage.textContent = '';
          isSecretCodeValid = false;
          isCPFValid = false;
        }, 2500);
      } else {
        // 🌍 Translate Indonesian backend messages to Portuguese
        orderFormMessage.textContent = translateBackendMessage(result.message) || 'Erro ao enviar pedido. Tente novamente.';
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
}

function updateOrderSubmitBtn() {
  if (orderSubmitBtn && orderForm) {
    orderSubmitBtn.disabled = !(orderForm.checkValidity() && isCPFValid && isSecretCodeValid);
  }
}

/* ========================================
   DOM READY SETUP
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  platformSelect = document.getElementById('platform');
  gameIdInput = document.getElementById('gameId');

  // Setup CPF validation
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    // Prevent non-numeric input
    cpfInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^\d]/g, '');
      if (this.value.length > 11) {
        this.value = this.value.slice(0, 11);
      }
    });

    function validateAndUpdateCPF() {
      if (!validateCPF(cpfInput.value)) {
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
    
    cpfInput.addEventListener('blur', validateAndUpdateCPF);
    cpfInput.addEventListener('input', validateAndUpdateCPF);
  }

  // Setup full name validation (no numbers allowed)
  const fullNameInput = document.getElementById('fullName');
  if (fullNameInput) {
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
  }

  // Setup platform and game ID validation
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

  // Initialize game ID rules
  applyGameIdRules();
  
  // Load catalog
  loadCatalog();
});

/* ========================================
   PERFORMANCE OPTIMIZATIONS
======================================== */
// Throttle scroll events
let ticking = false;
function updateOnScroll() {
  ticking = false;
}

document.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateOnScroll);
    ticking = true;
  }
});

// Preload critical images
const criticalImages = [
  'https://i.ibb.co/BHYkmXfs/Whatsapp-Transparent.gif',
  'https://i.ibb.co/s9x87GHJ/Telegram-logo.gif'
];

criticalImages.forEach(src => {
  const img = new Image();
  img.src = src;
});
