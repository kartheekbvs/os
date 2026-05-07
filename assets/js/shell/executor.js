/**
 * Shell Executor
 * 
 * AST Traversal Engine.
 * Orchestrates:
 * - Process spawning
 * - Stream plumbing (Pipes)
 * - Redirection setup
 * - Logic chaining (&&, ||)
 */

import { Bus } from '../event-bus.js';

export class Executor {
  constructor(runtime) {
    this.runtime = runtime;
  }

  async execute(astNode, stdinStream = null) {
    if (!astNode) return { exitCode: 0, stdout: '', stderr: '' };

    switch (astNode.type) {
      case 'ChainNode':
        return this.executeChain(astNode);
      case 'PipelineNode':
        return this.executePipeline(astNode, stdinStream);
      case 'SubshellNode':
        return this.executeSubshell(astNode);
      case 'CommandNode':
        return this.executeCommand(astNode, stdinStream);
      default:
        throw new Error(`Unknown AST Node Type: ${astNode.type}`);
    }
  }

  async executeChain(node) {
    const left = await this.execute(node.left);
    
    if (node.operator === '&&') {
      if (left.exitCode === 0) return this.execute(node.right);
      return left;
    }

    if (node.operator === '||') {
      if (left.exitCode !== 0) return this.execute(node.right);
      return left;
    }

    if (node.operator === ';') {
      return this.execute(node.right);
    }

    return left;
  }

  async executePipeline(node, stdinStream) {
    // Pipeline is left-to-right
    // stdout of left becomes stdin of right
    
    // Create an intermediate buffer/stream
    let intermediateOutput = '';
    
    const leftResult = await this.execute(node.left, stdinStream);
    intermediateOutput = leftResult.stdout;

    // Connect to right side
    return this.execute(node.right, intermediateOutput);
  }

  async executeSubshell(node) {
    // Subshells run in an isolated runtime context
    const subRuntime = this.runtime.fork();
    const result = await subRuntime.execute(node.body);
    
    // Handle subshell redirections
    if (node.redirects && node.redirects.length > 0) {
        for (const red of node.redirects) {
            this.handleRedirection(red, result.stdout, result.stderr);
        }
    }

    return result;
  }

  async executeCommand(node, stdin) {
    const process = this.runtime.processManager.createProcess({
        name: node.name,
        cwd: this.runtime.cwd,
        env: { ...this.runtime.env },
        ppid: this.runtime.shellPid
    });

    // Syscall Visualization Hook
    Bus.emit('syscall_trace', { 
        call: 'fork()', 
        pid: process.pid, 
        ppid: process.ppid,
        desc: 'Spawning child process'
    });

    try {
        const builtin = this.runtime.getBuiltin(node.name);
        let result;

        if (builtin) {
            Bus.emit('syscall_trace', { call: 'exec()', name: node.name, args: node.args });
            result = await builtin.execute(node.args, {
                stdin,
                cwd: this.runtime.cwd,
                env: this.runtime.env,
                vfs: this.runtime.vfs,
                process,
                runtime: this.runtime,
                processManager: this.runtime.processManager
            });
        } else {
            result = { stdout: '', stderr: `bash: ${node.name}: command not found`, exitCode: 127 };
        }

        // Handle redirections after command execution
        if (node.redirects) {
            for (const red of node.redirects) {
                this.handleRedirection(red, result.stdout, result.stderr);
                if (red.operator.includes('>')) result.stdout = ''; // Content redirected
            }
        }

        Bus.emit('syscall_trace', { call: 'waitpid()', pid: process.pid, status: result.exitCode });
        this.runtime.processManager.terminateProcess(process.pid, result.exitCode);
        return result;


    } catch (e) {
        this.runtime.processManager.terminateProcess(process.pid, 1);
        return { stdout: '', stderr: `bash: internal error: ${e.message}`, exitCode: 1 };
    }
  }

  handleRedirection(red, stdout, stderr) {
    const path = this.runtime.resolveAbsolutePath(red.file);
    Bus.emit('syscall_trace', { call: 'open()', path, mode: red.operator });

    if (red.operator === '>' || red.operator === '>>') {
        const isAppend = red.operator === '>>';
        const existing = isAppend ? (this.runtime.vfs.readFile(path) || '') : '';
        this.runtime.vfs.writeFile(path, existing + stdout);
    } else if (red.operator === '2>' || red.operator === '2>>') {
        const isAppend = red.operator === '2>>';
        const existing = isAppend ? (this.runtime.vfs.readFile(path) || '') : '';
        this.runtime.vfs.writeFile(path, existing + stderr);
    } else if (red.operator === '&>') {
        this.runtime.vfs.writeFile(path, stdout + stderr);
    }
  }
}
