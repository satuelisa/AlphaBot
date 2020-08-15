from PIL import Image, ImageDraw, ImageFont
from math import sqrt, sin, cos, atan2, pi
from random import randint, random, sample
from collections import defaultdict
import numpy as np
import sys
import cv2

locations = {
    'outpost_ground': {
        'back flag': ((1500, 300), (1800, 600)),
        'front flag': ((1530, 1000), (1780, 1270)),
        'kill box': ((1550, 700), (1760, 1050)),
        'merchant': ((1220, 280), (1400, 610)),
        'mechant lower stairs': ((1200, 630), (1410, 850)),
        'merchant mid': ((1220, 860), (1400, 980)),
        'merchant upper stairs': ((1230, 1015), (1415, 1225)),
        'postern': ((1890, 280), (2070, 610)),
        'postern lower stairs': ((1875, 630), (2100, 850)),
        'postern mid': ((1880, 860), (2080, 980)),
        'postern upper stairs': ((1875, 1015), (2060, 1225)),
        'inside the door': ((1480, 1290), (1835, 1530)),
        'outside the door': ((1480, 1580), (1840, 1700)),
        'left of the door': ((1370, 1580), (1515, 1680)),
        'right of the door': ((1800, 1580), (1905, 1680)),
        'left porch': ((1160, 1580), (1370, 1680)),
        'right porch': ((1905, 1580), (2140, 1680)),
        'merchant stairs': ((950, 370), (1100, 500)),
        'postern stairs': ((2190, 370), (2340, 500)),
        'front porch': ((1170, 1575), (2140, 1890)),
        'edge of the porch': ((1340, 1890), (1900, 2150))
    }
}

fps = 60
delay = 10
instant = fps // 2
flash = fps // 4
text = round(0.9 * fps)

# diagram dimensions with density 300 in PDF to PNG conversion
width = 3300
height = 2550

# THESE VALUES ARE MERE GUESSES
meter = 5 # how many pixels should a meter be
if len(sys.argv) > 1:
    if 'corner' in sys.argv[1]: # corner tower diagrams
        meter = 10
    elif 'inner' in sys.argv[1]: # inner keep diagrams
        meter = 7
    elif 'outpost' in sys.argv[1]: # outer keep or outpost
        meter = 12
    elif 'door' in sys.argv[1]: # outer keep outer door
        meter = 12
    elif 'resource' in sys.argv[1]:
        meter = 12
    else:
        print('Unknown diagram')
        quit()

margin = round(0.1 * min(width, height))
full = 2 * pi
total = 30 # total duration in seconds
final = total * fps
clock = 0
noise = 3
aim = 5 * meter
print(f'Animating {final} frames')

colors = { 'crown': (218, 204, 31, 255), # yellow
           'healer': (31, 194, 219, 255), # blue
           'support': (5, 117, 18, 255), # green
           'offensive': (52, 235, 232, 255), # cyan  
           'dd': (209, 13, 173, 255), # purple
           'streak': (0, 0, 255, 255), 
           'rapids': (196, 49, 6, 100),
           'purge': (245, 158, 66, 100),
           'rr': (209, 170, 13, 200), # yellow
           'heal': (69, 245, 66, 100), # green
           'label': (255, 255, 255, 255)}

INACTIVE = -1
active = defaultdict(set)
fnt = ImageFont.truetype("/Library/Fonts/Arial Unicode.ttf", 40)

