from PIL import Image
from pathlib import Path

source = Path('/home/ubuntu/upload/Gemini_Generated_Image_59ts3c59ts3c59ts.jfif')
target = Path('/home/ubuntu/webdev-static-assets/okutijobs-new.png')
Image.open(source).convert('RGBA').save(target, format='PNG', optimize=True)
