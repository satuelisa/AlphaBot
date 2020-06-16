const Canvas = require('canvas');
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

let raid  = {};
let guild = undefined;

client.on("ready", () => {
    guild = client.guilds.get('191716294943440897');
    console.log(guild.name);
});

'use strict';

const debugMode = true;
const { spawnSync } = require('child_process');
const separator = ' # ';
const roleInfo ='\nThe commands *!signup* and *!maybe* can be accompanied by role info: **d**amage, **s**upport/**u**tility, **h**eals, or **f**lexible (meaning you could take one of 2+ roles if needed). Also class (templar, DK, etc.) and primary resource (magicka or stamina) can be specified.\n\nYou can set a default role with the *!default* command using the same role specifiers; once a default has been set, future sign-ups employ that role unless you specify another one.\n';
const dateInfo = '\nBy default, you will be responding to the next raid; you can use *Mon Fri Sat* to specify a date, whereas using *all* or *week* refers to the next four raids.\n';
const earlyLate = '\nYou can also include the words *late* or *early* to indicate if you will be joining late or leaving early (or even both).\n';
const feedback = '\nIf anything seems broken or unpleasant, just tag *satuelisa* and express your concerns. <:Agswarrior:552592567875928064>'; 
const options = roleInfo + earlyLate + dateInfo + '\nUse __!**h**ustle__ to see this help text and __!**r**aid__ to just view the sign-ups.';
const help = '**Available commands:**\n__!**s**ignup__ if you will attend the next raid\n!__**m**aybe__ if you might be able to attend\n!__**d**ecline__ if you will not make it\n' + options;

const symbols = {0: ':confused:', 1: '<:damage:667107746868625458>',
		 2: '<:support:667107765872754738>',
		 3: '<:healer:667107717567217678>',
		 4: '<:flexible:667163606210707467>',
		 5: '<:noshow:674053654067806208>'}; // unavailable
const roleDescr = {0: 'surprise role', 1: 'damage', 2: 'support', 3: 'healer', 4: 'flexible spot'};
const classDescr = {0: '', 1: 'templar ', 2: 'sorc ', 3: 'DK ', 4: 'NB ', 5: 'necro ', 6: 'warden '};
const rssDescr = {0: '', 1: 'mag ', 2: 'stam '}

// <TOON SPECS>
const toonClass= {' t': 1, // templar
		  ' so': 2, // sorcerer,
		  ' dr': 3, // dragonknight
		  ' dk': 3, // dragonknight
		  ' nb': 4, // nightblade
		  ' ni': 4, // nightblade
		  ' ne': 5, // necromancer
		  ' w': 6} // warden
const classNames = {0: '', 1: 'templar', 2: 'sorcerer', 3: 'dragonknight', 4: 'nightblade', 5: 'necromancer', 6: 'warden'};
const toonRss = {' ma': 1, // magicka
		 ' st': 2, // stamina
		 ' hy': 3}; // hybrid
const rssNames = {0: '', 1: 'magicka', 2: 'stamina', 3: 'hybrid'};
const toonRole = {' da': 1, ' dp': 1, ' dm': 1, // dps
		  ' su': 2, ' u': 2, // support
		  ' he': 3, // heals
		  ' mu': 4} // multiple
const roleNames = {0: '', 1: 'damage dealer', 2: 'support/utility', 3: 'healer', 4: 'multitask'}
// </ TOON SPECS>

const classSymbols = {0: ':question:',
		      1: '<:templar:698500236200509460>',
		      2: '<:sorc:698500294505398283>',
		      3: '<:dk:698500389749784606>',
		      4: '<:nb:698500311849107456>',
		      5: '<:necro:698500303892381784>',
		      6: ' <:warden:698500220102770718>'}
const magSymbols = {0: ':blue_circle:',
		    1: '<:magplar:698500333198114917>',
		    2: '<:magsorc:698500323471523920>',
		    3: '<:magdk:698500344098848809>',
		    4: '<:magblade:698500374021275710>',
		    5: '<:magcro:698500365267763230>',
		    6: '<:magden:698500356350672967>'}
const stamSymbols = {0: 'green_circle:',
		    1: '<:stamplar:698500259256467471>',
		    2: '<:stamsorc:698500249106251806>',
		    3: '<:stamdk:698500268840714271>',
		    4: '<:stamblade:698500285978640456>',
		    5: '<:stamcro:698500494103937094>',
		    6: '<:stamden:698500277073870888>'}

