import { Bus } from './event-bus.js';

/**
 * Toast Notification Manager
 */
export const ToastManager = {
  container: null,

  init() {
    this.createContainer();
    this.bindEvents();
  },

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'fixed bottom-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(this.container);
  },

  bindEvents() {
    Bus.on('copy_success', () => this.show('Code copied to clipboard!', 'success'));
    Bus.on('concept_completed', () => this.show('Progress saved!', 'success'));
    Bus.on('theme_changed', (theme) => this.show(`Switched to ${theme} mode`, 'info'));
    Bus.on('terminal_error', (msg) => this.show(msg, 'error'));
    Bus.on('ui_error', (data) => this.show(`Error: ${data.context}`, 'error'));
  },

  show(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded shadow-lg text-sm text-white pointer-events-auto transform transition-all duration-300 translate-y-4 opacity-0 flex items-center gap-2`;
    
    // Type styling
    if (type === 'success') toast.classList.add('bg-accent-green', 'text-bg-primary');
    else if (type === 'error') toast.classList.add('bg-accent-red');
    else toast.classList.add('bg-border-strong');

    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    // Remove after 3s
    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};
