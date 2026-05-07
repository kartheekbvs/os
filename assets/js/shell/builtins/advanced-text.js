/**
 * Advanced Text Processing Builtins
 */

export const sort = {
    execute: async (args, context) => {
        const input = context.stdin || '';
        const lines = input.split('\n').filter(l => l);
        lines.sort();
        if (args.includes('-r')) lines.reverse();
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
    }
};

export const uniq = {
    execute: async (args, context) => {
        const input = context.stdin || '';
        const lines = input.split('\n').filter(l => l);
        const result = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] !== lines[i-1]) result.push(lines[i]);
        }
        return { stdout: result.join('\n'), stderr: '', exitCode: 0 };
    }
};

export const tee = {
    execute: async (args, context) => {
        const input = context.stdin || '';
        if (args[0]) {
            const path = context.runtime.resolveAbsolutePath(args[0]);
            context.vfs.writeFile(path, input);
        }
        return { stdout: input, stderr: '', exitCode: 0 };
    }
};

export const cut = {
    execute: async (args, context) => {
        const input = context.stdin || '';
        const dIdx = args.indexOf('-d');
        const delimiter = dIdx !== -1 ? args[dIdx+1] : '\t';
        const fIdx = args.indexOf('-f');
        const field = fIdx !== -1 ? parseInt(args[fIdx+1]) - 1 : 0;
        
        const lines = input.split('\n').map(line => {
            const parts = line.split(delimiter);
            return parts[field] || '';
        });
        
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
    }
};

export const sed = {
    execute: async (args, context) => {
        const input = context.stdin || '';
        const expr = args[0]; // e.g. 's/foo/bar/g'
        if (!expr || !expr.startsWith('s/')) return { stdout: input, stderr: '', exitCode: 0 };
        
        const parts = expr.split('/');
        const search = parts[1];
        const replace = parts[2];
        const flags = parts[3];
        
        const regex = new RegExp(search, flags);
        const result = input.replace(regex, replace);
        
        return { stdout: result, stderr: '', exitCode: 0 };
    }
};
