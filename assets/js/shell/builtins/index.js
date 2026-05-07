import { ls } from './ls.js';
import { grep } from './grep.js';
import { ps } from './ps.js';
import { cat } from './cat.js';
import * as system from './system.js';
import * as text from './text.js';
import * as shell from './shell.js';
import * as permissions from './permissions.js';
import * as advancedText from './advanced-text.js';

export const Builtins = {
    ls,
    grep,
    ps,
    cat,
    ...system,
    ...text,
    ...shell,
    ...permissions,
    ...advancedText,
    'export': shell.export_cmd
};