const classIcons = {1: 'templar.png',
		    2: 'sorc.png',
		    3: 'dk.png',
		    4: 'nb.png',
		    5: 'necro.png',
		    6: 'warden.png'}
const magIcons = {1: 'magplar.png',
		    2: 'magsorc.png',
		    3: 'magdk.png',
		    4: 'magblade.png',
		    5: 'magcro.png',
		    6: 'magden.png'}
const stamIcons = {1: 'stamplar.png',
		  2: 'stamsorc.png',
		  3: 'stamdk.png',
		  4: 'stamblade.png',
		  5: 'stamcro.png',
		  6: 'stamden.png'}

const timeDescr = {0: '',
		   1: ' <:time:668502892432457736> *(joining late, leaving early)* ',
		   2: ' <:time:668502892432457736> *(joining late)* ',
		   3: ' <:time:668502892432457736>  *(leaving early)* '};
const confirm = {1: 'confirmed', 2: 'possible', 3: 'unavailable'};
const raidNights = [1, 5, 6]; // Mon Fri Sat 
const nextRaid = {0: 1, 1: 5, 2: 5, 3: 5, 4: 5, 5: 6, 6: 1};
const dayNames = {1: 'Monday', 5: 'Friday', 6: 'Saturday', 8: 'the next three raids'};
const ALL = 8;
const stopWords = ["for", "as", "a", "an", "the", "of", "raid", "up", "tonight", "today", "yo", "me", "sign", "up", "gift", "gods", "to", "please"];
const prefixList = ["mon", "fri", "sat", "all", "week"];
const indices = {'status': 0, 'role': 1,
		 'resource': 2, 'class': 3,
		 'timing': 4, 'name': 5,
		 'nick': 6, 'url': 7, 
		 'defName': 0, 'defRole': 1,
		 'defRss': 2, 'defClass': 3};
const roleIcons = {1: 'dmg.png', 2: 'sup.png', 3: 'heal.png', 4: 'flex.png'};
const style = {0: '#999999', 1: '#00ee00', 2: '#0000cc', 3: '#dd0000'};
const timeIcon = 'hourglass.png';
const avatarSize = 64;
const iconSize = 128;
const defaultAvatar = 'https://support.discordapp.com/hc/user_images/l12c7vKVRCd-XLIdDkLUDg.png';

loadLogs();

function removeDuplicates(array) {
  return array.filter((a, b) => array.indexOf(a) === b)
};

//function collage(day) {
//    const redo = spawnSync('python3', ['raid.py', day]);
//    let embed = new Discord.RichEmbed(); 
//    embed.setTitle("Alpha Squad RSVP for " + dayNames[day])
//    embed.setImage('https://elisa.dyndns-web.com/eso/raid_' + day + '.png?nocache=' + new Date().getTime()); // no cache
//    return embed;
//}

