/**
 * ls - List directory contents
 */

export const ls = {
  execute: async (args, context) => {
    const { cwd, vfs, process } = context;
    
    const flags = args.filter(a => a.startsWith('-')).join('');
    const targetPathRaw = args.find(a => !a.startsWith('-')) || '.';
    
    // Resolve target path relative to process CWD
    const absPath = context.process.cwd + (targetPathRaw === '.' ? '' : '/' + targetPathRaw);
    const node = vfs.resolvePath(absPath);

    if (!node) {
      return { stdout: '', stderr: `ls: cannot access '${targetPathRaw}': No such file or directory`, exitCode: 2 };
    }

    if (node.type === 'file') {
      return { stdout: targetPathRaw, stderr: '', exitCode: 0 };
    }

    const isLong = flags.includes('l');
    const isAll = flags.includes('a');
    
    let entries = Object.entries(node.children || {});
    if (!isAll) entries = entries.filter(([k]) => !k.startsWith('.'));

    if (isLong) {
      const out = entries.map(([k, v]) => {
        const typeChar = v.type === 'dir' ? 'd' : '-';
        const mode = v.mode.toString(8).padStart(3, '0');
        const size = v.content ? v.content.length : 4096;
        const date = new Date(v.mtime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = new Date(v.mtime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        return `${typeChar}${mode} 1 ${v.uid} ${v.gid} ${String(size).padStart(5)} ${date} ${time} <span class="${v.type === 'dir' ? 'dir' : ''}">${k}</span>`;
      }).join('\n');
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    const out = entries.map(([k, v]) => `<span class="${v.type === 'dir' ? 'dir' : ''}">${k}</span>`).join('  ');
    return { stdout: out, stderr: '', exitCode: 0 };
  }
};
