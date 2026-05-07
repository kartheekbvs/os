import { qs, qsa } from './utils.js';
import { Bus } from './event-bus.js';
import { TerminalEngine } from './terminal.js';
import { VisualizerEngine } from './visualizers.js';

/**
 * ContentRenderer V5
 * 
 * Orchestrates the rendering of deep pedagogical Linux content.
 * Features:
 * - 20-point curriculum structure support
 * - Automatic Visualizer injection
 * - Module TOC generation
 * - Terminal Runtime integration
 */
export class ContentRenderer {
  constructor(mountSelector, dataUrl) {
    this.mountNode = qs(mountSelector);
    this.dataUrl = dataUrl;
    this.terminals = [];
    this.tocContainer = qs('#module-toc');
    this.init();
  }

  async init() {
    try {
      const response = await fetch(this.dataUrl);
      const data = await response.json();
      this.render(data);
      this.buildTOC(data.concepts);
      
      // Notify bus for other systems
      Bus.emit('module_loaded', data);
    } catch (err) {
      console.error('ContentRenderer init error:', err);
      if (this.mountNode) {
        this.mountNode.innerHTML = `
          <div class="p-8 text-center glass rounded-2xl border border-accent-red/20">
            <i class="fas fa-exclamation-triangle text-4xl text-accent-red mb-4"></i>
            <h3 class="text-xl font-bold text-white mb-2">Curriculum Load Failure</h3>
            <p class="text-text-secondary text-sm">The module data could not be retrieved. Please check your network connection or try again.</p>
          </div>
        `;
      }
    }
  }

