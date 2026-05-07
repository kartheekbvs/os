import { qs, qsa, debounce } from './utils.js';
import { Bus } from './event-bus.js';

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
    const overlay = qs('#sidebar-overlay');
    
    const toggle = (forceClose = false) => {
      const isOpen = forceClose ? false : !sidebar.classList.contains('is-open');
      sidebar.classList.toggle('is-open', isOpen);
      if (overlay) overlay.classList.toggle('hidden', !isOpen);
    };

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => toggle());
      if (overlay) overlay.addEventListener('click', () => toggle(true));

      // Close sidebar when clicking links on mobile
      document.body.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link') && window.innerWidth < 1024) {
          toggle(true);
        }
      });
    }
  },

  /**
   * Sidebar Live Search Filtering
   */
  initSearchFilter() {
    const searchInput = qs('#sidebar-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce((e) => {
      const term = e.target.value.toLowerCase();
      const sections = qsa('.nav-section');
      const links = qsa('.nav-link');
      
      if (!term) {
        // Reset all
        links.forEach(l => l.style.display = 'flex');
        sections.forEach(s => s.style.display = 'block');
        return;
      }

      sections.forEach(section => {
        const sectionLinks = qsa('.nav-link', section);
        let hasMatch = false;

        sectionLinks.forEach(link => {
          const text = link.textContent.toLowerCase();
          const matches = text.includes(term);
          link.style.display = matches ? 'flex' : 'none';
          if (matches) hasMatch = true;
        });

        section.style.display = hasMatch ? 'block' : 'none';
        if (hasMatch) section.classList.remove('collapsed');
      });
    }, 150));
  },

  /**
   * Collapsible Navigation Sections
   */
  initCollapsibles() {
    // Delegation for dynamic sidebar
    document.body.addEventListener('click', (e) => {
      const header = e.target.closest('.nav-section-title');
      if (header) {
        const section = header.closest('.nav-section');
        if (section) {
          section.classList.toggle('collapsed');
        }
      }
    });
  },

  /**
   * Sync Sidebar Active State
   */
  updateActiveState(pageId) {
    qsa('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = qs(`.nav-link[data-id="${pageId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      const section = activeLink.closest('.nav-section');
      if (section) section.classList.remove('collapsed');
      
      // Update Breadcrumb if on a track page
      const bc = qs('#breadcrumb-current');
      if (bc) {
        const trackName = section ? section.querySelector('.nav-section-title span').textContent : 'Track';
        bc.textContent = `${trackName} / ${activeLink.querySelector('.nav-link-text')?.textContent || activeLink.textContent}`;
      }
    }
  }
};
