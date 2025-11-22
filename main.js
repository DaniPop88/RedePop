'use strict';

/* ========================================
   KONFIG
======================================== */
const BACKEND_URL = "https://redepop-backend.onrender.com";
const MANIFEST_URL = window.REDEPOP_MANIFEST_URL || "./manifest.json";

/* ========================================
   🎯 NEW: REDUCED MOTION DETECTION
======================================== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ========================================
   DYNAMIC CONFIGURATION
======================================== */
// Dynamic color schemes
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

/* ========================================
   🎯 NEW: ENHANCED LAZY LOADING WITH ERROR HANDLING
======================================== */
function createIntersectionObserver() {
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          const realSrc = img.dataset.src;
          
          // Load image directly (blur-up removed for reliability)
          img.classList.add('loading');
          img.src = realSrc;
          
          img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            console.log('Image loaded:', realSrc);
          };
          
          img.onerror = () => {
            console.error('Failed to load image:', realSrc);
            img.classList.remove('loading');
            img.classList.add('error');
            // Keep placeholder visible
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
   🎯 FLOATING LABELS & ERROR HANDLING
======================================== */
function initFloatingLabels() {
  const formFields = document.querySelectorAll('#orderForm input, #orderForm select');
  
  formFields.forEach(field => {
    // Check on load if field has value
    if (field.value) {
      field.closest('.form-field')?.classList.add('has-value');
    }
    
    // Update on input
    field.addEventListener('input', function() {
      const formField = this.closest('.form-field');
      if (this.value) {
        formField?.classList.add('has-value');
      } else {
        formField?.classList.remove('has-value');
      }
    });
    
    // Update on change (for select)
    field.addEventListener('change', function() {
      const formField = this.closest('.form-field');
      if (this.value) {
        formField?.classList.add('has-value');
      } else {
        formField?.classList.remove('has-value');
      }
    });
  });
}

/* ========================================
   🎯 ERROR MODAL
======================================== */
function showErrorModal(errors) {
  // Remove existing modal if any
  const existingModal = document.querySelector('.error-modal-overlay');
  if (existingModal) existingModal.remove();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'error-modal-overlay';
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'error-modal';
  
  // Create error list
  const errorList = errors.map(err => `<li>${err}</li>`).join('');
  
  modal.innerHTML = `
    <div class="error-modal-title">
      ⚠️ Atenção!
    </div>
    <p style="color:#666;margin-bottom:12px;">Preencha os seguintes campos:</p>
    <ul class="error-modal-list">
      ${errorList}
    </ul>
    <button class="error-modal-button" onclick="closeErrorModal()">OK, ENTENDI</button>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  // Trigger animation
  setTimeout(() => {
    overlay.classList.add('active');
    modal.classList.add('active');
  }, 10);
  
  // Close on overlay click
  overlay.addEventListener('click', closeErrorModal);
}

function closeErrorModal() {
  const overlay = document.querySelector('.error-modal-overlay');
  const modal = document.querySelector('.error-modal');
  
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
  
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

// Make it global
window.closeErrorModal = closeErrorModal;

/* ========================================
   🎯 FIELD VALIDATION WITH VISUAL FEEDBACK
======================================== */
function validateField(field, isValid, errorMsg = '') {
  const formField = field.closest('.form-field');
  if (!formField) return;
  
  // Remove all states
  formField.classList.remove('error', 'success', 'loading');
  
  // Remove existing error message
  const existingError = formField.querySelector('.error-message');
  if (existingError) existingError.remove();
  
  if (isValid) {
    formField.classList.add('success');
  } else if (errorMsg) {
    formField.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMsg;
    formField.appendChild(errorDiv);
  }
}

/* ========================================
   🎯 SCROLL TO FIRST ERROR
======================================== */
function scrollToFirstError() {
  const firstError = document.querySelector('.form-field.error');
  if (firstError) {
    firstError.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Shake the field
    const input = firstError.querySelector('input, select');
    if (input) {
      input.focus();
    }
  }
}

/* ========================================
   🎉 CONFETTI EFFECT
======================================== */
function triggerConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '10001';
  
  // Create 50 confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.3 + 's';
    confetti.style.animationDuration = 2 + Math.random() * 1 + 's';
    
    // Random pink shades
    const colors = ['#FF4EB2', '#FF69B4', '#FFB6C1', '#310404', '#FFC0CB'];
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    confettiContainer.appendChild(confetti);
  }
  
  document.body.appendChild(confettiContainer);
  
  // Remove after animation completes
  setTimeout(() => {
    confettiContainer.remove();
  }, 3000);
}

/* ========================================
   🌟 GLOW TRAIL EFFECT
======================================== */
function initGlowTrail() {
  if (prefersReducedMotion) return;
  
  let lastTrailTime = 0;
  const trailInterval = 30; // milliseconds between trails
  
  function createGlow(x, y) {
    const now = Date.now();
    if (now - lastTrailTime < trailInterval) return;
    lastTrailTime = now;
    
    const glow = document.createElement('div');
    glow.className = 'glow-trail';
    glow.style.left = x + 'px';
    glow.style.top = y + 'px';
    document.body.appendChild(glow);
    
    setTimeout(() => glow.remove(), 1500);
  }
  
  // Mouse movement
  document.addEventListener('mousemove', (e) => {
    createGlow(e.clientX, e.clientY);
  });
  
  // Touch movement
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      createGlow(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
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
   🎯 NEW: 3D TILT EFFECT FOR MOBILE
======================================== */
function add3DTiltEffect(card) {
  if (prefersReducedMotion) return; // Skip if reduced motion preferred
  
  let tiltTimeout;
  
  card.addEventListener('touchstart', function(e) {
    if (prefersReducedMotion) return;
    
    clearTimeout(tiltTimeout);
    this.style.transform = 'perspective(1000px) rotateX(2deg) rotateY(2deg) scale(1.02)';
    this.style.transition = 'transform 0.1s ease-out';
  });
  
  card.addEventListener('touchend', function() {
    if (prefersReducedMotion) return;
    
    tiltTimeout = setTimeout(() => {
      this.style.transform = '';
      this.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 100);
  });
}

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

/* ========================================
   🎯 NEW: STAGGERED CARD ENTRANCE
======================================== */
function buildProductCard({ src, name, secret, isExtra, isFeatured, overlayUrl }, index) {
  const cardClass = `product-card${isExtra ? ' extra-product' : ''}${isFeatured ? ' featured' : ''}`;
  const card = el('div', cardClass, { 'data-secret': secret });
  
  // 🎯 STAGGERED ENTRANCE - Longer delay for better effect
  if (!prefersReducedMotion) {
    card.style.animationDelay = `${index * 0.08}s`;
  }
  
  // Featured badge
  if (isFeatured) {
    const badge = el('div', 'featured-badge', { text: '⭐' });
    card.appendChild(badge);
  }
  
  // Create wrapper for image + overlay
  const imgWrapper = el('div', 'product-img-wrapper');
  
  // 🎯 SIMPLE PLACEHOLDER - Reliable gray square
  const img = el('img', 'product-img', { 
    'data-src': src, 
    alt: name,
    loading: 'lazy',
    decoding: 'async',
    // Simple gray placeholder (more reliable)
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3C/svg%3E'
  });
  
  // Add overlay frame
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
  
  // 🎯 ADD 3D TILT EFFECT
  add3DTiltEffect(card);
  
  return card;
}

function buildTierSection(tier, baseUrl) {
  const section = el('section', 'reward-tier', { 'data-tier': tier.id });
  
  // Animation delay for tiers
  const tierIndex = parseInt(tier.id.split('-')[1]) || 1;
  if (!prefersReducedMotion) {
    section.style.animationDelay = `${tierIndex * 0.15}s`;
  }
  
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
   🎯 NEW: SKELETON LOADER
======================================== */
function showSkeletonLoader() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (!loadingOverlay) return;
  
  loadingOverlay.innerHTML = `
    <div style="width: 100%; max-width: 700px; padding: 20px;">
      <div class="skeleton-header"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  `;
}

/* ========================================
   OPTIMIZED CATALOG LOADING
======================================== */
async function loadCatalog() {
  try {
    setRandomColorScheme();
    
    if (loadingOverlay) {
      showSkeletonLoader(); // Show skeleton instead of spinner
      loadingOverlay.style.display = 'flex';
    }
    
    const [response] = await Promise.all([
      fetch(MANIFEST_URL, { cache: 'no-cache' }),
      new Promise(resolve => setTimeout(resolve, 500)) // Reduced from 800ms
    ]);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const manifest = await response.json();
    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];
    
    catalog.innerHTML = '';
    
    console.log('📦 Manifest loaded:', manifest);
    console.log('🌐 Base URL:', baseUrl);
    console.log('📚 Tiers count:', tiers.length);
    
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
    setTimeout(() => {
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }
    }, 200);
    
  } catch (error) {
    console.error('Error loading catalog:', error);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="color: white; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
          <div>Erro ao carregar catálogo</div>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #FF4EB2; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">TENTAR NOVAMENTE</button>
        </div>
      `;
    }
  }
}

