const MODAL_VIEWPORT_RATIO = 0.9;

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
      const formData = new FormData(contactForm);
      try {
        await fetch(contactForm.action || "/", { method: "POST", body: formData });
      } catch (err) { }
      contactForm.reset();
      if (successMsg) successMsg.hidden = false;
    });
  }
});

const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav-list");
const navLinks = document.querySelectorAll(".nav-list a");

if (navToggle && navList) {
  navToggle.addEventListener("click", () => {
    const active = navList.classList.toggle("active");
    navToggle.classList.toggle("active", active);
    document.body.classList.toggle("nav-open", active); // Keep body class
    navToggle.textContent = active ? "✖️" : "☰";
    navToggle.setAttribute("aria-expanded", active);
  });
  navToggle.setAttribute("aria-expanded", "false");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (navList.classList.contains("active")) {
        navList.classList.remove("active");
        navToggle.classList.remove("active");
        document.body.classList.remove("nav-open"); // Remove body class too
        navToggle.textContent = "☰";
        navToggle.setAttribute("aria-expanded", false);
      }
    });
  });
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
    const title = wrapper.dataset.title;
    if (title) {
      const titleDiv = document.createElement("div");
      titleDiv.className = "video-title";
      titleDiv.textContent = title;
      wrapper.appendChild(titleDiv);
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
  const container = modal.querySelector(".modal-video-container");
  const src = `${wrapper.dataset.src}?autoplay=1`;
  const ratio = parseFloat(wrapper.style.getPropertyValue("--ratio")) || 16 / 9;
  let w = MODAL_VIEWPORT_RATIO * window.innerWidth,
      h = w / ratio;
  if (h > MODAL_VIEWPORT_RATIO * window.innerHeight) {
    h = MODAL_VIEWPORT_RATIO * window.innerHeight;
    w = h * ratio;
  }
  container.style.width = `${w}px`;
  container.style.height = `${h}px`;
  container.style.setProperty("--modal-ratio", ratio);
  container.innerHTML = `<iframe src="${src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen tabindex="0" title="Video player"></iframe>`;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  const iframe = container.querySelector("iframe");
  if (iframe) iframe.focus();
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
  const container = modal.querySelector(".modal-video-container");
  modal.hidden = true;
  container.innerHTML = "";
  container.style.width = "";
  container.style.height = "";
  if (container._resizeHandler) {
    window.removeEventListener("resize", container._resizeHandler);
    delete container._resizeHandler;
  }
  document.body.style.overflow = "";
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

document.querySelector("#video-modal .modal-close").addEventListener("click", closeModal);
document.getElementById("video-modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});
document.querySelector("#video-modal .modal-content").addEventListener("click", e => e.stopPropagation());
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  document.querySelectorAll('.portfolio-item img').forEach(img => {
    img.addEventListener('click', () => {
      lbImg.src = img.dataset.full;
      lbImg.alt = img.alt;
      lightbox.classList.remove('hidden');
    });
  });

  closeBtn.addEventListener('click', () => {
    lightbox.classList.add('hidden');
    lbImg.src = '';
  });

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeBtn.click();
  });
});
