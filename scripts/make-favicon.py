from PIL import Image
from pathlib import Path

source = Path('/home/ubuntu/webdev-static-assets/okutijobs-new.png')
target = Path('/home/ubuntu/okutijobs-next/app/icon.png')
image = Image.open(source).convert('RGBA')
# Crop the official circular OkutiJobs mark, excluding the wordmark and tagline.
mark = image.crop((300, 170, 730, 610))
mark.thumbnail((192, 192), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (192, 192), (255, 255, 255, 255))
canvas.alpha_composite(mark, ((192 - mark.width) // 2, (192 - mark.height) // 2))
canvas.save(target, format='PNG', optimize=True)
