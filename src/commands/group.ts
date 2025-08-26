import { CommandHandlerParams, Command } from '../types'; 
import { isGroupAdmin, isBotAdmin, getGroupJid } from '../utils/utils';
import { proto, downloadMediaMessage, jidNormalizedUser } from '@whiskeysockets/baileys'; 
import { OWNER_NUMBERS, BOT_NAME } from '../config'; 
import fs from 'fs';
import path from 'path';
import os from 'os';

const TEMP_DIR_VCF = path.join(os.tmpdir(), 'zark_bots_vcf');
if (!fs.existsSync(TEMP_DIR_VCF)) {
    fs.mkdirSync(TEMP_DIR_VCF, { recursive: true });
}

const commandHeader = (title: string, icon: string = "👥") => `╭─⊷「 ${icon} ${BOT_NAME} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const sectionSeparator = () => `│`;

const safeIsGroupAdmin = async (sock: any, groupJid: string, participantJid: string): Promise<boolean> => {
    try {
        return await isGroupAdmin(sock, groupJid, jidNormalizedUser(participantJid));
    } catch (e) {
        console.error('safeIsGroupAdmin error:', e);
        return false;
    }
};
const safeIsBotAdmin = async (sock: any, groupJid: string): Promise<boolean> => {
    try {
        return await isBotAdmin(sock, groupJid);
    } catch (e) {
        console.error('safeIsBotAdmin error:', e);
        return false;
    }
};

// linkgroup
export const linkgroup: Command = async ({ sock, msg }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const code = await sock.groupInviteCode(chatId);
        const link = `https://chat.whatsapp.com/${code}`;
        let linkMessage = `${commandHeader("Group Invite Link", "🔗")}\n`;
        linkMessage += `│ 🔗 Here is the invite link for *${groupMetadata.subject}*:\n`;
        linkMessage += `│ ${link}\n`;
        linkMessage += commandFooter();
        await sock.sendMessage(chatId, { text: linkMessage });
    } catch {
        await sock.sendMessage(chatId, { text: "Couldn't get the group invite link. Am I an admin or has the link been reset recently?" });
    }
};
linkgroup.description = "Gets the invite link for the current group.";
linkgroup.category = "group";
linkgroup.groupOnly = true;

// setppg
export const setppg: Command = async ({ sock, msg, logger }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await safeIsGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can change the group icon." });
        return;
    }
    if (!await safeIsBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!msg.message || (!msg.message.imageMessage && !quotedMsg?.imageMessage)) {
        await sock.sendMessage(chatId, { text: "Please reply to an image or send an image with the command to set it as the group icon." });
        return;
    }
    const messageWithImage = quotedMsg ? { key: msg.key, message: quotedMsg } as proto.IWebMessageInfo : msg;
    try {
        const buffer = await downloadMediaMessage(
            messageWithImage, 
            'buffer', 
            {}, 
            { logger, reuploadRequest: sock.updateMediaMessage } 
        );
        await sock.updateProfilePicture(chatId, buffer as Buffer);
        await sock.sendMessage(chatId, { text: "✅ Group icon updated successfully!" });
    } catch {
        await sock.sendMessage(chatId, { text: "Failed to set group icon. Please ensure the image is valid." });
    }
};
setppg.description = "Sets the group profile picture (reply to an image or send with caption). Admin only.";
setppg.category = "group";
setppg.groupOnly = true;
setppg.adminOnly = true;
setppg.botAdminOnly = true;

// setname
export const setname: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await safeIsGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can change the group name." });
        return;
    }
    if (!await safeIsBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }
    if (!fullArgs) {
        await sock.sendMessage(chatId, { text: "Please provide a new name for the group. Usage: .setname <new_name>" });
        return;
    }
    try {
        await sock.groupUpdateSubject(chatId, fullArgs);
        await sock.sendMessage(chatId, { text: `✅ Group name updated to: ${fullArgs}` });
    } catch {
        await sock.sendMessage(chatId, { text: "Failed to set group name." });
    }
};
setname.description = "Sets the group name. Admin only.";
setname.category = "group";
setname.groupOnly = true;
setname.adminOnly = true;
setname.botAdminOnly = true;
setname.usage = ".setname <new_name>";

// setdesc
export const setdesc: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await safeIsGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can change the group description." });
        return;
    }
    if (!await safeIsBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }
    try {
        await sock.groupUpdateDescription(chatId, fullArgs);
        await sock.sendMessage(chatId, { text: `✅ Group description updated.` });
    } catch {
        await sock.sendMessage(chatId, { text: "Failed to set group description." });
    }
};
setdesc.description = "Sets the group description. Admin only.";
setdesc.category = "group";
setdesc.groupOnly = true;
setdesc.adminOnly = true;
setdesc.botAdminOnly = true;
setdesc.usage = ".setdesc <new_description>";

