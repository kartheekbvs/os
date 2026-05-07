import { CommandRegistry } from './command-registry.js';
import { Bus } from './event-bus.js';

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

/**
 * Shell Execution Context
 * Manages variables, scoping, positional parameters, and subshell isolation.
 */
export class ExecutionContext {
  constructor(parent = null, args = [], stateRef = null) {
    this.parent = parent;
    this.localEnv = {};
    // Fallback to parent state if not root
    this.state = stateRef || (parent ? parent.state : null);
    
    // Positional Parameters
    this.args = args;
    this.pid = parent ? parent.pid + 1 : 1050; // Mock PID
    this.setOptions = { e: false, u: false, pipefail: false };
    this.functions = {};
  }

  getEnv(key) {
    if (key === '?') return this.state.env['?'] || '0';
    if (key === '$') return this.pid.toString();
    if (key === '#') return (this.args.length > 0 ? this.args.length - 1 : 0).toString();
    if (key === '@' || key === '*') return this.args.slice(1).join(' ');
    if (key === '0') return this.args[0] || '-bash';
    if (!isNaN(key)) return this.args[parseInt(key)] || '';

    // Check local scope first, then state env (global/exported)
    if (this.localEnv.hasOwnProperty(key)) return this.localEnv[key];
    return this.state.env[key] || '';
  }

  setEnv(key, value, isLocal = false) {
    if (isLocal) {
      this.localEnv[key] = value;
    } else {
      this.state.env[key] = value;
    }
  }

  createSubshell() {
    // Subshells inherit exported environment, but mutations don't leak back up.
    // In our simplified JS model, we deep copy the state for full isolation.
    const isolatedState = JSON.parse(JSON.stringify(this.state));
    return new ExecutionContext(this, this.args, isolatedState);
  }
}

/**
 * Advanced Shell Parsing Pipeline
 * Lexing -> Tokenization -> Variable Expansion -> Globbing -> Redirection -> Execution
 */
class TerminalPipeline {
  constructor(context, vfs, engine) {
    this.context = context;
    this.vfs = vfs;
    this.engine = engine;
  }

