/**
 * Command Registry with unified {stdout, stderr, exitCode} returns.
 */

const VFSUtils = {
  resolvePath: (cwd, targetPath, env) => {
    if (!targetPath) return cwd;
    let path = targetPath.startsWith('/') ? targetPath : `${cwd}/${targetPath}`;
    if (targetPath.startsWith('~')) path = targetPath.replace('~', env.HOME);
    
    const parts = path.split('/').filter(p => p !== '');
    const stack = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else stack.push(part);
    }
    return '/' + stack.join('/');
  },

  getNode: (vfs, absolutePath) => {
    if (absolutePath === '/') return vfs['/'];
    const parts = absolutePath.split('/').filter(p => p !== '');
    let current = vfs['/'];
    for (const part of parts) {
      if (!current || !current.children || !current.children[part]) return null;
      current = current.children[part];
    }
    return current;
  }
};

export const CommandRegistry = {
  pwd: {
    help: () => "pwd - print name of current/working directory",
    execute: (args, state) => ({ stdout: state.cwd, stderr: '', exitCode: 0 })
  },

  cd: {
    help: () => "cd [dir] - change the shell working directory",
    execute: (args, state, vfs) => {
      const target = VFSUtils.resolvePath(state.cwd, args[0] || '~', state.env);
      const node = VFSUtils.getNode(vfs, target);
      
      if (!node) return { stdout: '', stderr: `bash: cd: ${args[0]}: No such file or directory`, exitCode: 1 };
      if (node.type !== 'dir') return { stdout: '', stderr: `bash: cd: ${args[0]}: Not a directory`, exitCode: 1 };
      
      // Simulate permission check
      if (!node.permissions.includes('x') && state.user !== 'root') {
        return { stdout: '', stderr: `bash: cd: ${args[0]}: Permission denied`, exitCode: 1 };
      }

      state.cwd = target;
      return { stdout: '', stderr: '', exitCode: 0 };
    }
  },

  ls: {
    help: () => "ls [OPTION]... [FILE]... - list directory contents",
    execute: (args, state, vfs) => {
      const targetPathRaw = args.find(a => !a.startsWith('-')) || '.';
      const target = VFSUtils.resolvePath(state.cwd, targetPathRaw, state.env);
      const node = VFSUtils.getNode(vfs, target);

      if (!node) return { stdout: '', stderr: `ls: cannot access '${targetPathRaw}': No such file or directory`, exitCode: 2 };
      
      if (node.type === 'file') return { stdout: targetPathRaw, stderr: '', exitCode: 0 };

      // Simulate permission check
      if (!node.permissions.includes('r') && state.user !== 'root') {
        return { stdout: '', stderr: `ls: cannot open directory '${targetPathRaw}': Permission denied`, exitCode: 2 };
      }

      const isLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const isAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
      
      let entries = Object.entries(node.children || {});
      if (!isAll) entries = entries.filter(([k]) => !k.startsWith('.'));

      if (isLong) {
        const out = entries.map(([k, v]) => {
          const typeChar = v.type === 'dir' ? 'd' : '-';
          const size = v.content ? v.content.length : 4096;
          return `${typeChar}${v.permissions} 1 ${v.owner} ${v.group} ${size} Oct 10 10:00 <span class="${v.type === 'dir' ? 'dir' : ''}">${k}</span>`;
        }).join('\n');
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      const out = entries.map(([k, v]) => `<span class="${v.type === 'dir' ? 'dir' : ''}">${k}</span>`).join('  ');
      return { stdout: out, stderr: '', exitCode: 0 };
    }
  },

  cat: {
    help: () => "cat [FILE]... - concatenate files and print on the standard output",
    execute: (args, state, vfs) => {
      if (args.length === 0) return { stdout: '', stderr: '', exitCode: 0 }; // Hangs usually, we simulate ignore
      
      const target = VFSUtils.resolvePath(state.cwd, args[0], state.env);
      const node = VFSUtils.getNode(vfs, target);
      
      if (!node) return { stdout: '', stderr: `cat: ${args[0]}: No such file or directory`, exitCode: 1 };
      if (node.type === 'dir') return { stdout: '', stderr: `cat: ${args[0]}: Is a directory`, exitCode: 1 };
      
      if (!node.permissions.includes('r') && state.user !== 'root') {
        return { stdout: '', stderr: `cat: ${args[0]}: Permission denied`, exitCode: 1 };
      }

      return { stdout: node.content, stderr: '', exitCode: 0 };
    }
  },

  echo: {
    help: () => "echo [SHORT-OPTION]... [STRING]... - display a line of text",
    execute: (args) => ({ stdout: args.join(' '), stderr: '', exitCode: 0 })
  },

  grep: {
    help: () => "grep [OPTION]... PATTERNS [FILE]...",
    execute: (args, state, vfs, stdin) => {
      const pattern = args[0] || '';
      if (!stdin) return { stdout: '', stderr: 'grep: requires stdin in this simulation', exitCode: 2 };
      
      const out = stdin.split('\n').filter(line => line.includes(pattern)).join('\n');
      return { stdout: out, stderr: '', exitCode: out ? 0 : 1 };
    }
  },

  whoami: {
    help: () => "whoami - print effective userid",
    execute: (args, state) => ({ stdout: state.user, stderr: '', exitCode: 0 })
  },

  ps: {
    help: () => "ps [options] - report a snapshot of the current processes",
    execute: (args, state) => {
      const isAux = args.includes('aux');
      let out = "";
      if (isAux) {
        out = "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n";
        out += state.processes.map(p => `${p.user.padEnd(8)} ${String(p.pid).padStart(5)}  0.0  0.1  14200  4500 pts/0    ${p.state.padEnd(4)} ${p.startTime}   0:00 ${p.cmd}`).join('\n');
      } else {
        out = "  PID TTY          TIME CMD\n";
        out += state.processes.map(p => `${String(p.pid).padStart(5)} pts/0    00:00:00 ${p.cmd}`).join('\n');
      }
      return { stdout: out, stderr: '', exitCode: 0 };
    }
  },

  mkdir: {
    help: () => "mkdir [DIR]... - make directories",
    execute: (args, state, vfs) => {
      if (!args[0]) return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 };
      
      const target = VFSUtils.resolvePath(state.cwd, args[0], state.env);
      const parts = target.split('/').filter(p => p !== '');
      const newDirName = parts.pop();
      const parentPath = '/' + parts.join('/');
      
      const parentNode = VFSUtils.getNode(vfs, parentPath);
      if (!parentNode) return { stdout: '', stderr: `mkdir: cannot create directory '${args[0]}': No such file or directory`, exitCode: 1 };
      if (parentNode.type !== 'dir') return { stdout: '', stderr: `mkdir: cannot create directory '${args[0]}': Not a directory`, exitCode: 1 };
      if (!parentNode.permissions.includes('w') && state.user !== 'root') return { stdout: '', stderr: `mkdir: cannot create directory '${args[0]}': Permission denied`, exitCode: 1 };
      
      if (parentNode.children[newDirName]) return { stdout: '', stderr: `mkdir: cannot create directory '${args[0]}': File exists`, exitCode: 1 };

      parentNode.children[newDirName] = {
        type: 'dir',
        permissions: 'rwxr-xr-x',
        owner: state.user,
        group: state.user,
        children: {}
      };
      return { stdout: '', stderr: '', exitCode: 0 };
    }
  },

  touch: {
    help: () => "touch [FILE]... - change file timestamps (or create file)",
    execute: (args, state, vfs) => {
      if (!args[0]) return { stdout: '', stderr: 'touch: missing file operand', exitCode: 1 };
      
      const target = VFSUtils.resolvePath(state.cwd, args[0], state.env);
      const parts = target.split('/').filter(p => p !== '');
      const newFileName = parts.pop();
      const parentPath = '/' + parts.join('/');
      
      const parentNode = VFSUtils.getNode(vfs, parentPath);
      if (!parentNode || parentNode.type !== 'dir') return { stdout: '', stderr: `touch: cannot touch '${args[0]}': No such file or directory`, exitCode: 1 };
      
      if (parentNode.children[newFileName]) {
        return { stdout: '', stderr: '', exitCode: 0 };
      }
      
      if (!parentNode.permissions.includes('w') && state.user !== 'root') return { stdout: '', stderr: `touch: cannot touch '${args[0]}': Permission denied`, exitCode: 1 };

      parentNode.children[newFileName] = {
        type: 'file',
        permissions: 'rw-r--r--',
        owner: state.user,
        group: state.user,
        content: ""
      };
      return { stdout: '', stderr: '', exitCode: 0 };
    }
  },

  rm: {
    help: () => "rm [OPTION]... [FILE]... - remove files or directories",
    execute: (args, state, vfs) => {
      const isRecursive = args.includes('-r') || args.includes('-rf');
      const targetRaw = args.find(a => !a.startsWith('-'));
      if (!targetRaw) return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 };

      const target = VFSUtils.resolvePath(state.cwd, targetRaw, state.env);
      if (target === '/') return { stdout: '', stderr: 'rm: it is dangerous to operate recursively on /', exitCode: 1 };

      const parts = target.split('/').filter(p => p !== '');
      const targetName = parts.pop();
      const parentPath = '/' + parts.join('/');

      const parentNode = VFSUtils.getNode(vfs, parentPath);
      if (!parentNode || !parentNode.children[targetName]) return { stdout: '', stderr: `rm: cannot remove '${targetRaw}': No such file or directory`, exitCode: 1 };
      
      const targetNode = parentNode.children[targetName];
      if (targetNode.type === 'dir' && !isRecursive) return { stdout: '', stderr: `rm: cannot remove '${targetRaw}': Is a directory`, exitCode: 1 };
      if (!parentNode.permissions.includes('w') && state.user !== 'root') return { stdout: '', stderr: `rm: cannot remove '${targetRaw}': Permission denied`, exitCode: 1 };

      delete parentNode.children[targetName];
      return { stdout: '', stderr: '', exitCode: 0 };
    }
  },

  man: {
    help: () => "man [CMD] - format and display the on-line manual pages",
    execute: (args) => {
      if (!args[0]) return { stdout: 'What manual page do you want?', stderr: '', exitCode: 1 };
      const cmd = args[0];
      const MANS = {
        'grep': `GREP(1)\n\nNAME\n       grep - print lines that match patterns\n\nSYNOPSIS\n       grep [OPTION...] PATTERNS [FILE...]\n\nDESCRIPTION\n       grep searches for PATTERNS in each FILE.\n       A FILE of "-" stands for standard input.`,
        'ls': `LS(1)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [OPTION]... [FILE]...\n\nDESCRIPTION\n       List information about the FILEs (the current directory by default).`,
        'find': `FIND(1)\n\nNAME\n       find - search for files in a directory hierarchy\n\nSYNOPSIS\n       find [-H] [-L] [-P] [-D debugopts] [-Olevel] [starting-point...] [expression]`
      };
      if (MANS[cmd]) {
         return { stdout: `<div class="text-accent-cyan font-mono whitespace-pre">${MANS[cmd]}</div>`, stderr: '', exitCode: 0 };
      }
      return { stdout: '', stderr: `No manual entry for ${cmd}`, exitCode: 1 };
    }
  },

  chmod: {
    help: () => "chmod OCTAL-MODE FILE - change file mode bits",
    execute: (args, state, vfs) => {
      if (args.length < 2) return { stdout: '', stderr: 'chmod: missing operand', exitCode: 1 };
      const mode = args[0];
      const targetRaw = args[1];
      
      // Basic 3-digit octal validation
      if (!/^[0-7]{3}$/.test(mode)) return { stdout: '', stderr: `chmod: invalid mode: '${mode}'`, exitCode: 1 };
      
      const target = VFSUtils.resolvePath(state.cwd, targetRaw, state.env);
      const node = VFSUtils.getNode(vfs, target);
      if (!node) return { stdout: '', stderr: `chmod: cannot access '${targetRaw}': No such file or directory`, exitCode: 1 };
      if (node.owner !== state.user && state.user !== 'root') return { stdout: '', stderr: `chmod: changing permissions of '${targetRaw}': Operation not permitted`, exitCode: 1 };
      
      // Convert octal to rwx string
      const map = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
      node.permissions = map[mode[0]] + map[mode[1]] + map[mode[2]];
      
      return { stdout: '', stderr: '', exitCode: 0 };
    }
  }
};