// group open/close
export const group: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await safeIsGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can modify group settings." });
        return;
    }
    if (!await safeIsBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }
    if (args.length === 0) {
        await sock.sendMessage(chatId, { text: "Usage: .group <open|close>" });
        return;
    }
    const action = args[0].toLowerCase();
    try {
        if (action === 'open') {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, { text: "🔓 Group opened. All members can send messages." });
        } else if (action === 'close') {
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, { text: "🔒 Group closed. Only admins can send messages." });
        } else {
            await sock.sendMessage(chatId, { text: "Invalid action. Use 'open' or 'close'." });
        }
    } catch {
        await sock.sendMessage(chatId, { text: "Failed to update group settings." });
    }
};
group.description = "Opens or closes the group (only admins can send messages when closed). Admin only.";
group.category = "group";
group.groupOnly = true;
group.adminOnly = true;
group.botAdminOnly = true;
group.usage = ".group <open|close>";

// ... Continue rewriting EVERY other command in this file, always using safeIsGroupAdmin/safeIsBotAdmin for admin/bot admin checks,
// always normalizing JIDs, and following your previous structure for replies/results/errors/descriptions/categories/usage.


export const groupinfo: Command = async ({ sock, msg }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        let info = `${commandHeader("Group Info: " + metadata.subject, "ℹ️")}\n`;
        info += `│ *ID:* ${metadata.id}\n`;
        info += `│ *Created:* ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleString() : 'Unknown'}\n`;
        info += `│ *Owner:* ${metadata.owner ? `@${metadata.owner.split('@')[0]}` : 'Unknown'}\n`;
        info += `│ *Members:* ${metadata.participants.length}\n`;
        
        let descText = metadata.desc?.toString() || 'No description';
        if (descText.length > 200) descText = descText.substring(0, 200) + "..."; // Truncate long descriptions
        info += `│ *Description:*\n│ ${descText}\n`;
        
        const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        info += sectionSeparator();
        info += `│ *Admins (${admins.length}):*\n`;
        admins.forEach(admin => {
            info += `│  ◦ @${admin.id.split('@')[0]}\n`;
        });
        info += commandFooter();

        const mentions = [metadata.owner, ...admins.map(a => a.id)].filter(Boolean) as string[];
        await sock.sendMessage(chatId, { text: info, mentions });
    } catch (e) {
        console.error("Error fetching group info:", e);
        await sock.sendMessage(chatId, { text: "Could not fetch group information." });
    }
};
groupinfo.description = "Displays information about the current group.";
groupinfo.category = "group";
groupinfo.groupOnly = true;

// Persist these settings in a DB or file for production bots
let welcomeEnabled: { [groupId: string]: boolean } = {};
let goodbyeEnabled: { [groupId: string]: boolean } = {}; // Added for consistency if you plan to implement .goodbye

export const welcome: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can manage welcome messages." });
        return;
    }
    
    if (args.length === 0) {
        await sock.sendMessage(chatId, { text: `Welcome messages are currently ${welcomeEnabled[chatId] ? 'ON' : 'OFF'}. Usage: .welcome <on|off>` });
        return;
    }
    const action = args[0].toLowerCase();
    if (action === 'on') {
        welcomeEnabled[chatId] = true;
        await sock.sendMessage(chatId, { text: '✅ Welcome messages enabled for this group.' });
    } else if (action === 'off') {
        welcomeEnabled[chatId] = false;
        await sock.sendMessage(chatId, { text: '❌ Welcome messages disabled for this group.' });
    } else {
        await sock.sendMessage(chatId, { text: 'Invalid action. Use "on" or "off".' });
    }
};
welcome.description = "Toggles welcome messages for new members. Admin only.";
welcome.category = "group";
welcome.groupOnly = true;
welcome.adminOnly = true;

export const isWelcomeEnabled = (groupId: string) => welcomeEnabled[groupId] || false;
export const isGoodbyeEnabled = (groupId: string) => goodbyeEnabled[groupId] || false; 


