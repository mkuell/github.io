// ===== navigation toggle & logo click =====
const navToggle = document.querySelector('.nav-toggle');
const body = document.body;
navToggle.addEventListener('click', () => {
  body.classList.toggle('nav-open');
});

const logo = document.querySelector('.logo');  // or '#logo-link'
logo.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== bio toggle & nav activation on scroll =====
const bioToggle = document.querySelector('.bio-toggle');
const bioContent = document.querySelector('.bio-content');
bioToggle.addEventListener('click', () => {
  const expanded = bioToggle.getAttribute('aria-expanded') === 'true';
  bioToggle.setAttribute('aria-expanded', String(!expanded));
  bioContent.hidden = expanded;
});

const navLinks = document.querySelectorAll('nav a');
const sections = [...document.querySelectorAll('section')];
window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + window.innerHeight / 2;
  sections.forEach(sec => {
    if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${sec.id}`));
    }
  });
});

// ===== video modal & preview logic =====
const videoTriggers = document.querySelectorAll('.video-thumb');
const modal = document.querySelector('.video-modal');
const modalVideo = modal.querySelector('video');
const modalClose = modal.querySelector('.close-modal');

videoTriggers.forEach(thumb => {
  thumb.addEventListener('click', () => {
    modalVideo.src = thumb.dataset.videoSrc;
    modal.classList.add('open');
    modalVideo.play();
  });
});

modalClose.addEventListener('click', () => {
  modal.classList.remove('open');
  modalVideo.pause();
  modalVideo.src = '';
});

// ===== contact form handling (from main branch) =====
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('success-msg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  fetch(form.action, {
    method: form.method,
    body: data,
  })
  .then(res => {
    if (res.ok) {
      form.hidden = true;
      successMsg.hidden = false;
    } else {
      alert('Submission failed. Please try again.');
    }
  })
  .catch(() => {
    alert('Network error. Please try later.');
  });
});