def sprite(x, y, s = 2):
    size = s * meter # 2-meter sprites by default
    return [(x + size, y), (x, y - size // 2), (x + size // 3, y), (x, y + size // 2)]
    
def dist(x1, y1, x2, y2):
    return sqrt((x1 - x2)**2 + (y1 - y2)**2)

def uniform(low, high):
    span = high - low
    return random() * span + low

def rotate(p, c, a):
    (cx, cy) = c
    (x, y) = p
    r = dist(x, y, cx, cy)
    a += atan2(y - cy, x - cx)
    return (round(cx + r * cos(a)), round(cy - r * sin(a)))

def circle(p, r, c, canvas):
    (x, y) = p
    d = r // 2
    bb = [x - r, y - r, x + r, y + r]
    canvas.ellipse(bb, outline = c, width = 3)

def beam(caster, target, color, canvas):
    coords = (caster.x, caster.y, target.x, target.y)
    canvas.line(coords, fill = color, width = 3) 
    
def visualize(specs, canvas):
    if 'circ' in specs:
        caster = specs[1]
        p = (caster.x, caster.y) if len(specs) == 4 else caster.locations[specs[4]]
        circle(p, specs[2], specs[3], canvas)
    elif 'beam' in specs:
        beam(specs[1], specs[2], specs[3], canvas)
    elif 'label' in specs:
        canvas.text((50, 50), specs[1], font = fnt, fill = colors['label'])

# skills
        
def charging(time, caster, party):
    radius = 20 * meter
    for member in party:
        if dist(caster.x, caster.y, member.x, member.y) < radius:
            member.apply('rapids', 8)
    for t in range(time, time + instant):
        active[t].add(('circ', caster, radius, colors['rapids']))
    
def purge(time, caster, raid):
    radius = 18 * meter
    for t in range(time, time + instant):
        active[t].add(('circ', caster, radius, colors['purge']))

def radiant(time, caster, party):
    radius = 28 * meter
    candidates = list()
    for member in party:
        if dist(caster.x, caster.y, member.x, member.y) < radius:
            candidates.append(member)
    for t in range(time, time + instant):
        for members in sample(candidates, min(3, len(candidates))):
            active[t].add(('beam', caster, member, colors['rr']))

def streak(time, caster, target):
    for t in range(time, time + instant):
        active[t].add(('beam', caster, target, colors['streak'])) 
            
def illustrious(time, caster, party):
    for t in range(time, time + (12 * fps)): # a 12-second ground effect
        active[t].add(('circ', caster, 8 * meter, colors['heal'], 'illustrious'))

def proxy(time, caster, party):
    end = time + (8 * fps) # an 8-second timer
    for t in range(time, end):
        if t > end - flash: # detonation
            active[t].add(('circ', caster, 8 * meter, (199, 6, 199, 100))) 
        else: # meantime
            active[t].add(('circ', caster, 2 * meter, (199, 6, 199, 100)))

def shake(x, m, dec = False):
    if dec:
        sign = 1 if random() < 0.5 else -1
        return x + sign * m * random()
    else:
        return x + randint(-m, m)

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
class Player:

    def __init__(self, r, x, y, a, p = INACTIVE, cm = INACTIVE, rr = INACTIVE, bounce = False):
        self.x = x
        self.y = y
        self.dx = 0
        self.dy = 0
        self.a = a
        self.bounce = bounce
        self.speed = 2 # meters per second base speed while running (not sprinting) 
        self.role = r
        self.effects = { 'rapids': 0 }
        self.every = { purge: p,
                       charging: cm,
                       radiant: rr }        
        self.timers = { purge: fps * p + randint(-delay, delay),
                        charging: fps * cm + randint(-delay, delay),
                        radiant: fps * rr + randint(-delay, delay)}
        self.locations = dict()

    def apply(self, effect, duration):
        self.effects[effect] = duration * fps

    def process(self, call, lead):
        if self.role == 'healer' and call == 'heal':
            lx = shake(lead.x, aim)
            ly = shake(lead.y, aim)
            d = dist(self.x, self.y, lx, ly)
            ix = shake(self.x, aim)
            iy = shake(self.y, aim)
            if d < 28 * meter: # can reach the lead
                ix = lx
                iy = ly
            self.locations['illustrious'] = (ix, iy)
            self.timers[illustrious] = randint(delay, 2 * delay)
        elif call == 'proxy':
            if self.role == 'dd':
                self.timers[proxy] = randint(delay, 2 * delay)
            elif self.role == 'crown':
                self.timers[proxy] = randint(0, delay)
            elif self.role == 'offensive':
                self.effects['streak'] = 5 + randint(delay, delay) # 5 seconds after proxies are called
                     
    def move(self, lead):
        if self.role == 'crown':
            v = self.speed if self.effects['rapids'] == 0 else round(1.3 * self.speed)
            self.dx = round(v * cos(self.a))
            self.dy = -round(v * sin(self.a)) # inverted y axis
            self.x += shake(self.dx, noise)
            self.y += shake(self.dy, noise)
            if self.bounce:
                if self.x < margin:
                    self.a = uniform(-pi / 4, pi / 4)
                elif self.x > width - margin:
                    self.a = uniform(3 * pi / 4, 5 * pi / 4)
                if self.y < margin:
                    self.a = uniform(-3 * pi / 4, -pi / 4)
                elif self.y > height - margin:
                    self.a = uniform(pi / 4, 3 * pi / 3)
                if self.a < 0:
                    self.a += full
                elif self.a > full:
                    self.a -= full
        else:
            self.dx = lead.dx
            self.dy = lead.dy
            origin = None
            if self.effects.get('streak', INACTIVE) == 0:
                origin = Point(self.x, self.y)
                l = 15 * meter # streaks are 15 meters
                self.dx += round(l * cos(self.a))
                self.dy -= round(l * sin(self.a))
            self.x += shake(self.dx, noise)
            self.y += shake(self.dy, noise)
            if origin is not None:
                streak(clock, self, origin)
            self.a = lead.a
        for effect in self.effects: # decrease effect durations
            if self.effects[effect] >= 0:        
                self.effects[effect] -= 1 
        return

    def cast(self, time, canvas, raid):
        p = (self.x, self.y)
        for spell in self.timers:
            if self.timers[spell] == -1:
                continue # inactive
            elif self.timers[spell] == 0:
                spell(time, self, raid)
                if spell in self.every: # rotation, not a call
                    self.timers[spell] = self.every[spell] * fps
                else:
                    self.timers[spell] = INACTIVE # only when called
            else:
                self.timers[spell] -= 1 # reduce timer to next cast

    def draw(self, canvas):
        canvas.polygon([rotate(p, (self.x, self.y), self.a) for p in sprite(self.x, self.y)],
                       fill = colors[self.role])

calls = dict()
for (time, call) in [(1, 'heal'), (2, 'proxy'), (4, 'heal'), (12, 'proxy'), (14, 'heal'), (17, 'heal'), (22, 'proxy'), (25, 'heal')]:
    calls[time * fps] = call

class Raid:

    def __init__(self, x, y, a, total = 30):
        self.timer = total * fps
        spread = 6 * meter
        self.lead = Player('crown', x, y, a, bounce = True, rr = 10)
        self.party = [ self.lead,
                       Player('healer', shake(x, spread), shake(y, spread), a, rr = 3),
                       Player('healer', shake(x, spread), shake(y, spread), a, rr = 4),
                       Player('healer', shake(x, spread), shake(y, spread), a, rr = 5),
                       Player('healer', shake(x, spread), shake(y, spread), a, rr = 6),
                       Player('healer', shake(x, spread), shake(y, spread), a, rr = 7),
                       Player('dd', shake(x, spread), shake(y, spread), a, rr = 10),
                       Player('dd', shake(x, spread), shake(y, spread), a, rr = 11),
                       Player('dd', shake(x, spread), shake(y, spread), a, rr = 12),
                       Player('dd', shake(x, spread), shake(y, spread), a, rr = 11),
                       Player('dd', shake(x, spread), shake(y, spread), a, rr = 10),
                       Player('support', shake(x, spread), shake(y, spread), a, p = 4, rr = 8), # purger
                       Player('support', shake(x, spread), shake(y, spread), a, p = 4, rr = 9), # purger
                       Player('offensive', shake(x, spread), shake(y, spread), a, p = 6, rr = 10), # streaker
                       Player('offensive', shake(x, spread), shake(y, spread), a, p = 6, rr = 8), # streaker
                       Player('support', shake(x, spread), shake(y, spread), a, cm = 8) ] # stam support

    def step(self, canvas):
        global clock
        for member in self.party:
            member.move(self.lead)
        if clock in calls:
            call = calls[clock]
            for time in range(clock, clock + text):
                active[time].add(('label', call))
            for member in self.party:
                member.process(call, self.lead)
        for member in self.party:
            member.cast(clock, canvas, self.party)
        for visual in active[clock]:
            visualize(visual, canvas)
        del active[clock]
        for member in self.party:
            member.draw(canvas)
        clock += 1
        if clock % fps == 0:
            sys.stdout.write('.')
            sys.stdout.flush()
        return clock < final

img = None
if len(sys.argv) == 1:
    width = 800
    height = 800
    dim = (width, height)
    img = Image.new('RGBA', dim, color = 'black')
else:
    img = Image.open(sys.argv[1])
    width, height = img.size
    dim = (width, height)

fourcc = cv2.VideoWriter_fourcc(*'avc1')    
video = cv2.VideoWriter('simulation.mp4', fourcc, fps, dim)
raid = Raid(width // 2, height // 2, uniform(0, full))
while True:
    frame = img.copy()
    if raid.step(ImageDraw.Draw(frame)):
        video.write(cv2.cvtColor(np.array(frame), cv2.COLOR_RGBA2BGR))
    else:
        break
print('\nReleasing video')
video.release()
