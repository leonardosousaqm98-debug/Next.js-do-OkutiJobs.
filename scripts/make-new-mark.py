from PIL import Image
from pathlib import Path

source = Path('/home/ubuntu/webdev-static-assets/okutijobs-new.png')
target = Path('/home/ubuntu/webdev-static-assets/okutijobs-new-mark.png')
image = Image.open(source).convert('RGBA')
# Preserve the official symbol only; the wordmark remains rendered as responsive web text.
mark = image.crop((300, 170, 730, 610))
mark.thumbnail((512, 512), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (512, 512), (255, 255, 255, 0))
canvas.alpha_composite(mark, ((512 - mark.width) // 2, (512 - mark.height) // 2))
canvas.save(target, format='PNG', optimize=True)
