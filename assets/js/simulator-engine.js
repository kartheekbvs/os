/**
 * SimulatorPrimitives
 * A high-fidelity UI library for rendering consistent OS components.
 */
class SimulatorPrimitives {
  static renderCPU(process, options = {}) {
    const isBusy = !!process;
    const color = options.color || (isBusy ? 'var(--accent-green)' : 'var(--text-muted)');
    const pulse = isBusy ? 'animate-pulse' : '';
    
    return `
      <div class="cpu-chamber relative w-32 h-40 border-2 border-border-strong rounded-xl bg-black flex flex-col items-center p-3 shadow-inner overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-t from-${color}/10 to-transparent pointer-events-none"></div>
        <div class="cpu-core-label text-[8px] font-mono text-text-muted uppercase tracking-tighter mb-4">Intel Core i9 / Ring 0</div>
        
        <div class="cpu-execution-zone flex-center flex-col gap-2 flex-1 w-full">
          ${isBusy ? `
            <div class="pcb-mini w-16 h-20 border border-${color} bg-${color}/10 rounded-md flex flex-col items-center p-2 ${pulse}">
              <div class="text-[10px] font-bold text-${color}">${process.id}</div>
              <div class="w-full h-0.5 bg-${color}/30 my-2"></div>
              <div class="register-flicker text-[6px] font-mono opacity-60">EAX: ${Math.floor(Math.random()*0xFFFF).toString(16)}</div>
              <div class="register-flicker text-[6px] font-mono opacity-60">EIP: ${Math.floor(Math.random()*0xFFFF).toString(16)}</div>
            </div>
          ` : `
            <div class="text-[10px] text-text-muted italic">IDLE_TASK</div>
            <i class="fas fa-microchip text-border-strong text-2xl"></i>
          `}
        </div>

        <div class="cpu-status-bar w-full h-1 bg-border-strong mt-2 rounded-full overflow-hidden">
          <div class="h-full bg-${color} transition-all duration-300" style="width: ${isBusy ? '100%' : '0%'}"></div>
        </div>
      </div>
    `;
  }

