const MODAL_VIEWPORT_RATIO = 0.9;
const MOBILE_NAV_QUERY = window.matchMedia("(max-width: 768px)");
let lastFocusedElement = null;
let modalFocusTrap = null;

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = (new Date).getFullYear();

  // Choose correct logo selector
  const logo = document.getElementById("logo-link") || document.querySelector(".logo");
  if (logo) {
    logo.addEventListener("click", e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.pushState(null, null, "/");
    });
  }

  const siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    const headerScroll = () => {
      siteHeader.classList.toggle("scrolled", window.scrollY > 0);
    };
    window.addEventListener("scroll", headerScroll);
    headerScroll();
  }

  initVideoPlaceholders();

  document.querySelectorAll(".teaser-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.closest("section, .testimonial, .bio-card");
      const full = section.querySelector(".teaser-full");
      const expanded = btn.getAttribute("aria-expanded") === "true";
      full.classList.toggle("hidden");
      btn.textContent = expanded ? "Read More" : "Show Less";
      btn.setAttribute("aria-expanded", String(!expanded));
    });
  });

  // Contact form handler (if exists)
  const contactForm = document.getElementById("contact-form");
  const successMsg = document.getElementById("success-msg");
  if (contactForm) {
    contactForm.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(contactForm).entries());
      try {
        const resp = await fetch(contactForm.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const json = await resp.json();
        if (resp.ok && json && json.success) {
          contactForm.reset();
          if (successMsg) successMsg.hidden = false;
        } else {
          alert("Sorry, there was a problem sending your message. Please try again later.");
        }
      } catch (err) {
        alert("Sorry, there was a problem sending your message. Please try again later.");
      }
    });
  }
});

const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav-list");
const navLinks = document.querySelectorAll(".nav-list a");

function setNavVisibility(visible) {
  if (!navList) return;
  navList.dataset.visible = visible ? "true" : "false";
  navList.setAttribute("aria-hidden", String(!visible));
  if (!visible && MOBILE_NAV_QUERY.matches) {
    navList.setAttribute("hidden", "");
  } else {
    navList.removeAttribute("hidden");
  }
  if (visible) {
    navList.removeAttribute("inert");
  } else {
    navList.setAttribute("inert", "");
  }
}

function syncNavToViewport() {
  if (!navList) return;
  if (MOBILE_NAV_QUERY.matches) {
    const isOpen = navToggle?.classList.contains("active");
    setNavVisibility(Boolean(isOpen));
  } else {
    setNavVisibility(true);
    if (navToggle) {
      navToggle.classList.remove("active");
      navToggle.textContent = "☰";
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
    }
    document.body.classList.remove("nav-open");
  }
}

if (navToggle && navList) {
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation menu");
  syncNavToViewport();
  if (MOBILE_NAV_QUERY.matches) {
    setNavVisibility(false);
  }
  navToggle.addEventListener("click", () => {
    const active = !navToggle.classList.contains("active");
    navToggle.classList.toggle("active", active);
    document.body.classList.toggle("nav-open", active);
    navToggle.textContent = active ? "✖️" : "☰";
    navToggle.setAttribute("aria-expanded", String(active));
    navToggle.setAttribute("aria-label", active ? "Close navigation menu" : "Open navigation menu");
    setNavVisibility(active);
  });
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (MOBILE_NAV_QUERY.matches && navToggle.classList.contains("active")) {
        navToggle.classList.remove("active");
        document.body.classList.remove("nav-open");
        navToggle.textContent = "☰";
        navToggle.setAttribute("aria-expanded", "false");
        setNavVisibility(false);
      }
    });
  });
  MOBILE_NAV_QUERY.addEventListener("change", syncNavToViewport);
} else if (navList) {
  setNavVisibility(true);
}

if (navLinks.length > 0) {
  const sections = Array.from(navLinks).map(link => document.querySelector(link.hash)).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle("active", link.hash === `#${id}`);
        });
      }
    });
  }, { threshold: 0.25 });
  sections.forEach(section => observer.observe(section));
}

function initVideoPlaceholders() {
  document.querySelectorAll(".video-wrapper").forEach(wrapper => {
    const img = wrapper.querySelector("img");
    const playBtn = wrapper.querySelector(".play-button");
    if (!img || !playBtn) return;
    const title = (wrapper.dataset.title || "").trim();
    const card = wrapper.closest(".work-card");
    if (card) {
      const captionTitle = card.querySelector(".work-card__title");
      if (title && captionTitle && !captionTitle.textContent.trim()) {
        captionTitle.textContent = title;
      }
      const cardButton = card.querySelector(".work-card__cta");
      if (cardButton) {
        const buttonLabel = title ? `Play ${title}` : "Play video";
        cardButton.setAttribute("aria-label", buttonLabel);
        cardButton.textContent = title ? `Watch “${title}”` : "Watch video";
        cardButton.addEventListener("click", e => {
          e.preventDefault();
          openModal(wrapper);
        });
      }
    }
    const setRatio = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio) wrapper.style.setProperty("--ratio", ratio);
    };
    img.complete ? setRatio() : img.addEventListener("load", setRatio);
    playBtn.addEventListener("click", e => {
      e.preventDefault();
      openModal(wrapper);
    });
    wrapper.addEventListener("mouseenter", () => showPreview(wrapper));
    wrapper.addEventListener("mouseleave", () => hidePreview(wrapper));
  });
}

