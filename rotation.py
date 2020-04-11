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
icons = { 'potion': Image.open('potion.png') }
weapon = dict()
plt.rcParams.update({ 'font.size': 15 })
fig, viz = plt.subplots(figsize = (24, 10))
colors = { 'health': 'r',
           'magicka': 'b',
           'stamina': 'g',
           'healing': 'g',
           'damage': 'r' }
positions = dict()
maxlevels = { 'ultimate': 500 }
recovery = dict()
rotation = []
bars = { 'front': set(),
         'back': set() }
slotted = dict()
lines = { 'front': defaultdict(set),
          'back': defaultdict(set) }
passive = { 'front': [],
            'back': [] }
active = dict()
pending = defaultdict(list)
effects = defaultdict(list)
cooldown = defaultdict(int)
n = 60 # one minute
x = [i for i in range(n + 1)]
data = None
with open('magden.json') as entry:
    data = json.load(entry)
for resource in data['pool']:
    maxvalue = data['pool'][resource]
    levels[resource] = [ maxvalue ]
    maxlevels[resource] = maxvalue
levels['ultimate'] = [ maxlevels['ultimate'] ]
i = 0
for element in data['equipped']:
    if element in ['front', 'back']: # bars
        weapon[element] = data['equipped'][element]['weapon']
        for (slot, skill) in data['equipped'][element]['skills'].items():
            bars[element].add(skill)
            slotted[skill] = element
            icons[skill] = Image.open(skill.replace(' ', '_') + '.png')
            positions[skill] = i
            i += 1
    else: 
        skills['potion'] = data['potions'][data['equipped'][element]]
positions['potion'] = i - 1
for element in icons:
    (r, g, b) = ColorThief(element.replace(' ', '_') + '.png').get_color(quality = 1) 
    colors[element] = (r / 255, g / 255, b / 255)
for line in data['skills']:
    available = data['skills'][line]
    for bar in bars:
        for skill in bars[bar]:
            if skill in available.keys():
                skills[skill] = available[skill]
                lines[bar][line].add(skill)
for line in data['passives']:
    for bar in passive:
        count = len(lines[bar][line])
        if count > 0:
            for p in data['passives'][line]:
                for buff in data['passives'][line][p]['buffs']:
                    passive[bar].append((line, buff, count))
for skill in data['rotation']:
    activation = data['rotation'][skill]
    if type(activation) == list:
        for a in activation:
            rotation.append((skill, a))
    else:
        rotation.append((skill, activation))
rotation.sort(key = lambda pair: pair[1])
labels = []
for bar in 'FB':
    labels += [f'{bar}{d}' for d in range(1, 6)]
    labels.append(f'{bar}U')
labels.append('P')
viz.set_ylabel('Skill and potion activations')
viz.set_ylim(-1, max(positions.values()) + 1)
viz.set_yticks([p for p in range(len(labels))])
viz.set_yticklabels(labels)
viz.set_xlim(0, n)
viz.set_xticks(x)
t = viz.transData
stats = { 'healing': [],
          'damage': [] }
source, target = None, None
first = None
barswap = []
for (action, instant) in rotation:
    if action != 'potion':
        current = slotted[action]
        if source is None:
            first = current
            source = current
            target = 'front' if current == 'back' else 'back'
        elif action not in bars[source]: # bar swap
            viz.axvline(instant, color = 'k', linewidth = 4)
            barswap.append(instant)
            target, source = source, target
    color = colors[action]
    dy = 1 / (len(skills[action].get('buffs', [])) + 1 * ('duration' in skills[action]) + 1)
    y = positions[action] + dy
    if 'duration' in skills[action]:
        duration = skills[action]['duration']
        start = instant / n
        end = (instant + duration) / n
        viz.axhline(y, color = color, linewidth = 4, xmin = start, xmax = end)
        y += dy
    for buff in skills[action].get('buffs', []):
        duration = buff.get('duration', None)
        if duration is None:
            duration = skills[action]['duration']
        start = instant / n
        end = (instant + duration) / n
        viz.axhline(y, color = color, linewidth = 3, xmin = start, xmax = end)
        y += dy
    (px, py) = t.transform((instant, positions[action]))
    xoffset = 4
    yoffset = -2
    if action == 'potion':
        xoffset += 50
    fig.figimage(icons[action], px - xoffset, py - yoffset)
