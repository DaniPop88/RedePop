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
  const section = el('section', 'reward-tier', { 'data-tier': tier.id });

  const header = el('div', 'tier-header', { text: tier.label || tier.id });
  section.appendChild(header);

  const grid = el('div', 'product-grid');
  section.appendChild(grid);

  const showFirst = Number.isInteger(tier.showFirst) ? tier.showFirst : 3;
  const items = Array.isArray(tier.items) ? tier.items : [];

  items.forEach((item, idx) => {
    const src = item.url ? item.url : (baseUrl + item.file);
    const name = item.name || (item.file || item.url || 'Produto');
    const isExtra = idx >= showFirst;
    const card = buildProductCard({ src, name, secret: tier.id, isExtra });
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

async function loadCatalog() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();

    const baseUrl = (manifest.baseUrl || '').trim();
    const tiers = Array.isArray(manifest.tiers) ? manifest.tiers : [];

    catalog.innerHTML = '';

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
   VALIDATION SECTION
======================================== */
function setupValidationFields() {
  const formDivider = document.querySelector('.form-divider');
  if (formDivider) {
    let validationSection = document.createElement('div');
    validationSection.className = 'validation-section';

    ['gameId', 'cpf', 'secretCode'].forEach(fieldId => {
      const label = document.querySelector(`label[for="${fieldId}"]`);
      const input = document.getElementById(fieldId);
      if (label && input) {
        let wrapper = document.createElement('div');
        wrapper.className = 'validation-field';
        label.parentNode.insertBefore(wrapper, label);
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        validationSection.appendChild(wrapper);

        input.addEventListener('input', function () {
          wrapper.classList.add('validating');
          wrapper.classList.remove('valid', 'invalid');
          setTimeout(() => {
            const isValid = fieldId === 'cpf' ? validateCPF(this.value) : this.value.length >= 3;
            wrapper.classList.remove('validating');
            wrapper.classList.add(isValid ? 'valid' : 'invalid');
          }, 800);
        });
      }
    });

    formDivider.parentNode.insertBefore(validationSection, formDivider.nextSibling);
  }
}

function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0, rest;

  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = sum % 11;
  rest = rest < 2 ? 0 : 11 - rest;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = sum % 11;
  rest = rest < 2 ? 0 : 11 - rest;
  return rest === parseInt(cpf.substring(10, 11));
}

/* ========================================
   BOOTSTRAP: MULAIKAN
======================================== */
document.addEventListener('DOMContentLoaded', function () {
  loadCatalog();
  setupValidationFields();
});
