/**
 * Shell Inspector
 * 
 * Educational visualization panel for the Shell Runtime.
 * Shows:
 * - AST (Abstract Syntax Tree)
 * - Process Table
 * - FD (File Descriptor) Table
 * - Syscall Trace
 */

import { Bus } from '../event-bus.js';
import { qs } from '../utils.js';

export class ShellInspector {
  constructor(containerId) {
    this.container = qs(containerId);
    this.syscallLogs = [];
    this.currentAST = null;
    this.init();
    this.bindEvents();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="shell-inspector-panel glass border border-border-strong rounded-xl overflow-hidden h-full flex flex-col">
        <div class="panel-header bg-bg-surface-elevated p-3 border-b border-border-strong flex justify-between items-center">
          <div class="flex items-center gap-2">
            <i class="fas fa-microchip text-accent-purple"></i>
            <span class="text-xs font-bold uppercase tracking-widest">Kernel Inspector</span>
          </div>
          <div class="flex gap-2">
            <button id="view-ast" class="btn-tab active">AST</button>
            <button id="view-procs" class="btn-tab">PROCS</button>
            <button id="view-syscalls" class="btn-tab">SYSCALLS</button>
          </div>
        </div>
        <div id="inspector-content" class="flex-1 p-4 font-mono text-[10px] overflow-auto custom-scrollbar bg-black/40">
          <div class="text-text-muted italic">Ready for command...</div>
        </div>
      </div>
    `;
    this.contentArea = qs('#inspector-content');
  }

  bindEvents() {
    Bus.on('syscall_trace', (trace) => {
      this.syscallLogs.unshift(trace);
      if (this.syscallLogs.length > 50) this.syscallLogs.pop();
      this.updateSyscallView();
    });

    Bus.on('ast_update', (ast) => {
      this.currentAST = ast;
      this.updateASTView();
    });

    qs('#view-ast')?.addEventListener('click', () => this.updateASTView());
    qs('#view-procs')?.addEventListener('click', () => this.updateProcsView());
    qs('#view-syscalls')?.addEventListener('click', () => this.updateSyscallView());
  }

  updateASTView() {
    this.setActiveTab('#view-ast');
    if (!this.currentAST) {
        this.contentArea.innerHTML = '<div class="text-text-muted">No AST generated yet.</div>';
        return;
    }
    this.contentArea.innerHTML = `<pre class="text-accent-cyan">${JSON.stringify(this.currentAST, null, 2)}</pre>`;
  }

  updateSyscallView() {
    this.setActiveTab('#view-syscalls');
    this.contentArea.innerHTML = this.syscallLogs.map(log => `
      <div class="mb-2 pb-1 border-b border-white/5">
        <span class="text-accent-purple font-bold">${log.call}</span>
        <span class="text-text-secondary ml-2">${JSON.stringify(log.args || log.path || '')}</span>
        ${log.pid ? `<span class="text-accent-green ml-2">[PID: ${log.pid}]</span>` : ''}
      </div>
    `).join('');
  }

  updateProcsView() {
    this.setActiveTab('#view-procs');
    // This would ideally pull from a global runtime or Bus event
    this.contentArea.innerHTML = '<div class="text-text-muted">Process tracking active... Run a command to see forks.</div>';
  }

  setActiveTab(id) {
    qsa('.btn-tab').forEach(b => b.classList.remove('active'));
    qs(id)?.classList.add('active');
  }
}
