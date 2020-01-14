const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');

client.on("ready", () => {
  console.log("hustle");
});

'use strict';

const debugMode = false;

const { spawnSync } = require('child_process');

const separator = ' # ';
const roleInfo ='*!signup* and *!maybe* can be accompanied by role info: **d**amage, **s**upport/**u**tility, **h**eals, or **f**lexible (meaning you could take one of 2+ roles if needed). You can set a default role with the *!default* command using the same role specifiers; once a default has been set, future sign-ups employ that role unless you specify another one.';
const dateInfo = ' By default, you will be responding to the next raid; you can use *Mon Wed Sat Sun* to specify a date. ';
const help = 'Available commands:\n__!**s**ignup__ if you will attend the next raid\n!__**m**aybe__ if you might be able to attend\n!__**d**ecline__ if you will not make it\n\Optionally, ' + roleInfo + dateInfo + '\nUse __!**h**ustle__ to see this help text and __!**r**aid__ to just view the sign-ups. If anything seems broken or unpleasant, just tag *satuelisa* and express your concerns. <:Agswarrior:552592567875928064>'; 

const symbols = {0: ':confused:', 1: '<:damage:666756787550027776>', 2: ':shield:', 3: '<:healer:666430033245503489>', 4: ':recycle:', 5: ':frowning2:'};
const descr = {0: 'for an unspecified role', 1: 'as a damage dealer', 2: 'as a support/utility provider', 3: 'as a healer', 4: 'for a flexible spot'};
const confirm = {1: 'confirmed', 2: 'possible', 3: 'unavailable'};
const raidNights = [0, 1, 3, 6]; // Sun Mon Wed Sat
const nextRaid = {0: 1, 1: 3, 2: 3, 3: 3, 4: 6, 5: 6, 6: 0};
const dayNames = {0: 'Sunday', 1: 'Monday', 3: 'Wednesday', 6: 'Saturday'};
const stopWords = ["for", "as", "a", "an", "the", "of", "raid", "up", "tonight", "today", "yo", "me", "week", "sign", "up", "gift", "gods", "to", "please"];
const prefixList = ["mon", "sun", "sat", "wed"];

function filename(d) {
    return 'alphabot_' +  d + '.log';
}

function reply(status, role, day) {
    var r = 'You are *' + confirm[status] + '*';
    if (status != 3 && role > 0) {
	r += ' ' + descr[role];
    }
    return r + ' for ' + day + ' ' + symbols[role];
}

function daySpec(text) {
    if (text.includes(' mon')) {
	return 1;
    } else if (text.includes(' wed')) {
	return 3;
    } else if (text.includes(' sat')) {
	return 6;
    } else if (text.includes(' sun')) {
	return 0;
    }
    return -1; // none specified
}

