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
