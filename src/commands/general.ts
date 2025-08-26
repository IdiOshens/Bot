
/// <reference types="node" />
import { proto, WASocket, jidNormalizedUser } from '@whiskeysockets/baileys';
import { CommandHandlerParams, BotMode, Command } from '../types';
import * as config from '../config'; 
import os from 'os';
import { infobot as getInfoBotContent } from './general'; // Import infobot to get its content

let botStartTime = Date.now();

const commandHeader = (title: string, icon: string = "✨") => `╭─⊷「 ${icon} ${config.BOT_NAME.toUpperCase()} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const listItem = (text: string) => `│ ◦ ${text}`;
const sectionSeparator = () => `│`;

export const ping = async ({ sock, msg, botName }: CommandHandlerParams) => {
    const prepStartTime = Date.now();
    // Send a very small, quick message to estimate latency
    const tempMsg = await sock.sendMessage(msg.key.remoteJid!, { text: 'Pinging...' });
    const latency = Date.now() - prepStartTime;

    let pingResponse = `${commandHeader("Ping", "🏓")}\n`;
    pingResponse += `│ 💬 Status: Pong!\n`;
    pingResponse += `│ ⏱️ Approx. Latency: ${latency}ms\n`;
    pingResponse += commandFooter();
    
    // Delete the temporary "Pinging..." message
    if (tempMsg && tempMsg.key) {
        await sock.sendMessage(msg.key.remoteJid!, { delete: tempMsg.key });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: pingResponse }, { quoted: msg });
};
ping.description = "Checks the bot's responsiveness and network latency.";
ping.category = "general";

export const alive = async ({ sock, msg, botName, prefix, ownerNumbers }: CommandHandlerParams) => {
    const uptime = formatUptime((process as NodeJS.Process).uptime());
    const ownerName = ownerNumbers[0] ? ownerNumbers[0].split('@')[0] : "Not Specified";
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let aliveMessage = `╭─⊷「 🟢 ${botName.toUpperCase()} IS ALIVE 🟢 」\n`;
    aliveMessage += `│ 👋 Hello there! *${botName}* is up and running.\n`;
    aliveMessage += sectionSeparator();
    aliveMessage += `│ 🟢 Status: Operational\n`;
    aliveMessage += `│ ⏰ Uptime: ${uptime}\n`;
    aliveMessage += `│ ⚙️ Mode: *${config.BOT_MODE.toUpperCase()}*\n`;
    aliveMessage += `│ #️⃣ Prefix: *${prefix}*\n`;
    aliveMessage += `│ 👑 Owner: @${ownerName}\n`;
    aliveMessage += `│ 🗓️ Date: ${currentDate} | ${currentTime}\n`;
    aliveMessage += sectionSeparator();
    aliveMessage += `│ Type *${prefix}menu* to explore my features!\n`;
    aliveMessage += commandFooter();

    await sock.sendMessage(msg.key.remoteJid!, { 
        image: { url: config.BOT_IMAGE_URL },
        caption: aliveMessage, 
        mentions: ownerNumbers 
    }, { quoted: msg });
};
alive.description = "Checks if the bot is online and provides basic info.";
alive.category = "general";

export const uptime = async ({ sock, msg, botName }: CommandHandlerParams) => {
    const uptimeSeconds = (process as NodeJS.Process).uptime();
    const d = Math.floor(uptimeSeconds / (3600 * 24));
    const h = Math.floor(uptimeSeconds % (3600 * 24) / 3600);
    const m = Math.floor(uptimeSeconds % 3600 / 60);
    const s = Math.floor(uptimeSeconds % 60);
    const serverTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let uptimeMessage = `${commandHeader("Uptime", "⏳")}\n`;
    uptimeMessage += sectionSeparator();
    uptimeMessage += `│ I, *${botName}*, have been diligently serving you for:\n`;
    uptimeMessage += `│   Days: ${d}\n`;
    uptimeMessage += `│   Hours: ${h}\n`;
    uptimeMessage += `│   Minutes: ${m}\n`;
    uptimeMessage += `│   Seconds: ${s}\n`;
    uptimeMessage += sectionSeparator();
    uptimeMessage += `│ Current Server Time: ${serverTime}\n`;
    uptimeMessage += commandFooter();

    await sock.sendMessage(msg.key.remoteJid!, { text: uptimeMessage });
};
uptime.description = "Shows how long the bot has been online.";
uptime.category = "general";


