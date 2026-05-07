/**
 * Virtual Filesystem (VFS)
 * 
 * Inode-based structure with:
 * - Permissions (rwx)
 * - Timestamps (ctime, mtime)
 * - Ownership (uid, gid)
 * - Persistence (localStorage)
 */

export class VirtualFileSystem {
  constructor() {
    this.storageKey = 'os_academy_vfs';
    this.root = this.load() || this.createDefaultFS();
  }

  createDefaultFS() {
    const now = Date.now();
    return {
      '/': {
        type: 'dir',
        mode: 0o755,
        uid: 0,
        gid: 0,
        ctime: now,
        mtime: now,
        children: {
          'bin': { type: 'dir', mode: 0o755, uid: 0, gid: 0, ctime: now, mtime: now, children: {} },
          'etc': { 
            type: 'dir', mode: 0o755, uid: 0, gid: 0, ctime: now, mtime: now, 
            children: {
              'passwd': { type: 'file', mode: 0o644, uid: 0, gid: 0, ctime: now, mtime: now, content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash' },
              'hosts': { type: 'file', mode: 0o644, uid: 0, gid: 0, ctime: now, mtime: now, content: '127.0.0.1 localhost\n::1 localhost' }
            }
          },
          'home': {
            type: 'dir', mode: 0o755, uid: 0, gid: 0, ctime: now, mtime: now,
            children: {
              'user': {
                type: 'dir', mode: 0o755, uid: 1000, gid: 1000, ctime: now, mtime: now,
                children: {
                  '.bashrc': { type: 'file', mode: 0o644, uid: 1000, gid: 1000, ctime: now, mtime: now, content: 'alias ll="ls -la"\nalias l="ls -CF"\n' },
                  'notes.txt': { type: 'file', mode: 0o644, uid: 1000, gid: 1000, ctime: now, mtime: now, content: 'Welcome to OS Academy. Practice your commands here.' }
                }
              }
            }
          },
          'tmp': { type: 'dir', mode: 0o1777, uid: 0, gid: 0, ctime: now, mtime: now, children: {} },
          'proc': { type: 'dir', mode: 0o555, uid: 0, gid: 0, ctime: now, mtime: now, children: {} },
          'dev': { 
            type: 'dir', mode: 0o755, uid: 0, gid: 0, ctime: now, mtime: now, 
            children: {
              'null': { type: 'device', mode: 0o666, uid: 0, gid: 0, ctime: now, mtime: now },
              'zero': { type: 'device', mode: 0o666, uid: 0, gid: 0, ctime: now, mtime: now }
            }
          }
        }
      }
    };
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load VFS:', e);
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.root));
    } catch (e) {
      console.warn('Failed to save VFS to localStorage (quota exceeded?)');
    }
  }

  resolvePath(absPath) {
    if (absPath === '/') return this.root['/'];
    const parts = absPath.split('/').filter(p => p !== '');
    let current = this.root['/'];
    for (const part of parts) {
      if (!current || !current.children || !current.children[part]) return null;
      current = current.children[part];
    }
    return current;
  }

  mkdir(absPath, uid = 0, gid = 0) {
    const parts = absPath.split('/').filter(p => p !== '');
    const dirName = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parentNode = this.resolvePath(parentPath);

    if (!parentNode || parentNode.type !== 'dir') return false;
    if (parentNode.children[dirName]) return false;

    const now = Date.now();
    parentNode.children[dirName] = {
      type: 'dir',
      mode: 0o755,
      uid,
      gid,
      ctime: now,
      mtime: now,
      children: {}
    };
    this.save();
    return true;
  }

  writeFile(absPath, content, uid = 1000, gid = 1000, mode = 0o644) {
    const parts = absPath.split('/').filter(p => p !== '');
    const fileName = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parentNode = this.resolvePath(parentPath);

    if (!parentNode || parentNode.type !== 'dir') return false;

    const now = Date.now();
    if (parentNode.children[fileName]) {
      const file = parentNode.children[fileName];
      if (file.type !== 'file') return false;
      file.content = content;
      file.mtime = now;
    } else {
      parentNode.children[fileName] = {
        type: 'file',
        mode,
        uid,
        gid,
        ctime: now,
        mtime: now,
        content
      };
    }
    this.save();
    return true;
  }

  readFile(absPath) {
    const node = this.resolvePath(absPath);
    if (!node || node.type !== 'file') return null;
    return node.content;
  }

  remove(absPath) {
    const parts = absPath.split('/').filter(p => p !== '');
    const name = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parentNode = this.resolvePath(parentPath);

    if (!parentNode || !parentNode.children[name]) return false;
    delete parentNode.children[name];
    this.save();
    return true;
  }
}
