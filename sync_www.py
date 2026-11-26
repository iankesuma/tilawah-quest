import shutil
from pathlib import Path

root = Path(__file__).resolve().parent
www = root / "www"
if www.exists():
    shutil.rmtree(www)
www.mkdir(parents=True, exist_ok=True)

ALLOWED_DIRS = {'css', 'data', 'js', 'audio', 'images'}
ALLOWED_EXTS = {'.html', '.json', '.svg', '.png', '.jpg', '.jpeg', '.mp3', '.ico', '.webmanifest'}

copied = 0
for item in root.glob('*'):
    if item.name in {'www', 'node_modules', '.git', 'android', 'package.json', 'package-lock.json', 'sync_www.py'}:
        continue
    if item.is_dir() and item.name in ALLOWED_DIRS:
        shutil.copytree(item, www / item.name)
        copied += 1
    elif item.is_file() and item.suffix.lower() in ALLOWED_EXTS:
        shutil.copy2(item, www / item.name)
        copied += 1

print(f"Berhasil menyinkronkan {copied} folder/file ke www/ untuk build APK.")
