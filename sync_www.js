const fs = require('fs');
const path = require('path');

const root = __dirname;
const www = path.join(root, 'www');

if (fs.existsSync(www)) {
  fs.rmSync(www, { recursive: true, force: true });
}
fs.mkdirSync(www, { recursive: true });

const ALLOWED_DIRS = new Set(['css', 'data', 'js', 'audio', 'images']);
const ALLOWED_EXTS = new Set(['.html', '.json', '.svg', '.png', '.jpg', '.jpeg', '.mp3', '.ico', '.webmanifest']);
const IGNORE = new Set(['www', 'node_modules', '.git', 'android', 'package.json', 'package-lock.json', 'sync_www.js', 'sync_www.py']);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

let copied = 0;
for (const item of fs.readdirSync(root)) {
  if (IGNORE.has(item)) continue;
  const fullPath = path.join(root, item);
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory() && ALLOWED_DIRS.has(item)) {
    copyRecursive(fullPath, path.join(www, item));
    copied++;
  } else if (stat.isFile() && ALLOWED_EXTS.has(path.extname(item).toLowerCase())) {
    fs.copyFileSync(fullPath, path.join(www, item));
    copied++;
  }
}

console.log(`Berhasil menyinkronkan ${copied} file/folder ke www/.`);