/* ========================================
   🎯 NEW: STICKY FLOATING CTA BUTTON
======================================== */
function createFloatingCTA() {
  const floatingCTA = document.createElement('div');
  floatingCTA.id = 'floatingCTA';
  floatingCTA.className = 'floating-cta hidden';
  floatingCTA.innerHTML = `
    <a href="https://poppremio.com/wa" target="_blank" class="floating-cta-btn">
      <img src="https://i.ibb.co/BHYkmXfs/Whatsapp-Transparent.gif" alt="WhatsApp" />
      <span>CONTATE MENTOR</span>
    </a>
  `;
  document.body.appendChild(floatingCTA);
  
  // Show/hide based on scroll
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 300) {
      floatingCTA.classList.remove('hidden');
    } else {
      floatingCTA.classList.add('hidden');
    }
    
    lastScroll = currentScroll;
  });
}

/* ========================================
   PRODUCT CARD CLICK HANDLER
======================================== */
catalog.addEventListener('click', e => {
  const card = e.target.closest('.product-card');
  if (card && !card.classList.contains('extra-product')) {
    const name = card.querySelector('.product-name')?.textContent || 'Produto';
    const img = card.querySelector('.product-img')?.src || '';
    const secret = card.dataset.secret || '';
    updateOrderProductInfo(name, img, secret);
    orderModal.classList.add('active');
  }
});

