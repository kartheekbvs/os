/**
 * Reusable utility functions for the OS Academy platform.
 */

/**
 * Debounce a function call
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Safe DOM selector that throws a clear error if not found (useful for debugging)
 * @param {string} selector 
 * @param {Document|HTMLElement} context 
 * @returns {HTMLElement}
 */
export function qs(selector, context = document) {
  const el = context.querySelector(selector);
  if (!el) console.warn(`Selector not found: ${selector}`);
  return el;
}

export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
