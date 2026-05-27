/* ============================================================
   LE CAMBRE D'AZE — Interactivité
============================================================ */

(() => {
  'use strict';

  /* ---------- Nav: scroll state ---------- */
  const nav = document.getElementById('nav');
  const stickyCta = document.getElementById('stickyCta');
  const hero = document.getElementById('hero');

  const onScroll = () => {
    const y = window.scrollY;
    if (y > 60) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Sticky CTA: visible quand le hero sort du viewport ---------- */
  /* (évite que la CTA bar couvre le formulaire du hero sur mobile) */
  if (hero && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio < 0.15) {
          stickyCta.classList.add('is-visible');
          stickyCta.setAttribute('aria-hidden', 'false');
        } else {
          stickyCta.classList.remove('is-visible');
          stickyCta.setAttribute('aria-hidden', 'true');
        }
      });
    }, { threshold: [0, 0.15, 0.5, 1] });
    heroObserver.observe(hero);
  }

  /* ---------- Video hero: pause when offscreen ---------- */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo && 'IntersectionObserver' in window) {
    const videoIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.1 });
    videoIo.observe(heroVideo);
  }

  /* ---------- Mobile video : kickstart autoplay + son toggle ---------- */
  const mobileVideo = document.querySelector('.hero__mobile-video video');
  const soundBtn = document.querySelector('.js-toggle-sound');

  if (mobileVideo) {
    // Force le play après le 1er tap utilisateur (workaround iOS strict autoplay policy)
    const ensurePlay = () => {
      const p = mobileVideo.play();
      if (p && p.catch) p.catch(() => {});
    };
    ensurePlay();
    document.addEventListener('touchstart', ensurePlay, { once: true, passive: true });

    // Pause quand offscreen (économie batterie)
    if ('IntersectionObserver' in window) {
      const mvIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            mobileVideo.play().catch(() => {});
          } else {
            mobileVideo.pause();
          }
        });
      }, { threshold: 0.2 });
      mvIo.observe(mobileVideo);
    }
  }

  if (soundBtn && mobileVideo) {
    soundBtn.addEventListener('click', () => {
      mobileVideo.muted = !mobileVideo.muted;
      soundBtn.classList.toggle('is-unmuted', !mobileVideo.muted);
      soundBtn.setAttribute('aria-label', mobileVideo.muted ? 'Activer le son' : 'Couper le son');
    });
  }

  // Bouton plein écran (compatible iOS Safari + standards)
  const fullscreenBtn = document.querySelector('.js-fullscreen-video');
  if (fullscreenBtn && mobileVideo) {
    fullscreenBtn.addEventListener('click', () => {
      // iOS Safari (≥12) supporte webkitEnterFullscreen sur l'élément video lui-même
      if (typeof mobileVideo.webkitEnterFullscreen === 'function') {
        mobileVideo.webkitEnterFullscreen();
      } else if (typeof mobileVideo.requestFullscreen === 'function') {
        mobileVideo.requestFullscreen().catch(() => {});
      } else if (typeof mobileVideo.webkitRequestFullscreen === 'function') {
        mobileVideo.webkitRequestFullscreen();
      } else if (typeof mobileVideo.msRequestFullscreen === 'function') {
        mobileVideo.msRequestFullscreen();
      }
      // En entrant en plein écran on retire le pointer-events: none pour laisser
      // l'utilisateur utiliser les contrôles natifs iOS (volume, scrubber)
      mobileVideo.style.pointerEvents = 'auto';
    });
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById('navBurger');
  const navMobile = document.getElementById('navMobile');

  burger.addEventListener('click', () => {
    const open = navMobile.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Fermer le menu quand on clique sur un lien
  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMobile.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Reveal animations (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Modal brochure : ouverture sur place + lazy load form ---------- */
  const openBtns = document.querySelectorAll('.js-open-brochure');
  const modal = document.getElementById('brochureModal');
  const closeEls = document.querySelectorAll('.js-close-modal');
  const formContainer = document.getElementById('brochureFormContainer');

  // Lazy load du script Systeme.io : on l'injecte uniquement au 1er ouverture
  // -> évite que iOS Safari déclenche l'autocomplete au 1er tap sur le CTA
  // Le funnel diffère selon la langue de la page (FR / ES).
  const isSpanish = document.documentElement.lang === 'es';
  const FORM_SCRIPT = isSpanish
    ? { id: 'form-script-tag-24095092', src: 'https://lecambredaze.systeme.io/public/remote/page/41070063f5e08476227a41bc494901a2d19b623d.js' }
    : { id: 'form-script-tag-24078244', src: 'https://lecambredaze.systeme.io/public/remote/page/41031899721b5c7af51ea4cf506e6b31005ec6bd.js' };

  let formLoaded = false;
  const loadBrochureForm = () => {
    if (formLoaded || !formContainer) return;
    formLoaded = true;
    const script = document.createElement('script');
    script.id = FORM_SCRIPT.id;
    script.src = FORM_SCRIPT.src;
    script.async = true;
    formContainer.appendChild(script);

    // Hide spinner once script likely loaded
    script.onload = () => {
      const loader = formContainer.querySelector('.modal__form-loading');
      if (loader) loader.style.display = 'none';
    };
  };

  // Scroll lock iOS-safe : on fige le body en position fixed
  // et on mémorise la position pour la restaurer à la fermeture
  let savedScrollY = 0;
  const lockBodyScroll = () => {
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  };
  const unlockBodyScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
  };

  const openModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Lazy load le form au 1er click — élimine autocomplete bar sur 1er tap
    loadBrochureForm();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockBodyScroll();

    navMobile.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');

    if (stickyCta) {
      stickyCta.style.opacity = '0';
      stickyCta.style.pointerEvents = 'none';
    }
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockBodyScroll();

    if (stickyCta) {
      stickyCta.style.opacity = '';
      stickyCta.style.pointerEvents = '';
    }
  };

  openBtns.forEach(btn => btn.addEventListener('click', openModal));
  closeEls.forEach(el => el.addEventListener('click', closeModal));

  // Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Support clavier (Enter/Espace) pour TOUS les CTAs non-button
  // (sticky CTA, teaser plan d'étage, etc.)
  openBtns.forEach(el => {
    if (el.tagName !== 'BUTTON') {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(e);
        }
      });
    }
  });

  /* ---------- Lightbox galerie ---------- */
  const galleryItems = document.querySelectorAll('[data-lightbox]');

  const createLightbox = () => {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <button class="lightbox__close" aria-label="Fermer">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Précédent">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Suivant">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      <div class="lightbox__stage">
        <img alt="" />
      </div>
      <div class="lightbox__counter"></div>
    `;
    document.body.appendChild(lb);

    // Styles inline pour minimiser dépendance CSS
    const style = document.createElement('style');
    style.textContent = `
      .lightbox {
        position: fixed; inset: 0; z-index: 300;
        opacity: 0; visibility: hidden;
        transition: opacity 300ms ease-out, visibility 300ms ease-out;
      }
      .lightbox.is-open { opacity: 1; visibility: visible; }
      .lightbox__backdrop {
        position: absolute; inset: 0;
        background: rgba(10, 8, 6, 0.96);
        backdrop-filter: blur(8px);
      }
      .lightbox__stage {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        padding: 4rem 5rem;
      }
      .lightbox__stage img {
        max-width: 100%; max-height: 100%;
        object-fit: contain;
        transition: opacity 200ms ease-out;
        box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      }
      .lightbox__close,
      .lightbox__nav {
        position: absolute; z-index: 2;
        width: 56px; height: 56px;
        display: flex; align-items: center; justify-content: center;
        background: transparent;
        border: 1px solid rgba(245,241,234, 0.25);
        border-radius: 50%;
        color: rgba(245,241,234, 0.85);
        transition: all 200ms ease-out;
        backdrop-filter: blur(8px);
      }
      .lightbox__close:hover,
      .lightbox__nav:hover {
        background: rgba(245,241,234, 0.1);
        border-color: rgba(245,241,234, 0.5);
        color: #F5F1EA;
      }
      .lightbox__close { top: 1.5rem; right: 1.5rem; }
      .lightbox__nav--prev { left: 1.5rem; top: 50%; transform: translateY(-50%); }
      .lightbox__nav--next { right: 1.5rem; top: 50%; transform: translateY(-50%); }
      .lightbox__counter {
        position: absolute;
        bottom: 1.5rem; left: 50%;
        transform: translateX(-50%);
        color: rgba(245,241,234, 0.6);
        font-family: 'Josefin Sans', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 0.25em;
        text-transform: uppercase;
      }
      @media (max-width: 768px) {
        .lightbox__stage { padding: 5rem 1rem; }
        .lightbox__close { top: 1rem; right: 1rem; width: 44px; height: 44px; }
        .lightbox__nav { width: 44px; height: 44px; }
        .lightbox__nav--prev { left: 0.5rem; }
        .lightbox__nav--next { right: 0.5rem; }
      }
    `;
    document.head.appendChild(style);

    return lb;
  };

  const lightbox = createLightbox();
  const lbImg = lightbox.querySelector('.lightbox__stage img');
  const lbCounter = lightbox.querySelector('.lightbox__counter');
  const lbBackdrop = lightbox.querySelector('.lightbox__backdrop');
  const lbClose = lightbox.querySelector('.lightbox__close');
  const lbPrev = lightbox.querySelector('.lightbox__nav--prev');
  const lbNext = lightbox.querySelector('.lightbox__nav--next');

  let lbIndex = 0;
  const lbSources = Array.from(galleryItems).map(item => {
    const img = item.querySelector('img');
    return { src: img.src, alt: img.alt };
  });

  const showLb = (i) => {
    lbIndex = (i + lbSources.length) % lbSources.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = lbSources[lbIndex].src;
      lbImg.alt = lbSources[lbIndex].alt;
      lbImg.style.opacity = '1';
    }, 180);
    lbCounter.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(lbSources.length).padStart(2, '0')}`;
  };

  const openLb = (i) => {
    showLb(i);
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeLb = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLb(i));
  });

  lbClose.addEventListener('click', closeLb);
  lbBackdrop.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', () => showLb(lbIndex - 1));
  lbNext.addEventListener('click', () => showLb(lbIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  /* ---------- Swipe support ---------- */
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) showLb(lbIndex - 1);
      else showLb(lbIndex + 1);
    }
  }, { passive: true });

  /* ---------- Language switcher: mémorise le choix manuel ---------- */
  /* Empêche le script de détection auto (dans le <head>) de rebondir
     l'utilisateur vers une langue qu'il vient de quitter manuellement. */
  document.querySelectorAll('.nav__lang-link').forEach(link => {
    link.addEventListener('click', () => {
      const lang = link.getAttribute('lang');
      try { localStorage.setItem('langChoice', lang); } catch (e) {}
    });
  });

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
