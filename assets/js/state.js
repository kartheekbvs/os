/**
 * State Management, LocalStorage Persistence, and Theming
 */

const STATE_KEY = 'os_academy_state';

const defaultState = {
  theme: 'dark',
  completedConcepts: [],
  terminalHistory: [],
  lastVisited: '/'
};

export const StateManager = {
  /**
   * Load state from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(STATE_KEY);
      if (stored) {
        return { ...defaultState, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return { ...defaultState };
  },

  /**
   * Save state to localStorage
   */
  save(newState) {
    try {
      const current = this.load();
      const updated = { ...current, ...newState };
      localStorage.setItem(STATE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save state', e);
    }
  },

  /**
   * Theme Management
   */
  initTheme() {
    const state = this.load();
    document.documentElement.setAttribute('data-theme', state.theme);
  },

  toggleTheme() {
    const state = this.load();
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    this.save({ theme: newTheme });
    return newTheme;
  },

  /**
   * Progress Tracking
   */
  markConceptCompleted(conceptId) {
    const state = this.load();
    if (!state.completedConcepts.includes(conceptId)) {
      const updatedList = [...state.completedConcepts, conceptId];
      this.save({ completedConcepts: updatedList });
      
      // Dispatch global event for the UI to update the sidebar progress
      window.dispatchEvent(new CustomEvent('concept_completed', { 
        detail: { conceptId, total: updatedList.length } 
      }));
    }
  },

  isCompleted(conceptId) {
    return this.load().completedConcepts.includes(conceptId);
  }
};