plt.savefig('rotation.png')
plt.close()
source, target = first, 'front' if first == 'back' else 'back'
for instant in range(n):
    if instant in barswap:
        target, source = source, target
    for c in cooldown:
        if cooldown[c] > 0:
            cooldown[c] -= 1  
    for rss in levels:
        recovery[rss] = data['recovery'].get(rss, 0)
    for (line, buff, count) in passive[source]: # apply passive buffs of the active bar
        if buff['proc'] in ['slot', 'near keep']: # assuming that the continuous buff applies always
            if buff['kind'] == 'increase':
                if 'recovery' in buff:
                    recovery[buff['recovery']] += (1 + buff['amount'])
                elif 'resistance' in buff:
                    continue # TO BE DONE: resistance buffs are not analyzed
                elif 'damage' in buff:
                    continue # TO BE DONE: damage increase buffs are not yet computed
                else:
                    print('CODE PENDING FOR PASSIVE', buff)
            else:
                print('CODE PENDING FOR PASSIVE', buff)
    for buff in active: # apply active buffs
        if active[buff] >= 1: # still going
            active[buff] -= 1 # reduce the remaining duration
            (name, mm) = buff
            if mm in ['major', 'minor']:
                value = data['buffs'][name][mm]
                for (t, r) in data['buffs'][name]['target'].items():
                    if t == 'recovery':
                        assert value > 0 and value < 1 # a percentage
                        recovery[rss] *= (1 + value)
                    elif t == 'speed': # TO BE DONE: speed bonuses are not analyzed
                        continue
                    elif t == 'damage': # TO BE DONE: damage buffs are not yet computed
                        continue
                    elif t == 'resistance': # TO BE DONE: resistance buffs are not analyzed
                        continue
                    else:
                        print('LACKING CODE FOR', t, r)
            else:
                if name == 'immune': # TO BE DONE: immunities are not yet analyzed
                    continue
                else:
                    print('LACKING CODE FOR', name, mm)
    for rss in levels: # extend the levels to the new time step
        levels[rss].append(min(levels[rss][-1] + recovery[rss], levels[rss][0]))
    while len(rotation) > 0 and rotation[0][1] == instant: # process anything cast right now
        (action, instant) = rotation.pop(0)
        if action == 'potion':
            for rss in skills['potion']['restore']: # apply instant effects
                levels[rss][instant] = min(levels[rss][instant] + skills['potion']['restore'][rss], maxlevels[rss])
            for buff in skills['potion']['buffs']: # activate buffs
                active[(buff['kind'], buff['type'])] = buff["duration"]
        else: # skill
            found = False
            assert source == slotted[action] 
            for bar in ['front', 'back']:
                if action in bars[bar]: # skill
                    found = True
                    cost = skills[action]['cost']
                    rss = skills[action]['resource']
                    levels[rss][instant] -= cost # pay the cost 
                    duration = skills[action].get('duration', None)
                    if 'effect' in skills[action]:
                        delay = skills[action].get('cast', 0) # in case there is a cast time
                        e = skills[action]['effect']
                        if e['when'] == 'start': # now
                            effects[instant + delay].append((e, duration))
                        else:
                            assert e['when'] == 'end' # later
                            effects[instant + delay + duration].append((e, duration))
                    for buff in skills[action].get('buffs', []):
                        if buff['kind'] == 'restore':
                            rss = buff['resource']
                            levels[rss][instant] = min(levels[rss][instant] + buff['amount'], maxlevels[rss])
                        elif buff['type'] in ['major', 'minor']:
                            if duration is None:
                                duration = buff['duration']
                            active[(buff['kind'], buff['type'])] = duration
                        else:
                            print('MISSING', buff)
                    for (line, buff, count) in passive[source]: # apply passive buffs to casts
                        if buff['proc'] == 'start': # now
                            pending[instant].append(buff)
                        elif buff['proc'] == 'end': # later
                            pending[instant + duration].append(buff)
            assert found
            px = instant
            for (e, dur) in effects[instant]:
                heal = 0
                damage = 0
                if 'damage' in e:
                    damage += e['damage']
                if 'heal' in e:
                    heal += e['heal']
                if 'HoT' in e: # schedule healing over time 
                    assert dur is not None
                    hot = e['HoT']
                    unit = hot['amount']
                    if hot['unit'] == 'total':
                        unit /= dur
                    else:
                        assert hot['unit'] == 'tick'
                    every = hot['every']                        
                    for step in range(instant, instant + duration, every):
                        effects[step].append(({'heal': unit}, None))
                if 'DoT' in e: # schedule damage over time
                    dot = e['DoT']
                    unit = dot['amount']
                    if dot['unit'] == 'total':
                        unit /= dur
                    else:
                        assert dot['unit'] == 'tick'
                    every = dot['every']
                    for step in range(instant, instant + duration, every):
                        effects[step].append(({'damage': unit}, None))
                if damage > 0:
                    stats['damage'].append((instant, damage))
                if heal > 0:
                    stats['healing'].append((instant, heal))
            for buff in pending[instant]:
                if buff['kind'] == 'restore':
                    if cooldown.get(line, 0) == 0:
                        cooldown[line] = buff.get('cooldown', 0) # only contemplating one cooldown per skill line for now
                        levels[rss][instant] = min(levels[rss][instant] + buff['amount'], maxlevels[rss])
                else:
                    print('CODE PENDING FOR AFTER EFFECT', buff)
aux = plt.figure(constrained_layout = True, figsize = (24, 16))
grid = aux.add_gridspec(4, 1)
panels = { 'resources': aux.add_subplot(grid[0:2, :]),
           'damage': aux.add_subplot(grid[2, :]),
           'healing': aux.add_subplot(grid[3, :]) }
panels['resources'].set_ylabel('Resource')
panels['healing'].set_ylabel('Healing')
panels['damage'].set_ylabel('Damage')
for p in panels:
    panels[p].set_xlim(0, n)
    panels[p].set_xticks(x)
for rss in levels:
    if rss != 'ultimate': # needs a different scale
        y = levels[rss]
        panels['resources'].plot(x, y, color = colors[rss], linewidth = 4)
w = 0.2
offset = (1 - w) / 2
for s in stats:                                    
    for (x, v) in stats[s]:
        panels[s].bar(x + offset, v, color = colors[s], width = w)
plt.savefig('stats.png')