export const kick: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can kick members." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const targetJidsFromArgs = args.map(arg => arg.startsWith('@') ? `${arg.substring(1)}@s.whatsapp.net` : (arg.match(/^\d+$/) ? `${arg}@s.whatsapp.net` : null)).filter(j => j) as string[];
    const allTargets = [...new Set([...mentions, ...targetJidsFromArgs])];

    if (allTargets.length === 0) {
        const replyParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (replyParticipant) {
            allTargets.push(replyParticipant);
        } else {
           await sock.sendMessage(chatId, { text: "Please mention, reply to, or provide the number of the user to kick. Usage: .kick @user or .kick 1234567890" });
           return;
        }
    }
    
    const results = [];
    const kickedJids: string[] = [];
    for (const targetJid of allTargets) {
        const normalizedTargetJid = jidNormalizedUser(targetJid);
        if (OWNER_NUMBERS.map(owner => jidNormalizedUser(owner)).includes(normalizedTargetJid)) {
            results.push(`🛡️ Cannot kick my owner: @${normalizedTargetJid.split('@')[0]}`);
            continue;
        }
        if (normalizedTargetJid === jidNormalizedUser(sock.user?.id || "")) {
            results.push(`🤦 I cannot kick myself.`);
            continue;
        }
        if (await isGroupAdmin(sock, chatId, normalizedTargetJid)) { 
            results.push(`🛡️ Cannot kick an admin: @${normalizedTargetJid.split('@')[0]}. Demote them first.`);
            continue;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, [normalizedTargetJid], "remove");
            results.push(`✅ Kicked @${normalizedTargetJid.split('@')[0]}`);
            kickedJids.push(normalizedTargetJid);
        } catch (e: any) {
            console.error(`Error kicking ${normalizedTargetJid}:`, e);
            results.push(`❌ Failed to kick @${normalizedTargetJid.split('@')[0]}. Error: ${e.message}`);
        }
    }
    await sock.sendMessage(chatId, { text: results.join('\n'), mentions: [...allTargets, ...kickedJids] });
};
kick.description = "Kicks a user from the group. Admin only.";
kick.category = "group";
kick.groupOnly = true;
kick.adminOnly = true;
kick.botAdminOnly = true;
kick.usage = ".kick @user or .kick <number> or reply to user's message";


export const add: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can add members." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }
    
    if (args.length === 0) {
        await sock.sendMessage(chatId, { text: "Please provide the number(s) of the user(s) to add. Usage: .add <number> [number2] [number3] ..." });
        return;
    }
    const targetJids = args
        .map(arg => arg.replace(/\D/g, '')) 
        .filter(num => num.length > 5 && num.length < 20) 
        .map(num => `${num}@s.whatsapp.net`);
    
    if (targetJids.length === 0) {
        await sock.sendMessage(chatId, { text: "No valid numbers provided. Ensure numbers are correct. Usage: .add <number> [number2] ..." });
        return;
    }
    
    const results: string[] = [];
    const addedJids: string[] = [];
    for (const targetJid of targetJids) {
        try {
            const response = await sock.groupParticipantsUpdate(chatId, [targetJid], "add");
            const resultAction = response[0];
            const status = resultAction?.status?.toString(); 
            
            const targetMention = `@${targetJid.split('@')[0]}`;
    
            if (status === "200") { 
                results.push(`✅ Added ${targetMention} to the group.`);
                addedJids.push(targetJid);
            } else if (status === '403') { 
                results.push(`❌ Could not add ${targetMention}. User's privacy settings prevent it, or they are not on WhatsApp, or they blocked the bot.`);
            } else if (status === '408') { 
                results.push(`❌ Could not add ${targetMention}. They may have recently left the group or could not be reached. An invite might be sent instead.`);
                 if (resultAction.invite_code) {
                    results.push(`🔗 Invite Code: ${resultAction.invite_code} (Expires: ${resultAction.invite_code_exp ? new Date(resultAction.invite_code_exp * 1000).toLocaleTimeString() : 'N/A'})`);
                }
            } else if (status === '409') { 
                results.push(`👥 ${targetMention} is already in the group.`);
            } else if (status === '401') { 
                results.push(`❌ Could not add ${targetMention}. I am not authorized (perhaps I'm not admin anymore?).`);
            } else if (status === '404') { 
                results.push(`❌ User ${targetMention} not found on WhatsApp.`);
            } else if (status?.startsWith("207")) { 
                results.push(`⚠️ Added ${targetMention} with mixed results (some operations might have failed if multiple users were part of this specific sub-action).`);
                addedJids.push(targetJid);
            }
            else { 
                results.push(`⚠️ Failed to add ${targetMention}. Response status/error: ${status || 'Unknown'}. Full response: ${JSON.stringify(resultAction)}`);
            }
        } catch (e: any) {
            console.error(`Error adding ${targetJid}:`, e);
            results.push(`❌ Failed to add @${targetJid.split('@')[0]}. Error: ${e.message}`);
        }
    }
    await sock.sendMessage(chatId, { text: results.join('\n'), mentions: [...targetJids, ...addedJids] });
};
add.description = "Adds a user to the group by number. Admin only.";
add.category = "group";
add.groupOnly = true;
add.adminOnly = true;
add.botAdminOnly = true;
add.usage = ".add <number_without_+_or_spaces> [number2 ...]";


