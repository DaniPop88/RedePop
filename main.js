'use strict';

const BACKEND_URL = "https://redepop-backend.onrender.com";

// ======================================== Helper State ========================================
let isCPFValid = false;
let isSecretCodeValid = false;
let currentProductName = "";
let currentProductImg = "";

// ======================================== Modal & Mobile Menu ========================================
const modal = document.querySelector('[data-modal]');
const modalCloseBtn = document.querySelector('[data-modal-close]');
const modalCloseOverlay = document.querySelector('[data-modal-overlay]');

const modalCloseFunc = function () { modal.classList.add('closed'); }

modalCloseOverlay.addEventListener('click', modalCloseFunc);
modalCloseBtn.addEventListener('click', modalCloseFunc);

const notificationToast = document.querySelector('[data-toast]');
const toastCloseBtn = document.querySelector('[data-toast-close]');
toastCloseBtn.addEventListener('click', function() {
    notificationToast.classList.add('closed');
});

const mobileMenuOpenBtn = document.querySelectorAll('[data-mobile-menu-open-btn]');
const mobileMenu = document.querySelectorAll('[data-mobile-menu]');
const mobileMenuCloseBtn = document.querySelectorAll('[data-mobile-menu-close-btn]');
const overlay = document.querySelector('[data-overlay]');

for (let i = 0; i < mobileMenuOpenBtn.length; i++) {
    const mobileMenuCloseFunc = function () {
        mobileMenu[i].classList.remove('active');
        overlay.classList.remove('active');
    }
    mobileMenuOpenBtn[i].addEventListener('click', function () {
        mobileMenu[i].classList.add('active');
        overlay.classList.add('active');
    })
    mobileMenuCloseBtn[i].addEventListener('click', mobileMenuCloseFunc);
    overlay.addEventListener('click', mobileMenuCloseFunc);
}

// ======================================== Banner Slider ========================================
const sliderItems = document.querySelectorAll('.slider-item');
let currentSlide = 0;
const slideInterval = 4000;
function showSlide(index) {
    sliderItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}
showSlide(currentSlide);
setInterval(() => {
    currentSlide = (currentSlide + 1) % sliderItems.length;
    showSlide(currentSlide);
}, slideInterval);

// ======================================== Countdown ========================================
function startMonthlyCountdownAll() {
    const endDate = new Date('2025-08-31T23:59:59');
    function updateCountdownAll() {
        const now = new Date();
        const diff = endDate - now;
        let days = 0, hours = 0, minutes = 0, seconds = 0;
        if (diff > 0) {
            days = Math.floor(diff / (1000 * 60 * 60 * 24));
            hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            minutes = Math.floor((diff / (1000 * 60)) % 60);
            seconds = Math.floor((diff / 1000) % 60);
        }
        document.querySelectorAll('.countdown').forEach(function(box) {
            const numbers = box.querySelectorAll('.display-number');
            if (numbers.length >= 4) {
                numbers[0].textContent = String(days).padStart(2, '0');
                numbers[1].textContent = String(hours).padStart(2, '0');
                numbers[2].textContent = String(minutes).padStart(2, '0');
                numbers[3].textContent = String(seconds).padStart(2, '0');
            }
        });
    }
    updateCountdownAll();
    setInterval(updateCountdownAll, 1000);
}
document.addEventListener('DOMContentLoaded', function() {
    startMonthlyCountdownAll();
});

// ======================================== CPF Validation ========================================
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g,'');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  var sum = 0, rest;
  for (var i=1; i<=9; i++) sum += parseInt(cpf.substring(i-1,i)) * (11-i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(9,10))) return false;
  sum = 0;
  for (i=1; i<=10; i++) sum += parseInt(cpf.substring(i-1,i)) * (12-i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(10,11))) return false;
  return true;
}

// ======================================== Order Modal Logic ========================================
const orderModal = document.getElementById('orderModal');
const orderModalCloseBtn = document.getElementById('orderModalCloseBtn');
const orderForm = document.getElementById('orderForm');
const orderSubmitBtn = document.getElementById('orderSubmitBtn');
const orderFormMessage = document.getElementById('orderFormMessage');

// ADD: Product info section in modal, if not exist, create
function ensureProductInfoArea() {
  if (!document.getElementById('orderProductInfo')) {
    const form = document.getElementById('orderForm');
    const infoDiv = document.createElement('div');
    infoDiv.id = "orderProductInfo";
    infoDiv.style = "text-align:center; margin-bottom: 16px;";
    infoDiv.innerHTML = `
      <img id="orderProductImg" src="" alt="" style="max-width:100px;max-height:100px;margin-bottom:8px;">
      <div id="orderProductName" style="font-weight:bold;"></div>
    `;
    form.parentNode.insertBefore(infoDiv, form);
  }
}
ensureProductInfoArea();

