/**
 * Global Glossary Engine
 * Binds hover events to glossary terms and displays definitions.
 */

const DICTIONARY = {
  'PCB': 'Process Control Block: The kernel data structure that stores the state of a process.',
  'TLB': 'Translation Lookaside Buffer: A hardware cache in the MMU that stores recent virtual-to-physical address translations.',
  'inode': 'Index Node: A filesystem metadata structure that stores file attributes and disk block locations.',
  'semaphore': 'A synchronization primitive (integer) accessed via wait() and signal() to control access to shared resources.',
  'deadlock': 'A state where a set of processes are blocked because each is holding a resource and waiting for another.',
  'syscall': 'System Call: The programmatic mechanism for user-space applications to request services from the kernel.',
  'ASLR': 'Address Space Layout Randomization: A security technique that randomizes memory locations to prevent buffer overflow attacks.',
  'NX': 'No-eXecute: A hardware feature that marks memory regions as non-executable, preventing code execution in the stack/heap.',
  'SUID': 'Set User ID: A Linux permission bit that allows a program to execute with the privileges of its owner (often root).'
};

export const GlossaryEngine = {
  init() {
    this.createTooltip();
    this.bindEvents();
  },

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'glossary-tooltip absolute bg-bg-surface-elevated border border-border-strong rounded-md p-3 shadow-xl text-sm text-text-primary max-w-xs z-[100] opacity-0 pointer-events-none transition-opacity duration-200';
    document.body.appendChild(this.tooltip);
  },

  bindEvents() {
    document.body.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('glossary-term')) {
        const term = e.target.dataset.term || e.target.textContent;
        const definition = DICTIONARY[term];
        if (definition) {
          this.tooltip.innerHTML = `<strong>${term}</strong><div class="text-xs text-text-secondary mt-1">${definition}</div>`;
          const rect = e.target.getBoundingClientRect();
          this.tooltip.style.left = `${rect.left + window.scrollX}px`;
          this.tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
          this.tooltip.style.opacity = '1';
        }
      }
    });

    document.body.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('glossary-term')) {
        this.tooltip.style.opacity = '0';
      }
    });
  }
};