export const promote: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can promote members." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const targetJidsFromArgs = args.map(arg => arg.startsWith('@') ? `${arg.substring(1)}@s.whatsapp.net` : (arg.match(/^\d+$/) ? `${arg}@s.whatsapp.net` : null)).filter(j => j) as string[];
    let allTargets = [...new Set([...mentions, ...targetJidsFromArgs])];
    
    if (allTargets.length === 0) {
        const replyParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (replyParticipant) {
            allTargets.push(replyParticipant);
        } else {
             await sock.sendMessage(chatId, { text: "Please mention, reply to, or provide the number of the user to promote. Usage: .promote @user" });
             return;
        }
    }

    const results = [];
    const promotedJids: string[] = [];
    for (const targetJid of allTargets) {
        const normalizedTargetJid = jidNormalizedUser(targetJid);
        if (await isGroupAdmin(sock, chatId, normalizedTargetJid)) {
            results.push(`🛡️ @${normalizedTargetJid.split('@')[0]} is already an admin.`);
            continue;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, [normalizedTargetJid], "promote");
            results.push(`👑 Promoted @${normalizedTargetJid.split('@')[0]} to admin.`);
            promotedJids.push(normalizedTargetJid);
        } catch (e: any) {
            console.error(`Error promoting ${normalizedTargetJid}:`, e);
            results.push(`❌ Failed to promote @${normalizedTargetJid.split('@')[0]}. Error: ${e.message}`);
        }
    }
    await sock.sendMessage(chatId, { text: results.join('\n'), mentions: [...allTargets, ...promotedJids] });
};
promote.description = "Promotes a user to admin. Admin only.";
promote.category = "group";
promote.groupOnly = true;
promote.adminOnly = true;
promote.botAdminOnly = true;
promote.usage = ".promote @user or reply to user's message";

export const demote: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can demote members." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "I need to be an admin in this group to perform this action." });
        return;
    }

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const targetJidsFromArgs = args.map(arg => arg.startsWith('@') ? `${arg.substring(1)}@s.whatsapp.net` : (arg.match(/^\d+$/) ? `${arg}@s.whatsapp.net` : null)).filter(j => j) as string[];
    let allTargets = [...new Set([...mentions, ...targetJidsFromArgs])];

    if (allTargets.length === 0) {
        const replyParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (replyParticipant) {
            allTargets.push(replyParticipant);
        } else {
            await sock.sendMessage(chatId, { text: "Please mention, reply to, or provide the number of the user to demote. Usage: .demote @user" });
            return;
        }
    }

    const results = [];
    const demotedJids: string[] = [];
    for (const targetJid of allTargets) {
        const normalizedTargetJid = jidNormalizedUser(targetJid);
        if (OWNER_NUMBERS.map(owner => jidNormalizedUser(owner)).includes(normalizedTargetJid)) {
            results.push(`🛡️ Cannot demote my owner: @${normalizedTargetJid.split('@')[0]}`);
            continue;
        }
        if (!await isGroupAdmin(sock, chatId, normalizedTargetJid)) {
            results.push(`🤷 @${normalizedTargetJid.split('@')[0]} is not an admin.`);
            continue;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, [normalizedTargetJid], "demote");
            results.push(`👤 Demoted @${normalizedTargetJid.split('@')[0]} from admin.`);
            demotedJids.push(normalizedTargetJid);
        } catch (e: any) {
            console.error(`Error demoting ${normalizedTargetJid}:`, e);
            results.push(`❌ Failed to demote @${normalizedTargetJid.split('@')[0]}. Error: ${e.message}`);
        }
    }
    await sock.sendMessage(chatId, { text: results.join('\n'), mentions: [...allTargets, ...demotedJids] });
};
demote.description = "Demotes an admin to member. Admin only.";
demote.category = "group";
demote.groupOnly = true;
demote.adminOnly = true;
demote.botAdminOnly = true;
demote.usage = ".demote @user or reply to user's message";

export const pick: Command = async ({ sock, msg }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants.map(p => p.id);
        if (participants.length === 0) {
            await sock.sendMessage(chatId, { text: "No one to pick from in this group." });
            return;
        }
        const pickedUser = participants[Math.floor(Math.random() * participants.length)];
        await sock.sendMessage(chatId, { text: `🎯 I pick @${pickedUser.split('@')[0]}!`, mentions: [pickedUser] });
    } catch (e) {
        console.error("Error picking user:", e);
        await sock.sendMessage(chatId, { text: "Couldn't pick a user." });
    }
};
pick.description = "Randomly picks a member from the group.";
pick.category = "group";
pick.groupOnly = true;

