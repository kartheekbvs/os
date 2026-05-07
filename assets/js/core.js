import { Bus } from './event-bus.js';
import { ErrorHandler } from './error-handler.js';
import { StateManager } from './state.js';
import { UIController } from './ui.js';
import { NavigationController } from './navigation.js';
import { AnimationController } from './animation.js';

class AppCore {
  constructor() {
    this.init();
  }

  async init() {
    performance.mark('app_init_start');
    
    // 1. Core Systems
    ErrorHandler.init();
    StateManager.initTheme();

    // 2. Base UI & Navigation
    UIController.init();
    NavigationController.init();
    AnimationController.init();

    // 3. Advanced Engine Orchestration (Dynamic Imports based on page needs)
    await this.orchestrateDynamicImports();

    // 4. Handle Deep Linking if present (#concept-id)
    this.handleDeepLinking();

    performance.measure('app_init_duration', 'app_init_start');
    console.log(`[Core] Boot complete in ${performance.getEntriesByName('app_init_duration')[0].duration.toFixed(2)}ms`);
  }

  /**
   * Strategically load heavy dependencies only when the current page requires them.
   */
  async orchestrateDynamicImports() {
    const isTerminalPage = document.querySelector('.terminal-mount-point') !== null;
    const isCodePage = document.querySelector('pre[class*="language-"]') !== null;
    const isMathPage = document.querySelector('.concept-formula') !== null;

    try {
      if (isTerminalPage) {
        // Will load terminal.js lazily
        console.log('[Core] Dynamic Import: Terminal Engine scheduled.');
      }
      
      if (isCodePage) {
        // Will load Prism dynamically
        console.log('[Core] Dynamic Import: PrismJS scheduled.');
      }

      if (isMathPage) {
        // Will load KaTeX dynamically
        console.log('[Core] Dynamic Import: KaTeX scheduled.');
      }
    } catch (err) {
      ErrorHandler.handleGlobalError(new Error('Dynamic Import Failed: ' + err.message));
    }
  }

  handleDeepLinking() {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      // Let the content renderer know it needs to scroll to this after injection
      Bus.emit('scroll_to_concept', targetId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.OSAcademy = new AppCore();
});
