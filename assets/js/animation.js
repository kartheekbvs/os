import { qsa } from './utils.js';

export const AnimationController = {
  init() {
    // Only init if user hasn't requested reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.initScrollAnimations();
  },

  /**
   * Use IntersectionObserver to trigger animations when elements scroll into view
   */
  initScrollAnimations() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add appropriate animation class based on data attribute
          const target = entry.target;
          const animType = target.dataset.animation || 'fade-in';
          
          target.classList.add(`animate-${animType}`);
          
          // Stop observing once animated
          observer.unobserve(target);
          
          // Specific logic for SVGs
          if (target.classList.contains('svg-animated')) {
            target.classList.add('is-visible');
          }
        }
      });
    }, observerOptions);

    // Observe all elements with data-animation attribute
    qsa('[data-animation], .svg-animated').forEach(el => {
      // Set initial state
      if (!el.classList.contains('svg-animated')) {
        el.style.opacity = '0';
      }
      observer.observe(el);
    });
  }
};