  // Phase 1 & 2: Lexing & Tokenization (handles quotes properly)
  tokenize(input) {
    const tokens = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }

      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }

      // If we are outside quotes, space splits tokens
      if (char === ' ' && !inSingle && !inDouble) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.length > 0) tokens.push(current);
    return tokens;
  }

  // Phase 3: Variable Expansion ($VAR)
  expandVariables(tokens) {
    return tokens.map(token => {
      // Subshell / Command Substitution $(cmd)
      if (token.startsWith('$(') && token.endsWith(')')) {
        // In a real parser we'd execute the inner command synchronously here and inject stdout.
        // Since execute is async in JS, we simulate the expansion if it's a known string for simplicity,
        // or we defer. For this lab, we just return a placeholder or handle basic $(whoami).
        const innerCmd = token.slice(2, -1).trim();
        if (innerCmd === 'whoami') return this.context.state.user;
        return `[subshell result of ${innerCmd}]`;
      }

      if (token.startsWith("'")) return token; // Skip if it somehow preserved quotes
      return token.replace(/\$([A-Za-z_?@*#$0-9]+)/g, (match, p1) => {
        return this.context.getEnv(p1);
      });
    });
  }

  // Phase 4: Glob Expansion (*, ?)
  expandGlobs(tokens) {
    const expanded = [];
    const cwdNode = VFSUtils.getNode(this.vfs, this.context.state.cwd);

    for (const token of tokens) {
      if ((token.includes('*') || token.includes('?')) && cwdNode && cwdNode.children) {
        // Convert shell glob to regex
        const regexStr = '^' + token.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
        const regex = new RegExp(regexStr);
        const matches = Object.keys(cwdNode.children).filter(k => regex.test(k) && !k.startsWith('.'));
        
        if (matches.length > 0) {
          expanded.push(...matches);
        } else {
          expanded.push(token); // No match, leave literal
        }
      } else {
        expanded.push(token);
      }
    }
    return expanded;
  }

  // Phase 5: Pipeline & Redirection Parsing
  parse(tokens) {
    const stages = [];
    let currentStage = { args: [], redirects: { out: null, err: null, appendOut: false, appendErr: false } };

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === '|') {
        if (currentStage.args.length > 0) stages.push(currentStage);
        currentStage = { args: [], redirects: { out: null, err: null, appendOut: false, appendErr: false } };
      } else if (t === '>') {
        currentStage.redirects.out = tokens[++i];
      } else if (t === '>>') {
        currentStage.redirects.out = tokens[++i];
        currentStage.redirects.appendOut = true;
      } else if (t === '2>') {
        currentStage.redirects.err = tokens[++i];
      } else if (t === '2>>') {
        currentStage.redirects.err = tokens[++i];
        currentStage.redirects.appendErr = true;
      } else if (t === '&>') {
        currentStage.redirects.out = tokens[++i];
        currentStage.redirects.err = currentStage.redirects.out;
      } else {
        currentStage.args.push(t);
      }
    }
    if (currentStage.args.length > 0) stages.push(currentStage);
    return stages;
  }

  // Phase 6: Execution Planning & VFS Mutation
  async execute(pipelineStages) {
    let previousOutput = null; // simulate stdout piping
    let finalCode = 0;

    for (const stage of pipelineStages) {
      if (stage.args.length === 0) continue;

      let cmd = stage.args[0];

      // Variable Assignment (VAR=value)
      if (cmd.includes('=') && !cmd.startsWith('=')) {
        const parts = cmd.split('=');
        // Very basic mock for environment export handling
        if (stage.args[0] === 'export') {
          const ep = stage.args[1].split('=');
          this.context.setEnv(ep[0], ep[1], false);
        } else {
          this.context.setEnv(parts[0], parts[1], false); // Globally set for now
        }
        continue;
      }
      
      // Built-in Control Flow (Mock for visualization)
      if (['if', 'while', 'for', '[[', '['].includes(cmd)) {
        Bus.emit('terminal_stream_event', { cmd: 'control_flow', args: stage.args });
        continue;
      }

      // Alias resolution
      if (this.context.state.aliases[cmd]) {
        const aliasTokens = this.tokenize(this.context.state.aliases[cmd]);
        cmd = aliasTokens[0];
        stage.args.splice(0, 1, ...aliasTokens);
      }

      const args = stage.args.slice(1);
      let stepResult = { stdout: '', stderr: '', exitCode: 0 };

      // Handle Command Types (Builtin vs External)
      if (args.includes('--help')) {
        const helpText = CommandRegistry[cmd] && CommandRegistry[cmd].help 
          ? CommandRegistry[cmd].help() 
          : `bash: ${cmd}: --help not supported`;
        stepResult = { stdout: helpText, stderr: '', exitCode: 0 };
      } else {
        // Latency
        if (['find', 'grep', 'sleep'].includes(cmd)) await new Promise(r => setTimeout(r, 600)); 
        else if (cmd === 'apt' || cmd === 'ping' || cmd === 'tar') await new Promise(r => setTimeout(r, 1200));
        else await new Promise(r => setTimeout(r, 50)); 

        try {
          if (CommandRegistry[cmd] && CommandRegistry[cmd].execute) {
            stepResult = await CommandRegistry[cmd].execute(args, this.context.state, this.vfs, previousOutput?.stdout, this.engine);
            
            // Educational Visualizer Hook
            Bus.emit('terminal_stream_event', { cmd, args, stdin: !!previousOutput, stdout: !!stepResult.stdout, stderr: !!stepResult.stderr });
          } else {
            // Source script execution fallback
            if (cmd === 'source' || cmd === '.') {
              const target = VFSUtils.resolvePath(this.context.state.cwd, args[0], this.context.state.env);
              const node = VFSUtils.getNode(this.vfs, target);
              if (node && node.type === 'file') {
                 // In source, we execute in CURRENT context
                 // For full script execution, we would recursively call execute() here.
                 stepResult = { stdout: `[Executing ${args[0]} in current scope]`, stderr: '', exitCode: 0 };
              } else {
                 stepResult = { stdout: '', stderr: `bash: ${args[0]}: No such file or directory`, exitCode: 1 };
              }
            } else if (cmd.startsWith('./') || cmd.endsWith('.sh')) {
                 // In script execution, we execute in SUBSHELL context
                 stepResult = { stdout: `[Executing ${cmd} in isolated subshell]`, stderr: '', exitCode: 0 };
            } else {
                 stepResult = { stdout: '', stderr: `bash: ${cmd}: command not found`, exitCode: 127 };
            }
          }
        } catch (err) {
          stepResult = { stdout: '', stderr: `bash: ${err.message}`, exitCode: 1 };
        }
      }

      finalCode = stepResult.exitCode;
      
      // Handle Redirections via VFS
      if (stage.redirects.out) this.writeVFS(stage.redirects.out, stepResult.stdout, stage.redirects.appendOut);
      if (stage.redirects.err) this.writeVFS(stage.redirects.err, stepResult.stderr, stage.redirects.appendErr);

      // Persist mutating VFS commands or redirects
      if (['cd', 'mkdir', 'touch', 'rm', 'mv', 'chmod'].includes(cmd) || stage.redirects.out || stage.redirects.err) {
         this.engine.persistState();
      }

      // If there is another stage in the pipe, pipe stdout to it
      previousOutput = stepResult;

      // If we errored and didn't redirect stderr, stop pipeline (bash normally continues, but for simplicity here we break unless handled)
      // Actually, standard bash continues pipes even if error. Let's just pipe it.
    }

    // Return the final output of the last command in the pipeline
    // Strip stdout/stderr if they were redirected to files
    const lastStage = pipelineStages[pipelineStages.length - 1];
    return {
      stdout: lastStage?.redirects.out ? '' : (previousOutput?.stdout || ''),
      stderr: lastStage?.redirects.err ? '' : (previousOutput?.stderr || ''),
      exitCode: finalCode
    };
  }

  writeVFS(targetRaw, content, isAppend) {
    if (!content) return;
    const target = VFSUtils.resolvePath(this.context.state.cwd, targetRaw, this.context.state.env);
    const parts = target.split('/').filter(p => p !== '');
    const newFileName = parts.pop();
    const parentPath = '/' + parts.join('/');
    
    const parentNode = VFSUtils.getNode(this.vfs, parentPath);
    if (!parentNode || parentNode.type !== 'dir') return; // Silent fail for simplicity in demo
    
    if (parentNode.children[newFileName]) {
      if (isAppend) parentNode.children[newFileName].content += content;
      else parentNode.children[newFileName].content = content;
    } else {
      parentNode.children[newFileName] = {
        type: 'file',
        permissions: 'rw-r--r--',
        owner: this.context.state.user,
        group: this.context.state.user,
        content: content
      };
    }
  }
}

