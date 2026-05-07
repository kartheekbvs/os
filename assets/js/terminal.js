import { ShellRuntime } from './shell/shell-runtime.js';
import { Builtins } from './shell/builtins/index.js';
import { ShellInspector } from './shell/shell-inspector.js';
import { Bus } from './event-bus.js';
import { qs, qsa } from './utils.js';

/**
 * TerminalEngine (View Layer)
 * 
 * Responsibilities:
 * - Render Shell output streams
 * - Capture Keyboard input
 * - Handle history/tab completion UI
 * - Bridge to Shell Inspector
 */
export class TerminalEngine {
  constructor(containerElement, config = {}) {
    this.container = containerElement;
    this.terminalId = config.id || 'default-term';
    
    // Initialize the Virtual Shell Runtime (The Kernel)
    this.runtime = new ShellRuntime({
        id: this.terminalId,
        builtins: Builtins
    });

    this.historyIndex = -1;
    this.isSearchMode = false;
    this.searchQuery = '';
    
    this.initDOM();
    
    // Auto-focus input
    setTimeout(() => this.inputField.focus(), 100);
  }

  get promptString() {
    if (this.isSearchMode) {
      return `<span>(reverse-i-search)\`${this.searchQuery}':</span> `;
    }
    let displayCwd = this.runtime.cwd;
    if (displayCwd.startsWith(this.runtime.env.HOME)) displayCwd = displayCwd.replace(this.runtime.env.HOME, '~');
    const promptChar = this.runtime.env.USER === 'root' ? '#' : '$';
    const userColor = this.runtime.env.USER === 'root' ? 'text-accent-red' : 'text-accent-green';
    return `<span class="${userColor}">${this.runtime.env.USER}@linux</span>:<span class="text-accent-purple">${displayCwd}</span>${promptChar} `;
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="terminal-container flex flex-col h-full">
        <div class="terminal-header">
          <div class="terminal-controls">
            <div class="terminal-dot red"></div>
            <div class="terminal-dot yellow"></div>
            <div class="terminal-dot green"></div>
          </div>
          <div class="terminal-title">bash</div>
          <div class="flex items-center gap-2 mr-2">
            <button class="terminal-action-btn toggle-inspector" title="Toggle Kernel Inspector">
              <i class="fas fa-microchip text-[10px]"></i>
            </button>
          </div>
        </div>
        <div class="flex-1 flex overflow-hidden">
          <div class="terminal-body flex-1 flex flex-col overflow-hidden" role="log" aria-live="polite">
            <div class="output-container p-4 overflow-y-auto custom-scrollbar flex-1"></div>
            <div class="terminal-input-line px-4 pb-4">
              <span class="terminal-prompt">${this.promptString}</span>
              <input type="text" class="terminal-input" autocomplete="off" spellcheck="false" autofocus aria-label="Terminal input">
            </div>
          </div>
          <div id="inspector-${this.terminalId}" class="terminal-inspector-mount w-0 transition-all duration-300 border-l border-border-strong overflow-hidden bg-black/20">
          </div>
        </div>
      </div>
    `;

    this.inspectorMount = this.container.querySelector(`#inspector-${this.terminalId}`);
    this.inspector = new ShellInspector(`#inspector-${this.terminalId}`);


    this.outputContainer = this.container.querySelector('.output-container');
    this.inputField = this.container.querySelector('.terminal-input');
    this.promptElement = this.container.querySelector('.terminal-prompt');
    this.bodyElement = this.container.querySelector('.terminal-body');

    this.bindEvents();
  }

  bindEvents() {
    this.inputField.addEventListener('keydown', async (e) => {
      // Ctrl+C
      if (e.ctrlKey && e.key === 'c') {
        this.isSearchMode = false;
        this.renderOutput(`${this.promptString}${this.inputField.value}^C`);
        this.inputField.value = '';
        this.promptElement.innerHTML = this.promptString;
        return;
      }

      if (e.key === 'Enter') {
        const cmdRaw = this.inputField.value;
        this.renderOutput(`${this.promptString}${cmdRaw}`);
        this.inputField.value = '';
        
        if (cmdRaw.trim()) {
          this.inputField.disabled = true;
          
          // Execute via Shell Runtime
          const result = await this.runtime.run(cmdRaw);
          
          this.inputField.disabled = false;
          this.inputField.focus();

          if (result.stdout) this.renderOutput(result.stdout, true, false);
          if (result.stderr) this.renderOutput(result.stderr, false, true);

          this.promptElement.innerHTML = this.promptString;
        }
        
        this.scrollToBottom();
      }
    });

    this.container.addEventListener('click', () => this.inputField.focus());

    this.container.querySelector('.toggle-inspector')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = this.inspectorMount.style.width === '40%';
      this.inspectorMount.style.width = isExpanded ? '0' : '40%';
      this.container.querySelector('.toggle-inspector').classList.toggle('active', !isExpanded);
    });
  }

  renderOutput(text, isHtml = true, isError = false) {
    if (!text) return;
    const div = document.createElement('div');
    div.className = `terminal-output ${isError ? 'text-accent-red font-bold' : ''} leading-relaxed mb-1 font-mono text-sm`;
    
    const formattedText = isHtml ? text.replace(/\n/g, '<br>') : text;
    
    if (isHtml) div.innerHTML = formattedText;
    else div.textContent = text;
    
    this.outputContainer.appendChild(div);
    this.scrollToBottom();
  }

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.bodyElement.scrollTop = this.bodyElement.scrollHeight;
    });
  }
}

