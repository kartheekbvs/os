/**
 * System Builtins
 */

export const date = {
    execute: async () => ({ stdout: new Date().toString(), stderr: '', exitCode: 0 })
};

export const whoami = {
    execute: async (args, context) => ({ stdout: context.env.USER || 'user', stderr: '', exitCode: 0 })
};

export const clear = {
    execute: async (args, context) => {
        // We'll handle this in the terminal view layer or via a special return
        return { stdout: '\u001b[2J\u001b[H', stderr: '', exitCode: 0, special: 'clear' };
    }
};

export const uname = {
    execute: async (args) => {
        if (args.includes('-a')) return { stdout: 'Linux linux-academy 5.15.0-generic #54-Ubuntu SMP x86_64 x86_64 x86_64 GNU/Linux', stderr: '', exitCode: 0 };
        return { stdout: 'Linux', stderr: '', exitCode: 0 };
    }
};

export const echo = {
    execute: async (args) => ({ stdout: args.join(' '), stderr: '', exitCode: 0 })
};
