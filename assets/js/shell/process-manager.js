/**
 * Process Manager
 * 
 * Manages the Virtual Process Table.
 * Handles:
 * - PID allocation
 * - Parent/Child relationships
 * - Process states (Running, Stopped, Zombie, etc.)
 */

export class ProcessManager {
  constructor() {
    this.processes = new Map();
    this.nextPid = 1000;
    
    // Initialize "init" process
    this.createProcess({
        name: 'init',
        uid: 0,
        gid: 0,
        ppid: 0
    });
  }

  createProcess(config) {
    const pid = this.nextPid++;
    const process = {
      pid,
      ppid: config.ppid || 0,
      uid: config.uid || 1000,
      gid: config.gid || 1000,
      name: config.name || 'sh',
      state: 'RUNNING',
      cwd: config.cwd || '/home/user',
      env: config.env || { PATH: '/bin:/usr/bin', HOME: '/home/user', USER: 'user' },
      fds: {
        0: { type: 'pipe', mode: 'r' }, // stdin
        1: { type: 'pipe', mode: 'w' }, // stdout
        2: { type: 'pipe', mode: 'w' }  // stderr
      },
      startTime: Date.now(),
      children: []
    };

    this.processes.set(pid, process);
    
    if (config.ppid && this.processes.has(config.ppid)) {
        this.processes.get(config.ppid).children.push(pid);
    }

    return process;
  }

  terminateProcess(pid, exitCode = 0) {
    const proc = this.processes.get(pid);
    if (!proc) return;

    proc.state = 'EXITED';
    proc.exitCode = exitCode;
    
    // In a real kernel, we'd handle orphan reparenting here
    // For our simulation, we just mark as zombie if parent exists
    if (proc.ppid !== 0) {
        proc.state = 'ZOMBIE';
    } else {
        this.processes.delete(pid);
    }
  }

  getProcess(pid) {
    return this.processes.get(pid);
  }

  listProcesses() {
    return Array.from(this.processes.values());
  }
}
