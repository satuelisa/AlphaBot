import requests
from io import BytesIO
from math import ceil, sqrt
from PIL import Image, ImageDraw

separator = ' # '
default = 'https://support.discordapp.com/hc/user_images/l12c7vKVRCd-XLIdDkLUDg.png'
defIcon = None
color = {0: '#999999', 1: '#00ee00', 2: '#0000cc', 3: '#dd0000'}
cross = [color[3]]
damage = Image.open('damage.png')
support = Image.open('support.png')
healer = Image.open('healer.png')
flexible = Image.open('flexible.png')
time = Image.open('time.png')
icon = {1: damage, 2: support, 3: healer, 4: flexible}

data = []
size = 64
m = 8
offset = size - 27


from sys import argv
date = argv[1]
filename = f'alphabot_{date}.log'

with open(filename) as responses:
    for line in responses:
        fields = line.split(separator)
        if len(fields) > 2: 
            status = color[int(fields[0])]
            role = icon.get(int(fields[1]), None)
            onTime = int(fields[2]) == 0
            avatar = fields[-1].split('?')[0] # URL is the last field
            if 'http' in avatar:
                avatar = f'{avatar}?size={size}'
            else:
                avatar = None
            data.append({'status': status, 'role': role, 'onTime': onTime, 'avatar': avatar})
n = len(data)
dim = int(ceil(sqrt(n)))
d = (dim + 1) * m + dim * size
target = Image.new('RGB', (d, d))
x = m
y = m
col = 0
for response in data:
    source = response['avatar']
    if source is None:
        if defIcon is None:
            resp = requests.get(default)
            defIcon = Image.open(BytesIO(resp.content)).resize((size, size))
        target.paste(defIcon, (x, y))
    else:
        resp = requests.get(source)
        img = Image.open(BytesIO(resp.content))
        target.paste(img, (x, y))
    r = response['role']
    if r is not None: # icon to overlay
        target.paste(r, (x + offset, y + offset), r)
    if not response['onTime']:
        target.paste(time, (x + 4, y + offset - 3), time)        
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
for response in data:
    s = response['status']
    canvas.rectangle((x, y, x + size, y + size), outline = s, width = w)
    if s in cross:
        canvas.line((x, y, x + size, y + size), fill = s, width = w)
        canvas.line((x + size, y, x, y + size), fill = s, width = w)
    x += size + m
    col += 1
    if col == dim:
        y += size + m
        x = m
        col = 0
target.save(f'/home/elisa/html/eso/raid_{date}.png')
