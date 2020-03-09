from collections import defaultdict
from colorthief import ColorThief
import matplotlib.pyplot as plt
from PIL import Image
import json

def hit(dmg, kind): # expected value
    assert kind in ['spell', 'weapon']
    return (dmg + data['attack'][kind]['critical'] * (1.5 * dmg)) / 2  

levels = defaultdict(list)
skills = dict()
buffs = defaultdict(list)
icons = { 'potion': Image.open('potion.png') }
weapon = dict()

plt.rcParams.update({'font.size': 15})
fig, ax = plt.subplots(nrows = 2, ncols = 1, figsize = (24, 24))
panels = {'buffs': 1, 'resources': 0}
colors = {'health': 'r', 'magicka': 'b', 'stamina': 'g'}
positions = dict()
with open('magden.json') as entry:
    data = json.load(entry)
    for resource in data['pool']:
        maxvalue = data['pool'][resource]
        levels[resource] = [ maxvalue ]
    rotation = []
    bars = {'front': set(), 'back': set()}
    i = 0
    for element in data['equipped']:
        if element in ['front', 'back']: # bars
            weapon[element] = data['equipped'][element]['weapon']
            for (slot, skill) in data['equipped'][element]['skills'].items():
                bars[element].add(skill)
                icons[skill] = Image.open(skill.replace(' ', '_') + '.png')
                positions[skill] = i
                i += 1
        else: 
            skills['potion'] = data['potions'][data['equipped'][element]]
    positions['potion'] = i - 1
    for element in icons:
        (r, g, b) = ColorThief(element.replace(' ', '_') + '.png').get_color(quality = 1) 
        colors[element] = (r / 255, g / 255, b / 255)
    lines = {'front': defaultdict(set), 'back': defaultdict(set)}
    for line in data['skills']:
        available = data['skills'][line]
        for bar in bars:
            for skill in bars[bar]:
                if skill in available.keys():
                    skills[skill] = available[skill]
                    lines[bar][line].add(skill)
    passives = {'front': defaultdict(set), 'back': defaultdict(set)}
    for line in data['passives']:
        for bar in passives:
            count = len(lines[bar][line])
            for passive in data['passives'][line]:
                p = data['passives'][line][passive]
                if count > 0:
                    buffs[bar].append((p, count))
    for skill in data['rotation']:
        activation = data['rotation'][skill]
        if type(activation) == list:
            for a in activation:
                rotation.append((skill, a))
        else:
            rotation.append((skill, activation))
    rotation.sort(key = lambda pair: pair[1])
    for (action, instant) in rotation:
        for rss in levels:
            while len(levels[rss]) < instant + 1:
                levels[rss].append(min(levels[rss][-1] + data['recovery'][rss], levels[rss][0]))
        if action == 'potion':
            for rss in skills['potion']['restore']:
                levels[rss][instant] = min(levels[rss][instant] + skills['potion']['restore'][rss], levels[rss][0])
        else: # skill
            found = False
            for bar in ['front', 'back']:
                if action in bars[bar]: # skill
                    cost = skills[action]['cost']
                    rss = skills[action]['resource']
                    for buff in skills[action].get('buffs', []):
                        if buff['kind'] == 'restore':
                            levels[buff['resource']][instant] += buff['amount']
                    levels[rss][instant] -= cost
                    found = True
                    break # not prepared for double-barred skills as of now
            assert found
n = 60 # one minute
x = [i for i in range(n + 1)]
for rss in levels:
    while len(levels[rss]) < n + 1:
        levels[rss].append(min(levels[rss][-1] + data['recovery'][rss], levels[rss][0]))
for rss in levels:
    y = levels[rss]
    ax[panels['resources']].plot(x, y, color = colors[rss], linewidth = 4)
ax[panels['buffs']].set_xticks(x)
ax[panels['buffs']].set_ylabel('Activations')
ax[panels['resources']].set_ylabel('Resource levels')
labels = []
for bar in 'FB':
    labels += [f'{bar}{d}' for d in range(1, 6)]
    labels.append(f'{bar}U')
labels.append('P')
ax[panels['resources']].set_xlim(0, n)
ax[panels['buffs']].set_xlim(0, n)
ax[panels['buffs']].set_ylim(-1, max(positions.values()) + 2)
ax[panels['buffs']].set_yticks([p for p in range(len(labels))])
ax[panels['buffs']].set_yticklabels(labels)
t = ax[panels['buffs']].transData
source, target = 'front', 'back'
for (action, instant) in rotation:
    if action != 'potion' and action not in bars[source]: # bar swap
        ax[panels['buffs']].axvline(instant - 0.5, color = 'k', linewidth = 1)
        target, source = source, target
    color = colors[action]
    dy = 1 / (len(skills[action].get('buffs', [])) + 1 * ('duration' in skills[action]) + 1)
    y = positions[action] + dy
    if 'duration' in skills[action]:
        duration = skills[action]['duration']
        start = instant / n
        end = (instant + duration) / n
        ax[panels['buffs']].axhline(y, color = color, linewidth = 4, xmin = start, xmax = end)
        y += dy
    for buff in skills[action].get('buffs', []):
        duration = buff.get('duration', None)
        if duration is None:
            duration = skills[action]['duration']
        mm = data['buffs'].get(buff['kind'], None)
        if mm is not None:
            print(mm[buff['type']])
        else:
            print(buff)
        start = instant / n
        end = (instant + duration) / n
        ax[panels['buffs']].axhline(y, color = color, linewidth = 3, xmin = start, xmax = end)
        y += dy
    (x, y) = t.transform((instant, positions[action]))
    offset = 20
    if action == 'potion':
        offset = 60
    fig.figimage(icons[action], x - offset, y - 20)
plt.savefig('rotation.png')
            
        
        
