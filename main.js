'use strict';

const modal = document.querySelector('[data-modal');
const modalCloseBtn = document.querySelector('[data-modal-close');
const modalCloseOverlay = document.querySelector('[data-modal-overlay');

const modalCloseFunc = function () { modal.classList.add('closed') }

modalCloseOverlay.addEventListener('click', modalCloseFunc);
modalCloseBtn.addEventListener('click', modalCloseFunc);

//Close Notification 

const notificationToast = document.querySelector('[data-toast]');
const toastCloseBtn = document.querySelector('[data-toast-close]');

toastCloseBtn.addEventListener('click', function() {
    notificationToast.classList.add('closed');
})

//Closing or Opening Mobile Menu 
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

// --- Banner Auto Sliding dengan Efek Zoom ---
const sliderItems = document.querySelectorAll('.slider-item');
let currentSlide = 0;
const slideInterval = 4000;

function showSlide(index) {
    sliderItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Inisialisasi
showSlide(currentSlide);

// Auto-slide tiap 4 detik
setInterval(() => {
    currentSlide = (currentSlide + 1) % sliderItems.length;
    showSlide(currentSlide);
}, slideInterval);

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
            // Get all .display-number children
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

// Helper: CPF validation (Brazilian format)
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

// Modal logic
const orderModal = document.getElementById('orderModal');
const orderModalCloseBtn = document.getElementById('orderModalCloseBtn');
const orderForm = document.getElementById('orderForm');
const orderSubmitBtn = document.getElementById('orderSubmitBtn');
const orderFormMessage = document.getElementById('orderFormMessage');

// Open modal when claim button clicked
document.querySelectorAll('.claim-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    orderModal.classList.add('active');
    document.getElementById('orderProductId').value = btn.getAttribute('data-product-id');
    orderSubmitBtn.disabled = true;
    orderFormMessage.textContent = '';
    orderForm.reset();
  });
});
orderModalCloseBtn.addEventListener('click', () => orderModal.classList.remove('active'));

// Secret code validation on input
document.getElementById('secretCode').addEventListener('input', async function() {
  const secretCode = this.value.trim();
  const productId = document.getElementById('orderProductId').value;
  if (secretCode.length > 4 && productId) {
    // Validate via Google Apps Script
    try {
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbxt177cEOKIfKlMHdXTQ7KgSMIG5dboL55wz1crjPJWst8c281pikc0Ef5nWTPV9nUKiQ/exec' +
        `?action=validateCode&product_id=${encodeURIComponent(productId)}&secret_code=${encodeURIComponent(secretCode)}`
      );
      const result = await res.json();
      if (result.valid) {
        orderSubmitBtn.disabled = false;
        orderFormMessage.textContent = 'Code valid! You can submit.';
        orderFormMessage.style.color = 'green';
      } else {
        orderSubmitBtn.disabled = true;
        orderFormMessage.textContent = 'Invalid or used code!';
        orderFormMessage.style.color = 'red';
      }
    } catch (err) {
      orderFormMessage.textContent = 'Could not validate code!';
      orderFormMessage.style.color = 'red';
      orderSubmitBtn.disabled = true;
    }
  } else {
    orderSubmitBtn.disabled = true;
    orderFormMessage.textContent = '';
  }
});

// CPF validation on blur
document.getElementById('cpf').addEventListener('blur', function() {
  if (!validateCPF(this.value)) {
    orderFormMessage.textContent = 'CPF inválido!';
    orderFormMessage.style.color = 'red';
    orderSubmitBtn.disabled = true;
  }
});

// Submit order
orderForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  orderSubmitBtn.disabled = true;
  orderFormMessage.textContent = 'Sending...';

  // Gather form data
  const data = {
    productId: document.getElementById('orderProductId').value,
    fullName: document.getElementById('fullName').value,
    cpf: document.getElementById('cpf').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    secretCode: document.getElementById('secretCode').value,
    action: 'submitOrder'
  };

  // Send to Google Apps Script
  try {
    const res = await fetch(
      'https://script.google.com/macros/s/AKfycbxt177cEOKIfKlMHdXTQ7KgSMIG5dboL55wz1crjPJWst8c281pikc0Ef5nWTPV9nUKiQ/exec',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      }
    );
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
