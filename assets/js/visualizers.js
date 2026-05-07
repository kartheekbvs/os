/**
 * Systems Engineering Visualizers
 * 
 * High-fidelity components for visualizing Linux internals:
 * - Filesystem Trees
 * - Permission Matrices
 * - Process Hierarchies
 */

export class VisualizerEngine {
  static renderPermissionMatrix(container, mode) {
    const octal = mode.toString(8).padStart(3, '0');
    const bits = mode.toString(2).padStart(9, '0');
    
    const labels = ['User', 'Group', 'Others'];
    const types = ['Read', 'Write', 'Execute'];
    const values = [4, 2, 1];

    let html = `
      <div class="permission-matrix p-4 glass border border-border-strong rounded-xl bg-black/40">
        <div class="flex justify-between items-center mb-4">
          <div class="text-xs font-mono text-accent-cyan uppercase tracking-widest">Permission Matrix</div>
          <div class="text-xl font-bold font-mono text-white">${octal}</div>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div></div>
          ${types.map(t => `<div class="text-[10px] text-center text-text-muted uppercase">${t}</div>`).join('')}
          
          ${labels.map((label, i) => `
            <div class="text-xs font-bold text-text-secondary py-2">${label}</div>
            ${[0, 1, 2].map(j => {
              const isActive = bits[i * 3 + j] === '1';
              return `
                <div class="flex justify-center items-center">
                  <div class="w-8 h-8 rounded border ${isActive ? 'bg-accent-green/20 border-accent-green text-accent-green' : 'bg-white/5 border-white/10 text-text-muted'} flex items-center justify-center font-mono text-xs transition-all">
                    ${isActive ? values[j] : '0'}
                  </div>
                </div>
              `;
            }).join('')}
          `).join('')}
        </div>
        <div class="mt-4 pt-4 border-t border-white/5 text-[10px] text-text-muted italic">
          Inode Mode: ${mode} (decimal) | Type: ${mode & 0o170000 === 0o040000 ? 'Directory' : 'Regular File'}
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  static renderProcessTree(container, processes) {
    const buildTree = (nodes, parentId = 0) => {
        return nodes
            .filter(n => n.ppid === parentId)
            .map(n => ({
                ...n,
                children: buildTree(nodes, n.pid)
            }));
    };

    const tree = buildTree(processes);

    const renderNode = (node, depth = 0) => `
      <div class="proc-node flex items-start gap-2 mb-1" style="padding-left: ${depth * 16}px">
        <div class="w-1 h-4 border-l border-b border-white/20 -mt-2"></div>
        <div class="flex items-center gap-2 p-1 px-2 rounded bg-white/5 border border-white/5 hover:border-accent-purple transition-all group">
          <span class="text-[10px] font-mono text-accent-purple">PID ${node.pid}</span>
          <span class="text-[11px] font-bold text-text-primary">${node.name}</span>
          <span class="text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">State: ${node.state}</span>
        </div>
      </div>
      ${node.children.map(c => renderNode(c, depth + 1)).join('')}
    `;

    container.innerHTML = `
      <div class="process-tree-viz p-4 glass border border-border-strong rounded-xl bg-black/40 overflow-auto max-h-[300px] custom-scrollbar">
        <div class="text-xs font-mono text-accent-purple uppercase tracking-widest mb-4">Live Process Tree (init)</div>
        ${tree.map(n => renderNode(n)).join('')}
      </div>
    `;
  }
}
