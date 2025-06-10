// script.js

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Add 'loaded' class so the CSS fade-in effect can start
    document.body.classList.add('loaded');

    // Dynamic Year in Footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Smooth Scroll for Logo
    const logoLink = document.getElementById('logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default navigation
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Smooth scroll to the top
            });
            // Optionally update the URL without reloading
            history.pushState(null, null, '/');
        });
    }

    // Add or remove 'scrolled' class based on scroll position
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        const toggleScrolled = () => {
            siteHeader.classList.toggle('scrolled', window.scrollY > 0);
        };
        window.addEventListener('scroll', toggleScrolled);
        toggleScrolled();
    }

    // Initialize video placeholders
    initVideoPlaceholders();
});

// Dark Mode Toggle
const toggleButton = document.getElementById('theme-toggle');
if (toggleButton) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Update toggle button icon based on current theme
    toggleButton.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    toggleButton.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            toggleButton.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleButton.textContent = '☀️';
        }
    });
}

// Navigation Toggle for Mobile
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');
const navLinks = document.querySelectorAll('.nav-list a');

if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
        const isActive = navList.classList.toggle('active');
        navToggle.classList.toggle('active', isActive);
        navToggle.textContent = isActive ? '✖️' : '☰';
        navToggle.setAttribute('aria-expanded', isActive);
    });
    navToggle.setAttribute('aria-expanded', 'false');

    // Close mobile menu when a navigation link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.textContent = '☰';
                navToggle.setAttribute('aria-expanded', false);
            }
        });
    });
}

// Bio card toggle for mobile
document.querySelectorAll('.bio-toggle').forEach(btn => {
    const card = btn.closest('.bio-card');
    const content = card.querySelector('.bio-content');
    btn.addEventListener('click', () => {
        const expanded = card.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', expanded);
        btn.textContent = expanded ? 'Show Less' : 'Read More';
    });
});

// Scroll-spy using Intersection Observer
if (navLinks.length > 0) {
    const sections = Array.from(navLinks)
        .map(link => document.querySelector(link.hash))
        .filter(Boolean);

    const observerOptions = { threshold: 0.25 };
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.hash === `#${id}`);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

function initVideoPlaceholders() {
    document.querySelectorAll('.video-wrapper').forEach(wrapper => {
        const img = wrapper.querySelector('img');
        const button = wrapper.querySelector('.play-button');
        if (!img || !button) return;

        const setRatio = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            if (ratio) {
                wrapper.style.setProperty('--ratio', ratio);
            }
        };
        if (img.complete) {
            setRatio();
        } else {
            img.addEventListener('load', setRatio);
        }

        button.addEventListener('click', e => {
            e.preventDefault();
            openModal(wrapper);
        });
    });
}

function openModal(wrapper) {
    const modal = document.getElementById('video-modal');
    const container = modal.querySelector('.modal-video-container');
    const src = `${wrapper.dataset.src}?autoplay=1`;
    const ratioValue = parseFloat(wrapper.style.getPropertyValue('--ratio')) || (16 / 9);

    // Calculate the largest video size that fits within the viewport
    const vw = window.innerWidth * 0.9;
    const vh = window.innerHeight * 0.9;
    let width = vw;
    let height = width / ratioValue;
    if (height > vh) {
        height = vh;
        width = height * ratioValue;
    }

    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.setProperty('--modal-ratio', ratioValue);
    container.innerHTML = `<iframe src="${src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen tabindex="0" title="Video player"></iframe>`;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Try focusing the iframe for accessibility, but fallback gracefully
    const iframe = container.querySelector('iframe');
    if (iframe) {
        iframe.focus();
    }

    // Adjust video size on viewport resize while modal is open
    const resizeHandler = () => {
        const vwR = window.innerWidth * 0.9;
        const vhR = window.innerHeight * 0.9;
        let w = vwR;
        let h = w / ratioValue;
        if (h > vhR) {
            h = vhR;
            w = h * ratioValue;
        }
        container.style.width = `${w}px`;
        container.style.height = `${h}px`;
    };
    window.addEventListener('resize', resizeHandler);
    container._resizeHandler = resizeHandler;
}

function closeModal() {
    const modal = document.getElementById('video-modal');
    const container = modal.querySelector('.modal-video-container');
    modal.hidden = true;
    container.innerHTML = '';
    container.style.width = '';
    container.style.height = '';
    const handler = container._resizeHandler;
    if (handler) {
        window.removeEventListener('resize', handler);
        delete container._resizeHandler;
    }
    document.body.style.overflow = '';
}

// Close modal with close button
document.querySelector('#video-modal .modal-close').addEventListener('click', closeModal);

// Close modal by clicking backdrop (outside .modal-content)
document.getElementById('video-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Prevent modal close when clicking inside modal-content
document.querySelector('#video-modal .modal-content').addEventListener('click', e => e.stopPropagation());

// Keyboard ESC closes modal
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});