export const tagall: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can use this command." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants.map(p => p.id);
        
        let tagallMessage = `${commandHeader("Tag All Members", "📣")}\n`;
        tagallMessage += `│ Message: *${fullArgs || "Attention everyone!"}*\n`;
        tagallMessage += sectionSeparator();
        tagallMessage += `│ Tagging all *${participants.length}* members:\n`;
        
        let mentionsChunk = "";
        participants.forEach((jid) => {
            mentionsChunk += `│ @${jid.split('@')[0]}\n`;
        });
        
        tagallMessage += mentionsChunk;
        tagallMessage += commandFooter();

        await sock.sendMessage(chatId, { 
            text: tagallMessage.trim(), 
            mentions: participants 
        });

    } catch (e) {
        console.error("Error tagging all members:", e);
        await sock.sendMessage(chatId, { text: "Couldn't tag all members." });
    }
};
tagall.description = "Tags all members in the group with a styled message. Admin only.";
tagall.category = "group";
tagall.groupOnly = true;
tagall.adminOnly = true;
tagall.usage = ".tagall [message]";

export const tagadmin: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
        if (admins.length === 0) {
            await sock.sendMessage(chatId, { text: "There are no admins in this group to tag." });
            return;
        }
        let text = `${commandHeader("Tag Admins", "🛡️")}\n`;
        text += `│ Message: *${fullArgs || "Attention Admins!"}*\n`;
        text += sectionSeparator();
        admins.forEach(jid => {
            text += `│ @${jid.split('@')[0]}\n`;
        });
        text += commandFooter();

        await sock.sendMessage(chatId, { text: text.trim(), mentions: admins });
    } catch (e) {
        console.error("Error tagging admins:", e);
        await sock.sendMessage(chatId, { text: "Couldn't tag admins." });
    }
};
tagadmin.description = "Tags all admins in the group.";
tagadmin.category = "group";
tagadmin.groupOnly = true;
tagadmin.usage = ".tagadmin [message]";

export const tagnotadmin: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    const senderJid = msg.key.participant || msg.key.remoteJid!;
     if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only group admins can use this command." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const notAdmins = metadata.participants.filter(p => !p.admin).map(p => p.id);
        if (notAdmins.length === 0) {
            await sock.sendMessage(chatId, { text: "Everyone in this group is an admin." });
            return;
        }
        let text = `${commandHeader("Tag Non-Admins", "🗣️")}\n`;
        text += `│ Message: *${fullArgs || "Message for members!"}*\n`;
        text += sectionSeparator();
        notAdmins.forEach(jid => {
            text += `│ @${jid.split('@')[0]}\n`;
        });
        text += commandFooter();
        await sock.sendMessage(chatId, { text: text.trim(), mentions: notAdmins });
    } catch (e) {
        console.error("Error tagging non-admins:", e);
        await sock.sendMessage(chatId, { text: "Couldn't tag non-admins." });
    }
};
tagnotadmin.description = "Tags all non-admin members in the group. Admin only.";
tagnotadmin.category = "group";
tagnotadmin.groupOnly = true;
tagnotadmin.adminOnly = true;
tagnotadmin.usage = ".tagnotadmin [message]";

export const hidetag: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    
    if (!fullArgs) {
        await sock.sendMessage(chatId, { text: "Please provide a message for the hidetag. Usage: .hidetag <message>" });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants.map(p => p.id);
        
        await sock.sendMessage(chatId, {
            text: fullArgs,
            mentions: participants
        });
    } catch (e) {
        console.error("Error sending hidetag:", e);
        await sock.sendMessage(chatId, { text: "Couldn't send hidetag message." });
    }
};
hidetag.description = "Sends a message that notifies all group members (mentions them invisibly).";
hidetag.category = "group";
hidetag.groupOnly = true;
hidetag.usage = ".hidetag <message>";


// Persist settings in a DB or file for production bots
let groupSettings: { [groupId: string]: { antilink?: 'on' | 'kick' | 'off', antisticker?: boolean, antibot?: boolean, antileft?: boolean } } = {};

export const antilink: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only admins can change this setting." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "🤖 I need to be an admin in this group for anti-link to function properly (delete messages/kick users)." });
        return;
    }

    if (!groupSettings[chatId]) groupSettings[chatId] = { antilink: 'off' };
    const currentStatus = groupSettings[chatId].antilink || 'off';
    const action = args[0]?.toLowerCase() as 'on' | 'kick' | 'off' | undefined;

    if (!action || !['on', 'off', 'kick'].includes(action)) {
        await sock.sendMessage(chatId, { text: `🔗 Anti-link is currently ${currentStatus.toUpperCase()}. Usage: .antilink <on|off|kick>\n- 'on': Delete link & warn\n- 'kick': Delete link, warn & kick user` });
        return;
    }

    groupSettings[chatId].antilink = action;
    await sock.sendMessage(chatId, { text: `🔗 Anti-link feature set to ${action.toUpperCase()}.` });
};
antilink.description = "Toggle anti-link (deletes links or kicks). Admin & Bot Admin only.";
antilink.category = "group";
antilink.groupOnly = true;
antilink.adminOnly = true;
antilink.botAdminOnly = true; 
antilink.usage = ".antilink <on|off|kick>";

