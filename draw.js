
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
	if (userData.length > indices['specs']) {
	    specs = userData[indices['specs']];
	}
	console.log(url);
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
    const bg = new Discord.MessageAttachment(canvas.toBuffer(), 'raid_' + day + '.png');
    if (bg != undefined) {
	channel.send(text, bg);
    } else {
	channel.send(text);
    }
    return;
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
	const bg = new Discord.MessageAttachment(canvas.toBuffer(), 'ack_' + day + '_' + name.replace(' ', '') + '.png');
	if (bg != undefined) {
	    message.channel.send(msg, bg);
	    return;
	}
    }
