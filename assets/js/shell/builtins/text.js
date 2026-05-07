/**
 * Text Processing Builtins
 */

export const wc = {
    execute: async (args, context) => {
        const { stdin } = context;
        const input = stdin || '';
        const lines = input.split('\n').length;
        const words = input.split(/\s+/).filter(w => w).length;
        const chars = input.length;

        if (args.includes('-l')) return { stdout: lines.toString(), stderr: '', exitCode: 0 };
        if (args.includes('-w')) return { stdout: words.toString(), stderr: '', exitCode: 0 };
        if (args.includes('-c')) return { stdout: chars.toString(), stderr: '', exitCode: 0 };

        return { stdout: `${lines} ${words} ${chars}`, stderr: '', exitCode: 0 };
    }
};

export const head = {
    execute: async (args, context) => {
        const { stdin } = context;
        const n = parseInt(args[args.indexOf('-n') + 1]) || 10;
        const input = stdin || '';
        const lines = input.split('\n').slice(0, n).join('\n');
        return { stdout: lines, stderr: '', exitCode: 0 };
    }
};

export const tail = {
    execute: async (args, context) => {
        const { stdin } = context;
        const n = parseInt(args[args.indexOf('-n') + 1]) || 10;
        const input = stdin || '';
        const allLines = input.split('\n');
        const lines = allLines.slice(Math.max(allLines.length - n, 0)).join('\n');
        return { stdout: lines, stderr: '', exitCode: 0 };
    }
};
