const Canvas = require('canvas');
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

let raid  = {};
let guild = undefined;

var prefixsymbol = '&'; 

'use strict';

const debugMode =  false;
const { spawnSync } = require('child_process');

let coc = fs.readFileSync('ch_coc.txt').toString().trim();

const basic = '\n\n' + fs.readFileSync('CH/basics.txt').toString().trim();
const availSlots = fs.readFileSync('CH/coreB.txt').toString().trim().split('\n').filter(Boolean);
var slotlist = 'The **CH SF Core B** slots are:\n\n';
for (let i = 0; i < availSlots.length; i++) {
    slotlist += (i + 1) + '. ' + availSlots[i] + '\n';
}


const sBasic = '\n\n' + fs.readFileSync('CH/basics_small.txt').toString().trim();
const sAvailSlots = fs.readFileSync('CH/small.txt').toString().trim().split('\n').filter(Boolean);
var sSlotlist = 'The **CH SF Core B small-scale** slots are:\n\n';
for (let i = 0; i < sAvailSlots.length; i++) {
    sSlotlist += (i + 1) + '. ' + sAvailSlots[i] + '\n';
}

async function thankYouNote(message, info) {
    var tag = message.author.tag;
    let suffix = '';
    if (tag.includes('AlphaBot')) { // it me, Mario
	return;
    } else if (tag.includes('satuelisa#0666')) {
	suffix = '\n\nHi, mom! :heart:\n';
    } else if (tag.includes('Frozzy#6969')) {
	suffix = '\n\nMy mom asked me to remind you she loves you. :heart:';
    }
    message.author.send(info + '\nThank you interacting with me.' + suffix).catch(error => { console.log(tag + ' cannot receive bot DM') });
}

const separator = ' # ';
const roleInfo ='\nThe commands *' + prefixsymbol + 'signup* and *' + prefixsymbol + 'maybe* can be accompanied by role info: **d**amage, **s**upport/**u**tility, **h**eals, or **f**lexible (meaning you could take one of 2+ roles if needed). Also class (templar, DK, etc.) and primary resource (magicka or stamina) can be specified. You can also write a custom specification indicating any sets, skills, or ultimates you would like to mention by enclosing them in parenthesis.\n\nYou can set a default role for Core A with the *' + prefixsymbol + 'default* command using the same role specifiers; once a default has been set, future sign-ups employ that role unless you specify another one.\n\nIf your are signing up for **Core B**, please include the slot number (DM me for more info) and the string *b* in the signup command. Similarly, to specify **Core A**, just include *a*.\n';
const dateInfo = '\nBy default, you will be responding to the next raid; you can use *Mon Tue Wed Thu Fri Sat Sun* to specify a date, whereas using *all* or *week* refers to the next round of raids for Core A (Tuesday) and the next two for Core B (Wednesday and Friday).\n';
const earlyLate = '\nYou can also include the words *late* or *early* to indicate if you will be joining late or leaving early (or even both).\n';
const feedback = '\nIf anything seems broken or unpleasant, just tag *satuelisa* and express your concerns. <:Agswarrior:552592567875928064>'; 
const options = roleInfo + earlyLate + dateInfo + '\nUse __' + prefixsymbol + '**h**elp__ to see this help text and __' + prefixsymbol + '**r**aid__ to just view the sign-ups.';
const help = '**Available commands:**\n__' + prefixsymbol + '**s**ignup__ if you will attend the next raid\n' + prefixsymbol + '__**m**aybe__ if you might be able to attend\n' + prefixsymbol + '__**d**ecline__ if you will not make it\n' + options;
const helpCoreB = '\nTo **sign up** for *Core B*, use *&signup slot <number> b* on the **#sf-signup** channel in ChapterHouse discord. If you need to **clear** an existing sign-up, just add the word *clear* in that message.';
const helpSchedule = '\n**Open** groups are for *all guild members*; contact @iTwiitchy#8180 for more information and note that *Core A* members are encouraged to use their core toons or toons they are preparing for the core.\n\n**Core A** groups are *exclusively* for Core A members; send information on your available toons to @satuelisa#0666 for more information.\n\n**Core B** groups are slot-based and exclusively for Core B members; message *slots* to me to see the slots (*small* for the small-scale slots) and send your build matching a slot to @Bubbles#8411.\n\nJoining a Core A/B raid also requires you to have **signed up** for it on the **#sf-signup** channel on CH Discord; you gain access to the channel after a Core leader has approved your build.';

