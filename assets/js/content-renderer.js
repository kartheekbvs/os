import { ErrorHandler } from './error-handler.js';
import { ComponentRegistry } from './component-registry.js';
import { TerminalEngine } from './terminal.js';
import { SVGEngine } from './svg-engine.js';
import { SimulatorEngine } from './simulator-engine.js';
import { GlossaryEngine } from './glossary-engine.js';
import { Bus } from './event-bus.js';
import { qs, qsa } from './utils.js';

export class ContentRenderer {
  constructor(mountId, jsonUrl) {
    this.mountNode = qs(mountId);
    this.jsonUrl = jsonUrl;
    this.templateHTML = '';
    this.terminals = [];
    this.animations = [];
    
    this.init();
    
    Bus.on('scroll_to_concept', (id) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Adjust for topbar height
          window.scrollBy(0, -80);
        }
      }, 500); // Wait for hydration
    });

    console.log(`[ContentRenderer] Initialized for ${jsonUrl} into ${mountId}`);
  }

  async init() {
    if (!this.mountNode) {
      console.error(`[ContentRenderer] Mount point not found. Aborting initialization.`);
      return;
    }
    
    try {
      performance.mark('content_load_start');
      
      // 1. Fetch Template
      const tplRes = await fetch('components/concept-template.html');
      if (!tplRes.ok) throw new Error('Failed to load concept template');
      this.templateHTML = await tplRes.text();

      // 2. Fetch Data
      const dataRes = await fetch(this.jsonUrl);
      if (!dataRes.ok) throw new Error(`Failed to load content payload from ${this.jsonUrl}`);
      const payload = await dataRes.json();
      this.data = payload;

      // 3. Render Concepts
      this.renderConcepts(payload);

      // 4. Update Sidebar/Progress
      this.setupTOC();
      this.setupScrollTracking();
      this.renderMath();
      
      Bus.emit('page_loaded', { module: payload.meta.module });
      Bus.emit('content_hydrated');
      
      performance.measure('content_load_duration', 'content_load_start');
      console.log(`[ContentRenderer] Rendered ${payload.meta.module} in ${performance.getEntriesByName('content_load_duration')[0].duration.toFixed(2)}ms`);

    } catch (err) {
      console.error('[ContentRenderer Error]', err);
      ErrorHandler.handleFetchError(`ContentRenderer (${this.jsonUrl})`, err);
      this.mountNode.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div class="w-16 h-16 bg-accent-red/10 text-accent-red rounded-full flex-center mb-6">
            <i class="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <h2 class="text-2xl font-bold mb-2">Systems Failure: Content Unreachable</h2>
          <p class="text-text-secondary max-w-md mb-8">The system was unable to synchronize with the curriculum data lake at ${this.jsonUrl}. Check your connection or verify the asset path.</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-redo mr-2"></i> REBOOT_PIPELINE
          </button>
        </div>
      `;
    } finally {
      // Small delay to prevent layout flash during final reflow
      setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) {
          loader.classList.add('opacity-0');
          setTimeout(() => loader.classList.add('hidden'), 300);
        }
      }, 100);
    }
  }

  renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }

  setupTOC() {
    const tocContainer = document.getElementById('module-toc-container');
    const tocList = document.getElementById('module-toc');
    if (!tocContainer || !tocList || !this.data.concepts) return;

    tocContainer.classList.remove('hidden');
    tocList.innerHTML = '';
    this.data.concepts.forEach(concept => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="#concept-${concept.id}" class="block py-1 px-2 text-text-secondary hover:text-accent-cyan hover:bg-bg-surface-elevated rounded transition-all truncate" data-toc-id="concept-${concept.id}">
          ${concept.title}
        </a>
      `;
      tocList.appendChild(li);
    });

    tocContainer.classList.remove('hidden');
  }

  setupScrollTracking() {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.highlightTOC(id);
        }
      });
    }, observerOptions);

    this.data.concepts.forEach(concept => {
      const element = document.getElementById(`concept-${concept.id}`);
      if (element) observer.observe(element);
    });
  }

  highlightTOC(id) {
    document.querySelectorAll('[data-toc-id]').forEach(el => {
      el.classList.remove('text-accent-cyan', 'bg-bg-surface-elevated', 'font-bold');
      el.classList.add('text-text-secondary');
    });

    const active = document.querySelector(`[data-toc-id="${id}"]`);
    if (active) {
      active.classList.remove('text-text-secondary');
      active.classList.add('text-accent-cyan', 'bg-bg-surface-elevated', 'font-bold');
    }
  }

  renderConcepts(data) {
    if (!data || !data.concepts) {
      console.warn('[ContentRenderer] No concepts found in payload');
      return;
    }

    const concepts = data.concepts;
    this.mountNode.innerHTML = ''; // Clear loaders
    const fragment = document.createDocumentFragment();
    
    console.log(`[ContentRenderer] Rendering ${concepts.length} concepts...`);

    concepts.forEach(concept => {
      const el = document.createElement('div');
      el.innerHTML = this.templateHTML;
      const article = el.firstElementChild;
      
      article.id = `concept-${concept.id}`;
      
      // Inject text data
      this.injectSlot(article, 'title', concept.title);
      this.injectSlot(article, 'difficulty-badge', `<span class="badge badge-${concept.difficulty.toLowerCase()}">${concept.difficulty}</span>`);
      
      if (concept.tags) {
        this.injectSlot(article, 'tags', concept.tags.map(t => `<span class="badge text-text-muted border border-border-subtle bg-bg-surface">#${t}</span>`).join(''));
      }

      // Helper to wrap known glossary terms
      const glossarize = (text) => {
        if(!text) return '';
        // Simple regex to wrap terms. In a real app, this would use the DICTIONARY keys dynamically.
        const terms = ['PCB', 'TLB', 'inode', 'semaphore', 'deadlock', 'syscall', 'ASLR', 'NX', 'SUID'];
        let result = text;
        terms.forEach(t => {
          const regex = new RegExp(`\\b(${t})\\b`, 'g');
          result = result.replace(regex, `<span class="glossary-term text-accent-cyan cursor-help border-b border-dashed border-accent-cyan" data-term="$1">$1</span>`);
        });
        return result;
      };

      const adaptiveMode = data.meta && data.meta.concept_template_mode === 'adaptive';
      
      const inject = (slotName, value) => {
        const slot = article.querySelector(`[data-slot="${slotName}"]`);
        if (!slot) return;
        
        if (value) {
          slot.innerHTML = value;
          // Show parent section if it was hidden
          const section = slot.closest('section') || slot.parentElement;
          if (section) section.classList.remove('hidden');
        } else if (adaptiveMode) {
          // In adaptive mode, hide sections with no content
          const section = slot.closest('section') || slot.parentElement;
          if (section) section.classList.add('hidden');
        }
      };

      const content = concept.content;
      inject('why-exists', content.why_exists);
      inject('real-world-problem', content.real_world_problem);
      inject('daily-life-analogy', content.daily_life_analogy);
      inject('hardware-story', content.hardware_story);
      inject('execution-flow', content.execution_flow ? `<pre>${content.execution_flow}</pre>` : null);
      inject('visual-machine-model', content.visual_machine_model);
      inject('performance-tradeoffs', content.performance_tradeoffs);
      inject('security-tradeoffs', content.security_tradeoffs);
      inject('mini-recap', content.mini_recap);
      inject('next-topic-why', content.next_topic_why);

      inject('definition', glossarize(content.definition));
      inject('internals', glossarize(content.internals));
      inject('worked-example', content.worked_example);
      
      // V4 Field Mapping for Misconceptions and Interviews
      if (content.common_misconceptions) {
        inject('common-mistakes', content.common_misconceptions);
        article.querySelector('[data-slot="mistakes-container"]')?.classList.remove('hidden');
      }
      
      if (content.interview_questions) {
        const iqHtml = `
          <ul class="space-y-3 mt-4">
            ${content.interview_questions.map(q => `
              <li class="flex items-start gap-3">
                <i class="fas fa-question-circle text-accent-purple mt-1"></i>
                <span class="text-sm text-text-secondary">${q}</span>
              </li>
            `).join('')}
          </ul>
        `;
        inject('interview-questions', iqHtml);
        article.querySelector('[data-slot="placement-container"]')?.classList.remove('hidden');
      }
      
      if (content.formula) {
        article.querySelector('[data-slot="formula-container"]').classList.remove('hidden');
        // KaTeX will be initialized later, for now inject raw
        this.injectSlot(article, 'formula', `$$${content.formula}$$`);
      }

      if (content.algorithm_steps) {
        article.querySelector('[data-slot="algorithm-container"]').classList.remove('hidden');
        const steps = content.algorithm_steps.split('\n').map(s => `<div class="mb-1">${s}</div>`).join('');
        this.injectSlot(article, 'algorithm-steps', steps);
      }

      if (content.worked_example) {
        article.querySelector('[data-slot="example-container"]').classList.remove('hidden');
        this.injectSlot(article, 'worked-example', content.worked_example);
      }

      if (content.comparison_table) {
        article.querySelector('[data-slot="comparison-container"]').classList.remove('hidden');
        // Render simple HTML table
        const tableHtml = `
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-bg-surface-elevated border-b border-border-strong">
                ${content.comparison_table.headers.map(h => `<th class="p-2 font-mono text-xs text-text-muted uppercase">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${content.comparison_table.rows.map(row => `
                <tr class="border-b border-border-subtle hover:bg-bg-surface transition-colors">
                  ${row.map(cell => `<td class="p-2 text-sm text-text-primary">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        this.injectSlot(article, 'comparison-table', tableHtml);
      }

      if (content.formula_sandbox) {
        article.querySelector('[data-slot="sandbox-container"]').classList.remove('hidden');
        // A placeholder for the formula sandbox widget
        this.injectSlot(article, 'formula-sandbox', `
          <div class="flex flex-col gap-2">
            <div class="text-xs text-text-muted">${content.formula_sandbox.description}</div>
            <div class="flex items-center gap-4 mt-2">
               ${content.formula_sandbox.inputs.map(i => `
                 <label class="flex flex-col text-xs text-text-secondary">
                   ${i.label}
                   <input type="number" class="bg-bg-primary border border-border-subtle p-1 rounded mt-1" placeholder="${i.default}">
                 </label>
               `).join('')}
               <button class="btn btn-primary self-end py-1"><i class="fas fa-play text-xs"></i> Calculate</button>
            </div>
            <div class="mt-2 text-accent-cyan font-mono result-display">Result: --</div>
          </div>
        `);
      }

      if (content.interactive_simulator) {
        article.querySelector('[data-slot="simulator-container"]').classList.remove('hidden');
        const mountTarget = article.querySelector('[data-slot="interactive-simulator"]');
        mountTarget.id = `sim-${concept.id}`;
        mountTarget.innerHTML = ''; // Clear fallback HTML
        
        // Initialize SimulatorEngine immediately and bind it to the article for control lookup
        const engine = new SimulatorEngine(mountTarget, content.interactive_simulator, concept.id);
        article._sim = engine;
        this.animations.push(engine);
      }

      if (content.threat_model) {
        article.querySelector('[data-slot="threat-model-container"]').classList.remove('hidden');
        const tm = content.threat_model;
        const tmHtml = `
          <div><strong class="text-text-primary">Attacker Goal:</strong> <span class="text-text-secondary">${tm.goal}</span></div>
          <div><strong class="text-text-primary">Vulnerability:</strong> <span class="text-accent-red">${tm.vulnerability}</span></div>
          <div class="col-span-2"><strong class="text-text-primary">Mitigation:</strong> <span class="text-accent-green">${tm.mitigation}</span></div>
        `;
        this.injectSlot(article, 'threat-model', tmHtml);
      }

      if (content.man_page) {
        article.querySelector('[data-slot="man-page-container"]').classList.remove('hidden');
        const man = content.man_page;
        let manHtml = '';
        if (man.name) manHtml += `<div><h5 class="font-bold text-white mb-1">NAME</h5><div class="pl-4">${man.name}</div></div>`;
        if (man.synopsis) manHtml += `<div><h5 class="font-bold text-white mb-1">SYNOPSIS</h5><div class="pl-4">${man.synopsis}</div></div>`;
        if (man.description) manHtml += `<div><h5 class="font-bold text-white mb-1">DESCRIPTION</h5><div class="pl-4">${man.description}</div></div>`;
        if (man.options) {
          manHtml += `<div><h5 class="font-bold text-white mb-1">OPTIONS</h5><div class="pl-4 space-y-1">`;
          man.options.forEach(opt => {
            manHtml += `<div><strong class="text-white">${opt.flag}</strong><br><span class="pl-4 block">${opt.desc}</span></div>`;
          });
          manHtml += `</div></div>`;
        }
        this.injectSlot(article, 'man-page', manHtml);
      }

      if (content.security_warning) {
        article.querySelector('[data-slot="security-warning-container"]').classList.remove('hidden');
        this.injectSlot(article, 'security-warning', content.security_warning);
      }

      if (content.linux_mapping || concept.commands) {
        article.querySelector('[data-slot="linux-map-container"]').classList.remove('hidden');
        this.injectSlot(article, 'linux-mapping', content.linux_mapping || '');
      }

      if (content.common_mistakes) {
        article.querySelector('[data-slot="mistakes-container"]').classList.remove('hidden');
        this.injectSlot(article, 'common-mistakes', content.common_mistakes);
      }

      // Graph Metadata
      if (concept.graph) {
        const renderLinks = (arr) => arr.map(a => `<a href="#${a}" class="text-accent-cyan hover:underline">${a}</a>`).join(', ');
        if (concept.graph.prerequisites?.length) this.injectSlot(article, 'prerequisites', `Prereqs: ${renderLinks(concept.graph.prerequisites)}`);
        if (concept.graph.related_topics?.length) this.injectSlot(article, 'related-topics', `Related: ${renderLinks(concept.graph.related_topics)}`);
        if (concept.graph.next_topics?.length) this.injectSlot(article, 'next-topics', `Next: ${renderLinks(concept.graph.next_topics)}`);
      }

      // Diagrams
      if (concept.diagram) {
        const diagContainer = article.querySelector('[data-slot="diagram-container"]');
        diagContainer.classList.remove('hidden');
        const mountTarget = article.querySelector('[data-slot="diagram"]');
        mountTarget.id = `diag-${concept.id}`;
        
        // Schedule SVGEngine initialization
        setTimeout(() => {
          this.animations.push(new SVGEngine(qs(`#diag-${concept.id}`), concept.diagram));
        }, 0);
      }

      // Placement
      if (concept.placement && (concept.placement.mcqs || concept.placement.interview_questions)) {
        article.querySelector('[data-slot="placement-container"]').classList.remove('hidden');
        if (concept.placement.mcqs) {
          const mcqHtml = concept.placement.mcqs.map(mcq => ComponentRegistry.renderMCQ(mcq)).join('');
          this.injectSlot(article, 'mcqs', mcqHtml);
        }
        if (concept.placement.interview_questions) {
          const iqHtml = concept.placement.interview_questions.map(iq => `
            <div class="p-3 bg-bg-surface border border-border-subtle rounded text-sm text-text-primary mb-2 flex items-start gap-2">
              <i class="fas fa-comment-dots text-accent-cyan mt-1"></i> ${iq}
            </div>
          `).join('');
          this.injectSlot(article, 'interview-questions', iqHtml);
        }
      }

      // Terminal
      if (concept.commands && concept.commands.length > 0) {
        const termContainer = article.querySelector('[data-slot="terminal-mount"]');
        termContainer.classList.remove('hidden');
        termContainer.id = `term-${concept.id}`;
        
        // Explain the commands above it
        const explanationHtml = concept.commands.map(c => `
          <div class="mb-2 text-sm"><code class="text-accent-green">${c.command}</code>: <span class="text-text-secondary">${c.explanation}</span></div>
        `).join('');
        termContainer.insertAdjacentHTML('beforebegin', `<div class="mb-4">${explanationHtml}</div>`);

        setTimeout(() => {
          // Fetch VFS
          fetch('assets/data/filesystem.json')
            .then(res => res.json())
            .then(vfs => {
              this.terminals.push(new TerminalEngine(qs(`#term-${concept.id}`), { vfs }));
            });
        }, 0);
      }

      fragment.appendChild(article);
    });

    this.mountNode.appendChild(fragment);

    // Trigger post-render hooks (Prism, KaTeX, Observers)
    setTimeout(() => {
      this.triggerPostRenderHooks();
    }, 100);
  }

  injectSlot(parent, slotName, contentHTML) {
    const slot = parent.querySelector(`[data-slot="${slotName}"]`);
    if (slot && contentHTML) {
      slot.innerHTML = contentHTML;
    }
  }

  triggerPostRenderHooks() {
    // Math rendering
    if (window.katex) {
      qsa('.concept-formula').forEach(el => {
        const tex = el.innerText.replace(/\$\$/g, '');
        window.katex.render(tex, el, { throwOnError: false, displayMode: true });
      });
    }

    // Initialize Glossary Engine once text is injected
    GlossaryEngine.init();
  }
}
