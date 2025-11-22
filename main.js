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
   🚀 STICKY CTA DOCK - Show/Hide on Scroll
======================================== */
let lastScrollY = 0;
let stickyCTADock = null;
const SCROLL_THRESHOLD = 5;

function initStickyCTADock() {
  // Create sticky CTA dock
  stickyCTADock = document.createElement('div');
  stickyCTADock.className = 'sticky-cta-dock';
  stickyCTADock.innerHTML = `
    <a href="https://poppremio.com/wa" target="_blank" class="sticky-cta-btn whatsapp-btn">
      <img src="https://i.ibb.co/BHYkmXfs/Whatsapp-Transparent.gif" alt="WhatsApp" />
      <span>WHATSAPP</span>
    </a>
    <a href="https://poppremio.com/tg" target="_blank" class="sticky-cta-btn telegram-btn">
      <img src="https://i.ibb.co/s9x87GHJ/Telegram-logo.gif" alt="Telegram" />
      <span>TELEGRAM</span>
    </a>
  `;
  document.body.appendChild(stickyCTADock);

  // Handle scroll behavior
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScrollCTA();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function handleScrollCTA() {
  const currentScrollY = window.scrollY;
  
  if (Math.abs(currentScrollY - lastScrollY) < SCROLL_THRESHOLD) {
    return;
  }

  if (currentScrollY > lastScrollY && currentScrollY > 150) {
    // Scrolling down - hide
    stickyCTADock.classList.add('hidden');
  } else {
    // Scrolling up - show
    stickyCTADock.classList.remove('hidden');
  }
  
  lastScrollY = currentScrollY;
}

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

/* ========================================
   🚀 OPTIMIZED IMAGE OBSERVER - Eager Load First 3
======================================== */
function createIntersectionObserver(isEager = false) {
  const options = isEager 
    ? { rootMargin: '300px', threshold: 0.01 } // Eager load
    : { rootMargin: '50px', threshold: 0.1 };  // Lazy load
    
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
  }, options);
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

function buildProductCard({ src, name, secret, isExtra, isFeatured, overlayUrl }, index, isFirstRow) {
  const cardClass = `product-card${isExtra ? ' extra-product' : ''}${isFeatured ? ' featured' : ''}`;
  const card = el('div', cardClass, { 'data-secret': secret });
  
  // 🚀 OPTIMIZED: Stagger only first row (first 3 items)
  if (isFirstRow && index < 3) {
    card.style.animationDelay = `${index * 0.04}s`;
  }
  
  if (isFeatured) {
    const badge = el('div', 'featured-badge', { text: '⭐' });
    card.appendChild(badge);
  }
  
  const imgWrapper = el('div', 'product-img-wrapper');
  
  const img = el('img', 'product-img', { 
    'data-src': src, 
    alt: name,
    loading: index < 3 ? 'eager' : 'lazy', // 🚀 First 3 eager
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
  
  // 🚀 OPTIMIZED: Reduced delay multiplier
  const tierIndex = parseInt(tier.id.split('-')[1]) || 1;
  section.style.animationDelay = `${tierIndex * 0.15}s`;
  
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
    
    const card = buildProductCard({ src, name, secret: tier.id, isExtra, isFeatured, overlayUrl }, idx, tierIndex === 1);
    grid.appendChild(card);
  });
  
  // 🎯 SMART "SHOW MORE" WITH COUNTER
  if (items.length > showFirst) {
    const extraCount = items.length - showFirst;
    const btn = el('button', 'veja-mais-btn', { 'data-tier': tier.id });
    btn.appendChild(el('span', 'btn-text', { text: 'VEJA MAIS' }));
    btn.appendChild(el('span', 'btn-count', { text: `+${extraCount}` }));
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
    
    // 🚀 OPTIMIZED: Reduced to 600ms
    const [response] = await Promise.all([
      fetch(MANIFEST_URL, { cache: 'no-cache' }),
      new Promise(resolve => setTimeout(resolve, 600))
    ]);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const manifest = await response.json();
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];
    
    catalog.innerHTML = '';
    
    // Create observers
    const eagerObserver = createIntersectionObserver(true);
    const lazyObserver = createIntersectionObserver(false);
    
    tiers.forEach(tier => {
      const tierSection = buildTierSection(tier, baseUrl);
      catalog.appendChild(tierSection);
      
      // 🚀 EAGER LOAD first 3 images, lazy load rest
      const images = tierSection.querySelectorAll('.product-img[data-src]');
      images.forEach((img, idx) => {
        if (idx < 3) {
          eagerObserver.observe(img);
        } else {
          lazyObserver.observe(img);
        }
      });
    });
    
    // 🚀 OPTIMIZED: Hide overlay immediately after minimal time
    setTimeout(() => {
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 300);
      }
    }, 100);
    
  } catch (err) {
    console.error('Load error:', err);
    catalog.innerHTML = '<p style="text-align:center; padding:40px;">⚠️ Erro ao carregar catálogo. Tente novamente.</p>';
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.style.display = 'none', 300);
    }
  }
}

