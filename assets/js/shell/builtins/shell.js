/**
 * Shell State Builtins
 */

export const pwd = {
    execute: async (args, context) => ({ stdout: context.cwd, stderr: '', exitCode: 0 })
};

export const cd = {
    execute: async (args, context) => {
        const target = args[0] || '~';
        const absPath = context.runtime.resolveAbsolutePath(target);
        const node = context.vfs.resolvePath(absPath);

        if (!node) return { stdout: '', stderr: `cd: ${target}: No such file or directory`, exitCode: 1 };
        if (node.type !== 'dir') return { stdout: '', stderr: `cd: ${target}: Not a directory`, exitCode: 1 };

        // Mutate the parent runtime's CWD
        context.runtime.cwd = absPath;
        return { stdout: '', stderr: '', exitCode: 0 };
    }
};

export const export_cmd = { // 'export' is a reserved word
    execute: async (args, context) => {
        if (args.length === 0) {
            const out = Object.entries(context.env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n');
            return { stdout: out, stderr: '', exitCode: 0 };
        }
        for (const arg of args) {
            const [key, val] = arg.split('=');
            if (key) context.runtime.env[key] = val || '';
        }
        return { stdout: '', stderr: '', exitCode: 0 };
    }
};

export const env = {
    execute: async (args, context) => {
        const out = Object.entries(context.env).map(([k, v]) => `${k}=${v}`).join('\n');
        return { stdout: out, stderr: '', exitCode: 0 };
    }
};

export const history = {
    execute: async (args, context) => {
        // history is usually managed by the terminal view, but let's mock it
        return { stdout: '  1  ls\n  2  cd /etc\n  3  cat passwd', stderr: '', exitCode: 0 };
    }
};