  render(data) {
    if (!this.mountNode) return;
    this.mountNode.innerHTML = '';
    
    const fragment = document.createDocumentFragment();

    data.concepts.forEach((concept, index) => {
      const article = document.createElement('article');
      article.className = 'concept-section mb-24 animate-in';
      article.id = concept.id;
      article.setAttribute('data-index', index);

      article.innerHTML = `
        <!-- Header Section -->
        <div class="concept-header mb-12">
          <div class="flex items-center gap-4 mb-4">
            <span class="px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-mono text-accent-cyan uppercase tracking-widest">${concept.category}</span>
            <span class="text-[10px] font-mono text-text-muted uppercase tracking-widest">${concept.difficulty}</span>
          </div>
          <h2 class="text-5xl font-bold text-white mb-6 tracking-tight">${concept.title}</h2>
          <div class="flex gap-2 flex-wrap">
            ${concept.tags ? concept.tags.map(t => `<span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-text-muted">#${t}</span>`).join('') : ''}
          </div>
        </div>

        <!-- The Engineering Core -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div class="space-y-8">
            <div class="content-block">
              <h4 class="text-xs font-mono text-accent-cyan uppercase tracking-widest mb-3">Why This Exists</h4>
              <p class="text-lg text-text-primary leading-relaxed font-medium">${concept.content.why_exists || ''}</p>
            </div>
            
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <i class="fas fa-screwdriver-wrench text-4xl"></i>
              </div>
              <h4 class="text-xs font-mono text-accent-cyan uppercase tracking-widest mb-3">The Engineering Problem</h4>
              <p class="text-text-secondary text-sm leading-relaxed">${concept.content.problem || ''}</p>
            </div>

            <div class="space-y-4">
              <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div class="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple border border-accent-purple/20 shrink-0">
                  <i class="fas fa-brain"></i>
                </div>
                <div>
                  <h5 class="text-sm font-bold text-white mb-1">Systems Intuition</h5>
                  <p class="text-xs text-text-secondary leading-relaxed">${concept.content.beginner_explanation || ''}</p>
                </div>
              </div>
              
              <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div class="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green border border-accent-green/20 shrink-0">
                  <i class="fas fa-project-diagram"></i>
                </div>
                <div>
                  <h5 class="text-sm font-bold text-white mb-1">Daily Life Analogy</h5>
                  <p class="text-xs text-text-secondary leading-relaxed">${concept.content.analogy || ''}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Machine Model Visualizer -->
          <div class="visualizer-container flex flex-col justify-center">
             <div class="visualizer-mount min-h-[300px]" data-slot="visualizer-mount"></div>
             <div class="mt-4 text-center">
                <span class="text-[10px] font-mono text-text-muted uppercase tracking-widest">Fig ${index + 1}: Internal Machine Model Visualization</span>
             </div>
          </div>
        </div>

        <!-- Terminal Runtime Lab -->
        <div class="lab-section mb-12">
          <div class="terminal-wrapper glass border border-border-strong rounded-2xl overflow-hidden shadow-2xl">
            <div class="terminal-header-meta px-4 py-2 border-b border-border-strong bg-black/40 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                <span class="text-[10px] font-mono text-accent-green uppercase tracking-widest">Interactive Lab Runtime</span>
              </div>
              <div class="text-[10px] font-mono text-text-muted">Target: Linux 5.15-generic</div>
            </div>
            <div class="p-6">
               <div class="mb-4">
                  <h4 class="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Active Mini Lab</h4>
                  ${concept.content.mini_labs ? concept.content.mini_labs.map(lab => `
                    <div class="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between group">
                      <span class="text-xs text-text-primary">${lab.task}</span>
                      <code class="text-[10px] text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Hint: ${lab.command}</code>
                    </div>
                  `).join('') : '<div class="text-xs text-text-muted">No labs available for this section.</div>'}
               </div>
               <div class="terminal-mount-point min-h-[300px]" data-slot="terminal-mount"></div>
            </div>
          </div>
        </div>

        <!-- Deep Knowledge Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div class="p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01]">
              <h5 class="text-xs font-mono text-accent-purple uppercase tracking-widest mb-4">Kernel Story</h5>
              <p class="text-xs text-text-secondary italic leading-relaxed">${concept.content.kernel_story || ''}</p>
           </div>
           <div class="p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01]">
              <h5 class="text-xs font-mono text-accent-purple uppercase tracking-widest mb-4">Internals</h5>
              <p class="text-xs text-text-secondary leading-relaxed">${concept.content.kernel_internals || ''}</p>
           </div>
           <div class="p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01]">
              <h5 class="text-xs font-mono text-accent-purple uppercase tracking-widest mb-4">Security</h5>
              <p class="text-xs text-text-secondary leading-relaxed">${concept.content.security_implications || ''}</p>
           </div>
        </div>
      `;

      // Post-render: Initialize Visualizers
      const visualMount = article.querySelector('[data-slot="visualizer-mount"]');
      if (concept.id === 'linux-permissions-deep') {
        VisualizerEngine.renderPermissionMatrix(visualMount, 0o755);
      } else if (concept.id === 'process-lifecycle') {
        VisualizerEngine.renderProcessTree(visualMount, [
            { pid: 1, ppid: 0, name: 'init', state: 'S' },
            { pid: 1050, ppid: 1, name: 'bash', state: 'S' },
            { pid: 1051, ppid: 1050, name: 'ls', state: 'R' }
        ]);
      }

      // Post-render: Initialize Terminal
      const termMount = article.querySelector('[data-slot="terminal-mount"]');
      if (concept.mini_labs || concept.commands) {
        setTimeout(() => {
          this.terminals.push(new TerminalEngine(termMount, { id: concept.id }));
        }, 0);
      }

      fragment.appendChild(article);
    });

    this.mountNode.appendChild(fragment);

    // Trigger post-render hooks
    setTimeout(() => {
      this.triggerPostRenderHooks();
    }, 100);
  }

  buildTOC(concepts) {
    if (!this.tocContainer) return;
    this.tocContainer.innerHTML = concepts.map(c => `
      <li>
        <a href="#${c.id}" class="toc-link block py-1 px-2 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-accent-cyan">
          ${c.title}
        </a>
      </li>
    `).join('');
    
    const tocWrapper = qs('#module-toc-container');
    if (tocWrapper) tocWrapper.classList.remove('hidden');
  }

  triggerPostRenderHooks() {
    Bus.emit('content_updated');
    
    // Refresh Syntax Highlighting
    if (window.Prism) window.Prism.highlightAllUnder(this.mountNode);
    
    // Refresh Scroll Handling
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