const symbols = {0: ':confused:', // unspecified
		 1: '<:sfdps:744307873181466674>', // dps
		 2: '<:sfsupport:744304803928211466>', // support 
		 3: '<:sfhealer:744312848020144190>', // heals
		 4: ':mechanical_arm:', // flex
		 5: ':no_entry_sign:'}; // unavailable
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
		      1: '<:templar:739912569241731275>',
		      2: '<:sorc:739912569476874301>',
		      3: '<:dk:739912569443319960>',
		      4: '<:nb:739912569392857170>',
		      5: '<:necro:739912569485131777>',
		      6: '<:warden:739912569241862286>'}
const magSymbols = {0: ':blue_circle:',
		    1: '<:magplar:739912569531138098>',
		    2: '<:magsorc:739912569631932537>',
		    3: '<:magdk:739912569632063538>',
		    4: '<:magblade:739912569510297629>',
		    5: '<:magcro:739912569287999489>',
		    6: '<:magden:739912569460097169>'}
const stamSymbols = {0: ':green_circle:',
		    1: '<:stamplar:739912569715949639>',
		    2: '<:stamsorc:739912569602441371>',
		    3: '<:stamdk:739912569632063558>',
		    4: '<:stamblade:739912569195724821>',
		    5: '<:stamcro:739912569564954784>',
		    6: '<:stamden:739912569262964798>'}

const timeDescr = {0: '',
		   1: ' *[joining late, leaving early]* ',
		   2: ' *[joining late]* ',
		   3: ' *[leaving early]* '};

const confirm = {1: 'confirmed',
		 2: 'possible',
		 3: 'unavailable'};

const dayNames = {1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday',
		  6: 'Saturday', 7: 'Sunday', 8: 'the next round of raids'};
const ALL = 8;
const raidNights = {'A': [], 'B': [], 'O': [], 'all': []};
const time = [];
const crown = [];
const group = [];
const campaign = [];
const backups = [];
const groupNames = {'A': 'Special Forces Core A',
		    'B': 'Special Forces Core B',
		    'O': 'Open',
		    'S': 'Auction'}
const eventList= fs.readFileSync('CH/schedule.txt').toString().trim().split('\n').filter(Boolean);
let schedule = '**ChapterHouse PVP Schedule**\n\n';
for (let i = 0; i < eventList.length; i++) {
    const event = eventList[i].split(' ');
    let day = parseInt(event[0]);
    time[day] = event[1];
    crown[day] = event[2];
    campaign[day] = event[3];
    group[day] = event[4];
    if (group[day] != 'S') { // no signups for the auction
	rn = raidNights[group[day]];
	rn.push(day);
	if (!raidNights['all'].includes(day)) {
	    raidNights['all'].push(day)
	}
    }
    schedule += dayNames[day] + ': ' + groupNames[group[day]] + ' with ' + crown[day].split('#')[0] + '\n';
}
const backupListing = fs.readFileSync('CH/backups.txt').toString().trim().split('\n').filter(Boolean);
for (let i = 0; i < backupListing.length; i++) {
    backups[i + 1] = backupListing[i].split(' ');
}
const nextRaid = {'A': {},
		  'B': {},
		  'O': {}}
for (let et in nextRaid){
    for (let i = 0; i < raidNights[et].length; i++) {
	let active = raidNights[et][i];
	for (let j = active; j < active + 7; j++) {
	    let day = ((j - 1) + 7) % 7;
	    let rl = nextRaid[et];
	    if (!(rl.hasOwnProperty('' + day))) { // unset at present
		if (day != active) {
		    rl[day] = active;
		}
	    }  
	    // console.log('for', day, 'we have', rl[day], 'and could have', active, day > rl[day], active > day);
	    if (day > rl[day] && active > day) { 
		rl[day] = active; // this one comes first
	    }
	}
    }
}


client.on("ready", () => {
    guild = client.guilds.cache.get('447444372439564288');
    console.log(guild.name);
    console.log(nextRaid);    	
});


