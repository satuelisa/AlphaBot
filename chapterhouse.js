const Canvas = require('canvas');
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

let raid  = {};
let guild = undefined;

client.on("ready", () => {
    guild = client.guilds.cache.get('447444372439564288');
    console.log(guild.name);
});

'use strict';

const debugMode = true;
const { spawnSync } = require('child_process');
const separator = ' # ';
const roleInfo ='\nThe commands *!signup* and *!maybe* can be accompanied by role info: **d**amage, **s**upport/**u**tility, **h**eals, or **f**lexible (meaning you could take one of 2+ roles if needed). Also class (templar, DK, etc.) and primary resource (magicka or stamina) can be specified. You can also write a custom specification indicating any sets, skills, or ultimates you would like to mention by enclosing them in parenthesis.\n\nYou can set a default role with the *!default* command using the same role specifiers; once a default has been set, future sign-ups employ that role unless you specify another one.\n';
const dateInfo = '\nBy default, you will be responding to the next raid; you can use *Mon Tue Wed Thu Fri* to specify a date, whereas using *all* or *week* refers to the next five raids.\n';
const earlyLate = '\nYou can also include the words *late* or *early* to indicate if you will be joining late or leaving early (or even both).\n';
const feedback = '\nIf anything seems broken or unpleasant, just tag *satuelisa* and express your concerns. <:Agswarrior:552592567875928064>'; 
const options = roleInfo + earlyLate + dateInfo + '\nUse __!**sfh**__ to see this help text and __!**r**aid__ to just view the sign-ups.';
const help = '**Available commands:**\n__!**s**ignup__ if you will attend the next raid\n!__**m**aybe__ if you might be able to attend\n!__**d**ecline__ if you will not make it\n' + options;

const symbols = {0: ':confused:', 1: '**[D]**',
		 2: '**[S]**',
		 3: '**[H]**',
		 4: '**[F]**',
		 5: '**[-]**'}; // unavailable
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
const confirm = {1: 'confirmed', 2: 'possible', 3: 'unavailable'};
const raidNights = [1, 2, 3, 4, 5]; // Mon through Fri
const nextRaid = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 1, 6: 1};
const dayNames = {1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday',
		  6: 'Saturday', 7: 'Sunday', 8: 'the next five raids'};
const ALL = 8;
const stopWords = ["for", "as", "a", "an", "the", "of", "raid", "up",
		   "tonight", "today", "yo", "me", "sign", "up", "gift", "gods", "to", "please"];
const prefixList = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "all", "week"];
const indices = {'status': 0, 'role': 1,
		 'resource': 2, 'class': 3,
		 'timing': 4, 'name': 5,
		 'nick': 6, 'url': 7, 'specs': 8,
		 'defName': 0, 'defRole': 1,
		 'defRss': 2, 'defClass': 3, 'defSpecs': 4};
loadLogs();

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
    var specs = formatSpecs(data[indices['specs']]);
    if (debugMode) {
	console.log('reply for', day);
    }
    if (status != 3) {
	r += ' as ' + rssDescr[rID] + classDescr[cID] + roleDescr[role];
    }
    return r + specs + ' for ' + dayNames[day]  + timeDescr[timing] + ' ' +
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
	       || (text.includes(' w') && !text.includes(' wa') && !text.includes(' wi')) || text.includes(' a')) {
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
	if (f[indices['defName']] == name) { // default has already been set
	    var defs = {'role':  parseInt(f[indices['defRole']]),
			'rss': parseInt(f[indices['defRss']]),
			'class': parseInt(f[indices['defClass']]),
			'specs': ''};
	    if (f.length > indices['defSpecs']) {
		defs.specs = f[indices['defSpecs']];
	    }
	    return defs;
	}
    }
    return {'role': 0, 'rss': 0, 'class': 0, 'specs': ''};
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

async function ack(data, day, message, msg) {
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
    message.channel.send(msg);
    return;
}

