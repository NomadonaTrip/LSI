/* ============================
   LSI Luminary — interactivity
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollNav();
  initMobileNav();
  initNavDropdowns();
  initReveal();
  initFaq();
  initContactForm();
  initFooterYear();
  initMarqueeDuplicate();
  initTrainingForm();
});

/* sticky nav state */
function initScrollNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 16) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* desktop hover/click dropdowns + mobile collapsible groups */
function initNavDropdowns() {
  // Desktop: hover is handled by CSS; we still wire click to toggle so keyboard
  // / touch users can open menus and Escape closes everything.
  const items = document.querySelectorAll('.nav-links .nav-item.has-children');
  items.forEach((item) => {
    const trigger = item.querySelector(':scope > button');
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = item.classList.contains('is-open');
      // close siblings
      items.forEach(s => s.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });
  document.addEventListener('click', () => {
    items.forEach(s => s.classList.remove('is-open'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') items.forEach(s => s.classList.remove('is-open'));
  });

  // Mobile drawer: each group expands inline when its parent button is tapped
  document.querySelectorAll('.nav-drawer .draw-group').forEach((group) => {
    const btn = group.querySelector(':scope > .draw-link');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      group.classList.toggle('is-open');
      const expanded = group.classList.contains('is-open');
      btn.setAttribute('aria-expanded', String(expanded));
    });
  });
}

/* mobile drawer */
function initMobileNav() {
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.nav-drawer');
  if (!burger || !drawer) return;
  const toggle = (open) => {
    burger.classList.toggle('is-open', open);
    drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => {
    toggle(!drawer.classList.contains('is-open'));
  });
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggle(false));
  });
}

/* reveal on scroll */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (els.length === 0) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));

  // Safety fallback: when the page is rendered for screenshots / printing /
  // unusual scroll containers, IO may never fire. Reveal all elements that
  // are within the document by 1.5s to guarantee they paint.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.4) el.classList.add('is-visible');
    });
  }, 600);
}

/* FAQ accordion */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      // Optional: close all others for cleaner UX
      item.parentElement.querySelectorAll('.faq-item.is-open').forEach((sib) => {
        if (sib !== item) sib.classList.remove('is-open');
      });
      item.classList.toggle('is-open', !open);
      q.setAttribute('aria-expanded', String(!open));
    });
  });
}

/* simple contact form fake-submit */
function initContactForm() {
  const form = document.querySelector('.contact-form form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = form.querySelector('.form-msg');
    if (msg) {
      msg.textContent = 'Thanks for submitting!';
      msg.classList.add('is-shown');
    }
    form.reset();
    setTimeout(() => msg && msg.classList.remove('is-shown'), 5000);
  });
}

