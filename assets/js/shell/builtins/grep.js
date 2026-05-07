/**
 * grep - Print lines matching a pattern
 */

export const grep = {
  execute: async (args, context) => {
    const { stdin, vfs } = context;
    const pattern = args[0];
    const file = args[1];

    if (!pattern) return { stdout: '', stderr: 'Usage: grep [PATTERN] [FILE]', exitCode: 2 };

    let content = '';
    if (file) {
        content = vfs.readFile(context.process.cwd + '/' + file) || '';
    } else {
        content = stdin || '';
    }

    if (!content && !file) {
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    const regex = new RegExp(pattern, 'g');
    const matches = content.split('\n').filter(line => regex.test(line));

    return {
        stdout: matches.join('\n'),
        stderr: '',
        exitCode: matches.length > 0 ? 0 : 1
    };
  }
};
