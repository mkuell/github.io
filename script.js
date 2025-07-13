// script.js


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

    const overlay = document.querySelector('.hero__overlay');
    if (overlay) {
        overlay.style.visibility = 'visible';
        overlay.classList.add('show');
    }


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

    // Add or remove background on scroll.
    // When the page is scrolled beyond the header's height,
    // we add `.header--scrolled` for a solid background.
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        const toggleScrolled = () => {
            const offset = siteHeader.offsetHeight;
            siteHeader.classList.toggle('header--scrolled', window.scrollY > offset);
        };
        window.addEventListener('scroll', toggleScrolled);
        toggleScrolled();
    }

    // Initialize video placeholders
    initVideoPlaceholders();

    initTestimonials();
});

// Dark mode toggle removed: site operates in light-only theme.

// Navigation Toggle for Mobile
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav__list');
const navLinks = document.querySelectorAll('.nav__link');

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

// Bio card toggle
const bioButtons = document.querySelectorAll('.bio-toggle');
bioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.bio-card');
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', (!expanded).toString());
        btn.textContent = expanded ? 'Read More' : 'Show Less';
        if (card) {
            card.classList.toggle('expanded', !expanded);
            const panel = card.querySelector('.bio-content');
            if (panel) {
                panel.style.maxHeight = expanded ? null : panel.scrollHeight + 'px';
            }
        }
    });
});


// Scroll-spy using Intersection Observer
// Each section becomes "active" when at least 50% visible
if (navLinks.length > 0) {
    const sections = Array.from(navLinks)
        .map(link => document.querySelector(link.hash))
        .filter(Boolean);

    // Trigger when half of a section is visible
    const observerOptions = { threshold: 0.5 };
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    const active = link.hash === `#${id}`;
                    link.classList.toggle('nav__link--active', active);
                    if (active) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
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
    if (!modal) return;
    const container = modal.querySelector('.modal-video-container');
    if (!container) return;
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
    container.innerHTML = `<iframe src="${src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen tabindex="0" title="Video player" loading="lazy"></iframe>`;

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
    if (!modal) return;
    const container = modal.querySelector('.modal-video-container');
    if (!container) return;
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
const modalCloseBtn = document.querySelector('#video-modal .modal-close');
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
}

// Close modal by clicking backdrop (outside .modal-content)
const modalBackdrop = document.getElementById('video-modal');
if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// Prevent modal close when clicking inside modal-content
const modalContent = document.querySelector('#video-modal .modal-content');
if (modalContent) {
    modalContent.addEventListener('click', e => e.stopPropagation());
}

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
        iframe.loading = 'lazy';
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
function initTestimonials() {
    const testimonials = [
        {
            text: "I have worked with Michael and his team on several occasions, and from start to finish, the experience was always fantastic. Great creative thinking, detailed preparation, and highly professional execution, made this part of my projects run like clockwork. Michael and his team define 'service oriented' and the results have always been outstanding.",
            author: "- Jonas Bromberg, Psy.D., Principal Consultant @ Crossroads Health"
        },
        {
            text: "I had the pleasure of being in several projects produced by Michael in my last role. Being in front of the camera can be very intimidating, especially when having little experience, but Michael always made the process easy to understand and fun. He is professional, approachable, and down to earth in a way that made anyone working with him want to be their best. From that perspective, I would highly recommend Michael in any client/customer facing roles.",
            author: "- Sonya Ponder, Diversity, Equity and Inclusion Talent Acquisition Manager at Princeton University"
        },
        {
            text: "The last time I worked with Mike, we were under every kind of pressure possible: political, financial, creative, temporal and trying to shoot in English and French simultaneously. We wrapped half an hour early. I recommend Mike without reservation. As a director, cinematographer, collaborator and leader, he’s nigh on peerless. You might think trusting an airline pilot is a big deal, but for people in my business, choosing a director is much, much hairier. As far as I’m concerned, it’s Mike Kuell or we find a way to do it in print.",
            author: "- Dave Greeley, Partner @ McKenna and Partners"
        },
        {
            text: "Michael is an exceptional Executive Producer, Director and Filmmaker. His level of professionalism and focus is remarkable. As a mentor, Michael has helped me redirect my skill set towards all aspects of video production. His innate ability to communicate effectively is one of his many great strengths. During a rigorous shoot that spanned 5 cities, I was privileged to witness Michael conduct over 40 interviews with some of the nation's top psychologists.",
            author: "- Cathleen Carr, Creative Social Impact Leader"
        },
        {
            text: "Mike is one of the most versatile, professional, and driven filmmakers I've ever worked with. I've seen him do great jobs with both scripted and improv comedy, drama, and commercials as well as straight-ahead corporate. He makes the most of the actors and craftspeople he works with (and has introduced me to some excellent ones), and delivers more than expected for the budget. Even more impressive: when not working for clients, he creates interesting projects on his own. That's love.",
            author: "- Jay Rose, Sound Designer, Digital Playroom"
        }
    ];

    const slidesContainer = document.getElementById('testimonial-slides');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!slidesContainer || !prevBtn || !nextBtn) return;

    testimonials.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML = `<blockquote class="testimonial-quote">${t.text}</blockquote>` +
                         `<cite class="testimonial-author">${t.author}</cite>`;
        if (i !== 0) card.hidden = true;
        slidesContainer.appendChild(card);
    });

    let index = 0;
    const slides = slidesContainer.children;

    const showSlide = idx => {
        Array.from(slides).forEach((slide, i) => {
            slide.hidden = i !== idx;
        });
    };

    prevBtn.addEventListener('click', () => {
        index = (index - 1 + slides.length) % slides.length;
        showSlide(index);
    });

    nextBtn.addEventListener('click', () => {
        index = (index + 1) % slides.length;
        showSlide(index);
    });

    showSlide(index);
}