function updateOrderProductInfo(name, img) {
  document.getElementById('orderProductName').textContent = name || '';
  document.getElementById('orderProductImg').src = img || '';
}

// ======================================== Order Modal Open ========================================
document.querySelectorAll('.claim-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    orderModal.classList.add('active');
    document.getElementById('orderProductId').value = btn.getAttribute('data-product-id');

    // Cari info produk otomatis dari DOM
    let productName = '';
    let productImg = '';

    // 1. Cek showcase title (nama produk)
    const showcase = btn.closest('.showcase');
    if (showcase) {
      // Untuk produk minimal/featured
      const titleEl = showcase.querySelector('.showcase-title, .showcase-title h4, .showcase-title h3');
      if (titleEl) productName = titleEl.textContent.trim();

      // Untuk gambar utama, cek .showcase-img, .product-img.default, atau .showcase-banner img
      let imgEl = showcase.querySelector('.showcase-img');
      if (!imgEl) imgEl = showcase.querySelector('.product-img.default');
      if (!imgEl) {
        // Bisa juga .showcase-banner img untuk grid
        const banner = showcase.querySelector('.showcase-banner img');
        if (banner) imgEl = banner;
      }
      if (imgEl) productImg = imgEl.src;
    }

    // Jika tetap belum ketemu, fallback ke data-attribute (kalau suatu hari kamu tambahkan)
    if (!productName) productName = btn.getAttribute('data-product-name') || '';
    if (!productImg) productImg = btn.getAttribute('data-product-img') || '';

    // Isi info ke modal (fungsi updateOrderProductInfo harus ada)
    updateOrderProductInfo(productName, productImg);
    // JANGAN LUPA set juga ke variabel state jika kamu butuh kirim ke backend
    window.currentProductName = productName;
    window.currentProductImg = productImg;

    orderSubmitBtn.disabled = true;
    orderFormMessage.textContent = '';
    orderForm.reset();
    // Reset state validasi, dst...
  });
});
orderModalCloseBtn.addEventListener('click', () => orderModal.classList.remove('active'));

// ======================================== Validasi Secret Code ========================================
document.getElementById('secretCode').addEventListener('input', async function () {
  const secretCode = this.value.trim();
  const productId = document.getElementById('orderProductId').value;
  if (secretCode.length > 4 && productId) {
    try {
      const res = await fetch(`${BACKEND_URL}/validate?product_id=${encodeURIComponent(productId)}&secret_code=${encodeURIComponent(secretCode)}`);
      const result = await res.json();
      if (result.status === "valid") {
        isSecretCodeValid = true;
        orderFormMessage.textContent = 'Code valid! You can submit.';
        orderFormMessage.style.color = 'green';
      } else {
        isSecretCodeValid = false;
        orderFormMessage.textContent = 'Invalid or used code!';
        orderFormMessage.style.color = 'red';
      }
    } catch (err) {
      isSecretCodeValid = false;
      orderFormMessage.textContent = 'Could not validate code!';
      orderFormMessage.style.color = 'red';
    }
  } else {
    isSecretCodeValid = false;
    orderFormMessage.textContent = '';
  }
  updateOrderSubmitBtn();
});

// ======================================== CPF validation on blur & input ========================================
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
    // Only clear message if not code error
    if (orderFormMessage.textContent === 'CPF inválido!') {
      orderFormMessage.textContent = '';
      orderFormMessage.style.color = '';
    }
  }
  updateOrderSubmitBtn();
}

// ======================================== Enable Submit Button Check ========================================
function updateOrderSubmitBtn() {
  orderSubmitBtn.disabled = !(isCPFValid && isSecretCodeValid);
}

// ======================================== Submit Order ========================================
orderForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  orderSubmitBtn.disabled = true;
  orderFormMessage.textContent = 'Sending...';

  const data = {
    productId: document.getElementById('orderProductId').value,
    productName: currentProductName,
    productImg: currentProductImg,
    fullName: document.getElementById('fullName').value,
    cpf: document.getElementById('cpf').value,
    phone: document.getElementById('phone').value,
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
    if (result.success) {
      orderFormMessage.textContent = 'Order submitted successfully!';
      orderFormMessage.style.color = 'green';
      setTimeout(() => orderModal.classList.remove('active'), 2000);
    } else {
      orderFormMessage.textContent = result.message || 'Submission failed!';
      orderFormMessage.style.color = 'red';
    }
  } catch (err) {
    orderFormMessage.textContent = 'Could not submit order!';
    orderFormMessage.style.color = 'red';
  }
});
