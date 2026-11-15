/* =========================================================
   main.js — shared behaviour for every page
   - Mobile navigation
   - Scroll progress, sticky header, back-to-top
   - Scroll-triggered reveal animations
   - Toast notifications (window.Toast)
   - Project filtering and detail dialog (projects page)
   ========================================================= */
(function () {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Toast notifications ---------- */
  const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  };

  window.Toast = {
    show(message, type = "success", duration = 3600) {
      const region = $("#toast-region");
      if (!region) return;
      const toast = document.createElement("div");
      toast.className = "toast" + (type === "error" ? " toast--error" : type === "info" ? " toast--info" : "");
      const icon = document.createElement("span");
      icon.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.success; // static, trusted markup
      const text = document.createElement("span");
      text.textContent = message; // user-facing text is never injected as HTML
      toast.append(icon, text);
      region.appendChild(toast);
      document.body.classList.add("has-toasts");

      const remove = () => {
        toast.classList.add("is-leaving");
        setTimeout(() => {
          toast.remove();
          if (!region.children.length) document.body.classList.remove("has-toasts");
        }, 320);
      };
      setTimeout(remove, duration);
    }
  };

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });

  /* ---------- Mobile navigation ---------- */
  const navToggle = $(".nav__toggle");
  const navList = $("#nav-list");

  function setNav(open) {
    if (!navToggle || !navList) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navList.classList.toggle("is-open", open);
  }

  if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
    navList.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navList.classList.contains("is-open")) { setNav(false); navToggle.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (navList.classList.contains("is-open") && !e.target.closest(".nav")) setNav(false);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) setNav(false); });
  }

  /* ---------- Scroll effects ---------- */
  const header = $(".site-header");
  const progress = $(".scroll-progress");
  const toTop = $(".back-to-top");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealNodes = $$(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  /* ---------- Projects page ---------- */
  const projectGrid = $("#project-grid");
  if (projectGrid) {
    const cards = $$(".project-card[data-category]", projectGrid);
    const filterButtons = $$("[data-project-filter]");
    const status = $("#filter-status");
    const emptyMessage = $("#no-projects");

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.projectFilter;
        filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        let visible = 0;
        cards.forEach((card) => {
          const show = filter === "all" || card.dataset.category === filter;
          card.hidden = !show;
          if (show) { visible += 1; card.classList.add("is-visible"); }
        });
        if (emptyMessage) emptyMessage.hidden = visible !== 0;
        if (status) status.textContent = visible + (visible === 1 ? " project shown" : " projects shown");
      });
    });

    // Detail dialog
    const dialog = $("#project-dialog");
    const dialogTitle = $("#dialog-title");
    const dialogBody = $("#dialog-body");

    function openDialog(card) {
      const detail = $(".project-detail", card);
      if (!dialog || !detail) return;
      dialogTitle.textContent = card.dataset.title || "Project details";
      dialogBody.innerHTML = detail.innerHTML; // content comes from this page's own markup
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      document.body.style.overflow = "hidden";
    }

    if (dialog) {
      dialog.addEventListener("close", () => { document.body.style.overflow = ""; });
      dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
      $("[data-close]", dialog).addEventListener("click", () => dialog.close());
    }

    projectGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".project-card");
      if (!card) return;
      if (e.target.closest("[data-open-detail]")) {
        openDialog(card);
      } else if (e.target.closest("[data-demo]")) {
        window.Toast.show("Demo link is a placeholder. This is a demonstration project.", "info", 4200);
      } else if (e.target.closest("[data-repo]")) {
        const btn = e.target.closest("[data-repo]");
        const url = btn.getAttribute("data-repo");
        if (url) window.open(url, "_blank", "noopener");
        else window.Toast.show("GitHub link is a placeholder until a real repository is added.", "info", 4200);
      }
    });
  }
})();
