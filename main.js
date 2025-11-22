'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL || "./manifest.json";

/* ========================================
   DYNAMIC CONFIGURATION
======================================== */
const COLOR_SCHEMES = [
  { primary: '#FF4EB2', secondary: '#310404' },
  { primary: '#FF4EB2', secondary: '#310404' },
  { primary: '#FF4EB2', secondary: '#310404' },
  { primary: '#FF4EB2', secondary: '#310404' },
  { primary: '#FF4EB2', secondary: '#310404' },
];

/* ========================================
   UTILITY FUNCTIONS
======================================== */
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
          img.onerror = () => {
            console.error('Failed to load image:', img.dataset.src);
            img.classList.remove('loading');
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

function buildProductCard({ src, name, secret, isExtra, isFeatured, overlayUrl }, index) {
  const cardClass = `product-card${isExtra ? ' extra-product' : ''}${isFeatured ? ' featured' : ''}`;
  const card = el('div', cardClass, { 'data-secret': secret });
  
  card.style.animationDelay = `${index * 0.05}s`;
  
  if (isFeatured) {
    const badge = el('div', 'featured-badge', { text: '⭐' });
    card.appendChild(badge);
  }
  
  const imgWrapper = el('div', 'product-img-wrapper');
  
  const img = el('img', 'product-img', { 
    'data-src': src, 
    alt: name,
    loading: 'lazy',
    decoding: 'async',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3C/svg%3E'
  });
  
  if (overlayUrl) {
    const overlay = el('img', 'product-overlay', {
      src: overlayUrl,
      alt: 'frame',
      loading: 'lazy'
    });
    imgWrapper.appendChild(img);
    imgWrapper.appendChild(overlay);
  } else {
    imgWrapper.appendChild(img);
  }
  
  const title = el('div', 'product-name', { text: name });
  
  card.appendChild(imgWrapper);
  card.appendChild(title);
  
  if (isExtra) card.hidden = true;
  
  return card;
}

function buildTierSection(tier, baseUrl) {
  const section = el('section', 'reward-tier', { 'data-tier': tier.id });
  
  const tierIndex = parseInt(tier.id.split('-')[1]) || 1;
  section.style.animationDelay = `${tierIndex * 0.2}s`;
  
  const header = el('div', 'tier-header', { text: tier.label || tier.id });
  section.appendChild(header);
  
  const grid = el('div', 'product-grid');
  section.appendChild(grid);
  
  const showFirst = Number.isInteger(tier.showFirst) ? tier.showFirst : 3;
  let items = Array.isArray(tier.items) ? tier.items : [];

  items = shuffleArray(items);

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
    const overlayUrl = baseUrl + 'overlay.webp';
    
    const card = buildProductCard({ src, name, secret: tier.id, isExtra, isFeatured, overlayUrl }, idx);
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
   OPTIMIZED CATALOG LOADING
======================================== */
async function loadCatalog() {
  try {
    setRandomColorScheme();
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
    
    const [response] = await Promise.all([
      fetch(MANIFEST_URL, { cache: 'no-cache' }),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const manifest = await response.json();
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];
    
    catalog.innerHTML = '';
    
    const imageObserver = createIntersectionObserver();
    
    tiers.forEach(tier => {
      const tierSection = buildTierSection(tier, baseUrl);
      catalog.appendChild(tierSection);
      
      const images = tierSection.querySelectorAll('.product-img[data-src]');
      images.forEach(img => imageObserver.observe(img));
    });
    
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
   🔥 FIX: PRODUCT CARD CLICK HANDLER
======================================== */
document.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;

  card.style.transform = 'scale(0.95)';
  setTimeout(() => { card.style.transform = ''; }, 150);

  const nameEl = card.querySelector('.product-name');
  const imgEl = card.querySelector('.product-img');
  const name = nameEl ? nameEl.textContent.trim() : '';
  
  // 🔥 FIX: Ambil dari data-src DULU (real URL), baru src (placeholder)
  const img = imgEl ? (imgEl.dataset.src || imgEl.src) : '';
  
  const secret = card.getAttribute('data-secret') || '';

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
const RULE_GROUP_B = new Set(['POPDEZ', 'POPWB', 'POPBOA', 'POPFLU', 'POPBIS']);

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
    gameIdInput.style.borderColor = '#FF4EB2';
    orderFormMessage.textContent = errorMsg;
    orderFormMessage.style.color = 'red';
    return;
  }

  if (!regex.test(gameId)) {
    gameIdInput.setCustomValidity(msg);
    gameIdInput.style.borderColor = '#FF4EB2';
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
   🔥 FIX: SECRET CODE VALIDATION
======================================== */
let isSecretCodeValid = false;
const secretCodeInput = document.getElementById('secretCode');
const secretCodeStatus = document.getElementById('secretCodeStatus');

const validationCache = new Map();
let validationAbortController = null;

function showSpinner() {
  if (!secretCodeStatus) return;
  secretCodeStatus.innerHTML = `
    <svg aria-label="Validando..." width="22" height="22" viewBox="0 0 50 50" role="img">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#FF4EB2" stroke-width="6" opacity="0.2"></circle>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#FF4EB2" stroke-width="6" stroke-linecap="round" stroke-dasharray="1,150" stroke-dashoffset="0">
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
  secretCodeStatus.innerHTML = '<ion-icon name="warning" style="color:#FF4EB2;font-size:1.6em"></ion-icon>';
}

function clearStatus() {
  if (!secretCodeStatus) return;
  secretCodeStatus.innerHTML = "";
}

// 🔥 FIX: Handle 404 error properly
async function performValidation(secretCode, productId) {
  const cacheKey = `${productId}-${secretCode}`;
  if (validationCache.has(cacheKey)) {
    console.log('✅ Using cached validation result');
    return validationCache.get(cacheKey);
  }

  if (validationAbortController) {
    validationAbortController.abort();
  }
  
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
    
    // 🔥 FIX: Check if response is OK before parsing JSON
    if (!res.ok) {
      console.warn('❌ Backend returned error:', res.status);
      return { status: 'error', message: 'Erro no servidor - tente novamente' };
    }
    
    const result = await res.json();
    
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
    orderFormMessage.textContent = result.message || 'Código inválido!';
    orderFormMessage.style.color = 'red';
    showWarning();
  }
  
  updateOrderSubmitBtn();
}, 600);

if (secretCodeInput) {
  secretCodeInput.addEventListener('input', function () {
    const secretCode = this.value.trim();
    const productId = document.getElementById('orderProductId').value;

    isSecretCodeValid = false;
    updateOrderSubmitBtn();

    if (secretCode.length === 8 && productId) {
      clearStatus();
      orderFormMessage.textContent = 'Digite o código completo...';
      orderFormMessage.style.color = '#444';
      
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

  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
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

  const fullNameInput = document.getElementById('fullName');
  if (fullNameInput) {
    fullNameInput.addEventListener('input', function() {
      if (/\d/.test(this.value)) {
        this.setCustomValidity('Nome não pode conter números!');
        this.style.borderColor = '#FF4EB2';
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

  applyGameIdRules();
  loadCatalog();
});

/* ========================================
   PERFORMANCE OPTIMIZATIONS
======================================== */
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

const criticalImages = [
  'https://i.ibb.co/BHYkmXfs/Whatsapp-Transparent.gif',
  'https://i.ibb.co/s9x87GHJ/Telegram-logo.gif'
];

criticalImages.forEach(src => {
  const img = new Image();
  img.src = src;
});

/* ========================================
   FLOATING FLOWERS DECORATION
======================================== */
(function() {
  const flowers = ['🌸', '🌺', '🌷'];
  const flowerCount = 8;
  const flowerPositions = [];
  
  const exclusionZones = [
    { x: 0, y: 0, width: 100, height: 20 },
    { x: 15, y: 10, width: 70, height: 85 },
    { x: 0, y: 90, width: 100, height: 10 }
  ];
  
  function isInExclusionZone(x, y, buffer = 5) {
    return exclusionZones.some(zone => {
      return x >= (zone.x - buffer) && x <= (zone.x + zone.width + buffer) &&
             y >= (zone.y - buffer) && y <= (zone.y + zone.height + buffer);
    });
  }
  
  function isTooClose(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const xPx = (x / 100) * vw;
    const yPx = (y / 100) * vh;
    const minDistancePx = 150;
    
    return flowerPositions.some(pos => {
      const posXPx = (pos.x / 100) * vw;
      const posYPx = (pos.y / 100) * vh;
      const distance = Math.sqrt(Math.pow(xPx - posXPx, 2) + Math.pow(yPx - posYPx, 2));
      return distance < minDistancePx;
    });
  }
  
  function getSafePosition() {
    let attempts = 0;
    const maxAttempts = 100;
    
    const safeAreas = [
      { x: 0, y: 25, width: 10, height: 15 },
      { x: 90, y: 25, width: 10, height: 15 },
      { x: 0, y: 45, width: 10, height: 15 },
      { x: 90, y: 45, width: 10, height: 15 },
      { x: 0, y: 70, width: 10, height: 15 },
      { x: 90, y: 70, width: 10, height: 15 }
    ];
    
    while (attempts < maxAttempts) {
      const area = safeAreas[Math.floor(Math.random() * safeAreas.length)];
      const x = area.x + Math.random() * area.width;
      const y = area.y + Math.random() * area.height;
      
      if (!isInExclusionZone(x, y, 10) && !isTooClose(x, y)) {
        return { x, y };
      }
      
      attempts++;
    }
    
    return null;
  }
  
  function createFlowers() {
    const flowerContainer = document.createElement('div');
    flowerContainer.style.position = 'fixed';
    flowerContainer.style.top = '0';
    flowerContainer.style.left = '0';
    flowerContainer.style.width = '100%';
    flowerContainer.style.height = '100%';
    flowerContainer.style.pointerEvents = 'none';
    flowerContainer.style.zIndex = '-1';
    flowerContainer.style.overflow = 'hidden';
    
    let successfulFlowers = 0;
    
    for (let i = 0; i < flowerCount && successfulFlowers < flowerCount; i++) {
      const pos = getSafePosition();
      if (!pos) continue;
      
      const flower = document.createElement('div');
      flower.className = 'flower-decoration';
      flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
      
      flowerPositions.push(pos);
      
      flower.style.left = pos.x + '%';
      flower.style.top = pos.y + '%';
      
      const size = 2 + Math.random() * 0.5;
      flower.style.fontSize = size + 'rem';
      flower.style.animationDelay = (Math.random() * -5) + 's';
      
      const duration = 5 + Math.random() * 3;
      flower.style.animationDuration = duration + 's';
      
      flower.style.pointerEvents = 'none';
      flower.style.userSelect = 'none';
      flower.style.webkitUserSelect = 'none';
      
      flowerContainer.appendChild(flower);
      successfulFlowers++;
    }
    
    document.body.appendChild(flowerContainer);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createFlowers, 100);
    });
  } else {
    setTimeout(createFlowers, 100);
  }
})();