export const antisticker: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only admins can change this setting." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "🤖 I need to be an admin in this group for anti-sticker to function properly (delete stickers)." });
        return;
    }

    if (!groupSettings[chatId]) groupSettings[chatId] = {};
    const currentStatus = groupSettings[chatId].antisticker || false;
    const action = args[0]?.toLowerCase();

    if (!action || (action !== 'on' && action !== 'off')) {
        await sock.sendMessage(chatId, { text: `🚫 Anti-sticker is currently ${currentStatus ? 'ON' : 'OFF'}. Usage: .antisticker <on|off>` });
        return;
    }

    groupSettings[chatId].antisticker = action === 'on';
    await sock.sendMessage(chatId, { text: `🚫 Anti-sticker feature ${action === 'on' ? 'enabled' : 'disabled'}.` });
};
antisticker.description = "Toggle anti-sticker feature (deletes stickers from non-admins). Admin & Bot Admin only.";
antisticker.category = "group";
antisticker.groupOnly = true;
antisticker.adminOnly = true;
antisticker.botAdminOnly = true; 
antisticker.usage = ".antisticker <on|off>";


export const antibot: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only admins can change this setting." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "🤖 I need to be an admin in this group for anti-bot to function properly (kick other bots)." });
        return;
    }

    if (!groupSettings[chatId]) groupSettings[chatId] = {};
    const currentStatus = groupSettings[chatId].antibot || false;
    const action = args[0]?.toLowerCase();

    if (!action || (action !== 'on' && action !== 'off')) {
        await sock.sendMessage(chatId, { text: `🤖 Anti-bot is currently ${currentStatus ? 'ON' : 'OFF'}. Usage: .antibot <on|off>` });
        return;
    }

    groupSettings[chatId].antibot = action === 'on';
    await sock.sendMessage(chatId, { text: `🤖 Anti-bot feature ${action === 'on' ? 'enabled' : 'disabled'}. (Kicks other bots if they join)` });
};
antibot.description = "Toggle anti-bot feature (kicks other bots). Admin & Bot Admin only.";
antibot.category = "group";
antibot.groupOnly = true;
antibot.adminOnly = true;
antibot.botAdminOnly = true; 
antibot.usage = ".antibot <on|off>";


export const antileft: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }
    const senderJid = msg.key.participant || msg.key.remoteJid!;
    if (!await isGroupAdmin(sock, chatId, senderJid)) {
        await sock.sendMessage(chatId, { text: "Only admins can change this setting." });
        return;
    }
    if (!await isBotAdmin(sock, chatId)) {
        await sock.sendMessage(chatId, { text: "🤖 I need to be an admin in this group for anti-left to function properly (re-add users)." });
        return;
    }

    if (!groupSettings[chatId]) groupSettings[chatId] = {};
    const currentStatus = groupSettings[chatId].antileft || false; 
    const action = args[0]?.toLowerCase();

    if (!action || (action !== 'on' && action !== 'off')) {
        await sock.sendMessage(chatId, { text: `🚪 Anti-left (re-add on leave) is currently ${currentStatus ? 'ON' : 'OFF'}. Usage: .antileft <on|off>` });
        return;
    }

    groupSettings[chatId].antileft = action === 'on';
    await sock.sendMessage(chatId, { text: `🚪 Anti-left feature ${action === 'on' ? 'enabled' : 'disabled'}.` });
};
antileft.description = "Toggles re-adding users if they leave. Admin & Bot Admin only.";
antileft.category = "group";
antileft.groupOnly = true;
antileft.adminOnly = true;
antileft.botAdminOnly = true; 
antileft.usage = ".antileft <on|off>";


export const getGroupSettings = (groupId: string) => {
    return groupSettings[groupId] || { antilink: 'off', antisticker: false, antibot: false, antileft: false }; 
};

