/**
 * cat - Concatenate files and print on the standard output
 */

export const cat = {
  execute: async (args, context) => {
    const { vfs, stdin } = context;

    if (args.length === 0) {
        return { stdout: stdin || '', stderr: '', exitCode: 0 };
    }

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    for (const file of args) {
        const absPath = context.process.cwd + '/' + file;
        const content = vfs.readFile(absPath);
        if (content !== null) {
            stdout += content;
        } else {
            stderr += `cat: ${file}: No such file or directory\n`;
            exitCode = 1;
        }
    }

    return { stdout, stderr, exitCode };
  }
};