function coreOn(core, day) {
    return raidNights[core].includes(day) || day == ALL;
}

function coreDays(core) {
    var s = '';
    const k = raidNights[core].length
    for (let i = 0; i < k; i++) {
	s += dayNames[raidNights[core][i]];
	if (i == k - 2) {
	    s += ' and ';
	} else if (i == k - 1) {
	    s += ', ';
	}
    }
    return s;
}

const stopWords = ["for", "as", "an", "the", "of", "raid", "up",
		   "tonight", "today", "yo", "me", "sign", "up", "gift", "gods", "to", "please"];
const prefixList = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "all", "week"];
const indices = {'status': 0, 'role': 1,
		 'resource': 2, 'class': 3,
		 'timing': 4, 'core': 5,
		 'name': 6, 'nick': 7,
		 'url': 8, 'specs': 9,
		 'defName': 0, 'defRole': 1,
		 'defRss': 2, 'defClass': 3,
		 'defCore': 4, 'defSpecs': 5};
loadLogs('A');
loadLogs('B');

function removeDuplicates(array) {
  return array.filter((a, b) => array.indexOf(a) === b)
};

function formatSpecs(specs) {
    if (specs == undefined) {
	specs = '';
    }
    if (specs.length > 0) {
	specs = ' (' + specs + ') ';
    }
    return specs;
}


function filename(d) {
    return 'ch_' +  d + '.log';
}

function raidDate(specDate, core) {
    var date = new Date();
    var weekDay = date.getDay();
    // console.log('checking date', core, raidNights[core], specDate in raidNights[core]);
    if (specDate > -1 && specDate < 8 && !(raidNights[core].includes(specDate))) {
	return -2; // no raid
    }
    if (raidNights[core].includes(weekDay)) {
	if (date.getHours() < 20) { // before eight on a raid Night
	    weekDay = ((weekDay - 1) + 7) % 7; // sign up for today (js modulo sucks)
	}
    }
    var day = nextRaid[core][weekDay]; // default is next raid
    if (specDate != -1) {
	day = specDate;
    }
    return day;
}

function reply(data, day) {
    var status = data[indices['status']];
    var role = data[indices['role']];
    var cID = data[indices['class']];
    var rID = data[indices['resource']];
    var timing = data[indices['timing']];
    var core = data[indices['core']];
    if (Number.isNaN(core) || core === 'NaN') {
	core = 'A';
    }
    var r = 'You are *' + confirm[status] + '*';
    var specs = formatSpecs(data[indices['specs']]);
    if (status != 3 && core != 'B') {
	r += ' as ' + rssDescr[rID] + classDescr[cID] + roleDescr[role];
    }
    return r + specs + ' for **Core ' + core + '** on ' + dayNames[day]  + timeDescr[timing] + ' ' +
	symbols[role] + ', ' + data[indices['nick']] + '!';
} 

function daySpec(text) {
    if (text.includes(' mon')) {
	return 1;
    } else if (text.includes(' tue')) {
	return 2;
    } else if (text.includes(' wed')) {
	return 3;
    } else if (text.includes(' thu')) {
	return 4;
    } else if (text.includes(' fri')) {
	return 5;
    } else if (text.includes(' sat')) {
	return 6;
    } else if (text.includes(' sun')) {
	return 7;
    } else if (text.includes(' all') || text.includes(' week')
	       || (text.includes(' w') && !text.includes(' wa') && !text.includes(' wi'))) {
	return ALL;
    }
    return -1; // none specified
}