export const gcsetting: Command = async ({ sock, msg }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const settings = getGroupSettings(chatId); 

        let responseText = `${commandHeader(`Settings: ${metadata.subject}`, "⚙️")}\n`;
        responseText += `│ 🔗 Anti-Link: ${(settings.antilink || 'off').toUpperCase()}\n`;
        responseText += `│ 🎨 Anti-Sticker: ${settings.antisticker ? 'ON' : 'OFF'}\n`;
        responseText += `│ 🤖 Anti-Bot: ${settings.antibot ? 'ON' : 'OFF'}\n`;
        responseText += `│ 🚪 Anti-Left: ${settings.antileft ? 'ON' : 'OFF'}\n`;
        responseText += `│ 👋 Welcome Messages: ${isWelcomeEnabled(chatId) ? 'ON' : 'OFF'}\n`;
        responseText += `│ 💔 Goodbye Messages: ${isGoodbyeEnabled(chatId) ? 'ON' : 'OFF'}\n`; 
        responseText += commandFooter();
        
        await sock.sendMessage(chatId, { text: responseText });
    } catch (e) {
        console.error("Error fetching group settings:", e);
        await sock.sendMessage(chatId, { text: "Could not fetch group settings." });
    }
};
gcsetting.description = "Displays current group settings managed by the bot.";
gcsetting.category = "group";
gcsetting.groupOnly = true;


export const vcf: Command = async ({ sock, msg }: CommandHandlerParams) => {
    const chatId = getGroupJid(msg);
    if (!chatId) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "This command can only be used in a group to get all member VCFs." });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        if (!metadata.participants || metadata.participants.length === 0) {
            await sock.sendMessage(chatId, { text: "No participants found in this group." });
            return;
        }

        let vcfData = "";
        for (const participant of metadata.participants) {
            const jid = jidNormalizedUser(participant.id);
            const number = jid.split('@')[0];
            const name = `User ${number}`; 

            vcfData += `BEGIN:VCARD\n`;
            vcfData += `VERSION:3.0\n`;
            vcfData += `FN:${name}\n`; 
            vcfData += `TEL;TYPE=CELL;waid=${number}:+${number}\n`; 
            vcfData += `END:VCARD\n\n`;
        }
        
        const vcfFileName = `${(metadata.subject || 'group').replace(/[^\w\s.-]/gi, '_')}_contacts.vcf`;
        const tempFilePath = path.join(TEMP_DIR_VCF, vcfFileName);
        fs.writeFileSync(tempFilePath, vcfData);

        await sock.sendMessage(chatId, {
            document: fs.readFileSync(tempFilePath), 
            fileName: vcfFileName,
            mimetype: 'text/vcard',
            caption: `👥 Here are the contacts for all members of *${metadata.subject}*.\nTotal Contacts: ${metadata.participants.length}`
        });
        
        fs.unlinkSync(tempFilePath); 

    } catch (error) {
        console.error("Error creating VCF for group:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "Sorry, I couldn't create the VCF file for the group members." });
    }
};
vcf.description = "Creates a VCF (contact card) file for all group members.";
vcf.category = "group"; 
vcf.groupOnly = true;
vcf.usage = ".vcf";

export const poll: Command = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    if (!fullArgs) {
        await sock.sendMessage(chatId, { text: "Usage: .poll Question | Option 1 | Option 2 | ..." });
        return;
    }

    const parts = fullArgs.split('|').map(s => s.trim());
    if (parts.length < 2) { 
        await sock.sendMessage(chatId, { text: "Poll must have a question and at least one option. Usage: .poll Question | Option 1 | Option 2" });
        return;
    }

    const question = parts[0];
    const options = parts.slice(1).filter(opt => opt.length > 0); 

    if (options.length === 0) {
        await sock.sendMessage(chatId, { text: "Poll must have at least one valid option." });
        return;
    }
    if (options.length > 12) { 
        await sock.sendMessage(chatId, { text: "Polls can have a maximum of 12 options." });
        return;
    }

    try {
        await sock.sendMessage(chatId, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1 
            }
        });
    } catch (error) {
        console.error("Error creating poll:", error);
        await sock.sendMessage(chatId, { text: "Sorry, I couldn't create the poll." });
    }
};
poll.description = "Creates a poll in the chat. Usage: .poll Question | Option 1 | Option 2 | ...";
poll.category = "group"; 


