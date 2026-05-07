import { Bus } from './event-bus.js';

export const KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      // "/" Focus search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('sidebar-search');
        if (searchInput) searchInput.focus();
      }

      // Ctrl+K or Cmd+K Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Bus.emit('toggle_command_palette');
      }

      // [ and ] Navigation (Prev/Next concept)
      if (e.key === '[') {
        Bus.emit('navigate_prev');
      }
      if (e.key === ']') {
        Bus.emit('navigate_next');
      }

      // Escape close overlays
      if (e.key === 'Escape') {
        Bus.emit('close_overlays');
      }
    });
  }
};