function loadLogs(core) { // update a global storage
    var rNs = raidNights[core];
    for (var i = 0; i < rNs.length; i++) {
	var rn = rNs[i];
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
		} else if ((spec.startsWith('s') || spec.startsWith('u'))
			   && !spec.startsWith('st')) { // support, utility
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

function specsSelection(text) {
    var start = text.indexOf('(');
    var end = text.indexOf(')');
    if (start + 1 <  end) {
	return text.substring(start + 1, end);
    } else {
	return '';
    }
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
    var defaults = fs.readFileSync('ch_roles.log').toString().trim().split('\n').filter(Boolean);
    for (var i = 0; i < defaults.length; i++) {
	var f = defaults[i].split(separator);
	if (f[indices['defName']] == name) { // a default has already been set
	    var defs = {'role':  parseInt(f[indices['defRole']]),
			'rss': parseInt(f[indices['defRss']]),
			'class': parseInt(f[indices['defClass']]),
			'core': f[indices['defCore']].trim(),
			'specs': 'no sets/skills specified'};
	    if (defs['core'] != 'A' && defs['core'] != 'B') {
		defs['core'] = 'A'; // default
	    }
	    if (f.length > indices['defSpecs']) { 
		defs.specs = f[indices['defSpecs']]; // update if there is one
	    }
	    return defs;
	}
    }
    return {'role': 0, 'rss': 0, 'class': 0, 'core': 'A', 'specs': ''};
}

function currentStatus(name, day) {
    var resp = raid[day];
    if (resp != undefined) {
	for (var i = 0; i < resp.length; i++) {
	    var f = resp[i].split(separator);
	    if (f[indices['name']] == name) {
		var curr = {'role': parseInt(f[indices['role']]),
			    'core': parseInt(f[indices['core']]),
			    'rss': parseInt(f[indices['resource']]),
			    'class': parseInt(f[indices['class']])};
		return curr;
	    }
	}
    }
    return {'role': 0, 'rss': 0, 'class': 0, 'core': 'A'};    
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

async function ack(data, day, message, msg) {
    var name = data[indices['nick']];
    var status = data[indices['status']];
    var role = data[indices['role']];
    var rID = data[indices['resource']];
    var cID = data[indices['class']];
    var core = data[indices['core']];
    var url = data[indices['url']];
    var text = name + '\n' + confirm[status]; 
    if (status == 1 || status == 2) {
	text += ' as\n' + rssDescr[rID] + classDescr[cID] + roleDescr[role];	
    }
    if (day != 8) {
	text += '\nfor **Core ' + core + '** on ' + dayNames[day]; 
    }
    message.channel.send(msg);
    return;
}

function addResponse(data, day, message, thanks) {
    var appendix = '';
    if (data[indices['status']] !=3 && data[indices['role']] == 0) { 
	appendix = '\n' + roleInfo;
    }
    fs.appendFileSync(filename(day), '\n' + data.join(separator) + '\n', (err) => {
	if (err) throw err;
    });
    raid[day].push(data.join(separator));
    if (thanks) {
    	ack(data, day, message, listing(undefined, day, false, false));
	if (data[indices['status']] != 3) {
	    appendix = coc + '\n' + appendix;
	}
	thankYouNote(message, appendix);
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
    var core = data[indices['core']];
    var timing = data[indices['timing']];
    if (resp != undefined) {
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
    }
    return false; // no match
}
    
function listing(channel, day) {
    var resp = raid[day].sort();
    var singular = '';
    var plural = 's';
    var count = resp.length;
    if (coreOn('B', day)) {
	let taken = fs.readFileSync('CH/slots_' + day + '.log').toString().trim().split('\n').filter(Boolean);
	if (typeof taken != 'undefined') {
	    count += taken.length;
	}
    }
    if (count == 1) {
	plural = '';
	singular = 'one';
	count = '';
    }
    var list = '\nFor **' + dayNames[day] + '**, we have ' + singular +  count + ' response' + plural + ':\n'; 
    var cores = { 'A': '\n**Core A**\n', 'B': '\n**Core B**\n'};
    var prev = 0;
    var firstYes = {'A': false, 'B': false};
    var firstMaybe = {'A': false, 'B': false};
    var firstNo = {'A': false, 'B': false};
    var seq = {'A': 0, 'B': 0};
    var attendance = {'A': 0, 'B': 0};
    for (r in resp) {
	var userData = resp[r].split(separator);
	var status = parseInt(userData[indices['status']]);
	var role = parseInt(userData[indices['role']]);
	var rID = parseInt(userData[indices['resource']]);
	var cID = parseInt(userData[indices['class']]);
	var timing = parseInt(userData[indices['timing']]);
	var nickname = userData[indices['nick']];
	var core = userData[indices['core']];
	let username = userData[indices['name']];
	if (core == undefined) {
	    core = 'A'; // default
	}
	console.log(nickname, core);
	var specs = formatSpecs(userData[indices['specs']]);
	var prefix = '';
	if (status != prev) {
	    firstYes[core] = true;
	    firstMaybe[core] = true;
	    firstNo[core] = true;
	    prev = status;
	}
	switch (status) {
	case 1: // attendee
	    if (firstYes[core]) {
		cores[core] += '__Attending:__\n';
		firstYes = false;
	    }
	    attendance[core] += 1;
	    nickname = '**' + nickname + '**'; // boldface	    
	    seq[core] += 1;
	    prefix = seq[core] + '. ';
	    break;
	case 2: // maybe
	    if (firstMaybe[core]) {
		cores[core] += '__Possibly attending:__\n';
		firstMaybe[core] = false;
	    }	    
	    prefix = '? ';
	    break;
	case 3: // declined
	    if (firstNo[core]) {
		cores[core] += '__Unable to attend:__\n';
		firstNo[core] = false;
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
	console.log(username, day, crown[day], crown[day] === username);
	let leader = ' ';
	if (crown[day] === username) {
	    leader = ' <:Crowns:486254092600213504> ';
	}
	cores[core] += prefix + symbols[role] + ' ' + source[cID] + leader + nickname + specs + timeDescr[timing] + '\n';
    }
    var r = list;
    if (coreOn('A', day)) {
	r += cores['A'];
	if (seq['A'] == 0) {
	    if (raidNights['A'].includes(day)) {
		r += '*Nobody is attending Core A yet* :frowning:';
	    } else { // this should not even be necessary
		r += '*Core A does not run on ' + dayNames[day] + '*';	    
	    }
	} else if (attendance[core] < 7) {
	    r += '\n\nWhen there are not at *least six sign-ups by noon* of the day of the raid, the raid is **cancelled**.';
	}	

    }
    if (coreOn('B', day)) {
	r += signupForSlot(undefined, day, -1, false); // just the listing
    }
    return r;
}

function listRaid(channel, day) {
    var text = undefined;
    var taken = undefined;
    if (coreOn('B', day)) {
	taken = fs.readFileSync('CH/slots_' + day + '.log').toString().trim().split('\n').filter(Boolean);
    }
    if ((!raid.hasOwnProperty(day) || raid[day].length == 0) && typeof taken === "undefined") {
	text = '*Nobody* has responded for **' + dayNames[day] + '**  :frowning2:';
    } else {
	text = listing(channel, day);
    }
    if (channel != undefined && text != undefined) {
	channel.send(text);
    } 
    return text;
}

function manageDefaults(name, nickname, defs, curr, channel) {
    if (curr['role'] != 0) {
	if (defs['role'] == curr['role'] && defs['class'] == curr['class']
	    && defs['rss'] == curr['rss'] && defs['core'] == curr['core']
	    && defs['specs'] == curr['specs']) {
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
	repl += ' ' + symbols[curr['role']] + ' ' + source[curr['class']] + ' for **Core ' + curr['core'] + '**';
	var defaults = fs.readFileSync('ch_roles.log').toString().trim().split('\n').filter(Boolean);

	var data = [name, curr['role'], curr['rss'], curr['class'], curr['core'], curr['specs']];
	var i = 0;
	for (; i < defaults.length; i++) {
	    var f = defaults[i].split(' ');
	    if (f[indices['defName']] == name) { // entry to replace
		// DEFAULT FILE SYNTAX: <name> <role> <rss> <class> <core> <specs> 
		defaults[i] = data.join(separator); 
		fs.writeFileSync('ch_roles.log', defaults.join('\n')  + '\n', (err) => {
		    if (err) throw err;
		});
		channel.send('Default role for ' + nickname + ' has been updated as ' + repl + formatSpecs(curr['specs']));
		return;
	    }
	} 
	fs.writeFileSync('ch_roles.log', defaults.join('\n') + '\n' + data.join(separator), (err) => {
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
	    var specs = formatSpecs(defs['specs']);
	    set += ' ' + symbols[defs['role']] + ' ' + source[defs['class']] + specs + ' for **Core ' + defs['core'] + '**';
	    channel.send('Your default is set as ' + set);
	    return; // nothing more to do
	} 
	channel.send('You should specify, at least, which role to set as your default: **d**amage, **s**upport/**u**tility, **h**ealer, or **f**lexible.');
	return;
    }
}

function signupForSlot(nick, day, slot, clear) {
    var taken = fs.readFileSync('CH/slots_' + day + '.log').toString().trim().split('\n').filter(Boolean);
    var mapping = {};
    var rewrite = false;
    var resp = '';
    var prev = '';
    for (let i = 0; i < taken.length; i++) {
	let fields = taken[i].split(" ");
	if (fields.length > 1) {
	    if (!(fields[0] in mapping)) {
		if (fields[1] == nick) {
		    if (slot != 0 || clear) {
			if (!clear) {
			    return 'You are already signed up for ' + dayNames[day] + '. Please use *!signup slot clear* to eliminate the existing sign-up first if you want to make another one.';
			} else {
			    rewrite = true;
			    taken[i] = '';
			    prev = parseInt(fields[0]) - 1;
			    console.log(fields);
			}
		    }
		}
		mapping[parseInt(fields[0]) - 1] = (fields.slice(1, fields.length)).join(' ');
	    }
	}
    }
    if (rewrite) {
	fs.writeFileSync('CH/slots_' + day + '.log', taken.join('\n') + '\n', (err) => { 
	    if (err) throw err;
	});
	return 'Your sign-up for slot ' + (prev + 1) + ' has been cleared, ' + nick;
    }
    if (slot < 1) { // display slots
	resp = 'The **CH SF Core B** raid slots for ' + dayNames[day] + ' are:\n\n';
	for (let i = 0; i < availSlots.length; i++) {
	    resp += (i + 1) + '. ' + availSlots[i];
	    if (i in mapping) {
		resp += ' **' + mapping[i] + '**';
	    } else {
		resp += ' *available*';
	    }
	    resp += '\n';
	}
	return resp;
    } else {
	if (slot in availSlots) {
	    fs.appendFileSync('CH/slots_' + day + '.log', slot + ' ' + nick + '\n', (err) => {
		if (err) throw err;
	    });
	    return 'You are now signed up for slot ' + slot + ', ' + nick + ' :slight_smile:';
	} else {
	    return 'That slot is already taken :cry:';
	}
    }
}

async function chat(message) {
    const tag = message.author.tag;
    if (tag.includes('SpecialForce')) { // it me, Mario
	return;
    }	
    console.log(tag);
    var usuario =  tag.split('#')[0];
    var text = message.content.toLowerCase();
    if (!text.includes('slot') && !text.includes('sch') && !text.includes('small')) {
	message.author.send('I only talk about the *schedule* and the slot builds by DM. DM me *slots* to see the Core B listing and then *slot <number>* to see the details for a specific slot.').catch(error => { console.log(tag + ' cannot receive bot DM') });
	return;
    }
    const m = guild.member(message.author);
    //    if (!m.roles.cache.find(role => role.name.includes('Special Forces'))) {
    //	message.author.send('Sorry, I am only allowed to respond to SF members.').catch(error => { console.log(tag + ' cannot receive bot DM') });
    //   } else {
    if (text.includes('sch')) {
	message.author.send(schedule + helpSchedule);
    } else if (text.includes('slots')) {
	message.author.send(slotlist + helpCoreB);
    } else if (text.includes('small')) {
	message.author.send(sSlotlist + sBasic);
    } else {
	const start = text.indexOf('slot') + 4;
	const slot = parseInt(text.substring(start));
	if (slot > 0 && slot < availSlots.length) {
	    const data = fs.readFileSync('CH/slot' + slot + '.txt').toString().trim();
	    message.author.send('**CH SF Core B Slot ' + slot + '**\n\n' + data + basic).catch(error => { console.log(tag + ' cannot receive bot DM') });
	} else {
	    message.author.send('Sorry, but I only know builds for slots from 1 to' + availSlots.length + '.').catch(error => { console.log(tag + ' cannot receive bot DM') });
	}
    }
}


function process(message) {
    var text = message.content.toLowerCase();
    var channel = message.channel;
    if (!channel.name.includes('sf')) { // ignore other channels
	return;
    } else if (!channel.name.includes('sf-signup')) {
	channel.send('I have been confined to the <#738954578602491946> channel.' +
		     ' Please talk to me there.')
	return;
    }
    if (text.startsWith(prefixsymbol + 'h')) {
	if (text.includes('channel')) {
	    channel.send(help);	    
	} else {
	    thankYouNote(message, help);
	    channel.send('I have sent you instructions by DM :smile:');
	}
    } else if (text.startsWith(prefixsymbol) && 'dsmrt'.includes(text[1])) {	
	let user = message.member.user;
	let name = user.tag;
	let member = guild.member(message.author);
	let nickname = member ? member.displayName : undefined;	
	if (nickname == undefined) {
	    // skip the Discord ID number when making a default nickname
	    nickname = name.split('#')[0]; 
	}
	let url = message.author.displayAvatarURL();
	var core = undefined;
	if (text.includes(' b ') || text.endsWith(' b') || text.includes('b(') || text.includes(')b')) {
	    core = 'B';
	} else if (text.includes(' a ') || text.endsWith(' a') || text.includes('a(') || text.includes(')a')) {
	    core = 'A';	    
	}
	var curr = {'role': roleSelection(text),
		    'rss': rssSelection(text),
		    'class': classSelection(text),
		    'specs': specsSelection(text),
		    'core': core};
	var defs = currentDefault(name);
	if (core == undefined) {
	    core = defs['core'];
	    curr['core'] = core;
	}
	if (curr['core'] == undefined) {
	    console.log('no def core', name, defs);		
	    curr['core'] = 'A'; // default
	}
	if (Number.isNaN(curr['core'])) {
	    curr['core'] = 'A';
	}
	if (text.startsWith(prefixsymbol + 'def')) { // default step requested with !default or !def
	    if (curr['core'] == 'B') {
		channel.send('Core B uses slot-based signups. All you need to define is the slot number. Please DM me for more info.');
	    } else {
		manageDefaults(name, nickname, defs, curr, channel);
	    }
	} else { // response or raid listing (other raid commands than default)
	    loadLogs('A');
	    loadLogs('B');
	    console.log(name, curr['role'], defs['role'], defs['core']);
	    var specDate = daySpec(text);
	    console.log('req date', specDate);
	    var day = raidDate(specDate, curr['core']);
	    console.log('date match', day);
	    if (day == -2) {
		message.channel.send('Sorry, but **Core ' + curr['core'] + '** does not run that day :frowning2:');
		return;
	    }
	    if (text[1] == 'r') { // raid listing requested
		if (debugMode) {
		    console.log('listing requested');
		}
		if (day != ALL) {
		    listRaid(channel, day);
		} else { // all week requested
		    var r = 'Showing all responses.\n';
		    for (var i = 0; i < raidNights['all'].length; i++) {
			r += '\n' + listRaid(undefined, raidNights['all'][i], false);
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
		    curr['class'] = defs['class']; // use default whenever none is given
		    if (curr['specs'].length == 0) { // also use default specs if there was none and the other data matches
			curr['specs'] = defs['specs'];
		    }
		}
		var status = 0;
		var timing = 0;
		if (text.includes(' late') && text.includes(' early')) {
		    timing = 1;
		} else if (text.includes(' late')) {
		    timing = 2;
		} else if (text.includes(' early')) {
		    timing = 3;
		}
		if (text[1] == 'm' || text.includes(' maybe')) { 
		    status = 2; // maybe
		} else if (text[1] == 'd' || text.includes(' decline') || text.includes(' no ') || text.includes(' not ')) { 
		    status = 3; // decline
		} else if (text[1] == 's' || text.includes(' yes ') || text.includes(' confirm')) { 
		    status = 1; // signup
		} else {
		    return;
		}
		if (status != 0) { // a valid response
		    if (curr['role'] == 0 && day != ALL) {
			curr = currentStatus(name, day); // check if one is set
		    }
		    var data = [status, curr['role'], curr['rss'], curr['class'], timing, curr['core'], name, nickname, url, curr['specs']]; // RESPONSE FILE SYNTAX
		    var appendix = '';
		    if (specDate == -1) { // no date was specified
			appendix = '\nYou have responded for the *next raid* which is on ' +
			    dayNames[day] + '; to specify a date, include a weekday in your command.';
		    }
		    if (data[indices['core']] == 'B' && !coreOn('B', day)) {
			message.channel.send('Sorry, but **Core B** only runs ' + coreDays('B') + ':frowning2:');
			return;
		    }
		    if (day != ALL) { // one-day response
			if (data[indices['core']] == 'B') {
			    if (text.includes('slot')) {
				var slot = parseInt(text.substring(text.indexOf('slot') + 4)) || 0;
				channel.send(signupForSlot(nickname, day, slot, text.includes('clear')));
			    } else {
				channel.send('To sign for Core B, please indicate the slot you want to fill by including *slot <number>* in your message. ' +
					     'DM me for information on all *slots* or a specific *slot <number>*.');
				return;
			    }
			} else { // core A
			    if (text.includes('slot')) {
				channel.send('Core A uses free-form signups; there is not slot to define. Type *' + prefixsymbol + 'h* and I will DM you instructions.');
				return;
			    } else {
				if (updateStatus(data, day)) { // an update on an existing response
				    channel.send(reply(data, day));
				} else { // a new response
				    addResponse(data, day, message, true);
				}
			    }
			}
		    } else { // response for all raids
			if (data[indices['core']] == 'B') {
			    if (text.includes('slot')) {
				var slot = parseInt(text.substring(text.indexOf('slot') + 4)) || 0;
				for (var i = 0; i < raidNights['B'].length; i++) {
				    var rn = raidNights['B'][i];
				    channel.send(signupForSlot(nickname, rn, slot, text.includes('clear')));
				}
			    } else {
				channel.send('To sign for Core B, please indicate the slot you want to fill by including *slot <number>* in your message. ' +
					     'DM me for information on all *slots* or a specific *slot <number>*.');
				return;
			    }
			} else { // core A
			    if (text.includes('slot')) {
				channel.send('Core A uses free-form signups, there is not slot to define.');
				return;
			    }
			    for (var i = 0; i < raidNights['all'].length; i++) {
				var rn = raidNights['all'][i];
				if (data[indices['core']] == 'A' || coreOn('B', rn)) {
				    if (!updateStatus(data, rn)) { // update if exists
					addResponse(data, rn, message, false, false); // add if it does not
				    }
				}
			    }
			}
			ack(data, day, message, reply(data, day) + appendix); // thank the user
		    }
		}
	    }
	}
    }
}

const drinks = [':wine_glass:', ':beers:', ':cocktail:', ':champagne:', ':beer:'];
const gifs = ['https://tenor.com/view/margarita-tequila-alcohol-drink-smh-gif-13358015',
	      'https://tenor.com/view/shots-dirtytalk-gif-8561333',
	      'https://media.giphy.com/media/12tCGGg5NuCO5O/giphy.gif',
	      'https://media.giphy.com/media/10pVtJi0VzADHa/giphy.gif',
	      'https://media.giphy.com/media/26gseZqYi0eofgYxy/giphy.gif',
	      'https://tenor.com/view/inna-drinking-drunk-trendizisst-drinking-wine-gif-14720190',
	      'https://tenor.com/view/tequila-happy-grandmas-gif-14416107'];
const coffee = 'https://media.giphy.com/media/TLCBaaTF5WYrs5inZi/giphy.gif';

const drunk = ['drunk', 'ivre', 'borrach', 'humala'];

client.on("message", (message) => {
    if (message.channel instanceof Discord.DMChannel) {
	console.log('chat');
	chat(message);
    } else if (message.content.startsWith(prefixsymbol)) {
	process(message);
    } else {
	var text = message.content.toLowerCase();
	if (text.includes('coffee')) {
	    message.channel.send(coffee);
	} else { 
	    var total = 0;
	    for (let i = 0; i < drunk.length; i++) {
		let word = drunk[i];
		if (text.includes(word)) {
		    let re = new RegExp(word, 'g');
		    total += (text.match(re)).length;
		}
	    }
	    if (total > 0) {
		var a = '';
		for (var i = 0; i < total; i++) {
		    a += ' ' + drinks[Math.floor(Math.random() * drinks.length)];
		}
		if (Math.random() > 0.8)  {
		    a += '\n' + gifs[Math.floor(Math.random() * gifs.length)];
		}
		message.channel.send(a);
	    }
	}
    }
});
var ID = fs.readFileSync('ch_token.txt').toString().trim();
client.login(ID);
