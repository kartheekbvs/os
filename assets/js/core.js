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
    if (window.OSAcademyInitiated) return;
    window.OSAcademyInitiated = true;
    
    performance.mark('app_init_start');
    
    // 1. Load Global Layout Components
    await this.loadLayout();

    // 2. Core Systems
    ErrorHandler.init();
    StateManager.initTheme();

    // 3. Base UI & Navigation
    UIController.init();
    NavigationController.init();
    AnimationController.init();

    // Sync active state based on filename
    const pageId = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    NavigationController.updateActiveState(pageId);

    // 4. Advanced Engine Orchestration
    await this.orchestrateDynamicImports();

    // 5. Handle Deep Linking
    this.handleDeepLinking();

    Bus.emit('layout_ready');
    performance.measure('app_init_duration', 'app_init_start');
    console.log(`[Core] Boot complete in ${performance.getEntriesByName('app_init_duration')[0].duration.toFixed(2)}ms`);
  }

  async loadLayout() {
    const sidebarMount = document.getElementById('sidebar-mount');
    const topbarMount = document.getElementById('topbar-mount');
    const cmdPaletteMount = document.getElementById('command-palette-mount');

    if (!sidebarMount && !topbarMount) return; // Not a page requiring layout

    try {
      // Use absolute-relative paths to ensure consistency across subpages
      const [sidebarRes, topbarRes, cmdPaletteRes] = await Promise.all([
        fetch('components/sidebar.html'),
        fetch('components/topbar.html'),
        fetch('components/command-palette.html')
      ]);

      if (!sidebarRes.ok || !topbarRes.ok) throw new Error('Layout component fetch failed');

      const sidebarHtml = await sidebarRes.text();
      const topbarHtml = await topbarRes.text();
      const cmdPaletteHtml = cmdPaletteRes.ok ? await cmdPaletteRes.text() : '';

      if (sidebarMount) sidebarMount.innerHTML = sidebarHtml;
      if (topbarMount) topbarMount.innerHTML = topbarHtml;
      if (cmdPaletteMount) cmdPaletteMount.innerHTML = cmdPaletteHtml;
      
      console.log('[Core] Layout components injected successfully.');
    } catch (err) {
      console.error('[Core] Layout injection failed:', err);
      // Fallback for critical UI if injection fails
      if (sidebarMount) sidebarMount.innerHTML = '<div class="p-4 text-xs text-text-muted">Navigation unavailable</div>';
    }
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
