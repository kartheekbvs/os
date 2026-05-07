import { Bus } from './event-bus.js';
import { qs } from './utils.js';

export const CommandPalette = {
  isOpen: false,
  
  init() {
    Bus.on('toggle_command_palette', () => this.toggle());
    Bus.on('close_overlays', () => this.close());
    this.bindEvents();
  },

  bindEvents() {
    // Event delegation on document for when component is injected
    document.addEventListener('click', (e) => {
      if (e.target.id === 'command-palette-overlay') {
        this.close();
      }
    });
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    const overlay = qs('#command-palette-overlay');
    const modal = qs('#command-palette-modal');
    const input = qs('#command-palette-input');
    
    if (!overlay) return; // Component not injected yet

    this.isOpen = true;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    requestAnimationFrame(() => {
      modal.classList.remove('scale-95', 'opacity-0');
      modal.classList.add('scale-100', 'opacity-100');
      if (input) input.focus();
    });
  },

  close() {
    const overlay = qs('#command-palette-overlay');
    const modal = qs('#command-palette-modal');
    
    if (!overlay || !this.isOpen) return;

    this.isOpen = false;
    modal.classList.remove('scale-100', 'opacity-100');
    modal.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
      overlay.classList.remove('flex');
      overlay.classList.add('hidden');
    }, 150); // Match transition duration
  }
};