function addResponse(data, day, message, thanks) {
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
    	ack(data, day, message, listing(undefined, day, false, false) + appendix);
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
    
function listing(channel, day) {
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
	var specs = formatSpecs(userData[indices['specs']]);
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
	    nickname = '**' + nickname + '**'; // boldface	    
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
	list += prefix + symbols[role] + ' ' + source[cID] + ' ' + nickname + specs + timeDescr[timing] + '\n';
    }
    return list;
}

function listRaid(channel, day) {
    var text = undefined;
    if (raid[day].length == 0) {
	text = '*Nobody* has responded for **' + dayNames[day] + '**  :frowning2:';
    } else {
	text = listing(channel, day);
    }
    if (channel != undefined && text != undefined) {
	console.log(channel, text);
	channel.send(text);
    } 
    return text;
}


function manageDefaults(name, nickname, defs, curr, channel) {
    if (curr['role'] != 0) {
	if (defs['role'] == curr['role'] && defs['class'] == curr['class']
	    && defs['rss'] == curr['rss'] && defs['specs'] == curr['specs']) {
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
		// DEFAULT FILE SYNTAX: <name> <role> <rss> <class> <specs>
		defaults[i] = [name, curr['role'], curr['rss'], curr['class'], curr['specs']].join(separator); 
		fs.writeFileSync('roles.log', defaults.join('\n')  + '\n', (err) => {
		    if (err) throw err;
		});
		channel.send('Default role for ' + nickname + ' has been updated as ' + repl + formatSpecs(curr['specs']));
		return;
	    }
	} 
	if (debugMode) {
	    console.log('default append');
	}
	var data = [name, curr['role'], curr['rss'], curr['class'], curr['specs']];
	fs.writeFileSync('roles.log', defaults.join('\n') + '\n' + data.join(separator), (err) => {
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
	    set += ' ' + symbols[defs['role']] + ' ' + source[defs['class']] + specs;
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
    if (!channel.name.includes('sf')) { // ignore other channels
	return;
    } else if (channel.name != 'sf-signup') {
	channel.send('I have been confined to the <#738954578602491946> channel.' +
		     ' Please talk to me there.')
	return;
    }
    if (text.includes('!clear')) {
	return; // that is for another bot
    }
    if (text.startsWith('!sfh')) {
	channel.send(help);
    } else if (text.startsWith('!') && 'dsmrt'.includes(text[1])) {	
	let user = message.member.user;
	let name = user.tag;
	let member = guild.member(message.author);
	let nickname = member ? member.displayName : undefined;	
	if (nickname == undefined) {
	    // skip the Discord ID number when making a default nickname
	    nickname = name.split('#')[0]; 
	}
	let url = message.author.displayAvatarURL();
	var curr = {'role': roleSelection(text),
		    'rss': rssSelection(text),
		    'class': classSelection(text),
		    'specs': specsSelection(text)};
	var defs = currentDefault(name);
	if (debugMode) {
	    console.log(text);
	}
	if (text.startsWith('!def')) { // default step requested with !default or !def
	    manageDefaults(name, nickname, defs, curr, channel);
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
		    listRaid(channel, day);
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
		    if (curr['specs'].length == 0) { // also use default specs if there was none and the other data matches
			curr['specs'] = defs['specs'];
		    }
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
		    var data = [status, curr['role'], curr['rss'], curr['class'], timing, name, nickname, url, curr['specs']]; // RESPONSE FILE SYNTAX
		    var appendix = '';
		    if (specDate == -1) { // no date was specified
			appendix = '\nYou have responded for the *next raid* which is on ' +
			    dayNames[day] + '; to specify a date, include a weekday in your command.';
		    }
		    if (day != ALL) { // one-day response
			if (updateStatus(data, day)) { // an update on an existing response
			    channel.send(reply(data, day));
			} else { // a new response
			    addResponse(data, day, message, true);
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
			ack(data, day, message, reply(data, day) + appendix); // thank the user
		    }
		}
	    }
	}
    }
}


client.on("message", (message) => {
    if (message.content.startsWith('!')) {
	process(message);
    }
});
var ID = fs.readFileSync('ch_token.txt').toString().trim();
client.login(ID);
