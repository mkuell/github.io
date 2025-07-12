// script.js

// Global hero variant flag - switch between 'A' and 'B'
// Example: window.HERO_VARIANT = 'B';
window.HERO_VARIANT = window.HERO_VARIANT || 'A';

// Preserve native scrollTo and extend it so strings scroll to selectors
const nativeScrollTo = window.scrollTo.bind(window);
window.scrollTo = function(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const el = document.querySelector(arg1);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }
    nativeScrollTo(arg1, arg2);
};

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Add 'loaded' class so the CSS fade-in effect can start
    document.body.classList.add('loaded');

    const heroA = document.getElementById('hero-variant-a');
    const quickPitch = document.getElementById('quick-pitch');
    if (window.HERO_VARIANT === 'A') {
        if (heroA) {
            heroA.classList.remove('hidden');
            heroA.classList.add('active', 'show');
        }
    } else if (window.HERO_VARIANT === 'B') {
        if (quickPitch) {
            quickPitch.classList.remove('hidden');
            quickPitch.classList.add('active');
        }
    }

    // Smooth scroll for hero CTA
    document.querySelectorAll('.cta-scroll').forEach(btn => {
        btn.addEventListener('click', e => {
            const target = document.querySelector(btn.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

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

    // Initialize testimonials carousel
    const carouselEl = document.querySelector('.testimonial-carousel');
    if (carouselEl && window.Swiper) {
        const swiper = new Swiper(carouselEl, {
            loop: true,
            slidesPerView: 1,
            spaceBetween: 20,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            autoplay: {
                delay: 6000,
                disableOnInteraction: false
            },
            breakpoints: {
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            },
            a11y: true
        });

        const pause = () => swiper.autoplay.stop();
        const play = () => swiper.autoplay.start();
        carouselEl.addEventListener('mouseenter', pause);
        carouselEl.addEventListener('mouseleave', play);
        carouselEl.addEventListener('focusin', pause);
        carouselEl.addEventListener('focusout', play);
    }
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
    const details = card.querySelector('.bio-details');
    btn.addEventListener('click', () => {
        const expanded = card.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', expanded);
        btn.textContent = expanded ? 'Read Less' : 'Read More';
        if (details) {
            details.hidden = !expanded;
        }
    });
});

// Testimonial "Read More" toggle
document.querySelectorAll('.testimonial-toggle').forEach(btn => {
    const card = btn.closest('.testimonial-card');
    const full = card.querySelector('.testimonial-full');
    btn.addEventListener('click', () => {
        const expanded = card.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', expanded);
        btn.textContent = expanded ? 'Show Less' : 'Read More';
        if (full) {
            full.hidden = !expanded;
            if (expanded) {
                full.focus();
            }
        }
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

        const titleText = wrapper.dataset.title;
        if (titleText) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'video-title';
            titleDiv.textContent = titleText;
            wrapper.appendChild(titleDiv);
        }

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

        wrapper.addEventListener('mouseenter', () => showPreview(wrapper));
        wrapper.addEventListener('mouseleave', () => hidePreview(wrapper));
    });
}

function openModal(wrapper) {
    hidePreview(wrapper);
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

function getPreviewSrc(src) {
    if (!src) return '';
    if (src.includes('youtube')) {
        const idMatch = src.match(/embed\/(.*?)(\?|$)/);
        const id = idMatch ? idMatch[1] : '';
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&start=0&end=2&playlist=${id}` : '';
    }
    if (src.includes('vimeo')) {
        return `${src}?autoplay=1&muted=1&loop=1#t=0,2`;
    }
    return '';
}

function showPreview(wrapper) {
    const previewSrc = getPreviewSrc(wrapper.dataset.src);
    if (!previewSrc) return;
    let iframe = wrapper.querySelector('.preview-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.className = 'preview-iframe';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.setAttribute('tabindex', '-1');
        iframe.allow = 'autoplay; muted';
        wrapper.appendChild(iframe);
    }
    iframe.src = previewSrc;
}

function hidePreview(wrapper) {
    const iframe = wrapper.querySelector('.preview-iframe');
    if (iframe) {
        iframe.remove();
    }
}
