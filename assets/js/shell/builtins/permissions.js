/**
 * Permissions Builtins
 */

export const chmod = {
    execute: async (args, context) => {
        if (args.length < 2) return { stdout: '', stderr: 'chmod: missing operand', exitCode: 1 };
        const modeStr = args[0];
        const target = args[1];
        
        const absPath = context.runtime.resolveAbsolutePath(target);
        const node = context.vfs.resolvePath(absPath);
        
        if (!node) return { stdout: '', stderr: `chmod: cannot access '${target}': No such file or directory`, exitCode: 1 };
        
        // Basic Octal validation
        if (/^[0-7]{3,4}$/.test(modeStr)) {
            const octal = modeStr.slice(-3);
            node.mode = parseInt(octal, 8);
        } else {
            // Symbolic mode (very basic mock)
            if (modeStr === '+x') node.mode |= 0o111;
            else if (modeStr === '-x') node.mode &= ~0o111;
        }
        
        context.runtime.vfs.save();
        return { stdout: '', stderr: '', exitCode: 0 };
    }
};

export const chown = {
    execute: async (args, context) => {
        if (args.length < 2) return { stdout: '', stderr: 'chown: missing operand', exitCode: 1 };
        const ownerGroup = args[0];
        const target = args[1];
        
        const absPath = context.runtime.resolveAbsolutePath(target);
        const node = context.vfs.resolvePath(absPath);
        
        if (!node) return { stdout: '', stderr: `chown: cannot access '${target}': No such file or directory`, exitCode: 1 };
        
        const [owner, group] = ownerGroup.split(':');
        if (owner) node.uid = 1000; // Mock UID resolution
        if (group) node.gid = 1000;
        
        context.runtime.vfs.save();
        return { stdout: '', stderr: '', exitCode: 0 };
    }
};
