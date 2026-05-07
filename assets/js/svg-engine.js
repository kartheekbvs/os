/**
 * SVG Animation Engine
 * Renders data-driven SVG visualizations for OS concepts.
 */

export class SVGEngine {
  constructor(container, config) {
    this.container = container;
    this.config = config; // { type: 'state_machine', states: [...], transitions: [...] }
    this.svg = null;
    this.animationId = null;
    this.isPaused = false;
    this.time = 0;

    // A11y
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) this.isPaused = true;

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    
    // Create base SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', '0 0 800 400');
    this.svg.classList.add('w-full', 'h-auto', 'max-h-96');
    this.svg.style.fontFamily = 'var(--font-mono)';
    
    // Add Defs for markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
      </marker>
    `;
    this.svg.appendChild(defs);
    
    // Render specific diagram type
    switch(this.config.type) {
      case 'process_state_machine':
        this.renderProcessStateMachine();
        break;
      case 'cpu_scheduling':
        this.renderCPUScheduling();
        break;
      case 'memory_layout':
        this.renderMemoryLayout();
        break;
      // Stubs for the remaining systems to be fleshed out per-page
      case 'layer-stack':
      case 'layer_stack':
        this.renderLayerStack();
        break;
      case 'timeline':
        this.renderTimeline();
        break;
      case 'page_table':
      case 'semaphore':
      case 'producer_consumer':
      case 'dining_philosophers':
      case 'deadlock_graph':
      case 'raid':
      case 'disk_scheduling':
        this.renderPlaceholder();
        break;
      default:
        console.warn(`Unknown diagram type: ${this.config.type}`);
    }

    this.container.appendChild(this.svg);
    this.addControls();

    if (!this.isPaused) {
      this.startAnimation();
    }
  }

  addControls() {
    const controls = document.createElement('div');
    controls.className = 'flex gap-2 mt-4 justify-end';
    
    const btnPlayPause = document.createElement('button');
    btnPlayPause.className = 'btn btn-outline text-xs px-2 py-1';
    btnPlayPause.innerHTML = this.isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    
    btnPlayPause.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      btnPlayPause.innerHTML = this.isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
      if (!this.isPaused) this.startAnimation();
    });

    controls.appendChild(btnPlayPause);
    this.container.appendChild(controls);
  }

  startAnimation() {
    let lastTime = performance.now();
    
    const loop = (currentTime) => {
      if (this.isPaused) return;
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      this.time += deltaTime;

      this.updateFrame(deltaTime);
      this.animationId = requestAnimationFrame(loop);
    };
    
    this.animationId = requestAnimationFrame(loop);
  }

  updateFrame(dt) {
    if (this.config.type === 'process_state_machine') {
      // Example animation: Pulse the "Running" state if it's the active one
      const runningNode = this.svg.querySelector('#node-running');
      if (runningNode) {
        const scale = 1 + Math.sin(this.time / 200) * 0.05;
        runningNode.setAttribute('transform', `scale(${scale}) translate(${scale * -10}, ${scale * -5})`);
      }
    }
    // Implement specific requestAnimationFrame logic for other types here
  }

  destroy() {
    this.isPaused = true;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.container.innerHTML = '';
  }

  /* ========================================================================
     DIAGRAM RENDERERS
     ======================================================================== */

  renderProcessStateMachine() {
    // Defines standard 5-state process model
    const states = [
      { id: 'new', label: 'NEW', x: 100, y: 100 },
      { id: 'ready', label: 'READY', x: 300, y: 100 },
      { id: 'running', label: 'RUNNING', x: 500, y: 100 },
      { id: 'terminated', label: 'TERMINATED', x: 700, y: 100 },
      { id: 'waiting', label: 'WAITING', x: 400, y: 250 }
    ];

    const transitions = [
      { from: 'new', to: 'ready', label: 'admitted' },
      { from: 'ready', to: 'running', label: 'scheduler dispatch' },
      { from: 'running', to: 'terminated', label: 'exit' },
      { from: 'running', to: 'ready', label: 'interrupt' },
      { from: 'running', to: 'waiting', label: 'I/O or event wait' },
      { from: 'waiting', to: 'ready', label: 'I/O or event completion' }
    ];

    this.drawNodesAndEdges(states, transitions);
  }

  renderCPUScheduling() {
    // Draws a Gantt Chart
    const tasks = this.config.tasks || [{id: 'P1', dur: 100}, {id: 'P2', dur: 200}];
    let currentX = 50;
    
    tasks.forEach(t => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', currentX);
      rect.setAttribute('y', 150);
      rect.setAttribute('width', t.dur);
      rect.setAttribute('height', 50);
      rect.setAttribute('fill', 'var(--accent-cyan)');
      rect.setAttribute('opacity', '0.2');
      rect.setAttribute('stroke', 'var(--accent-cyan)');
      this.svg.appendChild(rect);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', currentX + t.dur / 2);
      text.setAttribute('y', 180);
      text.setAttribute('fill', 'var(--text-primary)');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = t.id;
      this.svg.appendChild(text);

      currentX += t.dur;
    });
  }

  renderLayerStack() {
    const nodes = this.config.nodes || ['User', 'App', 'OS', 'Hardware'];
    const colors = ['var(--accent-purple)', 'var(--accent-cyan)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-red)'];
    
    let currentY = 50;
    const height = 40;
    const width = 400;
    const x = 200;

    nodes.forEach((node, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('layer-node');
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', currentY);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('fill', colors[i % colors.length]);
      rect.setAttribute('opacity', '0.15');
      rect.setAttribute('stroke', colors[i % colors.length]);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('rx', '4');
      g.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + width / 2);
      text.setAttribute('y', currentY + height / 2 + 5);
      text.setAttribute('fill', 'var(--text-primary)');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-weight', 'bold');
      text.textContent = node;
      g.appendChild(text);

      // Add "Request" arrow between layers
      if (i < nodes.length - 1) {
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('d', `M${x + width/2} ${currentY + height} L${x + width/2} ${currentY + height + 10}`);
        arrow.setAttribute('stroke', 'var(--text-muted)');
        arrow.setAttribute('stroke-width', '1');
        arrow.setAttribute('marker-end', 'url(#arrow)');
        this.svg.appendChild(arrow);
      }

      this.svg.appendChild(g);
      currentY += height + 15;
    });
  }

  renderMemoryLayout() {
    // Draws typical Process Memory Layout (Stack, Heap, Data, Text)
    const regions = [
      { name: 'Stack (grows down)', color: 'var(--accent-red)' },
      { name: '↓', color: 'transparent' },
      { name: '↑', color: 'transparent' },
      { name: 'Heap (grows up)', color: 'var(--accent-green)' },
      { name: 'BSS (Uninitialized Data)', color: 'var(--accent-orange)' },
      { name: 'Data (Initialized)', color: 'var(--accent-purple)' },
      { name: 'Text (Code)', color: 'var(--accent-cyan)' }
    ];

    let currentY = 20;
    regions.forEach(r => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      if (r.color !== 'transparent') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 300);
        rect.setAttribute('y', currentY);
        rect.setAttribute('width', 200);
        rect.setAttribute('height', 40);
        rect.setAttribute('fill', r.color);
        rect.setAttribute('opacity', '0.2');
        rect.setAttribute('stroke', r.color);
        g.appendChild(rect);
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 400);
      text.setAttribute('y', currentY + 25);
      text.setAttribute('fill', 'var(--text-primary)');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = r.name;
      g.appendChild(text);

      this.svg.appendChild(g);
      currentY += 45;
    });
  }

  renderPlaceholder() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 400);
    text.setAttribute('y', 200);
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `[SVG Engine] Rendering ${this.config.type} graph...`;
    this.svg.appendChild(text);
  }

  renderTimeline() {
    const jobs = this.config.jobs || [
      { id: 'Batch', segments: [{ len: 100, type: 'cpu' }, { len: 200, type: 'io' }, { len: 100, type: 'cpu' }] },
      { id: 'T-Share', segments: [{ len: 20, type: 'cpu' }, { len: 5, type: 'switch' }, { len: 20, type: 'cpu' }] }
    ];

    let currentY = 50;
    jobs.forEach(job => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', 20);
      label.setAttribute('y', currentY + 25);
      label.setAttribute('fill', 'var(--text-secondary)');
      label.setAttribute('font-size', '12px');
      label.textContent = job.id;
      g.appendChild(label);

      let currentX = 100;
      job.segments.forEach(seg => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', currentX);
        rect.setAttribute('y', currentY);
        rect.setAttribute('width', seg.len);
        rect.setAttribute('height', 40);
        
        let color = 'var(--accent-cyan)';
        if (seg.type === 'io') color = 'var(--accent-orange)';
        if (seg.type === 'switch') color = 'var(--accent-purple)';
        
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.3');
        rect.setAttribute('stroke', color);
        g.appendChild(rect);
        
        currentX += seg.len;
      });

      this.svg.appendChild(g);
      currentY += 60;
    });
  }

  drawNodesAndEdges(states, transitions) {
    // Very simplified direct drawing for demonstration
    transitions.forEach(t => {
      const fromNode = states.find(s => s.id === t.from);
      const toNode = states.find(s => s.id === t.to);
      if(!fromNode || !toNode) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromNode.x);
      line.setAttribute('y1', fromNode.y);
      line.setAttribute('x2', toNode.x);
      line.setAttribute('y2', toNode.y);
      line.setAttribute('stroke', 'var(--text-secondary)');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrow)');
      this.svg.appendChild(line);
    });

    states.forEach(s => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', `node-${s.id}`);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', s.x);
      circle.setAttribute('cy', s.y);
      circle.setAttribute('r', 40);
      circle.setAttribute('fill', 'var(--bg-surface-elevated)');
      circle.setAttribute('stroke', 'var(--accent-cyan)');
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', s.x);
      text.setAttribute('y', s.y + 5);
      text.setAttribute('fill', 'var(--text-primary)');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12px');
      text.textContent = s.label;
      g.appendChild(text);

      this.svg.appendChild(g);
    });
  }
}