/* footer year */
function initFooterYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* training-form behaviour: 3-step wizard, "Other" toggle, validate per step, success */
function initTrainingForm() {
  const form = document.querySelector('.training-form-actual');
  if (!form) return;
  const card = form.closest('.form-card');
  const formSteps = Array.from(form.querySelectorAll('.form-step'));
  const progressSteps = Array.from(card.querySelectorAll('.form-progress .step'));
  const counterEl = card.querySelector('[data-current-step]');
  const labelEl = card.querySelector('[data-current-label]');
  const totalSteps = formSteps.length;
  let currentStep = 1;

  /* Validate the required rows inside a single step. Mark each row, return
     the count of failures and a reference to the first failing row so the
     caller can scroll to it. */
  const validateStep = (stepIdx) => {
    const stepEl = formSteps[stepIdx - 1];
    if (!stepEl) return { failures: 0, firstInvalid: null };
    let firstInvalid = null;
    let failures = 0;
    stepEl.querySelectorAll('[data-required]').forEach((row) => {
      const radios = row.querySelectorAll('input[type="radio"]');
      const inputs = row.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="date"], textarea'
      );
      let valid = true;
      if (radios.length > 0) {
        valid = Array.from(radios).some(r => r.checked);
      } else {
        valid = Array.from(inputs).every(i =>
          (i.value || '').trim().length > 0 && i.checkValidity()
        );
      }
      row.classList.toggle('is-invalid', !valid);
      if (!valid) { failures++; if (!firstInvalid) firstInvalid = row; }
    });
    return { failures, firstInvalid };
  };

  /* Render the current step. Hides the rest. Updates progress + counter. */
  const showStep = (target, opts = {}) => {
    currentStep = target;
    formSteps.forEach((el, i) => {
      el.classList.toggle('is-active', i + 1 === currentStep);
    });
    progressSteps.forEach((el, i) => {
      el.classList.toggle('is-filled', i + 1 < currentStep);
      el.classList.toggle('is-current', i + 1 === currentStep);
    });
    if (counterEl) counterEl.textContent = `Step ${currentStep} of ${totalSteps}`;
    if (labelEl) {
      const lab = formSteps[currentStep - 1]?.dataset.stepLabel || '';
      labelEl.textContent = lab;
    }
    if (opts.skipScroll) return;
    // Scroll the page to the top of the form card, then focus the first
    // input. The delay lets the scroll animation finish before focus snaps.
    const top = card.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    const focusable = formSteps[currentStep - 1].querySelector(
      'input:not([type="hidden"]):not([type="radio"]), textarea, button[type="submit"]'
    );
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 400);
  };

  /* Toggle "Other" input visibility per radio group */
  form.querySelectorAll('.form-radio-group').forEach((group) => {
    const otherInput = group.parentElement.querySelector('.form-other');
    if (!otherInput) return;
    group.addEventListener('change', (e) => {
      if (!(e.target instanceof HTMLInputElement)) return;
      const isOther = e.target.value === '__other__';
      otherInput.classList.toggle('is-shown', isOther);
      const otherText = otherInput.querySelector('input');
      if (isOther && otherText) otherText.focus();
      const row = group.closest('.form-row');
      if (row) row.classList.remove('is-invalid');
    });
  });

  /* Clear validation error as soon as the user starts editing */
  form.querySelectorAll('.form-input, .form-textarea').forEach((el) => {
    el.addEventListener('input', () => {
      const row = el.closest('.form-row');
      if (row) row.classList.remove('is-invalid');
    });
  });

  /* Wire Next buttons */
  form.querySelectorAll('[data-step-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { failures, firstInvalid } = validateStep(currentStep);
      if (failures > 0 && firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (currentStep < totalSteps) showStep(currentStep + 1);
    });
  });

  /* Wire Back buttons (no validation when going backwards) */
  form.querySelectorAll('[data-step-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentStep > 1) showStep(currentStep - 1);
    });
  });

  /* Final submit on Step 3 */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Re-validate Step 1 + Step 2 in case a required value was cleared after
    // the user advanced past it.
    for (let s = 1; s <= 2; s++) {
      const { failures, firstInvalid } = validateStep(s);
      if (failures > 0) {
        showStep(s);
        if (firstInvalid) {
          setTimeout(() => firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
        }
        return;
      }
    }
    card.classList.add('is-submitted');
    const success = card.querySelector('.form-success');
    if (success) {
      success.classList.add('is-shown');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  /* Clear form (works on any step, returns to Step 1) */
  form.querySelectorAll('.clear-link').forEach((clearBtn) => {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      form.reset();
      form.querySelectorAll('.form-other.is-shown').forEach(o => o.classList.remove('is-shown'));
      form.querySelectorAll('.is-invalid').forEach(r => r.classList.remove('is-invalid'));
      showStep(1);
    });
  });

  /* "Register another response" — reset everything and return to Step 1 */
  const reset = card.querySelector('.success-reset');
  if (reset) {
    reset.addEventListener('click', (e) => {
      e.preventDefault();
      card.classList.remove('is-submitted');
      const success = card.querySelector('.form-success');
      if (success) success.classList.remove('is-shown');
      form.reset();
      form.querySelectorAll('.form-other.is-shown').forEach(o => o.classList.remove('is-shown'));
      form.querySelectorAll('.is-invalid').forEach(r => r.classList.remove('is-invalid'));
      showStep(1);
    });
  }

  // Initial render — do not scroll the page on first paint
  showStep(1, { skipScroll: true });
}

/* duplicate marquee items so the loop is seamless */
function initMarqueeDuplicate() {
  document.querySelectorAll('.marquee-track').forEach((track) => {
    if (track.dataset.duplicated) return;
    track.dataset.duplicated = 'yes';
    const html = track.innerHTML;
    track.innerHTML = html + html;
  });
}