/* ========================================
   VEJA MAIS BUTTON HANDLER
======================================== */
catalog.addEventListener('click', e => {
  const btn = e.target.closest('.veja-mais-btn');
  if (!btn) return;
  
  const tierId = btn.dataset.tier;
  const tier = btn.closest('.reward-tier');
  if (!tier) return;
  
  const extras = tier.querySelectorAll('.extra-product');
  const isExpanded = btn.classList.contains('expanded');
  
  if (isExpanded) {
    extras.forEach(ex => ex.hidden = true);
    btn.querySelector('.btn-text').textContent = 'VEJA MAIS';
  } else {
    extras.forEach((ex, idx) => {
      ex.hidden = false;
      // Stagger animation for revealed items
      if (!prefersReducedMotion) {
        ex.style.animationDelay = `${idx * 0.05}s`;
      }
    });
    btn.querySelector('.btn-text').textContent = 'VER MENOS';
  }
  btn.classList.toggle('expanded');
});

/* ========================================
   MODAL HANDLERS
======================================== */
orderModalCloseBtn.addEventListener('click', () => {
  orderModal.classList.remove('active');
});

orderModal.addEventListener('click', e => {
  if (e.target === orderModal) {
    orderModal.classList.remove('active');
  }
});

/* ========================================
   SECRET CODE VALIDATION
======================================== */
let isSecretValid = false;

const secretCodeInput = document.getElementById('secretCode');
const secretCodeStatus = document.getElementById('secretCodeStatus');

function updateOrderSubmitBtn() {
  const platform = platformSelect?.value || '';
  const gameId = gameIdInput?.value || '';
  const cpf = document.getElementById('cpf')?.value || '';
  
  const isValid = isSecretValid && 
                  platform && 
                  gameId && 
                  isGameIdValid && 
                  cpf.length === 11 && 
                  isCPFValid;
  
  orderSubmitBtn.disabled = !isValid;
}