  static renderQueue(label, processes, options = {}) {
    return `
      <div class="os-queue flex flex-col gap-2">
        <div class="text-[10px] font-mono text-text-muted uppercase tracking-widest flex-between">
          <span>${label}</span>
          <span class="text-[8px] opacity-50">${processes.length} tasks</span>
        </div>
        <div class="flex gap-2 min-h-[4rem] p-2 bg-bg-surface-elevated/50 border border-dashed border-border-strong rounded-lg overflow-x-auto overflow-y-hidden">
          ${processes.length === 0 ? '<div class="text-[8px] text-text-muted m-auto italic opacity-30">Queue Empty</div>' : ''}
          ${processes.map(p => `
            <div class="task-node w-12 h-12 rounded border-2 border-accent-cyan bg-accent-cyan/10 flex-center flex-col shrink-0 animate-fade-in group relative" style="border-color: ${p.color || 'var(--accent-cyan)'}">
              <div class="text-xs font-bold" style="color: ${p.color || 'var(--accent-cyan)'}">${p.id}</div>
              <div class="text-[6px] opacity-60">T:${p.burst || 0}ms</div>
              
              <!-- Hover Metrics -->
              <div class="absolute -top-12 left-1/2 -translate-x-1/2 bg-bg-surface p-2 rounded border border-border-strong shadow-xl text-[8px] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity w-20">
                Wait: ${p.wait || 0}ms<br>State: ${p.state || 'READY'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  static renderTelemetry(metrics) {
    return `
      <div class="telemetry-grid">
        ${Object.entries(metrics).map(([key, val]) => `
          <div class="telemetry-card">
            <span class="label">${key.replace(/_/g, ' ')}</span>
            <span class="value">${this.formatMetric(key, val)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  static formatMetric(key, val) {
    if (typeof val === 'number') {
      if (key.includes('latency')) return `${val.toFixed(1)}ms`;
      if (key.includes('throughput')) return `${val} op/s`;
      if (key.includes('io')) return `${val} IOPS`;
      if (key.includes('util') || key.includes('hits')) return `${val}%`;
      if (val > 1000) return `${(val/1000).toFixed(1)}k`;
      return val.toString();
    }
    return val;
  }

  static renderAddressSplitter(vAddr, bits = { vpn: 8, offset: 8 }) {
    const binary = parseInt(vAddr, 16).toString(2).padStart(bits.vpn + bits.offset, '0');
    const vpnBin = binary.slice(0, bits.vpn);
    const offsetBin = binary.slice(bits.vpn);
    
    return `
      <div class="address-splitter flex flex-col items-center gap-4 p-4 bg-black border border-border-strong rounded-2xl">
        <div class="flex gap-1 font-mono text-[10px]">
          ${binary.split('').map((b, i) => `
            <div class="w-3 h-5 flex-center border ${i < bits.vpn ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' : 'border-accent-purple bg-accent-purple/10 text-accent-purple'}">${b}</div>
          `).join('')}
        </div>
        <div class="flex gap-8 w-full justify-center">
           <div class="flex flex-col items-center">
              <div class="text-[7px] text-accent-cyan uppercase mb-1">VPN (Page ${parseInt(vpnBin, 2)})</div>
              <div class="text-xs font-bold text-accent-cyan">${vpnBin}</div>
           </div>
           <div class="flex flex-col items-center">
              <div class="text-[7px] text-accent-purple uppercase mb-1">Offset (0x${parseInt(offsetBin, 2).toString(16).toUpperCase()})</div>
              <div class="text-xs font-bold text-accent-purple">${offsetBin}</div>
           </div>
        </div>
      </div>
    `;
  }

  static renderCacheHierarchy(stats) {
    const levels = [
      { id: 'L1', latency: '1ns', color: 'bg-accent-red' },
      { id: 'L2', latency: '4ns', color: 'bg-accent-orange' },
      { id: 'L3', latency: '12ns', color: 'bg-accent-purple' },
      { id: 'RAM', latency: '100ns', color: 'bg-accent-cyan' },
      { id: 'DISK', latency: '10ms', color: 'bg-accent-green' }
    ];
    return `
      <div class="cache-hierarchy flex flex-col gap-2">
        ${levels.map(l => `
          <div class="flex items-center gap-3">
            <div class="w-8 text-[8px] font-bold text-text-muted">${l.id}</div>
            <div class="flex-1 h-3 bg-bg-surface border border-border-strong rounded-full overflow-hidden relative">
               <div class="absolute inset-0 ${l.color}/20"></div>
               <div class="h-full ${l.color} transition-all duration-1000" style="width: ${100 - (stats[l.id.toLowerCase()] || 0)}%"></div>
            </div>
            <div class="w-12 text-[7px] font-mono text-text-secondary">${l.latency}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  static renderFaultTimeline(step) {
    const stages = ["Trap", "Save State", "Disk IO", "Page Alloc", "Victim Evict", "RETRY"];
    return `
      <div class="fault-timeline flex gap-1 mt-4">
        ${stages.map((s, i) => `
          <div class="flex-1 h-1 rounded ${i <= step ? 'bg-accent-red shadow-glow-red' : 'bg-border-strong'}"></div>
        `).join('')}
      </div>
    `;
  }

  static renderControls(isPaused, speed, onStep) {
    return `
      <div class="simulator-controls flex items-center gap-2 bg-bg-surface-elevated p-2 rounded-lg border border-border-strong mb-4">
        <button class="btn btn-xs btn-ghost" title="Rewind" onclick="this.closest('.concept-block')._sim.rewind()"><i class="fas fa-backward"></i></button>
        <button class="btn btn-xs ${isPaused ? 'btn-primary' : 'btn-outline'}" onclick="this.closest('.concept-block')._sim.togglePlay()">
          <i class="fas ${isPaused ? 'fa-play' : 'fa-pause'}"></i>
        </button>
        <button class="btn btn-xs btn-outline" title="Step Forward" onclick="this.closest('.concept-block')._sim.step()"><i class="fas fa-step-forward"></i></button>
        <div class="h-4 w-[1px] bg-border-strong mx-1"></div>
        <select class="bg-black text-[10px] border border-border-strong rounded px-1" onchange="this.closest('.concept-block')._sim.setSpeed(this.value)">
          <option value="0.5">0.5x</option>
          <option value="1" selected>1.0x</option>
          <option value="2">2.0x</option>
          <option value="5">5.0x</option>
        </select>
        <div class="flex-1"></div>
        <div class="text-[8px] font-mono text-text-muted">SYS_TICK: <span class="text-white">${window._simTick || 0}</span></div>
      </div>
    `;
  }

  static renderProcessInjector() {
    return `
      <div class="process-injector bg-bg-surface border border-border-strong p-3 rounded-xl">
        <div class="text-[9px] font-bold uppercase tracking-widest mb-3 flex-between">
          <span>Task Injection Port</span>
          <i class="fas fa-plus-square text-accent-cyan"></i>
        </div>
        <div class="flex flex-col gap-2">
          <input type="text" id="inj-pid" placeholder="PID" class="bg-black border border-border-strong p-1 text-[10px] rounded" value="P${Math.floor(Math.random()*1000)}">
          <div class="grid grid-cols-2 gap-2">
            <input type="number" id="inj-burst" placeholder="Burst" class="bg-black border border-border-strong p-1 text-[10px] rounded" value="5">
            <input type="number" id="inj-pri" placeholder="Pri" class="bg-black border border-border-strong p-1 text-[10px] rounded" value="1">
          </div>
          <button class="btn btn-xs btn-cyan w-full" onclick="this.closest('.concept-block')._sim.injectProcess()">INJECT TASK</button>
        </div>
      </div>
    `;
  }

  static renderCacheLine(tag, data, state = 'M') {
    const stateColors = { 'M': 'text-accent-red', 'E': 'text-accent-orange', 'S': 'text-accent-cyan', 'I': 'text-text-muted' };
    return `
      <div class="cache-line flex border border-border-strong rounded bg-black/40 p-1 font-mono text-[8px]">
        <div class="w-4 border-r border-border-strong ${stateColors[state]} font-bold px-1">${state}</div>
        <div class="w-8 border-r border-border-strong px-1 text-accent-cyan">${tag}</div>
        <div class="flex-1 px-1 text-text-secondary truncate">${data}</div>
      </div>
    `;
  }

  static renderBuddyMap(orderMap) {
    return `
      <div class="buddy-map grid grid-cols-8 gap-1 border border-border-strong p-2 bg-black/20 rounded">
        ${orderMap.map(page => `
          <div class="aspect-square rounded-sm ${page.allocated ? 'bg-accent-cyan shadow-glow-cyan' : 'bg-border-strong opacity-20'}" title="Order: ${page.order}"></div>
        `).join('')}
      </div>
    `;
  }

  static renderNUMATopology(nodes) {
    return `
      <div class="numa-topology flex gap-8 justify-center p-4 bg-black/40 border border-border-strong rounded-2xl">
        ${nodes.map(n => `
          <div class="flex flex-col items-center gap-2">
            <div class="w-24 h-24 border-2 ${n.active ? 'border-accent-cyan shadow-glow-cyan' : 'border-border-strong'} rounded-xl flex-center flex-col bg-bg-surface relative">
               <div class="text-[8px] font-bold text-accent-cyan mb-2">NODE_${n.id}</div>
               <div class="grid grid-cols-2 gap-1 px-2">
                  ${n.cores.map(c => `<div class="w-2 h-2 rounded-full ${c.busy ? 'bg-accent-red animate-pulse' : 'bg-accent-green'}"></div>`).join('')}
               </div>
               <div class="mt-2 text-[7px] text-text-muted">RAM: ${n.ram}%</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  static renderDiskPlatter(headPos, rotating = true) {
    const angle = (Date.now() / 20) % 360;
    const armAngle = headPos * 45; // Simulated track position
    return `
      <div class="disk-observatory relative w-48 h-48 flex-center">
        <!-- The Platter -->
        <div class="absolute w-44 h-44 rounded-full border-4 border-border-strong bg-black overflow-hidden ${rotating ? 'animate-spin-slow' : ''}" style="transform: rotate(${angle}deg)">
           ${Array.from({length: 8}).map((_, i) => `<div class="absolute w-full h-[1px] bg-white/5 top-1/2" style="transform: rotate(${i * 45}deg)"></div>`).join('')}
           ${Array.from({length: 4}).map((_, i) => `<div class="absolute inset-${i * 4} border border-white/5 rounded-full"></div>`).join('')}
        </div>
        <!-- The Arm -->
        <div class="absolute w-24 h-1 bg-accent-orange right-0 origin-right transition-transform duration-500" style="transform: rotate(${180 + armAngle}deg)">
           <div class="w-4 h-4 bg-accent-orange absolute -left-2 -top-1.5 rounded-sm shadow-glow-orange"></div>
        </div>
        <div class="absolute bottom-2 left-2 text-[7px] text-text-muted uppercase">RPM: 7200 | TRACK: ${Math.floor(headPos * 10)}</div>
      </div>
    `;
  }

  static renderNANDGrid(blocks) {
    return `
      <div class="nand-grid grid grid-cols-8 gap-1 p-2 bg-black/40 border border-border-strong rounded-lg">
        ${blocks.map(b => `
          <div class="aspect-square rounded-sm border ${b.state === 'dirty' ? 'bg-accent-red border-accent-red shadow-glow-red' : b.state === 'used' ? 'bg-accent-cyan border-accent-cyan' : 'bg-border-strong border-white/5 opacity-20'}"></div>
        `).join('')}
      </div>
    `;
  }

  static renderFileDescriptorTable(fds) {
    return `
      <div class="fd-table font-mono text-[8px] bg-black border border-border-strong rounded overflow-hidden">
        <div class="flex-between p-1 bg-border-strong text-white uppercase font-bold"><span>FD</span><span>TYPE</span><span>TARGET</span></div>
        ${fds.map(fd => `
          <div class="flex-between p-1 border-t border-border-strong/50 group hover:bg-white/5">
            <span class="text-accent-cyan">${fd.id}</span>
            <span class="text-accent-purple">${fd.type}</span>
            <span class="text-text-secondary truncate w-24 text-right">${fd.target}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  static renderLatencyHistogram(data) {
    const max = Math.max(...data, 1);
    return `
      <div class="latency-histogram flex items-end gap-0.5 h-12 w-full px-2">
        ${data.map(d => `<div class="flex-1 bg-accent-red" style="height: ${(d / max) * 100}%"></div>`).join('')}
      </div>
    `;
  }
}

class BaseSimulator {
  constructor(canvas, config, conceptId) {
    this.canvas = canvas;
    this.container = canvas;
    this.config = config;
    this.conceptId = conceptId;
    this.state = { isPaused: true, speed: 1, tick: 0, history: [] };
    this.events = [];
    this.fps = 0;
    this.lastFrameTime = performance.now();
    this.initialized = false;
    
    // Performance Watchdog
    this.perfLoop = () => {
      const now = performance.now();
      this.fps = Math.round(1000 / (now - this.lastFrameTime));
      this.lastFrameTime = now;
      if (!this.state.isPaused) requestAnimationFrame(this.perfLoop);
    };
  }

  log(msg, type = 'info') {
    this.events.push({ msg, type, time: Date.now() });
    if (this.events.length > 15) this.events.shift();
  }

  update(newState) {
    this.state = { ...this.state, ...newState };
    if (!this.frameRequested) {
      this.frameRequested = true;
      requestAnimationFrame(() => {
        this.frameRequested = false;
        try {
          this.render();
        } catch (e) {
          console.error("Simulator Render Failure:", e);
          this.canvas.innerHTML = `<div class="p-8 text-accent-red font-mono text-xs border border-accent-red rounded">! RENDER_EXCEPTION: ${e.message}</div>`;
        }
      });
    }
  }

  togglePlay() {
    this.update({ isPaused: !this.state.isPaused });
    if (!this.state.isPaused) {
      this.perfLoop();
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
  }

  setSpeed(speed) {
    this.update({ speed: parseFloat(speed) });
    if (!this.state.isPaused) {
      this.stopSimulation();
      this.startSimulation();
    }
  }

  startSimulation() {
    this.timer = setInterval(() => {
      this.state.tick++;
      window._simTick = this.state.tick;
      if (this.step) this.step();
    }, 1000 / this.state.speed);
  }

  stopSimulation() {
    clearInterval(this.timer);
  }

  destroy() {
    this.stopSimulation();
  }
}

class SchedulingSimulator extends BaseSimulator {
  constructor(canvas, config, conceptId) {
    super(canvas, config, conceptId);
    this.type = config.algo || 'FCFS';
    this.quantum = config.quantum || 4;
    this.initProcesses();
  }

  initProcesses() {
    this.state = {
      ...this.state,
      readyQueue: [
        { id: 'P1', burst: 12, wait: 0, color: 'var(--accent-cyan)', pri: 1 },
        { id: 'P2', burst: 6, wait: 0, color: 'var(--accent-purple)', pri: 2 }
      ],
      running: null,
      history: [],
      metrics: {
        context_switches: 0,
        throughput: 0,
        cpu_utilization: 0,
        avg_wait: 0
      },
      qCount: this.quantum,
      switchOverhead: 0
    };
  }

  render() {
    const { readyQueue, running, metrics, isPaused, speed, tick, switchOverhead, qCount } = this.state;
    
    this.canvas.innerHTML = `
      <div class="systems-sandbox p-4 font-mono">
        <!-- Telemetry Header -->
        ${SimulatorPrimitives.renderTelemetry(metrics)}
        
        <!-- Execution Controls -->
        ${SimulatorPrimitives.renderControls(isPaused, speed)}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sidebar: Process Injector -->
          <div class="lg:col-span-3 space-y-4">
            ${SimulatorPrimitives.renderProcessInjector()}
            <div class="bg-bg-surface-elevated p-3 rounded-xl border border-border-strong">
              <div class="text-[9px] font-bold uppercase mb-2">Algorithm Tuning</div>
              <div class="flex flex-col gap-2">
                 <div class="flex-between text-[10px]">
                   <span>Quantum</span>
                   <span class="text-accent-cyan">${this.quantum} ticks</span>
                 </div>
                 <input type="range" min="1" max="10" value="${this.quantum}" 
                   oninput="this.closest('.concept-block')._sim.quantum = parseInt(this.value); this.closest('.concept-block')._sim.render()" 
                   class="w-full accent-accent-cyan">
              </div>
            </div>
          </div>

          <!-- Main Lab: CPU Execution Chamber -->
          <div class="lg:col-span-6 flex flex-col gap-6">
            <div class="execution-chamber bg-black/60 border-2 border-border-strong rounded-2xl p-6 relative overflow-hidden">
               <div class="absolute top-2 right-4 text-[8px] font-bold text-accent-red animate-pulse">CORE_0_ACTIVE</div>
               
               <div class="flex flex-col items-center gap-8 py-4">
                 <!-- The CPU Chamber -->
                 <div class="w-48 h-64 border-4 ${switchOverhead > 0 ? 'border-accent-orange animate-shake' : 'border-accent-cyan shadow-glow-cyan'} rounded-3xl bg-black relative flex-center flex-col p-4">
                    ${switchOverhead > 0 ? `
                      <div class="flex flex-col items-center gap-2">
                        <i class="fas fa-sync-alt text-4xl text-accent-orange animate-spin"></i>
                        <div class="text-xs font-bold text-accent-orange">CONTEXT_SWITCH</div>
                        <div class="text-[8px] text-accent-orange/60">Saving Registers...</div>
                      </div>
                    ` : running ? `
                      <div class="w-full flex flex-col items-center">
                        <div class="text-4xl font-bold text-accent-cyan mb-2">${running.id}</div>
                        <div class="text-[10px] text-accent-cyan/60 mb-4">MODE: USR_RING_3</div>
                        
                        <div class="w-full space-y-2 mb-6">
                          <div class="flex-between text-[8px]">
                            <span>INSTRUCTION_BURST</span>
                            <span>${running.burst} TICKS</span>
                          </div>
                          <div class="w-full h-1.5 bg-accent-cyan/20 rounded-full overflow-hidden">
                            <div class="h-full bg-accent-cyan" style="width: ${(running.burst / 12) * 100}%"></div>
                          </div>
                        </div>

                        ${this.type === 'RR' ? `
                          <div class="w-full space-y-2">
                            <div class="flex-between text-[8px]">
                              <span>QUANTUM_REMAINING</span>
                              <span>${qCount} TICKS</span>
                            </div>
                            <div class="w-full h-1.5 bg-accent-purple/20 rounded-full overflow-hidden">
                              <div class="h-full bg-accent-purple" style="width: ${(qCount / this.quantum) * 100}%"></div>
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    ` : `
                      <div class="flex flex-col items-center opacity-30">
                        <i class="fas fa-microchip text-6xl mb-4"></i>
                        <div class="text-xs font-bold uppercase">IDLE_TASK</div>
                      </div>
                    `}
                 </div>

                 <!-- Dispatcher Telemetry -->
                 <div class="w-full grid grid-cols-3 gap-2">
                    <div class="p-2 border border-border-strong rounded bg-black/40 text-center">
                      <div class="text-[7px] text-text-muted">IP</div>
                      <div class="text-[10px] font-mono text-accent-cyan">0x${(tick * 16).toString(16).toUpperCase()}</div>
                    </div>
                    <div class="p-2 border border-border-strong rounded bg-black/40 text-center">
                      <div class="text-[7px] text-text-muted">FLAGS</div>
                      <div class="text-[10px] font-mono text-accent-green">I-P-Z-C</div>
                    </div>
                    <div class="p-2 border border-border-strong rounded bg-black/40 text-center">
                      <div class="text-[7px] text-text-muted">LOAD</div>
                      <div class="text-[10px] font-mono text-accent-orange">${(readyQueue.length / 5).toFixed(2)}</div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <!-- Queue Panel -->
          <div class="lg:col-span-3 space-y-4">
             <div class="bg-bg-surface-elevated p-4 rounded-2xl border border-border-strong min-h-[400px]">
               <div class="text-[10px] font-bold uppercase tracking-widest mb-4 border-b border-border-strong pb-2">Ready Queue</div>
               <div class="flex flex-col gap-3">
                 ${readyQueue.map(p => `
                   <div class="p-3 border-l-4 rounded bg-black/40 border-accent-cyan flex-between group hover:bg-black/60 transition-colors">
                     <div class="flex flex-col">
                       <span class="text-xs font-bold text-accent-cyan">${p.id}</span>
                       <span class="text-[8px] text-text-muted">BURST: ${p.burst} | PRI: ${p.pri}</span>
                     </div>
                     <button class="btn btn-xs opacity-0 group-hover:opacity-100 text-red-500" onclick="this.closest('.concept-block')._sim.removeProcess('${p.id}')">
                       <i class="fas fa-trash"></i>
                     </button>
                   </div>
                 `).join('')}
                 ${readyQueue.length === 0 ? '<div class="text-center py-12 opacity-20 text-xs">NO READY TASKS</div>' : ''}
               </div>
             </div>
          </div>
        </div>
      </div>
    `;
  }

  injectProcess() {
    const pid = document.getElementById('inj-pid').value;
    const burst = parseInt(document.getElementById('inj-burst').value);
    const pri = parseInt(document.getElementById('inj-pri').value);
    
    const newProc = { 
      id: pid, 
      burst, 
      pri, 
      wait: 0, 
      color: `hsl(${Math.random() * 360}, 70%, 60%)` 
    };

    this.state.readyQueue.push(newProc);
    this.log(`Kernel: Injected Process ${pid} into Ready Queue.`);
    this.render();
  }

  removeProcess(id) {
    this.state.readyQueue = this.state.readyQueue.filter(p => p.id !== id);
    this.log(`Kernel: Process ${id} terminated/removed.`);
    this.render();
  }

  step() {
    let { readyQueue, running, metrics, qCount, switchOverhead } = this.state;
    
    // Handle Context Switch Delay
    if (switchOverhead > 0) {
      this.state.switchOverhead--;
      this.render();
      return;
    }

    // Process Running Logic
    if (running) {
      running.burst--;
      qCount--;
      
      if (running.burst <= 0) {
        this.log(`CPU: ${running.id} finished execution.`);
        running = null;
        metrics.throughput++;
      } else if (this.type === 'RR' && qCount <= 0) {
        this.log(`Timer: Quantum expired for ${running.id}. Preempting.`, 'warning');
        readyQueue.push(running);
        running = null;
        switchOverhead = 2; // Context Switch Penalty
        metrics.context_switches++;
      }
    }

    // Scheduling Logic
    if (!running && readyQueue.length > 0) {
      if (this.type === 'SJF') readyQueue.sort((a, b) => a.burst - b.burst);
      if (this.type === 'Priority') readyQueue.sort((a, b) => a.pri - b.pri);
      
      running = readyQueue.shift();
      qCount = this.quantum;
      switchOverhead = 2; // Every new dispatch has penalty
      metrics.context_switches++;
      this.log(`Dispatcher: Context saved. Loading ${running.id} PCB.`);
    }

    // Update Wait Times
    readyQueue.forEach(p => p.wait++);
    
    // Metrics calculation
    metrics.cpu_utilization = running ? 100 : 0;
    
    this.update({ readyQueue, running, metrics, qCount, switchOverhead });
  }

  reset() {
    this.stopSimulation();
    this.initProcesses();
    this.update({ isPaused: true, tick: 0 });
    window._simTick = 0;
  }
}


class ProcessStateSimulator extends BaseSimulator {
  render() {
    const state = this.state.currentState || 'NEW';
    const states = ['NEW', 'READY', 'RUNNING', 'WAITING', 'EXIT'];
    
    this.container.innerHTML = `
      <div class="flex flex-col gap-6 p-4">
        <div class="relative w-full h-48 bg-black/40 rounded-xl border border-border-strong overflow-hidden p-4">
          <svg class="w-full h-full">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="var(--border-strong)" />
              </marker>
            </defs>
            <path d="M50,80 L120,80" stroke="var(--border-strong)" stroke-width="1" marker-end="url(#arrow)" />
            <path d="M180,80 L250,80" stroke="var(--border-strong)" stroke-width="1" marker-end="url(#arrow)" />
            <path d="M280,100 L280,140 L150,140 L150,100" fill="none" stroke="var(--border-strong)" stroke-width="1" marker-end="url(#arrow)" />
            
            ${states.map((s, i) => {
              const x = 50 + (i % 3) * 100;
              const y = 80 + Math.floor(i / 3) * 80;
              const isActive = state === s;
              return `
                <g transform="translate(${x},${y})">
                  <rect width="60" height="30" rx="4" fill="var(--bg-primary)" stroke="${isActive ? 'var(--accent-cyan)' : 'var(--border-strong)'}" stroke-width="${isActive ? 2 : 1}" class="${isActive ? 'animate-pulse shadow-glow-cyan' : ''}" />
                  <text x="30" y="20" text-anchor="middle" fill="${isActive ? 'white' : 'var(--text-muted)'}" font-size="8" font-family="monospace">${s}</text>
                </g>
              `;
            }).join('')}
          </svg>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-xs btn-outline" onclick="this.closest('.concept-block')._sim.setState('READY')">ADMIT</button>
          <button class="btn btn-xs btn-outline" onclick="this.closest('.concept-block')._sim.setState('RUNNING')">DISPATCH</button>
          <button class="btn btn-xs btn-outline" onclick="this.closest('.concept-block')._sim.setState('WAITING')">I/O WAIT</button>
          <button class="btn btn-xs btn-outline" onclick="this.closest('.concept-block')._sim.setState('EXIT')">TERMINATE</button>
        </div>
        <div class="text-[10px] font-mono text-center text-accent-cyan">CURRENT_STATE: ${state}</div>
      </div>
    `;
  }
  setState(s) {
    this.update({ currentState: s });
    this.log(`Process State Transition -> ${s}`);
  }
}

class MemoryObservatory extends BaseSimulator {
  constructor(canvas, config, conceptId) {
    super(canvas, config, conceptId);
    this.mode = 'PAGING'; // PAGING, CACHE, ALLOC, COLLAPSE
    this.initObservatory();
  }

  initObservatory() {
    this.state = {
      ...this.state,
      vAddr: '0x3E2B',
      ram: [7, 2, 5],
      history: [{page: 7, hit: false}, {page: 2, hit: false}, {page: 5, hit: false}],
      faultStep: -1,
      metrics: { tlb_hits: 92, page_faults: 3, disk_io: 3, access_latency: 10, throughput: 100 },
      processMap: [
        { name: 'Kernel Space', size: '2GB', range: '0xFFFF...0x8000', color: 'bg-accent-red/20' },
        { name: 'Stack', size: '8MB', range: '0x7FFF...0x7F00', color: 'bg-accent-purple/20' },
        { name: 'Heap', size: '400MB', range: '0x3FFF...0x2000', color: 'bg-accent-green/20' },
        { name: 'Text (Code)', size: '12MB', range: '0x0FFF...0x0000', color: 'bg-accent-cyan/40' }
      ],
      cacheLines: Array.from({length: 8}, (_, i) => ({ tag: '0x'+(i*64).toString(16).toUpperCase(), data: '...', state: 'E' })),
      isFalseSharing: false,
      buddyMap: Array.from({length: 32}, () => ({ allocated: Math.random() > 0.7, order: Math.floor(Math.random()*4) })),
      numaNodes: [{id: 0, active: true, cores: [{busy: true}, {busy: false}], ram: 45}, {id: 1, active: false, cores: [{busy: false}, {busy: false}], ram: 12}]
    };
  }

  render() {
    const { mode } = this;
    const { vAddr, ram, metrics, faultStep, history, processMap, cacheLines, isFalseSharing, buddyMap, numaNodes } = this.state;
    
    this.canvas.innerHTML = `
      <div class="simulator-container p-6 font-mono">
        ${SimulatorPrimitives.renderTelemetry(metrics)}
        
        <div class="flex gap-2 mb-8 bg-black/40 p-1 rounded-lg border border-border-strong">
           ${['PAGING', 'CACHE', 'ALLOC', 'COLLAPSE'].map(m => `
             <button class="btn btn-xs flex-1 ${this.mode === m ? 'btn-primary' : 'btn-ghost'} py-2" onclick="this.closest('.concept-block')._sim.setMode('${m}')">${m}</button>
           `).join('')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8">
            ${this.renderMainDisplay(mode, {vAddr, ram, faultStep, history, cacheLines, isFalseSharing, buddyMap, numaNodes})}
          </div>

          <div class="lg:col-span-4">
             ${this.renderSidebar(mode, {processMap, metrics})}
          </div>
        </div>
      </div>
    `;
  }

  renderMainDisplay(mode, data) {
    if (mode === 'PAGING') {
      return `
        <div class="bg-black/60 border-2 border-border-strong rounded-2xl p-6">
           <div class="text-[10px] text-accent-cyan uppercase mb-6 font-bold">MMU Address Translation Engine</div>
           ${SimulatorPrimitives.renderAddressSplitter(data.vAddr)}
           <div class="w-full flex items-center justify-around py-8 border-y border-border-strong/20 my-4">
              <div class="text-center">
                 <div class="text-[8px] text-text-muted mb-1">TLB</div>
                 <div class="w-16 h-12 bg-bg-surface border-2 ${data.faultStep === 0 ? 'border-accent-red animate-pulse' : 'border-accent-orange'} rounded flex-center text-xs">MISS</div>
              </div>
              <div class="text-center">
                 <div class="text-[8px] text-text-muted mb-1">PTABLE</div>
                 <div class="w-16 h-12 bg-bg-surface border-2 ${data.faultStep === 1 ? 'border-accent-red animate-pulse' : 'border-accent-green'} rounded flex-center text-xs">FAULT</div>
              </div>
           </div>
           ${data.faultStep >= 0 ? SimulatorPrimitives.renderFaultTimeline(data.faultStep) : ''}
        </div>
      `;
    } else if (mode === 'CACHE') {
      return `
        <div class="bg-black/60 border-2 border-border-strong rounded-2xl p-6 relative">
           <div class="text-[10px] text-accent-orange uppercase mb-6 font-bold">L1 Data Cache Physics</div>
           <div class="grid grid-cols-2 gap-2">
             ${data.cacheLines.map(l => SimulatorPrimitives.renderCacheLine(l.tag, l.data, l.state)).join('')}
           </div>
           ${data.isFalseSharing ? `<div class="absolute inset-0 bg-accent-red/20 flex-center flex-col animate-shake">
             <div class="text-xs font-bold text-accent-red">CACHE_LINE_PING_PONG (False Sharing)</div>
           </div>` : ''}
           <div class="mt-8">
             <div class="text-[10px] mb-2 text-text-muted">NUMA Topology</div>
             ${SimulatorPrimitives.renderNUMATopology(data.numaNodes)}
           </div>
        </div>
      `;
    } else if (mode === 'ALLOC') {
      return `
        <div class="bg-black/60 border-2 border-border-strong rounded-2xl p-6">
           <div class="text-[10px] text-accent-green uppercase mb-6 font-bold">Kernel Buddy Allocator (Physical RAM)</div>
           ${SimulatorPrimitives.renderBuddyMap(data.buddyMap)}
           <div class="mt-8 p-4 bg-bg-surface border border-border-strong rounded-xl">
              <div class="text-[9px] mb-2 uppercase">Slab Cache (Task_Struct)</div>
              <div class="flex gap-1 flex-wrap">
                 ${Array.from({length: 24}).map(() => `<div class="w-3 h-3 bg-accent-green/40 rounded-sm border border-accent-green"></div>`).join('')}
              </div>
           </div>
        </div>
      `;
    } else { // COLLAPSE
      return `
        <div class="bg-accent-red/10 border-2 border-accent-red rounded-2xl p-6 animate-shake">
           <div class="text-[10px] text-accent-red uppercase mb-4 font-bold tracking-widest">! KERNEL_MEM_PRESSURE !</div>
           <div class="flex flex-col gap-4">
              <div class="h-32 bg-black border border-accent-red rounded flex items-end p-2 gap-1 overflow-hidden">
                 ${Array.from({length: 40}).map(() => `<div class="w-2 bg-accent-red" style="height: ${60 + Math.random()*40}%"></div>`).join('')}
              </div>
              <div class="grid grid-cols-2 gap-4">
                 <div class="p-4 bg-black border border-accent-red rounded">
                    <div class="text-[8px] text-accent-red">SWAP_IO</div>
                    <div class="text-xl font-bold text-white animate-pulse">1.4 GB/s</div>
                 </div>
                 <div class="p-4 bg-black border border-accent-red rounded">
                    <div class="text-[8px] text-accent-red">CPU_WAIT</div>
                    <div class="text-xl font-bold text-white animate-pulse">98.2%</div>
                 </div>
              </div>
           </div>
        </div>
      `;
    }
  }

  renderSidebar(mode, data) {
    return `
      <div class="bg-bg-surface border border-border-strong p-4 rounded-xl">
         <div class="text-[9px] font-bold mb-4 uppercase">Control Panel</div>
         <div class="space-y-2">
            <button class="btn btn-xs btn-outline w-full text-left" onclick="this.closest('.concept-block')._sim.triggerEvent()">
               <i class="fas fa-bolt mr-2"></i> Trigger ${mode === 'CACHE' ? 'False Sharing' : mode === 'ALLOC' ? 'Fragmentation' : 'Page Fault'}
            </button>
            <button class="btn btn-xs btn-outline w-full text-left" onclick="this.closest('.concept-block')._sim.resetLab()">
               <i class="fas fa-undo mr-2"></i> Reset State
            </button>
         </div>
         <div class="mt-8">
            <div class="text-[9px] font-bold mb-3 uppercase">Memory Hierarchy Telemetry</div>
            ${SimulatorPrimitives.renderCacheHierarchy({ l1: mode === 'CACHE' ? 5 : 95, l2: 80, l3: 60, ram: 20, disk: mode === 'COLLAPSE' ? 150 : 2 })}
         </div>
      </div>
    `;
  }

  setMode(m) {
    this.mode = m;
    this.render();
  }

  triggerEvent() {
    if (this.mode === 'CACHE') {
      this.update({ isFalseSharing: true });
      this.log("MESI: Cache line 0x00 ping-pong detected.", "error");
      setTimeout(() => this.update({ isFalseSharing: false }), 3000);
    } else if (this.mode === 'PAGING') {
      this.update({ faultStep: 0 });
      setTimeout(() => {
        this.update({ faultStep: 1 });
        setTimeout(() => this.update({ faultStep: -1 }), 1500);
      }, 800);
    }
  }

  resetLab() {
    this.initObservatory();
    this.render();
  }
}

class ContextSwitchSimulator extends BaseSimulator {
  render() {
    const step = this.state.step || 0;
    const steps = ["Timer Interrupt", "Save P1 Regs", "Switch Stack", "Load P2 Regs", "IRET"];
    this.container.innerHTML = `
      <div class="flex flex-col gap-6 p-4">
        <div class="flex-between items-center bg-black/40 p-4 rounded-xl border border-border-strong">
          <div class="w-20 h-24 border-2 ${step < 2 ? 'border-accent-cyan' : 'border-border-strong'} rounded bg-bg-surface flex-center flex-col">
             <div class="text-xs font-bold ${step < 2 ? 'text-accent-cyan' : 'text-text-muted'}">P1</div>
          </div>
          <i class="fas fa-sync-alt text-2xl ${step > 0 ? 'animate-spin-slow' : ''} text-accent-orange"></i>
          <div class="w-20 h-24 border-2 ${step >= 4 ? 'border-accent-green' : 'border-border-strong'} rounded bg-bg-surface flex-center flex-col">
             <div class="text-xs font-bold ${step >= 4 ? 'text-accent-green' : 'text-text-muted'}">P2</div>
          </div>
        </div>
        <div class="bg-black p-4 rounded-lg border border-border-strong">
          <div class="text-[10px] font-mono text-accent-orange mb-3 flex-between">
            <span>STEP: ${step + 1}/5</span>
            <span class="animate-pulse">${steps[step]}</span>
          </div>
          <div class="w-full h-1 bg-border-strong rounded-full overflow-hidden">
            <div class="h-full bg-accent-orange transition-all duration-500" style="width: ${(step + 1) * 20}%"></div>
          </div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="this.closest('.concept-block')._sim.step()">NEXT CYCLE</button>
      </div>
    `;
  }
  step() {
    const nextStep = ((this.state.step || 0) + 1) % 5;
    this.update({ step: nextStep });
  }
}

class PrivilegeSimulator extends BaseSimulator {
  render() {
    const { ring, isBlocked, log } = this.state;
    this.canvas.innerHTML = `
      <div class="privilege-lab p-6 font-mono">
        <div class="flex flex-col items-center gap-12">
          <!-- Hardware Rings -->
          <div class="relative w-64 h-64 flex-center">
             <div class="absolute w-full h-full border-8 border-accent-red/20 rounded-full"></div>
             <div class="absolute w-48 h-48 border-8 border-accent-orange/20 rounded-full"></div>
             <div class="absolute w-32 h-32 border-8 border-accent-cyan/20 rounded-full"></div>
             <div class="absolute w-16 h-16 bg-accent-green/20 rounded-full flex-center">
                <div class="text-[8px] font-bold text-accent-green">RING_0</div>
             </div>

             <!-- CPU Pointer -->
             <div class="absolute transition-all duration-1000 flex flex-col items-center" style="transform: translateY(${ring === 0 ? '0' : '90px'})">
                <div class="w-4 h-4 bg-white rounded-full shadow-glow-white animate-pulse"></div>
                <div class="text-[10px] font-bold text-white mt-2">CPL: ${ring || 3}</div>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4 w-full">
             <div class="bg-black/60 border border-border-strong p-4 rounded-xl">
                <div class="text-[10px] font-bold mb-4">INSTRUCTION_BUFFER</div>
                <div class="space-y-2">
                   <button class="btn btn-xs btn-outline w-full" onclick="this.closest('.concept-block')._sim.exec('MOV EAX, 1')">MOV EAX, 1</button>
                   <button class="btn btn-xs btn-outline border-accent-red text-accent-red w-full" onclick="this.closest('.concept-block')._sim.exec('HLT')">HLT (PRIVILEGED)</button>
                   <button class="btn btn-xs btn-outline border-accent-orange text-accent-orange w-full" onclick="this.closest('.concept-block')._sim.exec('INT 0x80')">INT 0x80 (SYSCALL)</button>
                </div>
             </div>
             
             <div class="bg-black border border-border-strong p-4 rounded-xl relative overflow-hidden">
                <div class="text-[9px] font-bold text-text-muted mb-2 uppercase">CPU_EXCEPTION_LOG</div>
                <div class="text-[10px] text-accent-green leading-relaxed">
                   ${(log || []).map(l => `<div>> ${l}</div>`).join('')}
                </div>
                ${isBlocked ? `<div class="absolute inset-0 bg-accent-red/20 flex-center flex-col animate-shake">
                   <div class="text-xs font-bold text-accent-red">#GP: GENERAL_PROTECTION_FAULT</div>
                   <div class="text-[8px] text-white">Privileged Instruction in Ring 3</div>
                </div>` : ''}
             </div>
          </div>
        </div>
      </div>
    `;
  }

  exec(ins) {
    const ring = this.state.ring || 3;
    const log = this.state.log || [];
    
    if (ins === 'HLT' && ring !== 0) {
      this.update({ isBlocked: true });
      log.push(`FAULT: ${ins} denied (CPL=${ring})`);
      setTimeout(() => this.update({ isBlocked: false }), 2000);
    } else if (ins === 'INT 0x80') {
      log.push(`TRAP: Switching to Ring 0 via Gate...`);
      this.update({ ring: 0 });
      setTimeout(() => this.update({ ring: 3 }), 1500);
    } else {
      log.push(`EXEC: ${ins} success.`);
    }
    this.update({ log: log.slice(-5) });
  }
}

class RaceConditionSimulator extends BaseSimulator {
  render() {
    const { count, threadA, threadB, mem, isCorrupted } = this.state;
    const instructions = ["LOAD [mem]", "ADD 1", "STORE [mem]"];
    
    this.canvas.innerHTML = `
      <div class="concurrency-lab p-4 font-mono">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Thread A -->
          <div class="flex flex-col gap-4">
            <div class="p-3 bg-accent-cyan/10 border-2 ${threadA?.active ? 'border-accent-cyan shadow-glow-cyan' : 'border-border-strong'} rounded-xl">
               <div class="text-[10px] font-bold text-accent-cyan mb-4 uppercase">Thread Alpha (Core 0)</div>
               <div class="space-y-2">
                 ${instructions.map((ins, i) => `
                   <div class="p-2 border rounded text-[10px] ${threadA?.pc === i ? 'bg-accent-cyan text-black font-bold' : 'bg-black/40 text-text-muted'}">
                     ${ins}
                   </div>
                 `).join('')}
               </div>
               <div class="mt-4 p-2 bg-black border border-border-strong rounded flex-between">
                  <span class="text-[8px] text-text-muted">Register:</span>
                  <span class="text-accent-cyan">${threadA?.reg || 0}</span>
               </div>
               <button class="btn btn-xs btn-cyan w-full mt-4" onclick="this.closest('.concept-block')._sim.stepThread('A')">STEP THREAD A</button>
            </div>
          </div>

          <!-- Shared Memory -->
          <div class="flex flex-col items-center justify-center gap-6">
             <div class="w-32 h-32 border-4 ${isCorrupted ? 'border-accent-red animate-shake' : 'border-accent-green'} rounded-2xl flex-center flex-col bg-black">
                <div class="text-[8px] font-bold text-text-muted uppercase">Global Memory</div>
                <div class="text-4xl font-bold ${isCorrupted ? 'text-accent-red' : 'text-accent-green'}">${mem || 5}</div>
                <div class="text-[8px] text-text-muted mt-2">Address: 0x8004</div>
             </div>
             ${isCorrupted ? `<div class="text-[10px] text-accent-red font-bold animate-pulse text-center">! RACE CONDITION DETECTED !<br>DATA CORRUPTED</div>` : ''}
             <button class="btn btn-xs btn-outline" onclick="this.closest('.concept-block')._sim.reset()">RESET MEMORY</button>
          </div>

          <!-- Thread B -->
          <div class="flex flex-col gap-4">
            <div class="p-3 bg-accent-purple/10 border-2 ${threadB?.active ? 'border-accent-purple shadow-glow-purple' : 'border-border-strong'} rounded-xl">
               <div class="text-[10px] font-bold text-accent-purple mb-4 uppercase">Thread Beta (Core 1)</div>
               <div class="space-y-2">
                 ${instructions.map((ins, i) => `
                   <div class="p-2 border rounded text-[10px] ${threadB?.pc === i ? 'bg-accent-purple text-white font-bold' : 'bg-black/40 text-text-muted'}">
                     ${ins}
                   </div>
                 `).join('')}
               </div>
               <div class="mt-4 p-2 bg-black border border-border-strong rounded flex-between">
                  <span class="text-[8px] text-text-muted">Register:</span>
                  <span class="text-accent-purple">${threadB?.reg || 0}</span>
               </div>
               <button class="btn btn-xs btn-purple w-full mt-4" onclick="this.closest('.concept-block')._sim.stepThread('B')">STEP THREAD B</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  stepThread(id) {
    let { threadA, threadB, mem, isCorrupted } = this.state;
    threadA = threadA || { pc: 0, reg: 0, active: false };
    threadB = threadB || { pc: 0, reg: 0, active: false };
    mem = mem || 5;

    const t = id === 'A' ? threadA : threadB;
    t.active = true;
    const other = id === 'A' ? threadB : threadA;
    other.active = false;

    if (t.pc === 0) { // LOAD
      t.reg = mem;
      t.pc = 1;
    } else if (t.pc === 1) { // ADD 1
      t.reg++;
      t.pc = 2;
    } else if (t.pc === 2) { // STORE
      mem = t.reg;
      t.pc = 0;
      // Simple corruption detection: if both finish, they should equal original + 2
      // For this lab, we just show the interleaving result.
    }

    this.update({ threadA, threadB, mem });
    this.log(`Core ${id === 'A' ? 0 : 1}: Executing instruction.`);
  }

  reset() {
    this.update({
      threadA: { pc: 0, reg: 0, active: false },
      threadB: { pc: 0, reg: 0, active: false },
      mem: 5,
      isCorrupted: false
    });
    this.log("Kernel: Shared memory reset to initial state.");
  }
}

class DeadlockRAGSimulator extends BaseSimulator {
  render() {
    const edges = this.state.edges || [];
    const isDeadlocked = this.hasCycle(edges);
    
    this.canvas.innerHTML = `
      <div class="deadlock-lab p-4 relative ${isDeadlocked ? 'bg-black/80' : ''} transition-all duration-1000 min-h-[400px]">
        ${isDeadlocked ? `
          <div class="absolute inset-0 flex-center flex-col z-50 animate-fade-in">
             <div class="text-6xl text-accent-red font-black tracking-tighter mb-4 animate-pulse">SYSTEM_HALT</div>
             <div class="px-6 py-2 bg-accent-red text-black font-bold uppercase tracking-widest">NO FORWARD PROGRESS POSSIBLE</div>
             <div class="text-[10px] text-accent-red mt-8 font-mono animate-flicker">CIRCULAR_WAIT_DETECTED [P1->R1->P2->R2->P1]</div>
             <button class="btn btn-sm btn-outline border-accent-red text-accent-red mt-12" onclick="this.closest('.concept-block')._sim.resetRAG()">FORCE SYSTEM REBOOT</button>
          </div>
        ` : ''}

        <div class="telemetry-grid mb-8">
           <div class="text-[10px] font-bold text-accent-cyan uppercase mb-4">Resource Allocation Graph (Live)</div>
           <div class="h-64 border-2 border-border-strong rounded-2xl bg-black/40 relative">
              <!-- P1 -->
              <div class="absolute top-10 left-10 w-16 h-16 border-2 border-accent-cyan rounded-full flex-center text-xs font-bold text-accent-cyan ${isDeadlocked ? 'animate-glow-red border-accent-red text-accent-red' : ''}">P1</div>
              <!-- R1 -->
              <div class="absolute top-10 right-10 w-16 h-16 border-2 border-accent-orange rounded flex-center text-xs font-bold text-accent-orange">R1</div>
              <!-- P2 -->
              <div class="absolute bottom-10 right-10 w-16 h-16 border-2 border-accent-cyan rounded-full flex-center text-xs font-bold text-accent-cyan ${isDeadlocked ? 'animate-glow-red border-accent-red text-accent-red' : ''}">P2</div>
              
              <!-- Edges (SVG Overlay) -->
              <svg class="absolute inset-0 w-full h-full pointer-events-none">
                 <marker id="arrow-dead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="${isDeadlocked ? 'var(--accent-red)' : 'var(--border-strong)'}" />
                 </marker>
                 ${edges.map(e => {
                   const x1 = e.from === 'P1' ? 42 : e.from === 'R1' ? 350 : 350;
                   const y1 = e.from === 'P1' ? 42 : e.from === 'R1' ? 42 : 350;
                   const x2 = e.to === 'P1' ? 42 : e.to === 'R1' ? 350 : 350;
                   const y2 = e.to === 'P1' ? 42 : e.to === 'R1' ? 42 : 350;
                   return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isDeadlocked ? 'var(--accent-red)' : 'var(--border-strong)'}" stroke-width="2" marker-end="url(#arrow-dead)" />`;
                 }).join('')}
              </svg>
           </div>
        </div>

        <div class="flex gap-4">
           <button class="btn btn-sm btn-outline flex-1" onclick="this.closest('.concept-block')._sim.addEdge('P1', 'R1')">P1 REQ R1</button>
           <button class="btn btn-sm btn-outline flex-1" onclick="this.closest('.concept-block')._sim.addEdge('R1', 'P2')">R1 ALLOC P2</button>
           <button class="btn btn-sm btn-outline flex-1" onclick="this.closest('.concept-block')._sim.addEdge('P2', 'P1')">P2 REQ P1 (CYCLE)</button>
        </div>
      </div>
    `;
  }
  addEdge(from, to) {
    const edges = this.state.edges || [];
    edges.push({ from, to });
    this.update({ edges });
    this.log(`RAG: Edge added ${from} -> ${to}`);
  }
  resetRAG() {
    this.update({ edges: [] });
    this.log("Kernel: Deadlock resolved. System state cleared.");
  }
  hasCycle(edges) { return edges.length >= 3; }
}

class BankerSimulator extends BaseSimulator {
  render() {
    const resources = this.state.resources || { A: 10, B: 5, C: 7 };
    const available = this.state.available || { A: 3, B: 3, C: 2 };
    this.container.innerHTML = `
      <div class="p-4 bg-bg-surface rounded border border-border-strong">
        <div class="text-[10px] flex-between mb-2">
          <span>AVAIL: A:${available.A} B:${available.B} C:${available.C}</span>
          <span class="text-accent-green">STATE: SAFE</span>
        </div>
        <button class="btn btn-xs btn-primary w-full" onclick="this.closest('.concept-block')._sim.simulateRequest()">RUN SAFETY AUDIT</button>
      </div>
    `;
  }
  simulateRequest() { this.log("Safety Audit: System is in a safe state."); }
}

class BootSimulator extends BaseSimulator {
  render() {
    const step = this.state.step || 0;
    const stages = ["Power On", "BIOS/UEFI POST", "Find Bootloader", "Kernel Init", "User Space Startup"];
    
    this.canvas.innerHTML = `
      <div class="boot-lab p-4 font-mono">
        <div class="flex flex-col gap-6">
          <div class="flex justify-between relative px-8 py-4">
            <div class="absolute top-1/2 left-0 w-full h-1 bg-border-strong -translate-y-1/2 z-0"></div>
            <div class="absolute top-1/2 left-0 h-1 bg-accent-green -translate-y-1/2 z-10 transition-all duration-1000" style="width: ${step * 25}%"></div>
            
            ${stages.map((s, i) => `
              <div class="relative z-20 flex flex-col items-center">
                <div class="w-8 h-8 rounded-full border-2 transition-all duration-500 ${i <= step ? 'bg-accent-green border-accent-green shadow-glow-green' : 'bg-black border-border-strong'} flex-center">
                   <i class="fas fa-check text-[10px] ${i <= step ? 'text-black' : 'opacity-0'}"></i>
                </div>
                <div class="text-[7px] mt-2 uppercase text-center w-16 ${i <= step ? 'text-accent-green font-bold' : 'text-text-muted'}">${s}</div>
              </div>
            `).join('')}
          </div>

          <div class="bg-black border-2 border-border-strong rounded-xl p-4 h-48 overflow-hidden font-mono text-[10px] leading-relaxed">
             <div class="text-accent-green mb-2">> [0.00s] SYSTEM_INITIALIZING...</div>
             <div class="text-white/80 opacity-60">
               ${this.getLogs(step).map(l => `<div>${l}</div>`).join('')}
             </div>
             <div class="text-accent-green mt-4 animate-pulse">_</div>
          </div>

          <button class="btn btn-sm btn-outline w-full" onclick="this.closest('.concept-block')._sim.advance()">ADVANCE BOOT STAGE</button>
        </div>
      </div>
    `;
  }

  getLogs(step) {
    const allLogs = [
      ["[0.01s] CPU_RESET: PASS", "[0.02s] VOLTAGE_CHECK: 1.2V OK"],
      ["[0.10s] BIOS: Enumerating PCI Bus", "[0.12s] RAM_CHECK: 16GB OK"],
      ["[0.50s] MBR: Loading GRUB Stage 1", "[0.55s] VMLINUZ: Decompressing Kernel"],
      ["[1.20s] KERNEL: Mounting root fs", "[1.50s] INIT: Spawning PID 1"],
      ["[2.10s] GUI: Loading Display Manager", "[2.50s] LOGIN: Machine Ready."]
    ];
    let res = [];
    for(let i=0; i<=step; i++) res = res.concat(allLogs[i]);
    return res.slice(-8);
  }

  advance() {
    this.update({ step: (this.state.step || 0) + 1 });
    if(this.state.step > 4) this.update({ step: 0 });
    this.log(`Boot: Stage ${this.state.step} complete.`);
  }
}


class InterruptSimulator extends BaseSimulator {
  render() {
    const step = this.state.step || 0;
    const steps = [
      "Device Event (Keyboard Press)",
      "CPU Pin INTR high",
      "Save PC & Flags to Stack",
      "IDT Lookup (Vector 0x21)",
      "Jump to ISR (keyboard_handler)"
    ];

    this.container.innerHTML = `
      <div class="flex flex-col gap-6 p-4">
        <div class="flex-between items-center bg-black/40 p-4 rounded-xl border border-border-strong">
          <div class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 bg-bg-surface border border-border-strong rounded flex-center ${step === 0 ? 'animate-pulse bg-accent-orange/20 border-accent-orange' : ''}">
              <i class="fas fa-keyboard text-xl"></i>
            </div>
            <div class="text-[8px] font-bold">KEYBOARD</div>
          </div>
          
          <div class="flex-1 px-4">
            <div class="h-0.5 w-full bg-border-strong relative">
              <div class="absolute top-1/2 left-0 h-2 w-2 rounded-full bg-accent-orange -translate-y-1/2 transition-all duration-500" style="left: ${step * 25}%"></div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div class="w-16 h-16 border-2 border-border-strong rounded-full flex-center bg-black overflow-hidden relative">
               <div class="absolute inset-0 bg-accent-orange/5 ${step > 0 ? 'animate-pulse' : ''}"></div>
               <i class="fas fa-microchip text-xl text-text-muted"></i>
            </div>
            <div class="text-[8px] font-bold">CPU</div>
          </div>
        </div>

        <div class="bg-bg-surface p-4 rounded-xl border border-border-strong">
          <div class="text-[10px] font-mono text-accent-orange mb-3 flex-between">
            <span>EVENT_TRACE: ${step + 1}/5</span>
            <span class="animate-pulse">${steps[step]}</span>
          </div>
          <div class="w-full h-1 bg-border-strong rounded-full overflow-hidden">
            <div class="h-full bg-accent-orange transition-all duration-500" style="width: ${(step+1)*20}%"></div>
          </div>
        </div>

        <button class="btn btn-sm btn-outline" onclick="this.closest('.concept-block')._sim.step()">TRIGGER INTERRUPT STEP</button>
      </div>
    `;
  }

  step() {
    const nextStep = ((this.state.step || 0) + 1) % 5;
    this.update({ step: nextStep });
    this.log(`Interrupt Flow: ${nextStep + 1}/5`);
  }
  getLogs(step) {
    const logs = ["POST_CHECK_OK", "BIOS_ENUM_PCI", "GRUB_STAGE_1_LOAD", "VMLINUZ_DECOMPRESS", "INIT_SYSTEMD_READY"];
    return logs.slice(0, step + 1);
  }
}


class SyscallSimulator extends BaseSimulator {
  render() {
    const { step, sysIndex, log } = this.state;
    const syscalls = ["write()", "read()", "open()", "fork()", "exit()"];
    const currentSyscall = syscalls[sysIndex || 0];

    this.canvas.innerHTML = `
      <div class="syscall-lab p-4 font-mono">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 h-48 mb-6">
          <div class="border-2 ${step === 0 ? 'border-accent-cyan shadow-glow-cyan' : 'border-border-strong'} rounded-2xl bg-bg-surface p-4 flex flex-col items-center">
            <div class="text-[10px] font-bold text-accent-cyan mb-8 uppercase">User Space (Ring 3)</div>
            <div class="w-16 h-16 bg-accent-cyan/10 border-2 border-accent-cyan rounded-xl flex-center flex-col animate-pulse">
              <i class="fas fa-terminal text-accent-cyan"></i>
              <div class="text-[8px] font-bold mt-1">APP_PID_102</div>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center relative overflow-hidden bg-black/40 border-y-2 border-dashed border-border-strong">
             <div class="text-[10px] font-bold text-accent-orange mb-2">SYSCALL_GATE</div>
             ${step === 1 ? `<div class="w-6 h-6 rounded-full bg-accent-orange shadow-glow-orange animate-ping z-10"></div>` : ''}
             <div class="text-[8px] text-text-muted mt-2">Vector 0x80</div>
          </div>

          <div class="border-2 ${step === 2 ? 'border-accent-green shadow-glow-green' : 'border-border-strong'} rounded-2xl bg-black p-4 flex flex-col items-center">
            <div class="text-[10px] font-bold text-accent-green mb-8 uppercase">Kernel Space (Ring 0)</div>
            <div class="w-16 h-16 bg-accent-green/10 border-2 border-accent-green rounded-xl flex-center flex-col">
              <i class="fas fa-microchip text-accent-green"></i>
              <div class="text-[8px] font-bold mt-1">SYS_CORE</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
           <div class="bg-black border border-border-strong p-4 rounded-xl">
              <div class="text-[9px] font-bold text-text-muted mb-4 uppercase">System Call Table</div>
              <div class="space-y-1">
                 ${syscalls.map((s, i) => `
                   <div class="p-1 px-3 border rounded text-[9px] ${i === sysIndex ? 'bg-accent-orange/20 border-accent-orange text-white' : 'border-transparent opacity-40'}">
                     0x${i.toString(16).toUpperCase()}: sys_${s}
                   </div>
                 `).join('')}
              </div>
           </div>
           
           <div class="bg-black border border-border-strong p-4 rounded-xl flex flex-col gap-4">
              <button class="btn btn-xs btn-outline w-full" onclick="this.closest('.concept-block')._sim.nextSyscall()">NEXT_SYSCALL</button>
              <button class="btn btn-sm btn-primary w-full" onclick="this.closest('.concept-block')._sim.trigger()">EXECUTE TRAP</button>
           </div>
        </div>
      </div>
    `;
  }

  nextSyscall() {
    this.update({ sysIndex: ((this.state.sysIndex || 0) + 1) % 5, step: 0 });
  }

  trigger() {
    this.update({ step: 1 });
    this.log("SYSCALL: App triggered INT 0x80 gate.");
    setTimeout(() => {
      this.update({ step: 2 });
      this.log("KERNEL: Privilege escalated. Executing syscall handler.");
      setTimeout(() => this.update({ step: 0 }), 1500);
    }, 800);
  }
}

class StoragePhysicsSimulator extends BaseSimulator {
  constructor(canvas, config, conceptId) {
    super(canvas, config, conceptId);
    this.type = 'HDD';
    this.initStorage();
  }

  initStorage() {
    this.state = {
      ...this.state,
      headPos: 0.5,
      rotating: true,
      queue: [0.1, 0.9, 0.3, 0.7],
      metrics: { iops: 120, latency_ms: 8.4, bandwidth_mbs: 150, queue_depth: 4 },
      nandBlocks: Array.from({length: 64}, () => ({ state: Math.random() > 0.8 ? 'used' : 'clean' })),
      latencyHistory: Array.from({length: 30}, () => Math.random() * 10)
    };
  }

  render() {
    const { headPos, rotating, queue, metrics, nandBlocks, latencyHistory } = this.state;
    this.canvas.innerHTML = `
      <div class="simulator-container p-6 font-mono">
        ${SimulatorPrimitives.renderTelemetry(metrics)}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 flex flex-col gap-8">
            <div class="bg-black/60 border-2 border-border-strong rounded-3xl p-10 relative shadow-2xl">
               <div class="flex-between mb-8">
                  <div class="text-[11px] text-accent-orange uppercase tracking-widest font-bold">Storage Physics Laboratory</div>
                  <div class="flex gap-2">
                     <button class="btn btn-xs ${this.type === 'HDD' ? 'btn-primary' : 'btn-ghost'} px-4 py-2" onclick="this.closest('.concept-block')._sim.setType('HDD')">HDD</button>
                     <button class="btn btn-xs ${this.type === 'SSD' ? 'btn-primary' : 'btn-ghost'} px-4 py-2" onclick="this.closest('.concept-block')._sim.setType('SSD')">SSD</button>
                  </div>
               </div>
               <div class="flex flex-col items-center gap-10">
                 ${this.type === 'HDD' ? SimulatorPrimitives.renderDiskPlatter(headPos, rotating) : SimulatorPrimitives.renderNANDGrid(nandBlocks)}
               </div>
            </div>
            <div class="bg-bg-surface-elevated border border-border-strong rounded-2xl p-6 shadow-lg">
               <div class="text-[9px] font-bold uppercase mb-4 text-text-muted">I/O Latency Distribution (Real-time)</div>
               ${SimulatorPrimitives.renderLatencyHistogram(latencyHistory)}
               <div class="mt-4 flex-between text-[7px] text-text-muted">
                  <span>0ms</span>
                  <span>TEMPORAL_VECTOR →</span>
                  <span>25ms</span>
               </div>
            </div>
          </div>
          <div class="lg:col-span-4 space-y-4">
             <div class="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-lg">
                <div class="text-[10px] font-bold uppercase mb-4 border-b border-border-strong pb-2">Control Panel</div>
                <button class="btn btn-sm btn-primary w-full mb-4 py-4" onclick="this.closest('.concept-block')._sim.runIO()">
                  <i class="fas fa-bolt mr-2"></i> TRIGGER_IO_REQUEST
                </button>
                <div class="text-[8px] text-text-muted leading-relaxed italic">
                  * Triggers physical head seek on HDD or FTL remapping on SSD NAND blocks.
                </div>
             </div>
          </div>
        </div>
      </div>
    `;
  }

  setType(t) { this.type = t; this.initStorage(); this.render(); }
  runIO() {
    const target = Math.random();
    this.update({ headPos: target });
    this.log(`Storage: Executing I/O at target ${target.toFixed(2)}`);
  }
}


class SemaphoreSimulator extends BaseSimulator {
  constructor(canvas, config, conceptId) {
    super(canvas, config, conceptId);
    this.state = { ...this.state, sem: 1, queue: [], active: null, metrics: { wait_time: 0, signal_count: 0 } };
  }
  render() {
    const { sem, queue, active, metrics } = this.state;
    this.canvas.innerHTML = `
      <div class="simulator-container p-6 font-mono">
        ${SimulatorPrimitives.renderTelemetry(metrics)}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-4 flex flex-col gap-4">
             <div class="p-6 bg-black/60 border-2 border-border-strong rounded-2xl flex-center flex-col">
                <div class="text-[10px] text-accent-cyan uppercase mb-6 font-bold">Binary Semaphore (Mutex)</div>
                <div class="w-20 h-20 rounded-full border-8 ${sem > 0 ? 'border-accent-green bg-accent-green/10 shadow-glow-green' : 'border-accent-red bg-accent-red/10 shadow-glow-red'} flex-center">
                   <i class="fas ${sem > 0 ? 'fa-lock-open' : 'fa-lock'} text-2xl"></i>
                </div>
                <div class="text-xl font-bold mt-4">${sem}</div>
             </div>
          </div>
          <div class="lg:col-span-8 space-y-4">
             ${SimulatorPrimitives.renderQueue('Waiting_on_Semaphore', queue.map(id => ({id})))}
             <div class="grid grid-cols-2 gap-4 mt-6">
                <button class="btn btn-sm btn-outline py-4" onclick="this.closest('.concept-block')._sim.wait()">
                   <i class="fas fa-arrow-down mr-2"></i> P() (Wait)
                </button>
                <button class="btn btn-sm btn-outline py-4" onclick="this.closest('.concept-block')._sim.signal()">
                   <i class="fas fa-arrow-up mr-2"></i> V() (Signal)
                </button>
             </div>
          </div>
        </div>
      </div>
    `;
  }
  wait() {
    const id = 'P' + Math.floor(Math.random() * 100);
    if (this.state.sem > 0) {
      this.update({ sem: 0, active: id });
      this.log(`Semaphore: ${id} acquired lock.`);
    } else {
      this.state.queue.push(id);
      this.render();
      this.log(`Semaphore: ${id} blocked. Entering sleep queue.`);
    }
  }
  signal() {
    if (this.state.queue.length > 0) {
      const next = this.state.queue.shift();
      this.update({ active: next });
      this.log(`Semaphore: Signal received. Waking up ${next}.`);
    } else {
      this.update({ sem: 1, active: null });
      this.log(`Semaphore: Resource freed. Mutex set to 1.`);
    }
    this.state.metrics.signal_count++;
  }
}

class DiningPhilosophersSimulator extends BaseSimulator {
  constructor(canvas, config, conceptId) {
    super(canvas, config, conceptId);
    this.state = { 
      ...this.state, 
      philosophers: Array.from({length: 5}, (_, i) => ({ id: i, state: 'THINKING' })),
      chopsticks: Array.from({length: 5}, () => true),
      metrics: { deadlocks_prevented: 0, throughput: 0 }
    };
  }
  render() {
    const { philosophers, chopsticks, metrics } = this.state;
    this.canvas.innerHTML = `
      <div class="simulator-container p-6 font-mono">
        ${SimulatorPrimitives.renderTelemetry(metrics)}
        <div class="flex-center relative w-full h-[400px] bg-black/40 rounded-3xl border-2 border-border-strong overflow-hidden">
           <div class="w-64 h-64 rounded-full border-4 border-border-strong bg-bg-surface-elevated flex-center shadow-2xl relative">
              ${chopsticks.map((c, i) => {
                const angle = i * (360/5) + (360/10);
                return `<div class="absolute w-12 h-1 ${c ? 'bg-accent-orange shadow-glow-orange' : 'bg-border-strong opacity-20'} rounded-full transition-all duration-300" style="transform: rotate(${angle}deg) translate(60px)"></div>`;
              }).join('')}
           </div>
           ${philosophers.map((p, i) => {
             const angle = i * (360/5);
             const colors = { 'THINKING': 'border-accent-cyan', 'HUNGRY': 'border-accent-orange animate-pulse', 'EATING': 'border-accent-green shadow-glow-green' };
             return `
               <div class="absolute flex-center flex-col gap-2 transition-all duration-500" style="transform: rotate(${angle}deg) translate(140px) rotate(-${angle}deg)">
                  <div class="w-16 h-16 rounded-full border-4 ${colors[p.state]} bg-black flex-center cursor-pointer hover:scale-110" onclick="this.closest('.concept-block')._sim.togglePhil(${i})">
                     <i class="fas fa-user-tie text-xl ${p.state === 'EATING' ? 'text-accent-green' : 'text-text-muted'}"></i>
                  </div>
                  <div class="text-[7px] font-bold uppercase tracking-widest">${p.state}</div>
               </div>
             `;
           }).join('')}
        </div>
      </div>
    `;
  }
  togglePhil(i) {
    let { philosophers, chopsticks } = this.state;
    const p = philosophers[i];
    const left = i;
    const right = (i + 1) % 5;
    if (p.state === 'THINKING') p.state = 'HUNGRY';
    else if (p.state === 'HUNGRY') {
      if (chopsticks[left] && chopsticks[right]) { chopsticks[left] = chopsticks[right] = false; p.state = 'EATING'; }
    } else { chopsticks[left] = chopsticks[right] = true; p.state = 'THINKING'; }
    this.render();
  }
}





export class SimulatorEngine {
  constructor(container, config, conceptId) {
    this.container = container;
    this.config = config;
    this.conceptId = conceptId;
    this.impl = null;
    
    const block = this.container.closest('.concept-block');
    if (block) block._sim = this;
    
    this.init();

    // Use a Proxy to delegate any method calls and property access to the implementation (impl)
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        if (target.impl && prop in target.impl) {
          const val = target.impl[prop];
          return typeof val === 'function' ? val.bind(target.impl) : val;
        }
        return undefined;
      },
      set: (target, prop, value) => {
        if (prop in target) {
          target[prop] = value;
          return true;
        }
        if (target.impl) {
          target.impl[prop] = value;
          return true;
        }
        return false;
      }
    });
  }

  init() {
    const type = this.config.type;
    console.log(`[SimulatorEngine] Mounting ${type} for ${this.conceptId}`);
    
    switch(type) {
      case 'Process State':
      case 'State Machine Animator':
      case 'Triggering the Machine':
        this.impl = new ProcessStateSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Address Translation':
      case 'Paging':
      case 'Memory Laboratory':
      case 'Memory Observatory':
      case 'Memory Hierarchy Observatory':
      case 'Address Translation Tracer':
      case 'TLB Cache Performance':
        this.impl = new MemoryObservatory(this.container, this.config, this.conceptId);
        break;
      case 'Storage Physics Observatory':
      case 'Persistence Laboratory':
      case 'Disk Platter Physics':
      case 'Storage Observatory':
        this.impl = new StoragePhysicsSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Context Switch':
      case 'Context Switch Forensic':
        this.impl = new ContextSwitchSimulator(this.container, this.config, this.conceptId);
        break;
      case 'CPU Privilege Ring Visualizer':
      case 'Privilege Ring Guard':
        this.impl = new PrivilegeSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Boot Sequence Timeline':
      case 'Machine Awakening Trace':
        this.impl = new BootSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Keyboard Interrupt Execution':
      case 'Interrupt Timeline Flow':
        this.impl = new InterruptSimulator(this.container, this.config, this.conceptId);
        break;
      case 'System Call Pipeline':
      case 'Syscall Request Flow':
        this.impl = new SyscallSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Scheduling Simulator':
      case 'Dispatcher Latency Visualizer':
      case 'Gantt Master View':
        this.impl = new SchedulingSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Race Condition Tracer':
      case 'Race Condition Simulator':
        this.impl = new RaceConditionSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Semaphore Queue Visualizer':
        this.impl = new SemaphoreSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Philosopher Stress Table':
        this.impl = new DiningPhilosophersSimulator(this.container, this.config, this.conceptId);
        break;
      case 'DeadlockRAGSimulator':
      case 'Deadlock RAG Simulator':
      case 'Resource Allocation Graph':
        this.impl = new DeadlockRAGSimulator(this.container, this.config, this.conceptId);
        break;
      case 'Banker Simulation Engine':
      case 'Banker Safety Audit':
      case 'Safety Audit Engine':
        this.impl = new BankerSimulator(this.container, this.config, this.conceptId);
        break;
      default:
        console.warn(`[SimulatorEngine] Unknown type: ${type}`);
        this.container.innerHTML = `<div class="coming-soon-card flex flex-col items-center justify-center h-48 border-2 border-dashed border-border-strong rounded-xl text-text-muted bg-black/20">
          <i class="fas fa-microchip text-3xl mb-4 opacity-20"></i>
          <span class="text-xs uppercase tracking-widest font-bold">Simulator [${type}] in development</span>
        </div>`;
        return;
    }
    
    if (this.impl) {
      this.impl.render();
    }
  }

  update(state) {
    if (this.impl) this.impl.update(state);
  }
}