export class TerminalEngine {
  constructor(containerElement, config = {}) {
    this.container = containerElement;
    this.terminalId = config.id || 'default-term';
    
    const storedState = sessionStorage.getItem(`term_state_${this.terminalId}`);
    const storedVFS = sessionStorage.getItem('global_vfs');
    
    this.vfs = storedVFS ? JSON.parse(storedVFS) : (config.vfs || {}); 
    
    const defaultState = {
      cwd: config.cwd || '/home/user',
      user: config.user || 'user',
      host: config.host || 'linux',
      history: [],
      env: { PATH: '/bin:/usr/bin', HOME: '/home/user', USER: config.user || 'user' },
      aliases: { 'll': 'ls -la', 'la': 'ls -A', 'l': 'ls -CF' },
      processes: [
        { pid: 1, ppid: 0, user: 'root', cmd: '/sbin/init', state: 'Ss' },
        { pid: 1050, ppid: 1, user: config.user || 'user', cmd: '-bash', state: 'Ss' }
      ]
    };

    const loadedState = storedState ? JSON.parse(storedState) : defaultState;
    this.rootContext = new ExecutionContext(null, [], loadedState);
    
    this.pipeline = new TerminalPipeline(this.rootContext, this.vfs, this);
    this.historyIndex = -1;
    this.isSearchMode = false;
    this.searchQuery = '';
    
    this.initDOM();
    if (!storedState) this.simulateStartup();
  }

  get state() { return this.rootContext.state; }

  persistState() {
    sessionStorage.setItem(`term_state_${this.terminalId}`, JSON.stringify(this.state));
    sessionStorage.setItem('global_vfs', JSON.stringify(this.vfs));
  }