async function collage(channel, resp, day, text) {
    var n = resp.length;
    if (n == 0) {
	return;
    }
    if (debugMode) {
	console.log('preparing collage');
    }
    const w = 402; 
    const h = 434; 
    const canvas = Canvas.createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    try {
	const background = await Canvas.loadImage('./scroll.png');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch (e) {
	console.log('bg', e);
    }
    const dim = Math.ceil(Math.sqrt(n));
    const center = w / 2
    const top = 170;
    const as = Math.round((w - 180) / dim);
    const m = Math.round(as / 10) // margin
    const is = 2 * m + 10;
    const rw = dim * as + (dim + 1) * m;
    const lw = Math.round(m / 2);
    const offset = as - is - 2 * lw;
    const co = is / 5;
    const start = Math.round(center - rw / 2 + m);
    var x = start;
    var y = top;
    var col = 0;
    for (r in resp) {
	var userData = resp[r].split(separator);
	var status = parseInt(userData[indices['status']]);
	var role = parseInt(userData[indices['role']]);
	var rID = parseInt(userData[indices['resource']]);
	var cID = parseInt(userData[indices['class']]);
	var timing = parseInt(userData[indices['timing']]);
	var nickname = userData[indices['nick']];
	var url = userData[indices['url']];
	if (url.includes('undefined')) {
	    url = defaultAvatar;
	} else {
	    url = url.split('?')[0] + '?size=' + avatarSize;
	}
	if (debugMode) {
	    console.log(nickname, 'avatar', url);
	}
	try {
	    const avatar = await Canvas.loadImage(url);
	    ctx.drawImage(avatar, x, y, as, as);
	} catch (e) {
	    console.log('skipping an avatar icon', e);
	}
	ctx.strokeStyle = style[status];
	ctx.lineWidth = lw;
	if (status == 3) { // unavailable
	    ctx.beginPath();
	    ctx.moveTo(x, y);
	    ctx.lineTo(x + as, y + as);
	    ctx.stroke();
	    ctx.beginPath();
	    ctx.moveTo(x + as, y);
	    ctx.lineTo(x, y + as);
	    ctx.stroke();
	}
	ctx.strokeRect(x, y, as, as);
	if (role > 0) {
	    var icon = roleIcons[role];
	    if (debugMode) {
		console.log(nickname, 'role', icon);
	    }
	    try {
		const roleIcon = await Canvas.loadImage('./' + icon);
		ctx.drawImage(roleIcon, x + offset, y + offset, is, is);
	    } catch(e) {
		console.log('skipping a role icon', e);
	    }
	}
	if (cID > 0) {
	    if (debugMode) {
		console.log(nickname, 'class', cID);
		console.log(nickname, 'resource', rID);
	    }	    
	    var icon = undefined;
	    switch (rID) {
	    case 0:
		icon = classIcons[cID];
		break;
	    case 1: // magicka
		icon = magIcons[cID];
		break;
	    case 2: // stamina
		icon = stamIcons[cID];
		break;
	    }
	    try {
		const classIcon = await Canvas.loadImage('./' + icon);
		ctx.drawImage(classIcon, x + co, y + co, is, is);
	    } catch(e) {
		console.log('skipping a class icon', e);
	    }
	}
	if (timing > 0) {
	    if (debugMode) {
		console.log(nickname, 'time');
	    }
	    try {
		const ti = await Canvas.loadImage('./' + timeIcon);
		ctx.drawImage(ti, x + 2 * lw, y + offset, is, is);
	    } catch(e) {
		console.log('skipping a time icon', e);
	    }
		
	}
	x += as + m;
	col += 1;
	if (col == dim) {
            y += as + m;
            x = start;
            col = 0;
	}
    }
    const bg = new Discord.Attachment(canvas.toBuffer(), 'raid_' + day + '.png');
    if (bg != undefined) {
	channel.send(text, bg);
    } else {
	channel.send(text);
    }
    return;
}

function filename(d) {
    return 'alphabot_' +  d + '.log';
}

function raidDate(specDate) {
    var date = new Date();
    var weekDay = date.getDay();
    if (raidNights.includes(weekDay)) {
	if (date.getHours() < 20) { // before eight on a raid Night
	    weekDay = ((weekDay - 1) + 7) % 7; // sign up for today (js modulo sucks)
	}
    }
    var day = nextRaid[weekDay]; // default is next raid
    if (specDate != -1) {
	day = specDate;
    }
    if (debugMode) {
	console.log(weekDay, specDate, day);
    }
    return day;
}

function reply(data, day) {
    var status = data[indices['status']];
    var role = data[indices['role']];
    var cID = data[indices['class']];
    var rID = data[indices['resource']];
    var timing = data[indices['timing']];
    var r = 'You are *' + confirm[status] + '*';
    if (debugMode) {
	console.log('reply for', day);
    }
    if (status != 3) {
	r += ' as ' + rssDescr[rID] + classDescr[cID] + roleDescr[role];
    }
    return r + ' for ' + dayNames[day]  + timeDescr[timing] + ' ' + symbols[role] + ', ' + data[indices['nick']] + '!';
} 

function daySpec(text) {
    if (text.includes(' mon')) {
	return 1;
    } else if (text.includes(' fri')) {
	return 5;
    } else if (text.includes(' sat')) {
	return 6;
    } else if (text.includes(' all') || text.includes(' week') || (text.includes(' w') && !text.includes('wa')) || text.includes(' a')) {
	return ALL;
    }
    return -1; // none specified
}

function loadLogs() { // update a global storage
    for (var i = 0; i < raidNights.length; i++) {
	var rn = raidNights[i];
	raid[rn] = fs.readFileSync(filename(rn)).toString().trim().split('\n').filter(Boolean).sort();
    }
    return;
}

function roleSelection(text) {
    var fields = text.split(' ');
    for (var i = 1; i < fields.length; i++) { // scan for role specification
	var spec = fields[i];
	if (!stopWords.includes(spec)) {
	    var skip = false;
	    for (var j = 0; j < prefixList.length; j++) {
		if (spec.startsWith(prefixList[j])) {
		    skip = true;
		    break;
		}
	    }
	    if (!skip) {
		if (spec.startsWith('d') && !spec.includes('dk')) { // damage, dps, deeps, dmg
		    return 1;
		} else if ((spec.startsWith('s') || spec.startsWith('u')) && !spec.startsWith('st')) { // support, utility
		    return 2;
		} else if (spec.startsWith('h')) { // healer, heals, healing
		    return 3;
		} else if (spec.startsWith('f')) { // flexible
		    return 4;
		}
	    }
	}
    }
    return 0; // unspecified
}

function rssSelection(text) {
    var fields = text.split(' ');
    for (var i = 1; i < fields.length; i++) { // scan for role specification
	var spec = fields[i];
	if (!stopWords.includes(spec)) {
	    var skip = false;
	    for (var j = 0; j < prefixList.length; j++) {
		if (spec.startsWith(prefixList[j])) {
		    skip = true;
		    break;
		}
	    }
	    if (!skip) {
		if (spec.startsWith('mag')) { // magicka
		    return 1;
		} else if (spec.startsWith('stam')) { // stamina
		    return 2;
		}
	    }
	}
    }
    return 0; // unspecified
}

function classSelection(text) {
    var fields = text.split(' ');
    for (var i = 1; i < fields.length; i++) { // scan for role specification
	var spec = fields[i];
	if (!stopWords.includes(spec)) {
	    var skip = false;
	    for (var j = 0; j < prefixList.length; j++) {
		if (spec.startsWith(prefixList[j])) {
		    skip = true;
		    break;
		}
	    }
	    if (!skip) {
		if (spec.startsWith('temp') || spec.endsWith('plar')) { // templar
		    return 1;
		} else if (spec.includes('sorc')) { // sorc
		    return 2;
		} else if (spec.includes('dk')) { // DK
		    return 3;
		} else if (spec.includes('blade') || spec.includes('nb')) { // nightblade
		    return 4;
		} else if (spec.endsWith('cro') || spec.startsWith('necro')) { // necromancer
		    return 5;
		} else if (spec.endsWith('den') || spec.startsWith('warden')) { // warden
		    return 6;
		}
	    }
	}
    }
    return 0; // unspecified
}

function currentDefault(name) {
    var defaults = fs.readFileSync('roles.log').toString().trim().split('\n').filter(Boolean);
    for (var i = 0; i < defaults.length; i++) {
	var f = defaults[i].split(' ');
	if (f[indices['defName']] == name) { // default has already been set
	    var defs = {'role':  parseInt(f[indices['defRole']]),
			'rss': parseInt(f[indices['defRss']]),
			'class': parseInt(f[indices['defClass']])};
	    return defs;
	}
    }
    return {'role': 0, 'rss': 0, 'class': 0};
}

function currentStatus(name, day) {
    if (debugMode) {
	console.log('checking current status', name, day);
    }
    var resp = raid[day];
    for (var i = 0; i < resp.length; i++) {
	var f = resp[i].split(separator);
	if (f[indices['name']] == name) {
	    var curr = {'role': parseInt(f[indices['role']]),
			'rss': parseInt(f[indices['resource']]),
			'class': parseInt(f[indices['class']])};
	    return curr;
	}
    }
    return {'role': 0, 'rss': 0, 'class': 0};    
}

// helper method from https://discordjs.guide/popular-topics/canvas.html#adding-in-text
const applyText = (canvas, text, available) => {
    const ctx = canvas.getContext('2d');
    let fontSize = 50;
    do {
	ctx.font = `${fontSize -= 2}px sans serif`;
    } while (ctx.measureText(text).width >= available);
    return ctx.font;
};

async function ack(draw, data, day, message, msg) {
    var name = data[indices['nick']];
    if (debugMode) {
	console.log('thanking', name);
    }    
    var status = data[indices['status']];
    var role = data[indices['role']];
    var rID = data[indices['resource']];
    var cID = data[indices['class']];
    var url = data[indices['url']];
    var text = name + '\n' + confirm[status]; 
    if (status == 1 || status == 2) {
	text += ' as\n' + rssDescr[rID] + classDescr[cID] + roleDescr[role];	
    }
    if (day != 8) {
	text += '\nfor ' + dayNames[day]; 
    }
    if (debugMode) {
	console.log(text);
    }
    if (draw) {
	const height = 229; 
	const width = 320;
	const canvas = Canvas.createCanvas(width, height);
	const margin = 40;
	const is = avatarSize; // icon size
	const ts = is - 10; // hourglass size
	const ctx = canvas.getContext('2d');
	try {
	    const background = await Canvas.loadImage('./confirm.png');
	    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
	} catch (e) {
	    console.log('skipping confirmation bg', e);
	}
	if (url.includes('undefined')) {
	    url = defaultAvatar;
	} else {
	    url = url.split('?')[0] + '?size=' + avatarSize;
	}	
	if (debugMode) {
	    console.log(url);
	}
	try {
	    const avatar = await Canvas.loadImage(url);
	    ctx.drawImage(avatar, margin, margin, avatarSize, avatarSize);
	} catch (e) {
	    console.log('skipping confirmation avatar', e);
	}
	ctx.strokeStyle = style[status];
	ctx.lineWidth = 5;
	ctx.strokeRect(margin, margin, avatarSize, avatarSize);
	if (role > 0) {
	    var icon = roleIcons[role];
	    if (debugMode) {
		console.log(icon);
	    }
	    try {
		const roleIcon = await Canvas.loadImage('./' + icon);
		const d = is + margin;
    		ctx.drawImage(roleIcon, margin, height - d, is, is);
	    } catch (e) {
		console.log('skipping conf role icon', e);
	    }
	}
	if (cID > 0) {
	    var icon = undefined;
	    switch (rID) {
	    case 0:
		icon = classIcons[cID];
		break;
	    case 1: // magicka
		icon = magIcons[cID];
		break;
	    case 2: // stamina
		icon = stamIcons[cID];
		break;
	    }
	    if (debugMode) {
		console.log(icon);
	    }
	    try {
		const classIcon = await Canvas.loadImage('./' + icon);
		const d = is + margin;
    		ctx.drawImage(classIcon, width / 3, height - d + 10, is, is);
	    } catch (e) {
		console.log('skipping conf class icon', e);
	    }
	}	
	const offset = 1.5 * margin;
	const busy = offset + avatarSize;
	ctx.font = applyText(canvas, text, width - busy - margin);
	ctx.fillStyle = '#ffffff';
	ctx.fillText(text, busy, offset);
	if (data[indices['timing']] > 0) {
	    try {
		const ti = await Canvas.loadImage('./' + timeIcon);
		const d = ts + margin;
		ctx.drawImage(ti, width - d - margin / 2, height - d, ts, ts);
	    } catch (e) {
		console.log('skipping conf time icon', e);
	    }
	}
	const bg = new Discord.Attachment(canvas.toBuffer(), 'ack_' + day + '_' + name.replace(' ', '') + '.png');
	if (bg != undefined) {
	    message.channel.send(msg, bg);
	    return;
	}
    }
    message.channel.send(msg);
    //    var embed = new Discord.RichEmbed()
    //	.setTitle(a)
    //	.setAuthor("Alpha Squad RSVP for " + dayNames[day], message.author.avatarURL)
    //	.setDescription("Thank you for letting us know! " + symbols[role]);
    //    message.channel.send(embed);
    return;
}

function addResponse(data, day, message, thanks, draw) {
    if (debugMode) {
	console.log('new response for', day);
    }
    var appendix = '';
    if (data[indices['status']] !=3 && data[indices['role']] == 0) { 
	appendix = '\n' + roleInfo;
    }
    fs.appendFileSync(filename(day), '\n' + data.join(separator) + '\n', (err) => {
	if (err) throw err;
    });
    raid[day].push(data.join(separator));
    if (thanks) {
    	ack(draw, data, day, message, listing(undefined, day, false, false) + appendix);
    }
    return;
}

function updateStatus(data, day) {
    var resp = raid[day];
    var name = data[indices['name']];
    var status = data[indices['status']];
    var role = data[indices['role']];
    var rID = data[indices['resource']];
    var cID = data[indices['class']];
    var timing = data[indices['timing']];
    if (debugMode) {
	console.log('checking', name, 'for', day);
    }
    for (var i = 0; i < resp.length; i++) {
	var f = resp[i].split(separator);
	if (f[indices['name']] == name) {
	    if (debugMode) {
		console.log('match of', name, 'for', day, '\n', f);
	    }	    
	    resp[i] = data.join(separator); // rewrite entry and file
	    fs.writeFileSync(filename(day), resp.join('\n') + '\n', (err) => { 
		if (err) throw err;
	    });
	    return true;
	}
    }
    return false; // no match
}
    
function listing(channel, day, draw) {
    if (debugMode) {
        console.log('listing for', day);
    }
    var resp = raid[day].sort();
    var singular = '';
    var plural = 's';
    var count = resp.length;
    if (resp.length == 1) {
	plural = '';
	singular = 'one';
	count = '';
    }
    var list = 'For **' + dayNames[day] + '**, we have ' + singular +  count + ' response' + plural + ':\n'; 
    var i = 1;
    var prev = 0;
    for (r in resp) {
	var userData = resp[r].split(separator);
	var status = parseInt(userData[indices['status']]);
	var role = parseInt(userData[indices['role']]);
	var rID = parseInt(userData[indices['resource']]);
	var cID = parseInt(userData[indices['class']]);
	var timing = parseInt(userData[indices['timing']]);
	var nickname = userData[indices['nick']];
	var prefix = '';
	if (status != prev) {
	    var firstYes = true;
	    var firstMaybe = true;
	    var firstNo = true;
	    prev = status;
	}
	switch (status) {
	case 1: // attendee
	    if (firstYes) {
		list += '__Attending:__\n';
		firstYes = false;
	    }
	    prefix = i + '. ';
	    i++;
	    break;
	case 2: // maybe
	    if (firstMaybe) {
		list += '__Possibly attending:__\n';
		firstMaybe = false;
	    }	    
	    prefix = '? ';
	    break;
	case 3: // declined
	    if (firstNo) {
		list += '__Unable to attend:__\n';
		firstNo = false;
	    }	    
	    nickname = '~~' + nickname + '~~'; // crossed out
	    role = 5;
	    break;
	}
	var source = undefined;
	switch (rID) {
	case 0:
	    source = classSymbols;
	    break;
	case 1:
	    source = magSymbols;
	    break;
	case 2:
	    source = stamSymbols;
	    break;
	}
	list += prefix + symbols[role] + ' ' + source[cID] + ' ' + nickname + timeDescr[timing] + '\n';
    }
    if (draw) {
	collage(channel, resp, day, list);
	return;
    } 
    return list;
}

function alpaca(message) {
    var text = message.content.toLowerCase();
    var n = (text.match(/alpaca/g) || []).length;
    if (n > 0) {
	var a = '';
	for (var i = 0; i < n; i++) {
	    a += ':llama:';
	}
	message.channel.send(a);
    }
}

function listRaid(channel, day, draw) {
    var text = undefined;
    if (raid[day].length == 0) {
	text = '*Nobody* has responded for **' + dayNames[day] + '**  :frowning2:';
    } else {
	text = listing(channel, day, draw);
    }
    if (!draw && channel != undefined && text != undefined) {
	console.log(channel, text);
	channel.send(text);
    } 
    return text;
}

function manageToons(name, nickname, channel, text) {
    if (text.includes(' help')) {
	channel.send('Writing just **!toon** will print out a list of the registered toons.\n' +
		     'To define a new toon, use **!toon add <class> <rss> <role>** where\n' +
		     '**class** is one of: *templar*, *sorc*, *DK*, *NB*, *warden*, or *necro*;\n' +
		     '**rss** is one of: *magicka*, *stamina*, or *hybrid*;\n' +
		     '**role** is one of: *damage*, *support*, *healer*, or *multitask.\n' + 
		     'I recognize many ways to type each role, resource type, and role.');
	return;
    } if (text.includes(' add')) {
	var tc = 0; // parse class
	for (let entry of Object.entries(toonClass)) {
	    let className = entry[0];
	    let classID = entry[1];
	    if (debugMode) {
		console.log(className, classID);
	    }
	    if (text.includes(className)) {
		tc = classID;
		break;
	    }
	}
	if (tc == 0) {
	    channel.send('I am sorry, but I did not understand what the class for this toon is (templar, sorc, DK, NB, warden, or necro).');
	    return;
	}
	var tr = 0; // parse primary resource
	for (let entry of Object.entries(toonRss)) {
            let rssName = entry[0];
            let rssID = entry[1];
	    if (debugMode) {
		console.log(rssName, rssID);
	    }	    
            if (text.includes(rssName)) {
                tr = rssID;
                break;
            }
        }
	if (tr == 0) { 
	    channel.send('I am sorry, but I did not understand what the build for this toon is (magicka, stamina, or hybrid).');
	    return;
	}
	var tf = 0; // parse function
	for (let entry of Object.entries(toonRole)) {
            let roleName = entry[0];
            let roleID = entry[1];
	    if (debugMode) {
		console.log(roleName, roleID);
	    }	    
            if (text.includes(roleName)) {
                tf = roleID;
                break;
            }
        }
	if (tf == 0) {
	    channel.send('I am sorry, but I did not understand what the role for this toon is (damage, support, heals, or multitask).');
	    return;
	}
	data = [name, nickname, tc, tr, tf]; // join data
	channel.send(nickname + ' has defined a ' +  rssNames[tr] + ' ' + classNames[tc] + ' ' + roleNames[tf]);
	fs.appendFileSync('toons.log', '\n' + data.join(separator) + '\n', (err) => {
	    if (err) throw err;
	});
	return;
    } else if (text.includes(' del') || text.includes(' rem')) { // delete / remove a toon template
	channel.send('My mom has not taught me how to delete toons yet. She will, though, when she has the time.');
	return; // IMPLEMENTATION PENDING
    } else { // listing
	console.log('toon listing')
	var toons = fs.readFileSync('toons.log').toString().trim().split('\n').filter(Boolean).sort();
	toons = removeDuplicates(toons);
	fs.writeFileSync('toons.log', toons.join('\n') + '\n', (err) => {
	    if (err) throw err;
	});			
	var msg = '**The presently registered Alpha toons are**:\n';
	for (var i = 0; i < toons.length; i++) {
	    var f = toons[i].split(separator);
	    var rn = f[0]; // username
	    var nn = f[1]; // nickname
	    var tc = parseInt(f[2]);
	    var tr = parseInt(f[3]);
	    var tf = parseInt(f[4]);
	    msg += '*' + nn + '* has a ' + rssNames[tr] + ' ' + classNames[tc] + ' ' +  roleNames[tf] + '\n';
	}
	channel.send(msg);
    }
    return;
}

function manageDefaults(name, nickname, defs, curr, channel) {
    if (curr['role'] != 0) {
	if (defs['role'] == curr['role'] && defs['class'] == curr['class'] && defs['rss'] == curr['rss']) {
	    channel.send('You had already set that as your default.');
	    return;
	}
	var repl = rssDescr[curr['rss']] + classDescr[curr['class']] + roleDescr[curr['role']];
	var source = undefined;
	switch (curr['rss']) {
	case 0:
	    source = classSymbols;
	    break;
	case 1:
	    source = magSymbols;
	    break;
	case 2:
	    source = stamSymbols;
	    break;
	}
	repl += ' ' + symbols[curr['role']] + ' ' + source[curr['class']];
	if (debugMode) {
            console.log('current ' + repl);
        }
	var defaults = fs.readFileSync('roles.log').toString().trim().split('\n').filter(Boolean);
	if (debugMode) {
	    console.log('default update');
	}
	var i = 0;
	for (; i < defaults.length; i++) {
	    var f = defaults[i].split(' ');
	    if (f[indices['defName']] == name) { // entry to replace
		defaults[i] = name + ' ' + curr['role'] + ' ' + curr['rss'] + ' ' + curr['class']; // DEFAULT FILE SYNTAX: <name> <role> <rss> <class>
		fs.writeFileSync('roles.log', defaults.join('\n')  + '\n', (err) => {
		    if (err) throw err;
		});
		channel.send('Default role for ' + nickname + ' has been updated as ' + repl);
		return;
	    }
	} 
	if (debugMode) {
	    console.log('default append');
	}
	fs.writeFileSync('roles.log', defaults.join('\n') + '\n' + name + ' ' + curr['role'] + ' ' + curr['rss'] + ' ' + curr['class'], (err) => {
	    if (err) throw err;
	});
	channel.send('Default for ' + nickname + ' set as ' + repl);
	return;
    } else { // !default was called with no role specified
	if (defs['role'] != 0) {
	    var set = rssDescr[defs['rss']] + classDescr[defs['class']] + roleDescr[defs['role']];
	    var source = undefined;
	    switch (defs['rss']) {
	    case 0:
		source = classSymbols;
		break;
	    case 1:
		source = magSymbols;
		break;
	    case 2:
		source = stamSymbols;
		break;
	    }
	    set += ' ' + symbols[defs['role']] + ' ' + source[defs['class']];
	    channel.send('Your default is set as ' + set);
	    return; // nothing more to do
	} 
	channel.send('You should specify which role to set as your default: **d**amage, **s**upport/**u**tility, **h**ealer, or **f**lexible.');
	return;
    }
}

function process(message) {
    var text = message.content.toLowerCase();
    var channel = message.channel;
    if (!channel.name.includes('alpha')) { // ignore other channels
	return;
    } else if (channel.name != 'alpha-signup') {
	channel.send('I have been confined to the <#667529156212293664> channel. Please talk to me there.')
	return;
    }
    if (text.includes('!clear')) {
	return; // that is for another bot
    }
    if (text.startsWith('!h')) {
	channel.send(help);
    } else if (text.startsWith('!') && 'dsmrt'.includes(text[1])) {	
	var draw = true;
	if (text.includes(' text')) {
	    if (debugMode) {
		console.log('turning off graphics')
	    }
	    draw = false;
	}
	var user = message.member.user;
	var name = user.tag;
	let member = guild.member(message.author);
	let nickname = member ? member.displayName : undefined;
	if (nickname == undefined) {
	    nickname = name.split('#')[0]; // skip the Discord ID number when making a default nickname
	}
	var curr = {'role': roleSelection(text),
		    'rss': rssSelection(text),
		    'class': classSelection(text)};
	var defs = currentDefault(name);
	if (debugMode) {
	    console.log(text);
	}
	if (text.startsWith('!def')) { // default step requested with !default or !def
	    manageDefaults(name, nickname, defs, curr, channel);
	} else if (text.startsWith('!toon')) { // register a toon definition
	    manageToons(name, nickname, channel, text);
	} else { // response or raid listing (other raid commands than default)
	    loadLogs();
	    if (debugMode) {
		console.log(name, curr['role'], defs['role']);
	    }
	    var specDate = daySpec(text);
	    var day = raidDate(specDate);
	    if (text[1] == 'r') { // raid listing requested
		if (debugMode) {
		    console.log('listing requested');
		}
		if (day != ALL) {
		    listRaid(channel, day, draw);
		} else { // all week requested
		    var r = 'Showing all responses.\n';
		    for (var i = 0; i < raidNights.length; i++) {
			r += listRaid(undefined, raidNights[i], false);
		    }
		    channel.send(r);
		}
		return;
	    } else { // a new response has been given with !signup
		if (curr['role'] == 0) {
		    if (debugMode) {
			console.log('Using default role');
		    }
		    curr['role'] = defs['role']; // use default whenever none is given
		}
		if (curr['role'] == defs['role'] && curr['rss'] == 0) {
		    if (debugMode) {
			console.log('Using default rss');
		    }
		    curr['rss'] = defs['rss']; // use default whenever none is given
		}
		if (curr['role'] == defs['role'] && curr['rss'] == defs['rss'] && curr['class'] == 0) {
		    if (debugMode) {
			console.log('Using default class');
		    }
		    curr['class'] = defs['class']; // use default whenever none is given
		}
		var status = 0;
		var timing = 0;
		if (text.includes(' l') && text.includes(' e')) {
		    timing = 1;
		} else if (text.includes(' l')) {
		    timing = 2;
		} else if (text.includes(' e')) {
		    timing = 3;
		}
		if (text[1] == 'm' || text.includes(' maybe')) { 
		    status = 2; // maybe
		} else if (text[1] == 'd' || text.includes(' decline') || text.includes(' no ') || text.includes(' not ')) { 
		    status = 3; // decline
		} else if (text[1] == 's' || text.includes(' yes ') || text.includes(' confirm')) { 
		    status = 1; // signup
		} else {
		    if (debugMode) {
			console.log(text);
		    }
		    return;
		}
		if (status != 0) { // a valid response
		    if (curr['role'] == 0 && day != ALL) {
			curr = currentStatus(name, day); // check if one is set
		    }
		    var url = user.avatarURL;
		    if (url == undefined) {
			url = "undefined";
		    }
		    var data = [status, curr['role'], curr['rss'], curr['class'], timing, name, nickname, url]; // RESPONSE FILE SYNTAX
		    var appendix = '';
		    if (specDate == -1) { // no date was specified
			appendix = '\nYou have responded for the *next raid* which is on ' + dayNames[day] + '; to specify a date, include one of Mon Fri Sat in your command.';
		    }
		    
		    if (day != ALL) { // one-day response
			if (updateStatus(data, day)) { // an update on an existing response
			    channel.send(reply(data, day));
			} else { // a new response
			    addResponse(data, day, message, true, draw);
			}
		    } else { // response for all raids
			if (debugMode) {
			    console.log('weekly response');
			}			
			for (var i = 0; i < raidNights.length; i++) {
			    var rn = raidNights[i];
			    if (!updateStatus(data, rn)) { // update if exists
				addResponse(data, rn, message, false, false); // add if it does not
			    }
			}
			ack(draw, data, day, message, reply(data, day) + appendix); // thank the user
		    }
		}
	    }
	}
    }
}


client.on("message", (message) => {
    if (message.content.startsWith('!')) {
	process(message);
    } else {
	alpaca(message); // for Ags
    }
});
var ID = fs.readFileSync('token.txt').toString().trim();
client.login(ID);