function loadLogs() {
    var raid = {};
    for (var i = 0; i < raidNights.length; i++) {
	var rn = raidNights[i];
	raid[rn] = fs.readFileSync(filename(rn)).toString().trim().split('\n').filter(Boolean).sort();
    }
    return raid;
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
		if (spec.startsWith('d')) { // damage, dps, deeps, dmg
		    return 1;
		} else if (spec.startsWith('s') || spec.startsWith('u')) { // support, utility
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

function currentDefault(name) {
    var defaults = fs.readFileSync('roles.log').toString().trim().split('\n').filter(Boolean);
    for (var i = 0; i < defaults.length; i++) {
	var f = defaults[i].split(' ');
	if (f[0] == name) { // default has already been set
	    return parseInt(f[1]);
	}
    }
    return 0; // unspecified
}

function listing(day, resp) {
    var singular = '';
    var plural = 's';
    if (resp.length == 1) {
	plural = '';
	singular = 'a ';
    }
    var list = 'We have ' + singular +  resp.length + ' response' + plural + ' for **' + day + '** thus far.\n';
    var i = 1;
    var prev = 0;
    for (r in resp) {
	var userData = resp[r].split(separator);
	var status = parseInt(userData[0]);
	var role = parseInt(userData[1]);
	var name = userData[2].split('#')[0];
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
		list += '\n**Attending:**\n';
		firstYes = false;
	    }
	    prefix = i + '. ';
	    i++;
	    break;
	case 2: // maybe
	    if (firstMaybe) {
		list += '\n**Possibly attending:**\n';
		firstMaybe = false;
	    }	    
	    prefix = '? ';
	    break;
	case 3: // declined
	    if (firstNo) {
		list += '\n**Unable to attend:**\n';
		firstNo = false;
	    }	    
	    name = '~~' + name + '~~'; // crossed out
	    role = 5;
	    break;
	}
	list += prefix + symbols[role] + '  ' + name + '\n';
    }
    return list + '\nType *!hustle* for instructions on how to sign up or alter your response.';
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

function process(message) {
    var text = message.content.toLowerCase();
    if (text.startsWith('!h')) {
	message.channel.send(help);
    } else if (text.startsWith('!') && 'dsmdr'.includes(text[1])) {
	var name = message.member.user.tag.split('#')[0];
	var role = roleSelection(text);
	var defRole = currentDefault(name);
	if (role == 0) {
	    role = defRole; // use default whenever none is given
	}
	if (text.startsWith("!def")) { // default step requested with !default or !def
	    if (role != 0) {
		if (prevRole == role) {
		    message.channel.send('You had already set that as your default role ' + symbols[role]);
		    return;
		}
		var defaults = fs.readFileSync('roles.log').toString().trim().split('\n').filter(Boolean);
		if (defRole != 0 && role != defRole) { // replace old default
		    if (debugMode) {
			console.log('default update');
		    }
		    var i = 0;
		    for (; i < defaults.length; i++) {
			var f = defaults[i].split(' ');
			if (f[0] == name) { // entry to replace
			    defaults[i] = name + ' ' + role;
			    fs.writeFile('roles.log', defaults.join('\n'), (err) => {
				if (err) throw err;
			    });			
			    message.channel.send('Your default role has been updated to ' + descr[role] + ' ' + symbols[role]);
			    return;
			}
		    }
		}
		if (role != 0) {
		    if (debugMode) {
			console.log('default append');
		    }
		    fs.writeFile('roles.log', defaults.join('\n') + '\n' + name + ' ' + role, (err) => {
			if (err) throw err;
		    });
		    message.channel.send('Default role for ' + name + ' set ' + descr[role] + ' ' + symbols[role]);
		    return;
		}
	    } else { // !default was called with no role specified
		if (defRole != 0) {
		    message.channel.send('Your default is currently set ' + descr[role] + ' ' + symbols[role]);
		    return; // nothing more to do
		} 
		message.channel.send('You should specify which role to set as your default: **d**amage, **s**upport/**u**tility, **h**ealer, or **f**lexible.');
		return;
	    }
	} else { // response or raid listing (other raid commands than default)
	    var raid = loadLogs();
	    var date = new Date();
	    var weekDay = date.getDay();
	    if (raidNights.includes(weekDay)) {
		if (date.getHours() < 20) { // before eight on a raid Night
		    weekDay = (weekDay - 1) % 7; // sign up for today
		}
	    }
	    var requestedDate = nextRaid[weekDay]; // default is next raid
	    var day = dayNames[requestedDate];
	    var specDate = daySpec(text);
	    if (specDate != -1) {
		requestedDate = specDate;
	    }
	    if (debugMode) {
		console.log(name, role, defRole, specDate);
	    }
	    var resp = raid[requestedDate];
	    if (text[1] == 'r') { // raid listing requested
		if (resp.length == 0) {
		    message.channel.send('*Nobody has responded for ' + dayNames[requestedDate] + '*  :frowning2:');
		    return;
		}
		message.channel.send(listing(dayNames[requestedDate], resp));
		const redo = spawnSync ('python3', ['raid.py', requestedDate]);
		let embed = new Discord.RichEmbed();
		embed.setImage('https://elisa.dyndns-web.com/eso/raid_' + requestedDate + '.png?nocache=' + new Date().getTime()); // no cache
		message.channel.send(embed);
		return;
	    } else { // a new response has been given with !signup
		var status = 0;
		if (text[1] == 's') { // signup
		    status = 1;
		} else if (text[1] == 'm') { // maybe
		    status = 2;
		} else if (text[1] == 'd') { // decline
		    status = 3;
		} else {
		    if (debugMode) {
			console.log(text);
		    }
		    return;
		}
		if (status != 0) { // a valid response
		    var day = dayNames[requestedDate];
		    var user = message.member.user;
		    var data = [status, role, user.tag, user.avatarURL];
		    var repr = data.join(separator);
		    var pos = resp.indexOf(repr);
		    var prevRole = 0;
		    if (pos != -1) {
			var prevData = resp[pos].split(separator);
			prevRole = parseInt(prevData[1]);
			if (debugMode) {
			    console.log(name, prevRole);
			}
		    }
		    if (role !=0 && prevRole == role) { // no file update necessary
			if (debugMode) {
			    console.log('response already set');
			}
			message.channel.send(reply(status, role, day));
			return;
		    }
		    if (role == 0 && prevRole != 0) {
			role = prevRole; // retaining previous role
			data[1] = role;
			repr = data.join(separator);
		    }
		    if (pos != -1) { // update existing sign-up info
			if (debugMode) {
			    console.log('update response');
			}
			resp[pos] = repr;
			message.channel.send(reply(status, role, day));
			// rewrite the file with the updated info
			fs.writeFile(filename(requestedDate), resp.join('\n') + '\n', (err) => {
			    if (err) throw err;
			});
			return;
		    } else { // append a new response
			if (debugMode) {
			    console.log('append response');
			}
			var nameText = confirm[status]; 
			if (status == 1 || status == 2) {
			    nameText += ' ' + descr[role];
			}
			var embed = new Discord.RichEmbed()
			    .setTitle("Alpha Squad RSVP for " + day)
			    .setAuthor(nameText, message.author.avatarURL)
			    .setDescription("Thank you for letting us know! " + symbols[role]);
			message.channel.send(embed);
			if (specDate == -1) { // no date was specified
			    message.channel.send('You have signed up for *next raid* which is on ' + day + ' ; to specify a date, include one of Mon Wed Sat Sun in your command.');
			} 
			if (role == 0) {
			    message.channel.send(roleInfo);			    
			}
			resp.push(repr);
			resp = resp.sort();			
			fs.appendFile(filename(requestedDate), repr + '\n', (err) => {
			    if (err) throw err;
			});
			message.channel.send(listing(dayNames[requestedDate], resp));
			return;
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
