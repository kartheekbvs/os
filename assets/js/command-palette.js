import { Bus } from './event-bus.js';
import { qs } from './utils.js';

export const CommandPalette = {
  isOpen: false,
  index: [],
  modules: [
    { name: 'OS Foundations', path: 'os-foundations.html', data: 'assets/data/concepts/os-foundations.json' },
    { name: 'Processes & Scheduling', path: 'os-processes.html', data: 'assets/data/concepts/os-processes.json' },
    { name: 'Synchronization', path: 'os-synchronization.html', data: 'assets/data/concepts/os-sync.json' },
    { name: 'Memory Management', path: 'os-memory.html', data: 'assets/data/concepts/os-memory.json' },
    { name: 'Storage Systems', path: 'os-storage.html', data: 'assets/data/concepts/os-storage.json' },
    { name: 'Security & Protection', path: 'os-security.html', data: 'assets/data/concepts/os-security.json' }
  ],
  
  init() {
    Bus.on('toggle_command_palette', () => this.toggle());
    Bus.on('close_overlays', () => this.close());
    this.bindEvents();
    this.preIndex();
  },

  async preIndex() {
    try {
      const allConcepts = await Promise.all(this.modules.map(async mod => {
        try {
          const res = await fetch(mod.data);
          if (!res.ok) return [];
          const payload = await res.json();
          return payload.concepts.map(c => ({
            id: c.id,
            title: c.title,
            module: mod.name,
            path: mod.path,
            tags: c.tags || []
          }));
        } catch (e) { return []; }
      }));
      this.index = allConcepts.flat();
      console.log(`[Search] Indexed ${this.index.length} concepts across ${this.modules.length} modules.`);
    } catch (err) {
      console.error('[Search] Indexing failed', err);
    }
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'command-palette-overlay') this.close();
    });

    // Delegation for search input
    document.body.addEventListener('input', (e) => {
      if (e.target.id === 'command-palette-input') {
        this.performSearch(e.target.value);
      }
    });

    // Delegation for result selection
    document.body.addEventListener('click', (e) => {
      const item = e.target.closest('[data-search-path]');
      if (item) {
        const path = item.dataset.searchPath;
        const id = item.dataset.searchId;
        this.close();
        window.location.href = `${path}#concept-${id}`;
      }
    });
  },

  performSearch(query) {
    const resultsContainer = qs('#command-palette-results');
    if (!resultsContainer) return;

    const queryStr = query.toLowerCase().trim();
    if (queryStr.length < 2) {
      resultsContainer.innerHTML = '<div class="p-3 text-sm text-text-muted text-center">Type at least 2 characters to search...</div>';
      return;
    }

    const terms = queryStr.split(/\\s+/);

    const matches = this.index.filter(item => {
      const searchableText = `${item.title} ${item.module} ${item.tags.join(' ')}`.toLowerCase();
      return terms.every(t => searchableText.includes(t));
    }).slice(0, 8);

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="p-8 text-center text-text-muted"><i class="fas fa-search-minus mb-3 text-2xl opacity-20"></i><br>No results for "${query}"</div>`;
      return;
    }

    resultsContainer.innerHTML = matches.map(m => `
      <div class="p-3 hover:bg-bg-surface-elevated rounded-lg cursor-pointer group flex-between transition-colors" data-search-path="${m.path}" data-search-id="${m.id}">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-accent-purple/10 text-accent-purple flex-center group-hover:bg-accent-purple group-hover:text-white transition-all">
            <i class="fas fa-file-alt"></i>
          </div>
          <div>
            <div class="text-sm font-bold text-text-primary">${m.title}</div>
            <div class="text-[10px] text-text-muted uppercase font-mono">${m.module}</div>
          </div>
        </div>
        <i class="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all"></i>
      </div>
    `).join('');
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    const overlay = qs('#command-palette-overlay');
    const modal = qs('#command-palette-modal');
    const input = qs('#command-palette-input');
    
    if (!overlay) return;

    this.isOpen = true;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    requestAnimationFrame(() => {
      modal.classList.remove('scale-95', 'opacity-0');
      modal.classList.add('scale-100', 'opacity-100');
      if (input) {
        input.value = '';
        input.focus();
        this.performSearch('');
      }
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
    }, 150);
  }
};