function openModal(wrapper) {
  hidePreview(wrapper);
  const modal = document.getElementById("video-modal");
  if (!modal) return;
  const container = modal.querySelector(".modal-video-container");
  const modalTitle = modal.querySelector("#video-modal-title");
  const closeButton = modal.querySelector(".modal-close");
  if (!container) return;
  const src = `${wrapper.dataset.src}?autoplay=1`;
  const ratio = parseFloat(wrapper.style.getPropertyValue("--ratio")) || 16 / 9;
  const videoTitle = (wrapper.dataset.title || wrapper.querySelector(".video-title")?.textContent || "Video").trim();
  let w = MODAL_VIEWPORT_RATIO * window.innerWidth,
      h = w / ratio;
  if (h > MODAL_VIEWPORT_RATIO * window.innerHeight) {
    h = MODAL_VIEWPORT_RATIO * window.innerHeight;
    w = h * ratio;
  }
  container.style.width = `${w}px`;
  container.style.height = `${h}px`;
  container.style.setProperty("--modal-ratio", ratio);
  container.innerHTML = `<iframe src="${src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen tabindex="0" title="${escapeHtml(videoTitle || "Video player")}"></iframe>`;
  if (modalTitle) modalTitle.textContent = videoTitle || "Video player";
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lastFocusedElement = document.activeElement;
  const focusableElements = getFocusableElements(modal);
  if (closeButton) {
    closeButton.focus();
  } else if (focusableElements[0]) {
    focusableElements[0].focus();
  }
  modalFocusTrap = event => {
    if (event.key !== "Tab") return;
    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", modalFocusTrap);
  const resizeHandler = () => {
    let nw = MODAL_VIEWPORT_RATIO * window.innerWidth,
        nh = nw / ratio;
    if (nh > MODAL_VIEWPORT_RATIO * window.innerHeight) {
      nh = MODAL_VIEWPORT_RATIO * window.innerHeight;
      nw = nh * ratio;
    }
    container.style.width = `${nw}px`;
    container.style.height = `${nh}px`;
  };
  window.addEventListener("resize", resizeHandler);
  container._resizeHandler = resizeHandler;
}

function closeModal() {
  const modal = document.getElementById("video-modal");
  if (!modal) return;
  const container = modal.querySelector(".modal-video-container");
  if (!container) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  container.innerHTML = "";
  container.style.width = "";
  container.style.height = "";
  if (container._resizeHandler) {
    window.removeEventListener("resize", container._resizeHandler);
    delete container._resizeHandler;
  }
  document.body.style.overflow = "";
  if (modalFocusTrap) {
    document.removeEventListener("keydown", modalFocusTrap);
    modalFocusTrap = null;
  }
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

function getPreviewSrc(src) {
  if (!src) return "";
  if (src.includes("youtube")) {
    const match = src.match(/embed\/(.*?)(\?|$)/);
    const id = match ? match[1] : "";
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&start=0&end=2&playlist=${id}` : "";
  }
  if (src.includes("vimeo")) return `${src}?autoplay=1&muted=1&loop=1#t=0,2`;
  return "";
}

function showPreview(wrapper) {
  const src = getPreviewSrc(wrapper.dataset.src);
  if (!src) return;
  let iframe = wrapper.querySelector(".preview-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.className = "preview-iframe";
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.allow = "autoplay; muted";
    wrapper.appendChild(iframe);
  }
  iframe.src = src;
}

function hidePreview(wrapper) {
  const iframe = wrapper.querySelector(".preview-iframe");
  if (iframe) iframe.remove();
}

const modalRoot = document.getElementById("video-modal");
const modalCloseButton = document.querySelector("#video-modal .modal-close");
const modalContent = document.querySelector("#video-modal .modal-content");

if (modalCloseButton) {
  modalCloseButton.addEventListener("click", closeModal);
}

if (modalRoot) {
  modalRoot.addEventListener("click", function(e) {
    if (e.target === this) closeModal();
  });
}

if (modalContent) {
  modalContent.addEventListener("click", e => e.stopPropagation());
}

document.addEventListener("keydown", e => {
  const modal = document.getElementById("video-modal");
  if (e.key === "Escape" && modal && !modal.hidden) closeModal();
});

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter(el => !el.hasAttribute("inert") && !el.hidden && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