export const owner = async ({ sock, msg }: CommandHandlerParams) => {
    const ownerName = "Zark Bryan"; // Bot author
    const ownerContact = config.OWNER_NUMBERS[0] ? config.OWNER_NUMBERS[0].split('@')[0] : "Not specified"; 
    
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName} (${config.BOT_NAME} Owner)\nORG:${config.BOT_NAME};\nTEL;type=CELL;type=VOICE;waid=${ownerContact}:+${ownerContact}\nPHOTO;TYPE=JPEG;ENCODING=BASE64:${(await getBotImageBase64()) || ''}\nNOTE:The creative mind behind ${config.BOT_NAME}. Created by Zark Bryan.\nEND:VCARD`;
    
    let ownerMessage = `${commandHeader("Bot Owner", "👑")}\n`;
    ownerMessage += `│ 👑 Bot Creator & Maintainer: *${ownerName}*\n`;
    ownerMessage += `│ 📞 Contact: @${ownerContact}\n`;
    ownerMessage += `│ 💡 Inspiration: Zark Bryan\n`;
    ownerMessage += `│ ✨ Thank you for using ${config.BOT_NAME}!\n`;
    ownerMessage += commandFooter();

    await sock.sendMessage(msg.key.remoteJid!, {
        contacts: {
            displayName: `${ownerName} (${config.BOT_NAME} Owner)`,
            contacts: [{ vcard }]
        }
    });
    await sock.sendMessage(msg.key.remoteJid!, { text: ownerMessage, mentions: [config.OWNER_NUMBERS[0]] });
};
owner.description = "Displays the bot owner's contact information.";
owner.category = "general";

async function getBotImageBase64() {
    try {
        const response = await fetch(config.BOT_IMAGE_URL);
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
    } catch (e) {
        console.warn("Could not fetch bot image for vCard:", e);
        return null;
    }
}


export const sudo = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    // This command is now for adding/removing sudo users.
    // The actual check for sudo access is in commandHandler.ts
    const senderId = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(senderId)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "❌ This command is for the bot owner only to manage sudo users." });
    }

    if (args.length < 2 || !['add', 'remove', 'del', 'list'].includes(args[0].toLowerCase())) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .sudo add|remove|list [@user/number]" });
    }

    const action = args[0].toLowerCase();
    
    if (action === 'list') {
        let listText = `${commandHeader("Sudo Users List", "🛡️")}\n`;
        if (config.SUDO_USERS.length === 0) {
            listText += "│ No sudo users configured.\n";
        } else {
            config.SUDO_USERS.forEach((jid, index) => {
                listText += `│ ${index + 1}. @${jid.split('@')[0]}\n`;
            });
        }
        listText += commandFooter();
        await sock.sendMessage(msg.key.remoteJid!, { text: listText, mentions: config.SUDO_USERS });
        return;
    }

    let targetJidInput = args[1];
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mention) {
        targetJidInput = mention;
    } else if (targetJidInput.startsWith('@')) {
        targetJidInput = `${targetJidInput.substring(1)}@s.whatsapp.net`;
    } else if (targetJidInput.match(/^\d+$/)) {
        targetJidInput = `${targetJidInput}@s.whatsapp.net`;
    }

    const targetJid = jidNormalizedUser(targetJidInput);
    if (!targetJid || !targetJid.includes('@s.whatsapp.net')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Invalid user specified. Please mention or provide a valid WhatsApp number." });
    }

    if (action === 'add') {
        if (config.SUDO_USERS.includes(targetJid)) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `User @${targetJid.split('@')[0]} is already a sudo user.`, mentions: [targetJid] });
        }
        config.addSudoUser(targetJid);
        await sock.sendMessage(msg.key.remoteJid!, { text: `🛡️ User @${targetJid.split('@')[0]} added to sudo list. They can now use the bot even in private mode.`, mentions: [targetJid] });
    } else if (action === 'remove' || action === 'del') {
        if (!config.SUDO_USERS.includes(targetJid)) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `User @${targetJid.split('@')[0]} is not in the sudo list.`, mentions: [targetJid] });
        }
        config.removeSudoUser(targetJid);
        await sock.sendMessage(msg.key.remoteJid!, { text: `🛡️ User @${targetJid.split('@')[0]} removed from sudo list.`, mentions: [targetJid] });
    }
};
sudo.description = "Manages sudo users (add/remove/list). Sudo users can use the bot in private mode. Owner only.";
sudo.category = "owner_panel";
sudo.ownerOnly = true;
sudo.usage = ".sudo <add|remove|list> <@user/number>";


export const infobot = async ({ sock, msg, botName, prefix, ownerNumbers, ai, logger }: CommandHandlerParams) => { // Added ai, logger to params
    const uptime = formatUptime((process as NodeJS.Process).uptime());
    const osInfo = `${os.type()} ${os.release()} (${os.arch()})`;
    const nodeVersion = (process as NodeJS.Process).version;
    const memoryUsage = `${((process as NodeJS.Process).memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`;
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;

    let infoText = `╭─⊷「*${botName.toUpperCase()}* - *INFO*」\n`;
    infoText += `│ ✨ *Version:* 1.0.1 (Custom Build by Zark Bryan)\n`; // Increment version slightly
    infoText += `│ ✨ *Prefix:* *${prefix}*\n`;
    infoText += `│ ✨ *Mode:* *${config.BOT_MODE.toUpperCase()}*\n`;
    infoText += `│ ✨ *Uptime:* ${uptime}\n`;
    infoText += `│ 👤 *Owner(s):*\n`;
    config.OWNER_NUMBERS.forEach(n => {
        infoText += `    - @${n.split('@')[0]}\n`;
    });
    infoText += sectionSeparator();
    infoText += commandFooter();

    return { text: infoText.trim(), mentions: config.OWNER_NUMBERS };
};
infobot.description = "Displays detailed information about the bot.";
infobot.category = "general";


// This is a global variable to store user menu states.
// In a more complex bot, this might be in a database or a dedicated state management solution.
export const userMenuContext: { [userId: string]: { state: string, currentCategory?: string } } = {};

const userCategoriesConfig: { title: string; key: string; emoji: string; }[] = [
    { title: "AI & Chat", key: "ai_chat", emoji: "🧠" },
    { title: "Tools", key: "tools", emoji: "🛠️" },
    { title: "Converters", key: "converters", emoji: "🔄" },
    { title: "Games & Fun", key: "games_fun", emoji: "🎮" },
    { title: "Downloads", key: "downloads", emoji: "📥" },
    { title: "Media", key: "media", emoji: "🖼️" }, 
    { title: "Religion", key: "religion", emoji: "🕌" },
    { title: "Group Tools", key: "group", emoji: "👥" },
    { title: "Economy", key: "economy", emoji: "💰" }
];


export const menu = async ({ sock, msg, prefix, allCommands, botName, ownerNumbers, ai, logger }: CommandHandlerParams & { allCommands: Map<string, Command>}) => {
    const senderName = msg.pushName || "User";
    const greeting = getGreeting();
    const userId = msg.key.participant || msg.key.remoteJid!;
    
    // Set user to main menu
    userMenuContext[userId] = { state: "main_menu" };

    // Get infobot content
    const infoBotData = await getInfoBotContent({ sock, msg, prefix, botName, ownerNumbers, command: 'infobot', args: [], fullArgs: '', ai, logger });


    let menuHeader = `${infoBotData.text}\n`; // Use infobot content as header
    menuHeader += `╭─⊷「 ✨ *${botName.toUpperCase()} CATEGORIES* ✨ 」\n`;
    menuHeader += `│ 👋 Hello, ${senderName}! ${greeting}\n`;
    menuHeader += `│ My prefix is: *${prefix}*\n`;

    let menuBody = "";
    userCategoriesConfig.forEach((cat, index) => {
        menuBody += `│  ${index + 1}. ${cat.emoji} ${cat.title}\n`;
    });
    
    let menuFooter = sectionSeparator() + "\n";
    menuFooter += `│ Reply with '0' to exit this menu.\n`;
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (ownerNumbers.includes(jidNormalizedUser(senderJid))) {
        menuFooter += `│ Owner: Use *${prefix}allcmds* for the full command list.\n`;
    }
    menuFooter += commandFooter();
    
    const fullMenu = menuHeader + menuBody + menuFooter;

    await sock.sendMessage(msg.key.remoteJid!, { 
        image: { url: config.BOT_IMAGE_URL }, 
        caption: fullMenu.trim(),
        mimetype: 'image/jpeg',
        mentions: infoBotData.mentions 
    }, { quoted: msg });
};
menu.description = "Shows the interactive command menu with bot info.";
menu.category = "general";

export async function displayCategoryCommands(
    sock: WASocket, 
    chatId: string, 
    categoryKey: string, 
    allCommands: Map<string, Command>, 
    prefix: string,
    botName: string
) {
    const category = userCategoriesConfig.find(c => c.key === categoryKey);
    if (!category) {
        await sock.sendMessage(chatId, { text: "Invalid category selected." });
        return;
    }

    let commandsListText = "";
    let commandsFound = false;

    // Filter commands: exclude ownerOnly unless it's the owner_panel category itself
    // And exclude commands that are specifically aliases if the main command is already listed.
    const uniqueCommands = new Map<string, Command>();
    Array.from(allCommands.values()).forEach(cmd => {
        if (!uniqueCommands.has(cmd.name)) {
            uniqueCommands.set(cmd.name, cmd);
        }
    });


    if (category.key === "media") { 
        const mediaCommands = Array.from(uniqueCommands.values()).filter(cmd => 
            (cmd.category === "wallpapers" || cmd.category === "waifu" || cmd.category === "reactions") && !cmd.ownerOnly
        ).sort((a,b) => a.name.localeCompare(b.name));

        if (mediaCommands.length > 0) {
            commandsFound = true;
            mediaCommands.forEach(cmd => {
                const usage = cmd.usage ? ` _${cmd.usage.replace(new RegExp(`^\\${prefix}${cmd.name}\\s*`), '').trim()}_` : '';
                commandsListText += `│  ◦ ${prefix}${cmd.name}${usage}\n`;
            });
        }
    } else {
        const commandsInCategory = Array.from(uniqueCommands.values()).filter(cmd => 
            cmd.category === category.key && (category.key === "owner_panel" || !cmd.ownerOnly) // Show ownerOnly for owner_panel
        ).sort((a,b) => a.name.localeCompare(b.name));

        if (commandsInCategory.length > 0) {
            commandsFound = true;
            commandsInCategory.forEach(cmd => {
                const usage = cmd.usage ? ` _${cmd.usage.replace(new RegExp(`^\\${prefix}${cmd.name}\\s*`), '').trim()}_` : '';
                commandsListText += `│  ◦ ${prefix}${cmd.name}${usage}\n`;
            });
        }
    }

    if (!commandsFound) {
        commandsListText = "│  No commands available in this category for users.\n";
    }
    
    let categoryMenu = `${commandHeader(`${category.emoji} ${category.title.toUpperCase()} COMMANDS`, category.emoji)}\n`;
    categoryMenu += `│ Prefix: *${prefix}*\n`;
    categoryMenu += sectionSeparator();
    categoryMenu += commandsListText;
    categoryMenu += sectionSeparator();
    categoryMenu += `│ Reply with '0' to go back to the main menu.\n`;
    categoryMenu += commandFooter();

    await sock.sendMessage(chatId, { text: categoryMenu.trim() });
}


export function formatUptime(seconds: number): string {
    seconds = Number(seconds);
    if (isNaN(seconds) || seconds < 0) return "Calculating...";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    let str = "";
    if (d > 0) str += `${d}d `;
    if (h > 0) str += `${h}h `;
    if (m > 0) str += `${m}m `;
    if (s > 0 || str === "") str += `${s}s`; 
    
    return str.trim() || "Just started!";
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up or early bird?";
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    if (hour < 21) return "Good Evening!";
    return "Good Night!";
}

// Function to get all registered commands (used by index.ts for interactive menu)
export function getAllMenuCategories() {
    return userCategoriesConfig;
}
