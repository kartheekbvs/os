/**
 * ps - Report a snapshot of current processes
 */

export const ps = {
  execute: async (args, context) => {
    const { processManager } = context; // We'll need to pass this in or get from runtime
    
    // For now, let's assume we can access it via a global or passed in context
    // Actually, let's just mock the output based on the process table we have in context
    
    const processes = context.runtime ? context.runtime.processManager.listProcesses() : [context.process];
    
    let out = "  PID TTY          TIME CMD\n";
    out += processes.map(p => {
        const time = new Date(Date.now() - p.startTime).toISOString().substr(11, 8);
        return `${String(p.pid).padStart(5)} pts/0    ${time} ${p.name}`;
    }).join('\n');

    return { stdout: out, stderr: '', exitCode: 0 };
  }
};
