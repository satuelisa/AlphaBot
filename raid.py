import requests
from io import BytesIO
from math import ceil, sqrt
from PIL import Image, ImageDraw

separator = ' # '
default = 'https://support.discordapp.com/hc/user_images/l12c7vKVRCd-XLIdDkLUDg.png'
defIcon = None
color = {0: '#999999', 1: '#00ee00', 2: '#0000cc', 3: '#dd0000'}
damage = Image.open('damage.png')
support = Image.open('support.png')
healer = Image.open('healer.png')
icon = {1: damage, 2: support, 3: healer}

urls = []
role = []
status = []
size = 64
m = 8
offset = size - 35

from sys import argv
date = argv[1]
filename = f'alphabot_{date}.log'

with open(filename) as data:
    for line in data:
        fields = line.split(separator)
        if len(fields) > 2: 
            status.append(color[int(fields[0])])
            role.append(icon.get(int(fields[1]), None))
            orig = fields[-1].split('?')[0] # URL is the last field
            if 'null' not in orig and 'http' in orig:
                urls.append(f'{orig}?size={size}')
            else:
                urls.append(None)
n = len(urls)
dim = int(ceil(sqrt(n)))
d = (dim + 1) * m + dim * size
target = Image.new('RGB', (d, d))
x = m
y = m
col = 0
for source in urls:
    if source is None:
        if defIcon is None:
            resp = requests.get(default)
            defIcon = Image.open(BytesIO(resp.content)).resize((size, size))
        target.paste(defIcon, (x, y))
    else:
        resp = requests.get(source)
        img = Image.open(BytesIO(resp.content))
        target.paste(img, (x, y))
    r = role.pop(0)
    if r is not None: # icon to overlay
        target.paste(r, (x + offset, y + offset), r)
    x += size + m
    col += 1
    if col == dim:
        y += size + m
        x = m
        col = 0
canvas = ImageDraw.Draw(target)
d = size + m
w = 3
x = m
y = m
col = 0
for s in status:
    canvas.rectangle((x, y, x + size, y + size), outline = s, width = w)     
    x += size + m
    col += 1
    if col == dim:
        y += size + m
        x = m
        col = 0
target.save(f'/home/elisa/html/eso/raid_{date}.png')
