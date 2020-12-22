const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const header = 'CH SF Core B small-scale sign-up reminder';

// bubbles satuelisa twitchy boober dork abin emy
const reminder = "Please *react* with the symbol of your class if you are attending *tomorrow night's raid* and the last one otherwise\n\n:skull: for **necromancer**\n:seedling: for **warden**\n :mage: for **sorcerer**\n:blue_heart: for **templar**\n:no_entry: if you *cannot make it*\n\n<@356144076338233344> <@184425873531731969> <@313168380951527434> <@343529517597327361> <@212724658296848384> <@250126423409295360> <@229277321071165440>\n\nIf there are not *six or more sign-ups by noon* of the day of the raid, the raid will be **cancelled**."; 

const test = "this is a test :skull: :seedling: :mage: :blue_heart: :no_entry:  <@184425873531731969>";

var ID = fs.readFileSync('/home/elisa/jobs/alphabot/reminder_token.txt').toString().trim();
client.login(ID);

const ch = '447444372439564288'; 
const general = '447444372884029440';
const signup = '738954578602491946';
const testing = false;
var gch = undefined;
var sch = undefined;

client.on("ready", () => {
    console.log("preparado para chingar");
    var guild = client.guilds.cache.get(ch);
    if (guild) {
	gch = guild.channels.cache.get(general);
	sch = guild.channels.cache.get(signup);
	console.log('channels found');
	if (testing) {
	    gch.send(test);
	} else {
	    sch.send('**' + header + '**\n\n' + reminder);
	}
    }
})

function reactions(message) {
    message.react('💀');
    message.react('🌱');
    message.react('🧙');
    message.react('💙');
    message.react('⛔');
    setTimeout(function () {
	console.log('leaving');
	client.destroy();		
    }, 10000);
}

client.on("message", (message) => {	  
    var text = message.content;
    if (testing) {
	if (text.includes('testing')) {
	    reactions(message);
	}
    } else {
	if (text.includes(header)) {
	    reactions(message);
	}
    }
});
