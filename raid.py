import requests
from io import BytesIO
from math import ceil, sqrt
from PIL import Image, ImageDraw

separator = ' # '
default = 'https://support.discordapp.com/hc/user_images/l12c7vKVRCd-XLIdDkLUDg.png'
defAvatar = None
color = {0: '#999999', 1: '#00ee00', 2: '#0000cc', 3: '#dd0000'}
cross = [color[3]]
target = Image.open('scroll.png')
w, h = target.size
data = []
from sys import argv
date = argv[1]
filename = f'alphabot_{date}.log'

with open(filename) as responses:
    for line in responses:
        fields = line.split(separator)
        if len(fields) > 2: 
            status = color[int(fields[0])]
            role = int(fields[1])
            onTime = int(fields[2]) == 0
            avatar = fields[-1].split('?')[0] # URL is the last field
            data.append({'status': status, 'role': role, 'onTime': onTime, 'avatar': avatar})
n = len(data)
if n == 0:
    quit()
dim = int(ceil(sqrt(n)))
center = w // 2
top = 220
rw = None
size = (w - 150) // dim
m = size // 10 # margin
i = 2 * m + 10
iconSize = (i, i)
damage = Image.open('damage.png').resize(iconSize)
support = Image.open('support.png').resize(iconSize)
healer = Image.open('healer.png').resize(iconSize)
flexible = Image.open('flexible.png').resize(iconSize)
time = Image.open('time.png').resize(iconSize)
icons = {1: damage, 2: support, 3: healer, 4: flexible}

rw = dim * size + (dim + 1) * m
lw = m // 2
offset = size - i - 2 * lw
start = center - rw // 2 + m
x = start
y = top
col = 0
for response in data:
    source = response['avatar']
    if 'http' in source:
        resp = requests.get(source)
        img = Image.open(BytesIO(resp.content)).resize((size, size))
        target.paste(img, (x, y))
    else:
        if defAvatar is None:
            resp = requests.get(default)
            defAvatar = Image.open(BytesIO(resp.content)).resize((size, size))
        target.paste(defAvatar, (x, y))
    r = response['role']
    if r is not None: # icon to overlay
        if r in icons:
            target.paste(icons[r], (x + offset, y + offset), icons[r])
    if not response['onTime']:
        target.paste(time, (x + 2 * lw, y + offset), time)        
    x += size + m
    col += 1
    if col == dim:
        y += size + m
        x = start
        col = 0
canvas = ImageDraw.Draw(target)
d = size + m
x = start
y = top 
col = 0
for response in data:
    s = response['status']
    canvas.rectangle((x, y, x + size, y + size), outline = s, width = lw)
    if s in cross:
        canvas.line((x, y, x + size, y + size), fill = s, width = lw)
        canvas.line((x + size, y, x, y + size), fill = s, width = lw)
    x += size + m
    col += 1
    if col == dim:
        y += size + m
        x = start
        col = 0
target.save(f'/home/elisa/html/eso/raid_{date}.png')