/* ========================================
   EVENT DELEGATION: VEJA MAIS BUTTONS
======================================== */
catalog.addEventListener('click', (e) => {
  const btn = e.target.closest('.veja-mais-btn');
  if (btn) {
    const tierId = btn.dataset.tier;
    const tier = btn.closest('.reward-tier');
    const extras = tier.querySelectorAll('.extra-product[hidden]');
    
    if (extras.length > 0) {
      extras.forEach(card => {
        card.hidden = false;
        card.classList.add('fade-in');
      });
      btn.classList.add('expanded');
      const btnText = btn.querySelector('.btn-text');
      const btnCount = btn.querySelector('.btn-count');
      if (btnText) btnText.textContent = 'VER MENOS';
      if (btnCount) btnCount.textContent = '';
    } else {
      const allExtras = tier.querySelectorAll('.extra-product');
      allExtras.forEach(card => {
        card.hidden = true;
        card.classList.remove('fade-in');
      });
      btn.classList.remove('expanded');
      const btnText = btn.querySelector('.btn-text');
      const btnCount = btn.querySelector('.btn-count');
      if (btnText) btnText.textContent = 'VEJA MAIS';
      if (btnCount) btnCount.textContent = `+${allExtras.length}`;
    }
  }
  
  const card = e.target.closest('.product-card');
  if (card) {
    const secret = card.dataset.secret;
    const name = card.querySelector('.product-name')?.textContent || 'Produto';
    const img = card.querySelector('.product-img')?.src || '';
    updateOrderProductInfo(name, img, secret);
    orderModal.classList.add('active');
  }
});

/* ========================================
   MODAL CONTROL
======================================== */
orderModalCloseBtn.addEventListener('click', () => {
  orderModal.classList.remove('active');
});

orderModal.addEventListener('click', (e) => {
  if (e.target === orderModal) {
    orderModal.classList.remove('active');
  }
});

/* ========================================
   SECRET CODE VALIDATION
======================================== */
let isSecretCodeValid = false;
const secretCodeInput = document.getElementById('secretCode');
const secretCodeStatus = document.getElementById('secretCodeStatus');