async function checkSecretCode(code) {
  if (!code || code.length < 6) {
    isSecretValid = false;
    secretCodeStatus.textContent = '';
    updateOrderSubmitBtn();
    return;
  }
  
  try {
    const res = await fetch(`${BACKEND_URL}/validate-secret?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    
    isSecretValid = data.valid === true;
    
    if (isSecretValid) {
      secretCodeStatus.innerHTML = '<span style="color: #10b981; font-size: 1.5rem;">✓</span>';
    } else {
      secretCodeStatus.innerHTML = '<span style="color: #ef4444; font-size: 1.5rem;">✗</span>';
    }
  } catch (err) {
    console.error('Error checking secret code:', err);
    isSecretValid = false;
    secretCodeStatus.textContent = '';
  }
  
  updateOrderSubmitBtn();
}

const debouncedSecretCheck = debounce(checkSecretCode, 500);

secretCodeInput.addEventListener('input', function() {
  this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (this.value.length > 8) {
    this.value = this.value.slice(0, 8);
  }
  debouncedSecretCheck(this.value);
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
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

/* ========================================
   GAME ID VALIDATION
======================================== */
let isGameIdValid = false;

const PLATFORM_RULES = {
  'POPBIS': {
    pattern: /^[0-9]{9,12}$/,
    placeholder: 'Ex: 123456789012 (9-12 dígitos)',
    maxLength: 12
  },
  'POPN1': {
    pattern: /^[A-Za-z0-9]{6,12}$/,
    placeholder: 'Ex: ABC123XYZ (6-12 caracteres)',
    maxLength: 12
  }
};

function applyGameIdRules() {
  const platform = platformSelect?.value;
  if (!platform || !gameIdInput) return;
  
  const rules = PLATFORM_RULES[platform];
  if (!rules) {
    gameIdInput.placeholder = 'Selecione a plataforma primeiro';
    gameIdInput.maxLength = 12;
    return;
  }
  
  gameIdInput.placeholder = rules.placeholder;
  gameIdInput.maxLength = rules.maxLength;
  gameIdInput.value = '';
  isGameIdValid = false;
  updateOrderSubmitBtn();
}

function validateGameId() {
  const platform = platformSelect?.value;
  const gameId = gameIdInput?.value;
  
  if (!platform || !gameId) {
    isGameIdValid = false;
    return;
  }
  
  const rules = PLATFORM_RULES[platform];
  if (!rules) {
    isGameIdValid = false;
    return;
  }
  
  isGameIdValid = rules.pattern.test(gameId);
  
  if (!isGameIdValid && gameId.length > 0) {
    gameIdInput.style.borderColor = '#ef4444';
  } else {
    gameIdInput.style.borderColor = '';
  }
}

/* ========================================
   FORM SUBMISSION
======================================== */
orderForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Clear all previous errors
  document.querySelectorAll('.form-field').forEach(f => {
    f.classList.remove('error', 'success');
  });
  
  // Collect validation errors
  const errors = [];
  const errorFields = [];
  
  // Validate all required fields
  const fullName = document.getElementById('fullName');
  const phone = document.getElementById('phone');
  const zip = document.getElementById('zip');
  const state = document.getElementById('state');
  const city = document.getElementById('city');
  const neighborhood = document.getElementById('neighborhood');
  const street = document.getElementById('street');
  const number = document.getElementById('number');
  const address = document.getElementById('address');
  const platform = platformSelect;
  const gameId = gameIdInput;
  const cpf = document.getElementById('cpf');
  const secretCode = secretCodeInput;
  
  // Check each field
  if (!fullName.value.trim()) {
    errors.push('Nome Completo');
    errorFields.push(fullName);
    validateField(fullName, false, 'Campo obrigatório');
  } else if (/\d/.test(fullName.value)) {
    errors.push('Nome não pode conter números');
    errorFields.push(fullName);
    validateField(fullName, false, 'Nome não pode conter números');
  } else {
    validateField(fullName, true);
  }
  
  if (!phone.value.trim()) {
    errors.push('Número de Telefone');
    errorFields.push(phone);
    validateField(phone, false, 'Campo obrigatório');
  } else {
    validateField(phone, true);
  }
  
  if (!zip.value.trim()) {
    errors.push('CEP');
    errorFields.push(zip);
    validateField(zip, false, 'Campo obrigatório');
  } else {
    validateField(zip, true);
  }
  
  if (!state.value) {
    errors.push('Estado');
    errorFields.push(state);
    validateField(state, false, 'Selecione o Estado');
  } else {
    validateField(state, true);
  }
  
  if (!city.value.trim()) {
    errors.push('Cidade');
    errorFields.push(city);
    validateField(city, false, 'Campo obrigatório');
  } else {
    validateField(city, true);
  }
  
  if (!neighborhood.value.trim()) {
    errors.push('Bairro');
    errorFields.push(neighborhood);
    validateField(neighborhood, false, 'Campo obrigatório');
  } else {
    validateField(neighborhood, true);
  }
  
  if (!street.value.trim()) {
    errors.push('Rua/Avenida');
    errorFields.push(street);
    validateField(street, false, 'Campo obrigatório');
  } else {
    validateField(street, true);
  }
  
  if (!number.value.trim()) {
    errors.push('Número');
    errorFields.push(number);
    validateField(number, false, 'Campo obrigatório');
  } else {
    validateField(number, true);
  }
  
  if (!address.value.trim()) {
    errors.push('Complemento/Descrição do Prédio');
    errorFields.push(address);
    validateField(address, false, 'Campo obrigatório');
  } else {
    validateField(address, true);
  }
  
  if (!platform.value) {
    errors.push('Plataforma');
    errorFields.push(platform);
    validateField(platform, false, 'Escolha a plataforma');
  } else {
    validateField(platform, true);
  }
  
  if (!gameId.value.trim()) {
    errors.push('ID de Jogo');
    errorFields.push(gameId);
    validateField(gameId, false, 'Campo obrigatório');
  } else if (!isGameIdValid) {
    errors.push('ID de Jogo inválido para a plataforma');
    errorFields.push(gameId);
    validateField(gameId, false, 'ID inválido para esta plataforma');
  } else {
    validateField(gameId, true);
  }
  
  if (!cpf.value.trim()) {
    errors.push('CPF');
    errorFields.push(cpf);
    validateField(cpf, false, 'Campo obrigatório');
  } else if (!isCPFValid) {
    errors.push('CPF inválido');
    errorFields.push(cpf);
    validateField(cpf, false, 'CPF inválido! Confira os números');
  } else {
    validateField(cpf, true);
  }
  
  if (!secretCode.value.trim()) {
    errors.push('Código Secreto');
    errorFields.push(secretCode);
    validateField(secretCode, false, 'Campo obrigatório');
  } else if (!isSecretValid) {
    errors.push('Código Secreto inválido');
    errorFields.push(secretCode);
    validateField(secretCode, false, 'Código incorreto! Solicite ao mentor');
  } else {
    validateField(secretCode, true);
  }
  
  // If there are errors, show modal and scroll to first error
  if (errors.length > 0) {
    showErrorModal(errors);
    
    // Scroll to first error after a short delay
    setTimeout(() => {
      scrollToFirstError();
    }, 100);
    
    // Show error message
    orderFormMessage.textContent = `❌ ${errors.length} campo(s) precisam ser corrigidos`;
    orderFormMessage.className = 'error';
    orderFormMessage.style.display = 'block';
    
    return;
  }
  
  // All validation passed, submit form
  const fd = new FormData(this);
  const data = Object.fromEntries(fd.entries());
  
  orderSubmitBtn.disabled = true;
  orderFormMessage.textContent = '⏳ Enviando pedido...';
  orderFormMessage.className = 'loading';
  orderFormMessage.style.display = 'block';
  
  try {
    const res = await fetch(`${BACKEND_URL}/submit-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await res.json();
    
    if (res.ok && result.success) {
      orderFormMessage.textContent = '✅ Pedido enviado com sucesso!';
      orderFormMessage.className = 'success';
      orderFormMessage.style.display = 'block';
      orderForm.reset();
      isSecretValid = false;
      isCPFValid = false;
      isGameIdValid = false;
      secretCodeStatus.textContent = '';
      
      // 🎉 TRIGGER CONFETTI
      if (!prefersReducedMotion) {
        triggerConfetti();
      }
      
      // Clear all field states
      document.querySelectorAll('.form-field').forEach(f => {
        f.classList.remove('error', 'success', 'has-value');
      });
      
      setTimeout(() => {
        orderModal.classList.remove('active');
        orderFormMessage.style.display = 'none';
        orderFormMessage.className = '';
      }, 2000);
    } else {
      orderFormMessage.textContent = `❌ ${result.message || 'Erro ao enviar pedido'}`;
      orderFormMessage.className = 'error';
      orderFormMessage.style.display = 'block';
      orderSubmitBtn.disabled = false;
    }
  } catch (err) {
    console.error('Error submitting order:', err);
    orderFormMessage.textContent = '❌ Erro de conexão. Tente novamente.';
    orderFormMessage.className = 'error';
    orderFormMessage.style.display = 'block';
    orderSubmitBtn.disabled = false;
  }
});

/* ========================================
   DOM READY
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

  applyGameIdRules();
  
  // 🎯 INITIALIZE FLOATING LABELS
  initFloatingLabels();
  
  // 🎯 CREATE FLOATING CTA
  createFloatingCTA();
  
  // Load catalog
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
   FLOATING FLOWERS DECORATION
======================================== */
(function() {
  if (prefersReducedMotion) return; // Skip flowers if reduced motion preferred
  
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

/* ========================================
   🎬 ENHANCED LOADING SEQUENCE
======================================== */
(function() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingPercentage = document.getElementById('loadingPercentage');
  
  if (!loadingOverlay || !loadingPercentage) return;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;
    
    loadingPercentage.textContent = Math.floor(progress) + '%';
    
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
      }, 300);
    }
  }, 100);
  
  // Fallback: Force hide after 3 seconds
  setTimeout(() => {
    clearInterval(interval);
    loadingOverlay.classList.add('hidden');
  }, 3000);
})();

/* ========================================
   🌟 INITIALIZE GLOW TRAIL
======================================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlowTrail);
} else {
  initGlowTrail();
}