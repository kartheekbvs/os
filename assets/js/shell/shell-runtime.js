/**
 * Shell Runtime (The Virtual Kernel)
 * 
 * Orchestrates:
 * - Tokenization & Parsing
 * - Execution
 * - VFS & Process Management
 * - State Persistence
 */

import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';
import { Executor } from './executor.js';
import { VirtualFileSystem } from './virtual-filesystem.js';
import { ProcessManager } from './process-manager.js';
import { CommandRegistry } from '../command-registry.js'; // Fallback for now

export class ShellRuntime {
  constructor(config = {}) {
    this.vfs = config.vfs || new VirtualFileSystem();
    this.processManager = config.processManager || new ProcessManager();
    this.executor = new Executor(this);
    
    this.cwd = config.cwd || '/home/user';
    this.env = config.env || { 
        PATH: '/bin:/usr/bin', 
        HOME: '/home/user', 
        USER: 'user', 
        SHELL: '/bin/bash',
        TERM: 'xterm-256color',
        '?': '0'
    };
    
    this.shellPid = config.shellPid || 1050;
    this.builtins = config.builtins || CommandRegistry;
  }

  async run(input) {
    if (!input || !input.trim()) return { stdout: '', stderr: '', exitCode: 0 };

    try {
        const tokenizer = new Tokenizer(input);
        const tokens = tokenizer.tokenize();
        
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        const result = await this.executor.execute(ast);
        
        // Update exit code variable
        this.env['?'] = result.exitCode.toString();
        
        return result;

    } catch (e) {
        return { 
            stdout: '', 
            stderr: e.message, 
            exitCode: e.message.includes('Syntax Error') ? 2 : 1 
        };
    }
  }

  /**
   * Expands glob patterns (*, ?) in arguments
   */
  expandGlobs(args) {
    let expanded = [];
    for (const arg of args) {
      if (arg.includes('*') || arg.includes('?')) {
        const matches = this.matchGlob(arg);
        if (matches.length > 0) {
          expanded.push(...matches);
        } else {
          expanded.push(arg); // No match, leave literal (bash behavior)
        }
      } else {
        expanded.push(arg);
      }
    }
    return expanded;
  }

  matchGlob(pattern) {
    const parts = pattern.split('/');
    const isAbsolute = pattern.startsWith('/');
    let currentDirs = [isAbsolute ? '/' : this.cwd];
    
    // Simple glob matching for current directory for now
    // A full recursive globber would be more complex
    const targetDir = isAbsolute ? '/' : this.cwd;
    const node = this.vfs.resolvePath(targetDir);
    if (!node || !node.children) return [];

    // Convert glob to regex
    const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
    const regex = new RegExp(regexStr);
    
    return Object.keys(node.children).filter(name => regex.test(name));
  }


  getBuiltin(name) {
    return this.builtins[name];
  }

  resolveAbsolutePath(path) {
    if (path.startsWith('/')) return this.normalizePath(path);
    if (path.startsWith('~')) return this.normalizePath(this.env.HOME + path.slice(1));
    return this.normalizePath(this.cwd + '/' + path);
  }

  normalizePath(path) {
    const parts = path.split('/').filter(p => p !== '' && p !== '.');
    const stack = [];
    for (const part of parts) {
        if (part === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(part);
        }
    }
    return '/' + stack.join('/');
  }

  /**
   * Creates a forked runtime for subshells.
   * Inherits state but isolation ensures mutations don't leak.
   */
  fork() {
    return new ShellRuntime({
        vfs: this.vfs,
        processManager: this.processManager,
        cwd: this.cwd,
        env: { ...this.env },
        builtins: this.builtins,
        shellPid: this.shellPid // Child inherits parent's context concept
    });
  }
}
