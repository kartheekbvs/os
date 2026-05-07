import { qs, qsa, debounce } from './utils.js';

export const NavigationController = {
  init() {
    this.initSidebarToggle();
    this.initSearchFilter();
    this.initCollapsibles();
  },

  /**
   * Mobile Sidebar Toggle
   */
  initSidebarToggle() {
    const toggleBtn = qs('#mobile-menu-btn');
    const sidebar = qs('.sidebar');
    
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
      });
    }
  },

  /**
   * Sidebar Live Search Filtering
   */
  initSearchFilter() {
    const searchInput = qs('#sidebar-search');
    if (!searchInput) return;

    const filterLinks = debounce((e) => {
      const term = e.target.value.toLowerCase();
      const links = qsa('.nav-link');
      
      links.forEach(link => {
        const text = link.textContent.toLowerCase();
        // Simple client-side text filtering for the sidebar tree
        if (text.includes(term)) {
          link.style.display = 'flex';
          // Ensure parent section is open
          const section = link.closest('.nav-section');
          if (section) section.classList.remove('collapsed');
        } else {
          link.style.display = 'none';
        }
      });
    }, 200);

    searchInput.addEventListener('input', filterLinks);
  },

  /**
   * Collapsible Navigation Sections
   */
  initCollapsibles() {
    document.addEventListener('click', (e) => {
      const header = e.target.closest('.nav-section-title');
      if (header) {
        const section = header.closest('.nav-section');
        if (section) {
          section.classList.toggle('collapsed');
        }
      }
    });
  }
};
