import { qs, qsa, debounce } from './utils.js';
import { Bus } from './event-bus.js';

export const UIController = {
  /**
   * Initialize all generic UI behaviors
   */
  init() {
    this.initScrollProgress();
    this.initCopyButtons();
    this.initPlacementReveals();
    this.initThemeToggle();
    this.initGlobalShortcuts();
  },

  /**
   * Keyboard Shortcuts (Ctrl+K, ESC)
   */
  initGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+K Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Bus.emit('toggle_command_palette');
      }
      // ESC Close
      if (e.key === 'Escape') {
        Bus.emit('close_overlays');
      }
    });
  },

  /**
   * Theme Toggle Logic
   */
  initThemeToggle() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle');
      if (btn) {
        import('./state.js').then(({ StateManager }) => {
          StateManager.toggleTheme();
        });
      }
    });
  },

  /**
   * Read progress bar at the top of the page
   */
  initScrollProgress() {
    const progressBar = qs('#scroll-progress');
    if (!progressBar) return;

    const calculateScroll = () => {
      const scrollPx = document.documentElement.scrollTop || document.body.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = `${(scrollPx / winHeightPx) * 100}%`;
      progressBar.style.width = scrolled;
    };

    window.addEventListener('scroll', debounce(calculateScroll, 10));
  },

  /**
   * Code block copy to clipboard functionality
   */
  initCopyButtons() {
    // We use event delegation on the document for dynamically rendered code blocks
    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.copy-btn');
      if (!copyBtn) return;

      const pre = copyBtn.closest('pre');
      const code = pre ? pre.querySelector('code') : null;
      
      if (code) {
        navigator.clipboard.writeText(code.innerText).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
          copyBtn.classList.add('text-accent-green');
          
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('text-accent-green');
          }, 2000);
        });
      }
    });
  },

  /**
   * Placement Questions Answer Reveal (Event Delegation)
   */
  initPlacementReveals() {
    document.addEventListener('click', (e) => {
      const option = e.target.closest('.mcq-option');
      if (option) {
        const isCorrect = option.dataset.correct === 'true';
        
        // Remove active states from siblings
        const siblings = Array.from(option.parentElement.children);
        siblings.forEach(sib => sib.classList.remove('correct', 'incorrect'));

        // Apply correct/incorrect styling
        if (isCorrect) {
          option.classList.add('correct');
        } else {
          option.classList.add('incorrect');
          // Highlight the correct one as well
          const correctOption = siblings.find(sib => sib.dataset.correct === 'true');
          if (correctOption) correctOption.classList.add('correct');
        }
        
        // Show explanation block if it exists
        const explanation = option.closest('.mcq-panel').querySelector('.mcq-explanation');
        if (explanation) {
          explanation.style.display = 'block';
          explanation.classList.add('animate-fade-in');
        }
      }
    });
  }
};