async function validateSecretCode(code) {
  if (!code || code.length < 8) {
    secretCodeStatus.innerHTML = '';
    isSecretCodeValid = false;
    updateOrderSubmitBtn();
    return;
  }
  
  secretCodeStatus.innerHTML = '<div style="width:16px;height:16px;border:2px solid #eb0b0a;border-top:2px solid transparent;border-radius:50%;animation:spin 0.6s linear infinite"></div>';
  
  try {
    const res = await fetch(`${BACKEND_URL}/validate-secret-code?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    
    if (data.valid) {
      secretCodeStatus.innerHTML = '✅';
      isSecretCodeValid = true;
    } else {
      secretCodeStatus.innerHTML = '❌';
      isSecretCodeValid = false;
    }
  } catch (err) {
    console.error('Validation error:', err);
    secretCodeStatus.innerHTML = '⚠️';
    isSecretCodeValid = false;
  }
  
  updateOrderSubmitBtn();
}

const debouncedValidateSecretCode = debounce((code) => {
  validateSecretCode(code);
}, 500);

secretCodeInput.addEventListener('input', function() {
  this.value = this.value.toUpperCase();
  if (this.value.length > 8) {
    this.value = this.value.slice(0, 8);
  }
  debouncedValidateSecretCode(this.value);
});

/* ========================================
   CPF VALIDATION
======================================== */
let isCPFValid = false;

function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;
  
  return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2;
}

/* ========================================
   GAME ID VALIDATION
======================================== */
let isGameIdValid = false;

function applyGameIdRules() {
  const platform = platformSelect?.value;
  
  if (!platform || !gameIdInput) return;
  
  if (platform === 'POPBIS') {
    gameIdInput.placeholder = 'Digite 11 dígitos (ex: 12345678901)';
    gameIdInput.maxLength = 11;
  } else if (platform === 'POPN1') {
    gameIdInput.placeholder = 'Digite 8-9 dígitos (ex: 12345678)';
    gameIdInput.maxLength = 9;
  } else {
    gameIdInput.placeholder = 'Selecione a plataforma primeiro';
    gameIdInput.maxLength = 12;
  }
  
  gameIdInput.value = '';
  isGameIdValid = false;
}

function validateGameId() {
  const platform = platformSelect?.value;
  const gameId = gameIdInput?.value.replace(/[^\d]/g, '');
  
  if (!platform || !gameId) {
    isGameIdValid = false;
    return;
  }
  
  if (platform === 'POPBIS') {
    isGameIdValid = gameId.length === 11;
  } else if (platform === 'POPN1') {
    isGameIdValid = gameId.length >= 8 && gameId.length <= 9;
  } else {
    isGameIdValid = false;
  }
}

/* ========================================
   SUBMIT BUTTON STATE
======================================== */
function updateOrderSubmitBtn() {
  const allValid = isSecretCodeValid && isCPFValid && isGameIdValid;
  orderSubmitBtn.disabled = !allValid;
}

/* ========================================
   FORM SUBMIT
======================================== */
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!isSecretCodeValid || !isCPFValid || !isGameIdValid) {
    orderFormMessage.textContent = '⚠️ Verifique todos os campos!';
    orderFormMessage.style.color = 'red';
    return;
  }
  
  orderSubmitBtn.disabled = true;
  orderFormMessage.textContent = 'Enviando...';
  orderFormMessage.style.color = '#007bff';
  
  const formData = new FormData(orderForm);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const res = await fetch(`${BACKEND_URL}/submit-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    
    if (res.ok && result.success) {
      orderFormMessage.textContent = '✅ Pedido enviado com sucesso!';
      orderFormMessage.style.color = 'green';
      orderForm.reset();
      isSecretCodeValid = false;
      isCPFValid = false;
      isGameIdValid = false;
      secretCodeStatus.innerHTML = '';
      setTimeout(() => {
        orderModal.classList.remove('active');
        orderFormMessage.textContent = '';
      }, 2000);
    } else {
      orderFormMessage.textContent = `❌ ${result.message || 'Erro ao enviar'}`;
      orderFormMessage.style.color = 'red';
      orderSubmitBtn.disabled = false;
    }
  } catch (err) {
    console.error('Submit error:', err);
    orderFormMessage.textContent = '❌ Erro de conexão. Tente novamente.';
    orderFormMessage.style.color = 'red';
    orderSubmitBtn.disabled = false;
  }
});

/* ========================================
   DOM READY INITIALIZATION
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  platformSelect = document.getElementById('platform');
  gameIdInput = document.getElementById('gameId');

  // Setup CPF validation
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

  // Setup full name validation
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

  // 📱 Setup inputmode for better mobile keyboards
  const zipInput = document.getElementById('zip');
  if (zipInput) zipInput.setAttribute('inputmode', 'numeric');
  
  const phoneInput = document.getElementById('phone');
  if (phoneInput) phoneInput.setAttribute('inputmode', 'tel');

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
  
  // 🚀 Initialize sticky CTA dock
  initStickyCTADock();
  
  // Load catalog
  loadCatalog();
});

/* ========================================
   PERFORMANCE OPTIMIZATIONS
======================================== */
// Preload critical images
const criticalImages = [
  'https://i.ibb.co/BHYkmXfs/Whatsapp-Transparent.gif',
  'https://i.ibb.co/s9x87GHJ/Telegram-logo.gif'
];

criticalImages.forEach(src => {
  const img = new Image();
  img.src = src;
});

/* ========================================
   🌸 FLOATING FLOWERS DECORATION 🌺
   WITH SUPER STRICT ANTI-COLLISION SYSTEM
======================================== */
(function() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // Skip flowers for accessibility
  
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
      
      if (!pos) {
        console.log('Could not find safe position for flower', i);
        continue;
      }
      
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
    
    console.log(`Created ${successfulFlowers} flowers safely positioned`);
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
