'use strict';

const BACKEND_URL = "https://redepop-backend.onrender.com";

// ======================================== MODAL LOGIC ========================================
const orderModal = document.getElementById('orderModal');
const orderModalCloseBtn = document.getElementById('orderModalCloseBtn');
const orderForm = document.getElementById('orderForm');
const orderSubmitBtn = document.getElementById('orderSubmitBtn');
const orderFormMessage = document.getElementById('orderFormMessage');

// Utility to update modal product info
function updateOrderProductInfo(name, img, secret) {
  document.getElementById('orderProductName').textContent = name || '';
  document.getElementById('orderProductImg').src = img || '';
  document.getElementById('orderProductId').value = secret || '';
}

// Open claim modal when product is clicked
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', function(e) {
    e.preventDefault();
    const name = card.querySelector('.product-name').textContent.trim();
    const img = card.querySelector('.product-img').src;
    const secret = card.getAttribute('data-secret');
    updateOrderProductInfo(name, img, secret);
    orderModal.classList.add('active');
    orderSubmitBtn.disabled = true;
    orderFormMessage.textContent = '';
    orderForm.reset();
    isCPFValid = false; isSecretCodeValid = false;
  });
});
orderModalCloseBtn.addEventListener('click', () => orderModal.classList.remove('active'));

// ======================================== VEJA MAIS LOGIC ========================================
document.querySelectorAll('.veja-mais-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const tier = btn.getAttribute('data-tier');
    const section = document.querySelector(`section[data-tier="${tier}"]`);
    const extraProducts = section.querySelectorAll('.extra-product');
    const expanded = btn.classList.toggle('expanded');
    extraProducts.forEach(p => p.hidden = !expanded);
    btn.querySelector('.arrow-icon').innerHTML = expanded ? '&#9650;' : '&#9660;';
    btn.textContent = expanded ? "VER MENOS " : "VEJA MAIS ";
    btn.appendChild(btn.querySelector('.arrow-icon'));
  });
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

// ======================================== Secret Code Validation ========================================
document.getElementById('secretCode').addEventListener('input', async function () {
  const secretCode = this.value.trim();
  const productId = document.getElementById('orderProductId').value;
  if (secretCode.length > 4 && productId) {
    try {
      const res = await fetch(`${BACKEND_URL}/validate?product_id=${encodeURIComponent(productId)}&secret_code=${encodeURIComponent(secretCode)}`);
      const result = await res.json();
      if (result.status === "valid") {
        isSecretCodeValid = true;
        orderFormMessage.textContent = 'Código válido! Você pode enviar.';
        orderFormMessage.style.color = 'green';
      } else {
        isSecretCodeValid = false;
        orderFormMessage.textContent = 'Código inválido ou já utilizado!';
        orderFormMessage.style.color = 'red';
      }
    } catch (err) {
      isSecretCodeValid = false;
      orderFormMessage.textContent = 'Erro ao validar código!';
      orderFormMessage.style.color = 'red';
    }
  } else {
    isSecretCodeValid = false;
    orderFormMessage.textContent = '';
  }
  updateOrderSubmitBtn();
});
function updateOrderSubmitBtn() {
  orderSubmitBtn.disabled = !(isCPFValid && isSecretCodeValid);
}

// ======================================== Submit Order ========================================
orderForm.addEventListener('submit', async function (e) {
  e.preventDefault();
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
    fullName: document.getElementById('fullName').value,
    cpf: document.getElementById('cpf').value,
    phone: document.getElementById('phone').value,
    gameId: document.getElementById('gameId').value, // <-- Tambahan baru!
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
    if (result.status === "success" || result.success) {
      orderFormMessage.textContent = 'Pedido enviado com sucesso!';
      orderFormMessage.style.color = 'green';
      setTimeout(() => orderModal.classList.remove('active'), 2000);
    } else {
      orderFormMessage.textContent = result.message || 'Falha ao enviar!';
      orderFormMessage.style.color = 'red';
    }
  } catch (err) {
    orderFormMessage.textContent = 'Erro ao enviar pedido!';
    orderFormMessage.style.color = 'red';
  }
});