  simulateStartup() {
    const tokens = this.pipeline.tokenize('cat ~/.bashrc');
    const stages = this.pipeline.parse(this.pipeline.expandGlobs(this.pipeline.expandVariables(tokens)));
    
    this.pipeline.execute(stages).then(bashrc => {
      if (bashrc.exitCode === 0 && bashrc.stdout) {
         const lines = bashrc.stdout.split('\\n');
         lines.forEach(line => {
           if (line.startsWith('alias ')) {
              const parts = line.replace('alias ', '').split('=');
              if (parts.length === 2) this.state.aliases[parts[0].trim()] = parts[1].replace(/['"]/g, '').trim();
           }
         });
         this.persistState();
      }
    });
  }

  get promptString() {
    if (this.isSearchMode) {
      return `<span>(reverse-i-search)\`${this.searchQuery}':</span> `;
    }
    let displayCwd = this.state.cwd;
    if (displayCwd.startsWith(this.state.env.HOME)) displayCwd = displayCwd.replace(this.state.env.HOME, '~');
    const promptChar = this.state.user === 'root' ? '#' : '$';
    const userColor = this.state.user === 'root' ? 'text-accent-red' : 'text-accent-green';
    return `<span class="${userColor}">${this.state.user}@${this.state.host}</span>:<span class="text-accent-purple">${displayCwd}</span>${promptChar} `;
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="terminal-header">
        <div class="terminal-controls">
          <div class="terminal-dot red"></div>
          <div class="terminal-dot yellow"></div>
          <div class="terminal-dot green"></div>
        </div>
        <div class="terminal-title">bash</div>
      </div>
      <div class="terminal-body" role="log" aria-live="polite">
        <div class="output-container"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt">${this.promptString}</span>
          <input type="text" class="terminal-input" autocomplete="off" spellcheck="false" autofocus aria-label="Terminal input">
        </div>
      </div>
    `;

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
        this.searchQuery = '';
        this.renderOutput(`${this.promptString}${this.inputField.value}^C`);
        this.inputField.value = '';
        this.promptElement.innerHTML = this.promptString;
        return;
      }

      // Ctrl+R
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this.isSearchMode = true;
        this.searchQuery = '';
        this.inputField.value = '';
        this.promptElement.innerHTML = this.promptString;
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion();
        return;
      }

      if (e.key === 'Enter') {
        let cmdRaw = this.inputField.value;
        
        if (this.isSearchMode) {
          // Commit search
          this.isSearchMode = false;
          this.searchQuery = '';
          this.promptElement.innerHTML = this.promptString;
        }

        cmdRaw = cmdRaw.trim();
        this.renderOutput(`${this.promptString}${cmdRaw}`);
        this.inputField.value = '';
        
        if (cmdRaw) {
          this.state.history.push(cmdRaw);
          this.historyIndex = this.state.history.length;
          this.persistState();
          
          this.inputField.disabled = true; 
          
          const tokens = this.pipeline.tokenize(cmdRaw);
          const expandedVars = this.pipeline.expandVariables(tokens);
          const expandedGlobs = this.pipeline.expandGlobs(expandedVars);
          const stages = this.pipeline.parse(expandedGlobs);
          
          const result = await this.pipeline.execute(stages);
          
          this.inputField.disabled = false;
          this.inputField.focus();

          this.state.env['?'] = result.exitCode;

          if (result.stdout) this.renderOutput(result.stdout, true, false);
          if (result.stderr) this.renderOutput(result.stderr, false, true);

          this.promptElement.innerHTML = this.promptString;
        }
        
        this.scrollToBottom();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputField.value = this.state.history[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.state.history.length - 1) {
          this.historyIndex++;
          this.inputField.value = this.state.history[this.historyIndex];
        } else {
          this.historyIndex = this.state.history.length;
          this.inputField.value = '';
        }
      } else if (this.isSearchMode && e.key.length === 1) {
        // Handle Ctrl+R typing
        this.searchQuery += e.key;
        this.promptElement.innerHTML = this.promptString;
        
        // Find in history (reverse)
        const match = [...this.state.history].reverse().find(cmd => cmd.includes(this.searchQuery));
        if (match) {
          this.inputField.value = match;
        } else {
          this.inputField.value = '';
        }
      } else if (this.isSearchMode && e.key === 'Backspace') {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.promptElement.innerHTML = this.promptString;
      }
    });

    this.container.addEventListener('click', () => this.inputField.focus());
  }

  handleTabCompletion() {
    const input = this.inputField.value;
    const parts = input.split(' ');
    const lastPart = parts[parts.length - 1];
    
    const cwdNode = VFSUtils.getNode(this.vfs, this.state.cwd);
    if (!cwdNode || !cwdNode.children) return;
    
    // Command completion vs File completion
    if (parts.length === 1) {
      // Very basic command completion stub
      const cmds = Object.keys(CommandRegistry).filter(k => k.startsWith(lastPart));
      if (cmds.length === 1) {
        this.inputField.value = cmds[0] + ' ';
      }
    } else {
      const matches = Object.keys(cwdNode.children).filter(k => k.startsWith(lastPart));
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0] + (cwdNode.children[matches[0]].type === 'dir' ? '/' : ' ');
        this.inputField.value = parts.join(' ');
      } else if (matches.length > 1) {
        this.renderOutput(`${this.promptString}${input}`);
        this.renderOutput(matches.map(m => `<span class="${cwdNode.children[m].type==='dir'?'text-accent-cyan font-bold':''}">${m}</span>`).join('  '), true);
        this.scrollToBottom();
      }
    }
  }

  renderOutput(text, isHtml = true, isError = false) {
    if (text === null || text === undefined || text === '') return;
    const div = document.createElement('div');
    div.className = `terminal-output ${isError ? 'text-accent-red font-bold' : ''} leading-relaxed mb-1`;
    
    // Replace newlines with <br> if not using pre-wrap
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
