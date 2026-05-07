/**
 * Terminal Session Architecture 
 * Represents the state and logic of a single interactive terminal instance.
 */
export class TerminalSession {
  constructor(mountElementId, config = {}) {
    this.mountId = mountElementId;
    this.cwd = config.cwd || '/home/user';
    this.user = config.user || 'user';
    this.host = config.host || 'linux';
    
    this.history = [];
    this.historyIndex = -1;
    this.env = {
      PATH: '/bin:/usr/bin',
      HOME: '/home/user',
      USER: this.user
    };
    
    this.aliases = {};
    
    // Will be populated by the virtual filesystem
    this.vfs = null;
    
    this.isDestroyed = false;
  }

  mount() {
    console.log(`[Terminal] Mounted to ${this.mountId}`);
    // DOM initialization logic here
  }

  execute(commandString) {
    if (this.isDestroyed) return;
    
    this.history.push(commandString);
    this.historyIndex = this.history.length;
    
    // Command parsing logic here (args, flags, pipes)
    return `Executed: ${commandString} at ${this.cwd}`;
  }

  destroy() {
    this.isDestroyed = true;
    // Cleanup event listeners
    console.log(`[Terminal] Destroyed session for ${this.mountId}`);
  }
}