export const getbio: Command = async ({ sock, msg, args }: CommandHandlerParams) => {
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let targetJid: string | undefined;

    if (mentions.length > 0) {
        targetJid = mentions[0];
    } else if (args.length > 0 && args[0].match(/^@?\d+$/)) { 
        targetJid = `${args[0].replace('@','')}@s.whatsapp.net`;
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) { 
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (msg.key.remoteJid && !msg.key.remoteJid.endsWith('@g.us')) {
        targetJid = msg.key.remoteJid; 
    } else if (msg.key.participant) {
        targetJid = msg.key.participant; 
    }

    if (!targetJid) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "Could not determine the target user. Mention a user, reply, use their number, or use in DM/as group member for self-bio." });
        return;
    }
    
    const normalizedTargetJid = jidNormalizedUser(targetJid);
    if (normalizedTargetJid.endsWith('@g.us')) {
        await sock.sendMessage(msg.key.remoteJid!, { text: "Cannot fetch bio for a group. Please target a user." });
        return;
    }

    try {
        const statusResArray = await sock.fetchStatus(normalizedTargetJid); 
        const statusResult = statusResArray?.[normalizedTargetJid] || statusResArray?.[0]; 
        
        let bioText: string = "Not available or private";

        if (statusResult && typeof statusResult === 'string') { 
            bioText = statusResult;
        } else if (statusResult && typeof statusResult.status === 'string') { 
            bioText = statusResult.status;
        }
        
        if (bioText !== "Not available or private") {
            await sock.sendMessage(msg.key.remoteJid!, { text: `📝 Bio of @${normalizedTargetJid.split('@')[0]}:\n${bioText}`, mentions: [normalizedTargetJid] });
        } else if (statusResult && 'error' in statusResult && typeof statusResult.error === 'number') {
            console.warn(`Could not fetch bio for ${normalizedTargetJid}: Error ${statusResult.error}`);
            bioText = "Error fetching bio";
            await sock.sendMessage(msg.key.remoteJid!, { text: `User @${normalizedTargetJid.split('@')[0]} bio: ${bioText}.`, mentions: [normalizedTargetJid] });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: `User @${normalizedTargetJid.split('@')[0]} has no bio, it's private, or could not be fetched.`, mentions: [normalizedTargetJid] });
        }
    } catch (e) {
        console.error("Error fetching bio:", e);
        await sock.sendMessage(msg.key.remoteJid!, { text: "Could not fetch bio. The user might have privacy settings, the number might be incorrect, or an error occurred." });
    }
};
getbio.description = "Gets the WhatsApp bio/status of a user.";
getbio.category = "group"; 
getbio.usage = ".getbio [@user/number/reply_to_user/self]";

export const mygroups: Command = async ({ sock, msg, ownerNumbers: cmdOwnerNumbers }: CommandHandlerParams) => {
    const effectiveOwnerNumbers = OWNER_NUMBERS;

    try {
        const senderJid = msg.key.participant || msg.key.remoteJid!;
        const groupsObject = await sock.groupFetchAllParticipating();
        const groupEntries = Object.values(groupsObject); 
        
        let groupListText = `${commandHeader("My Groups", "📂")}\n`;
        let count = 0;
        const results: string[] = []; 

        if (groupEntries.length === 0) {
            groupListText += `│ I'm not in any groups currently.\n`;
        } else {
            for (let index = 0; index < groupEntries.length; index++) {
                const group = groupEntries[index];
                groupListText += `│ ${index + 1}. *${group.subject}*\n│    ID: ${group.id}\n│    Members: ${group.participants.length}\n`;
                if (index < groupEntries.length - 1) {
                    groupListText += sectionSeparator() + `\n`;
                }
                
                const normalizedSenderJid = jidNormalizedUser(senderJid);
                if (
                    effectiveOwnerNumbers.map(o => jidNormalizedUser(o)).includes(normalizedSenderJid) &&
                    !group.participants.find(p => jidNormalizedUser(p.id) === normalizedSenderJid && (p.admin === 'admin' || p.admin === 'superadmin'))
                ) {
                    try {
                        if (await isBotAdmin(sock, group.id)) {
                            await sock.groupParticipantsUpdate(group.id, [normalizedSenderJid], "promote");
                            results.push(`👑 Owner @${normalizedSenderJid.split('@')[0]} promoted to admin in *${group.subject}*.`);
                        } else {
                            results.push(`⚠️ Owner @${normalizedSenderJid.split('@')[0]} cannot be auto-promoted in *${group.subject}* (Bot is not admin there).`);
                        }
                    } catch (e: any) {
                        console.error(`Error promoting owner ${normalizedSenderJid} in ${group.subject}:`, e);
                        results.push(`❌ Failed to promote owner @${normalizedSenderJid.split('@')[0]} in *${group.subject}*. Error: ${e.message}`);
                    }
                }
                count++;
            }
        }
        groupListText += `│ Total groups: ${count}\n`;
        groupListText += commandFooter();
        if (results.length > 0) {
            groupListText += `\n\n${commandHeader("Promotion Notes", "📌")}\n│ ${results.join('\n│ ')}\n${commandFooter()}`;
        }
        await sock.sendMessage(msg.key.remoteJid!, { text: groupListText, mentions: [senderJid] });
    } catch (e: any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Error fetching groups: ${e.message}` });
    }
};
mygroups.description = "Lists all groups the bot is currently in. Owners are auto-promoted if bot is admin.";
mygroups.category = "group";
mygroups.aliases = ["getall"];
    
    