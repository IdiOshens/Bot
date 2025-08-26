
/// <reference types="node" />
import { CommandHandlerParams, Command } from '../types';
import *_config from '../config'; 
import { proto, WAMessageStubType, getDevice, WAMessage, jidNormalizedUser, GroupMetadata, downloadMediaMessage, AnyMessageContent, WASocket, isJidGroup } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { formatUptime as formatUptimeUtil, getGreeting as getGreetingUtil } from './general'; 

const execAsync = promisify(exec);

const formatUptime = formatUptimeUtil;
const getGreeting = getGreetingUtil;

const commandHeader = (title: string, icon: string = "👑") => `╭─⊷「 ${icon} ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const listItem = (text: string) => `│ ◦ ${text}`;
const sectionSeparator = () => `│`;


const isOwner = (sender: string | null | undefined): boolean => {
    if (!sender) return false;
    return _config.OWNER_NUMBERS.includes(jidNormalizedUser(sender));
};

export const send = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }

    if (args.length < 2) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .send <JID> <message>" });
    }

    let targetJid = args[0];
    if (!targetJid.includes('@')) { 
        targetJid = targetJid.replace(/\D/g, '') + (targetJid.includes('-') ? '@g.us' : '@s.whatsapp.net');
    }
    
    const messageToSend = args.slice(1).join(" ");

    try {
        await sock.sendMessage(targetJid, { text: messageToSend });
        await sock.sendMessage(msg.key.remoteJid!, { text: `✅ Message sent to ${targetJid}` });
    } catch (error: any) {
        console.error("Error sending message:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to send message to ${targetJid}. Error: ${error.message}` });
    }
};
send.description = "Sends a message to a specified JID. Owner only.";
send.category = "owner_panel";
send.ownerOnly = true;
send.usage = ".send <jid> <message>";

const handleViewOnce = async (sock: WASocket, originalMsg: proto.IWebMessageInfo, targetChatId: string, logger: CommandHandlerParams['logger'], captionPrefix: string = "👁️ Forwarded View-Once:") => {
    const quotedMsg = originalMsg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
        await sock.sendMessage(originalMsg.key.remoteJid!, { text: "Please reply to a view-once message." });
        return;
    }

    let viewOnceMedia: proto.IMessage | undefined | null = quotedMsg;
    let originalMediaType: "image" | "video" | null = null;
    let originalCaption: string | null | undefined = "";

    if (viewOnceMedia?.imageMessage?.viewOnce) {
        originalMediaType = "image";
        originalCaption = viewOnceMedia.imageMessage.caption;
    } else if (viewOnceMedia?.videoMessage?.viewOnce) {
        originalMediaType = "video";
        originalCaption = viewOnceMedia.videoMessage.caption;
    } else {
        await sock.sendMessage(originalMsg.key.remoteJid!, { text: "The replied message is not a view-once image or video, or it could not be processed." });
        return;
    }
    
    try {
        await sock.sendPresenceUpdate('composing', targetChatId);
        const fullQuotedMsg: proto.IWebMessageInfo = {
            key: { 
                remoteJid: originalMsg.key.remoteJid!, 
                id: originalMsg.message?.extendedTextMessage?.contextInfo?.stanzaId || "unknown_id", 
                fromMe: originalMsg.message?.extendedTextMessage?.contextInfo?.participant === sock.user?.id,
                participant: originalMsg.message?.extendedTextMessage?.contextInfo?.participant
            },
            message: quotedMsg,
            messageTimestamp: originalMsg.messageTimestamp 
        };

        const buffer = await downloadMediaMessage(fullQuotedMsg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
        
        let messageContent: AnyMessageContent;
        const finalCaption = `${captionPrefix} ${originalCaption || ""}`.trim();

        if (originalMediaType === "image" && buffer instanceof Buffer) {
            messageContent = { image: buffer, caption: finalCaption };
        } else if (originalMediaType === "video" && buffer instanceof Buffer) {
            messageContent = { video: buffer, caption: finalCaption, gifPlayback: quotedMsg.videoMessage?.gifPlayback || false };
        } else {
            throw new Error("Failed to download or process view-once media correctly.");
        }

        await sock.sendMessage(targetChatId, messageContent);
        if (targetChatId !== originalMsg.key.remoteJid) {
            await sock.sendMessage(originalMsg.key.remoteJid!, { text: `View-once media sent to ${targetChatId}.` });
        }
    } catch (error: any) {
        console.error("Error handling view-once:", error);
        await sock.sendMessage(originalMsg.key.remoteJid!, { text: `❌ Failed to process view-once message. It might have already been fully viewed or an error occurred. (${error.message})` });
    } finally {
        await sock.sendPresenceUpdate('paused', targetChatId);
    }
};


export const vv = async ({ sock, msg, ownerNumbers, logger }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }
    // Forward view-once image/video with original caption (if any)
    await handleViewOnce(sock, msg, msg.key.remoteJid!, logger, ":");
};
vv.description = "Attempts to re-display a replied view-once image/video in the current chat, including its caption. (Experimental)";
vv.category = "owner_panel";
vv.ownerOnly = true;
vv.usage = ".vv (reply to a view-once message)";

export const vv1 = async ({ sock, msg, ownerNumbers, logger }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }
    // Forward view-once image/video to owner's DM with caption
    await handleViewOnce(sock, msg, sender, logger, ":");
};
vv1.description = "Attempts to send a replied view-once image/video to your DM, including its caption. (Experimental)";
vv1.category = "owner_panel";
vv1.ownerOnly = true;
vv1.usage = ".vv1 (reply to a view-once message)";

// View-once voice note (ptt) support for .vv3
export const vv3 = async ({ sock, msg, ownerNumbers, logger }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please reply to a view-once voice note (audio) message." });
    }

    let isViewOnceVoice = false;
    let originalCaption: string | undefined = "";
    if (quotedMsg.audioMessage?.viewOnce) {
        isViewOnceVoice = true;
        originalCaption = quotedMsg.audioMessage.caption || "";
    }

    if (!isViewOnceVoice) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "The replied message is not a view-once voice note (audio), or it could not be processed." });
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);

        const fullQuotedMsg: proto.IWebMessageInfo = {
            key: { 
                remoteJid: msg.key.remoteJid!, 
                id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId || "unknown_id", 
                fromMe: msg.message?.extendedTextMessage?.contextInfo?.participant === sock.user?.id,
                participant: msg.message?.extendedTextMessage?.contextInfo?.participant
            },
            message: quotedMsg,
            messageTimestamp: msg.messageTimestamp 
        };

        const buffer = await downloadMediaMessage(fullQuotedMsg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });

        const messageContent: AnyMessageContent = {
            audio: buffer,
            mimetype: quotedMsg.audioMessage?.mimetype || 'audio/ogg; codecs=opus',
            ptt: true,
            caption: originalCaption ? `: ${originalCaption}` : ""
        };

        await sock.sendMessage(msg.key.remoteJid!, messageContent);
    } catch (error: any) {
        console.error("Error handling view-once voice note:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to process view-once voice note. It might have already been fully viewed or an error occurred. (${error.message})` });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
vv3.description = "Attempts to re-display a replied view-once voice note (audio) in the current chat. (Experimental)";
vv3.category = "owner_panel";
vv3.ownerOnly = true;
vv3.usage = ".vv3 (reply to a view-once voice note)";


export const restart = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
     if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: "🔄 Restarting Zark-Bots... This might take a moment." });
    console.log("Restart command received. Exiting process...");
    (process as NodeJS.Process).exit(1); 
};
restart.description = "Restarts the bot. Owner only.";
restart.category = "owner_panel";
restart.ownerOnly = true;

export const update = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }
    
    await sock.sendMessage(msg.key.remoteJid!, { text: "⚙️ Attempting to update Zark-Bots from git..." });
    try {
        const { stdout: pullOutput, stderr: pullErr } = await execAsync('git pull');
        if (pullErr && !pullOutput.includes("Already up to date.") && !pullOutput.includes("already up to date")) { 
            await sock.sendMessage(msg.key.remoteJid!, { text: `Git pull error: ${pullErr}` });
        }
        let response = `Git Pull Output:\n${pullOutput}\n`;

        if (pullOutput.includes("Already up to date.") || pullOutput.includes("already up to date")) {
             response += "✅ Zark-Bots is already up to date. No restart needed unless forced.";
             await sock.sendMessage(msg.key.remoteJid!, { text: response });
             return;
        }

        response += "🔄 Rebuilding TypeScript...\n";
        await sock.sendMessage(msg.key.remoteJid!, { text: response });

        const { stdout: tscOutput, stderr: tscErrBuild } = await execAsync('npm run build'); 
        if (tscErrBuild) {
            await sock.sendMessage(msg.key.remoteJid!, { text: `TypeScript compilation error: ${tscErrBuild}` });
            return;
        }
        response += `TypeScript Build Output:\n${tscOutput}\n`;
        response += "✅ Update complete. Restarting Zark-Bots now...";
        await sock.sendMessage(msg.key.remoteJid!, { text: response });
        
        (process as NodeJS.Process).exit(1); 
    } catch (error: any) {
        console.error("Update error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Update failed: ${error.message}` });
    }
};
update.description = "Updates the bot from its source repository and restarts. Owner only.";
update.category = "owner_panel";
update.ownerOnly = true;

export const pair = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const senderId = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(senderId)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }

    if (!sock.user?.id) {
        return sock.sendMessage(senderId, { text: "Bot user ID not available yet. Please wait for full connection." });
    }
    const botPhoneNumber = jidNormalizedUser(sock.user.id).split('@')[0];
    if (!botPhoneNumber) {
        return sock.sendMessage(senderId, { text: "Could not determine bot's phone number for pairing code." });
    }

    if (sock.type === 'md' && typeof (sock as any).requestPairingCode === 'function') {
        try {
            const pairingCode = await (sock as any).requestPairingCode(botPhoneNumber);
            if (pairingCode) {
                await sock.sendMessage(senderId, { text: `📱 Your pairing code for *this bot instance* (${botPhoneNumber}) is: *${pairingCode}*\n\nUse this code in WhatsApp on your phone:\n1. Go to Settings > Linked Devices.\n2. Tap "Link a device".\n3. Tap "Link with phone number instead" and enter the code.` });
            } else {
                await sock.sendMessage(senderId, { text: "Could not retrieve pairing code. The feature might not be enabled or supported by your Baileys version. Check the console for a QR code if available during startup." });
            }
        } catch (e) {
            console.error("Pairing code error:", e);
            await sock.sendMessage(senderId, { text: "Error generating pairing code. Check console. Ensure your Baileys version supports this and you are using Multi-Device. Usually, QR code is shown on startup." });
        }
    } else {
        await sock.sendMessage(senderId, { text: "Pairing code feature is typically for initial MD setup or if `sock.ws.config.pairingCode` was used. If you need to re-pair, restart the bot and check the console for QR or pairing code options. This command might only work with specific Baileys configurations." });
    }
};
pair.description = "Requests a new pairing code for the bot's WhatsApp account (if supported). Owner only.";
pair.category = "owner_panel";
pair.ownerOnly = true;


export const forward = async ({ sock, msg, fullArgs, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    const quotedMsgInfo = msg.message?.extendedTextMessage?.contextInfo;
    if (!quotedMsgInfo?.quotedMessage || !quotedMsgInfo.stanzaId) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please reply to a message to forward." });
    }

    let targetJid = fullArgs.trim();
    if (!targetJid) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please provide a JID to forward to. Usage: .forward <jid>" });
    }

    if (!targetJid.includes('@')) { 
        targetJid = targetJid.replace(/\D/g, '') + (targetJid.includes('-') ? '@g.us' : '@s.whatsapp.net');
    }
    
    if (targetJid === (msg.key.participant || msg.key.remoteJid)) { 
        return sock.sendMessage(msg.key.remoteJid!, { text: "You cannot forward a message to yourself/current chat this way." });
    }

    try {
        const originalMsgFromStore = global.deletedMessagesStore?.[msg.key.remoteJid!]?.[quotedMsgInfo.stanzaId];

        let messageToForward: WAMessage | proto.IWebMessageInfo | undefined;

        if (originalMsgFromStore) {
            messageToForward = originalMsgFromStore;
        } else {
             const keyToForward: proto.IMessageKey = {
                remoteJid: msg.key.remoteJid!, 
                id: quotedMsgInfo.stanzaId!,
                participant: quotedMsgInfo.participant, 
                fromMe: !!sock.user && quotedMsgInfo.participant === jidNormalizedUser(sock.user.id)
            };
            messageToForward = { key: keyToForward, message: quotedMsgInfo.quotedMessage, pushName: msg.pushName };
        }
        

        if (messageToForward && messageToForward.message) { 
             await sock.sendMessage(targetJid, { forward: messageToForward as WAMessage });
             await sock.sendMessage(msg.key.remoteJid!, { text: `✅ Message forwarded to ${targetJid}` });
        } else {
             await sock.sendMessage(msg.key.remoteJid!, {text: "Could not load the original message content to forward. It might be too old, not stored, or not a forwardable type."});
        }

    } catch (e: any) {
        console.error("Forward error:", e);
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to forward: ${e.message}. Try sending the content directly with '.send'.` });
    }
};
forward.description = "Forwards a replied message to a JID. Owner only.";
forward.category = "owner_panel";
forward.ownerOnly = true;
forward.usage = ".forward <jid>";

export const getall = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    try {
        const groups = await sock.groupFetchAllParticipating() as { [key: string]: GroupMetadata }; 
        let groupListText = `${commandHeader("Participating Groups", "📊")}\n`;
        let count = 0;
        const groupEntries = Object.values(groups); 

        if (groupEntries.length === 0) {
            groupListText += `│ I'm not in any groups currently.\n`;
        } else {
            groupEntries.forEach((group, index) => {
                groupListText += `│ ${index + 1}. *${group.subject}*\n│    ID: ${group.id}\n│    Members: ${group.participants.length}\n`;
                if (index < groupEntries.length - 1) {
                    groupListText += sectionSeparator() + `\n`;
                }
                count++;
            });
        }
        groupListText += `│ Total groups: ${count}\n`;
        groupListText += commandFooter();
        await sock.sendMessage(msg.key.remoteJid!, { text: groupListText });
    } catch (e: any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Error fetching groups: ${e.message}` });
    }
};
getall.description = "Lists all groups the bot is currently in. Owner only.";
getall.category = "owner_panel";
getall.ownerOnly = true;


export const jid = async ({ sock, msg }: CommandHandlerParams) => {
    const senderRemoteJid = msg.key.remoteJid!;
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    
    let targetJid: string | null | undefined = senderRemoteJid; 
    let targetName = "Current Chat";

    if (quoted?.participant) {
        targetJid = quoted.participant;
        targetName = `Replied User (@${targetJid.split('@')[0]})`;
    } else if (quoted?.mentionedJid && quoted.mentionedJid.length > 0) {
        targetJid = quoted.mentionedJid[0];
        targetName = `Mentioned User (@${targetJid.split('@')[0]})`;
    } else if (msg.key.participant) { 
        targetJid = msg.key.participant;
        targetName = `Sender (@${targetJid.split('@')[0]})`;
    }
    
    await sock.sendMessage(msg.key.remoteJid!, { text: `🆔 JID for ${targetName}: ${targetJid}` });
};
jid.description = "Gets the JID of the current chat, sender, or replied/mentioned user.";
jid.category = "owner_panel"; 

export const join = async ({ sock, msg, fullArgs, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    if (!fullArgs || !fullArgs.includes('chat.whatsapp.com/')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please provide a valid WhatsApp group invite link." });
    }
    const codeMatch = fullArgs.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
    if (!codeMatch || !codeMatch[1]) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Invalid WhatsApp group invite link format."});
    }
    const code = codeMatch[1];
    try {
        await sock.groupAcceptInvite(code);
        await sock.sendMessage(msg.key.remoteJid!, { text: "✅ Successfully joined the group." });
    } catch (e: any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to join group: ${e.message}` });
    }
};
join.description = "Joins a group via invite link. Owner only.";
join.category = "owner_panel";
join.ownerOnly = true;
join.usage = ".join <invite_link>";

export const leave = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    let targetGroupId = msg.key.remoteJid;
    if (args[0] && args[0].endsWith('@g.us')) {
        targetGroupId = args[0];
    } else if (!targetGroupId?.endsWith('@g.us')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "This command must be used in a group or provide a group JID to leave." });
    }
    
    if (!targetGroupId) { 
        return sock.sendMessage(msg.key.remoteJid!, { text: "Error: Group ID not determined." });
    }

    try {
        await sock.sendMessage(targetGroupId, { text: `👋 Leaving this group as requested by owner (${_config.BOT_NAME}). Goodbye!` });
        await sock.groupLeave(targetGroupId);
        if(targetGroupId !== msg.key.remoteJid) { 
            await sock.sendMessage(msg.key.remoteJid!, { text: `✅ Successfully left group: ${targetGroupId}` });
        }
    } catch (e: any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to leave group: ${e.message}` });
    }
};
leave.description = "Leaves the current group or a specified group. Owner only.";
leave.category = "owner_panel";
leave.ownerOnly = true;
leave.usage = ".leave [group_jid]";

export const block = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let targetJidInput = args[0] || (mentions.length > 0 ? mentions[0] : null);
    if (msg.message?.extendedTextMessage?.contextInfo?.participant && !targetJidInput) { 
        targetJidInput = msg.message.extendedTextMessage.contextInfo.participant;
    }

    if (!targetJidInput) return sock.sendMessage(msg.key.remoteJid!, { text: "Please mention a user, reply to their message, or provide their JID to block. Usage: .block @user" });

    const targetJid = targetJidInput.replace('@', '').split(':')[0] + '@s.whatsapp.net';


    if (_config.OWNER_NUMBERS.includes(targetJid)) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🛡️ Cannot block an owner." });
    }
    if (sock.user && targetJid === jidNormalizedUser(sock.user.id)) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🤦 I cannot block myself." });
    }

    try {
        await sock.updateBlockStatus(targetJid, "block");
        await sock.sendMessage(msg.key.remoteJid!, { text: `🚫 User @${targetJid.split('@')[0]} has been blocked.`, mentions: [targetJid] });
    } catch (e: any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to block user @${targetJid.split('@')[0]}: ${e.message}`, mentions: [targetJid] });
    }
};
block.description = "Blocks a user. Owner only.";
block.category = "owner_panel";
block.ownerOnly = true;
block.usage = ".block @user_or_number";

export const unblock = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let targetJidInput = args[0] || (mentions.length > 0 ? mentions[0] : null);
     if (msg.message?.extendedTextMessage?.contextInfo?.participant && !targetJidInput) { 
        targetJidInput = msg.message.extendedTextMessage.contextInfo.participant;
    }

    if (!targetJidInput) return sock.sendMessage(msg.key.remoteJid!, { text: "Please mention a user, reply to their message, or provide their JID to unblock. Usage: .unblock @user" });
    
    const targetJid = targetJidInput.replace('@', '').split(':')[0] + '@s.whatsapp.net';

    try {
        await sock.updateBlockStatus(targetJid, "unblock");
        await sock.sendMessage(msg.key.remoteJid!, { text: `✅ User @${targetJid.split('@')[0]} has been unblocked.`, mentions: [targetJid] });
    } catch (e: any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to unblock user @${targetJid.split('@')[0]}: ${e.message}`, mentions: [targetJid] });
    }
};
unblock.description = "Unblocks a user. Owner only.";
unblock.category = "owner_panel";
unblock.ownerOnly = true;
unblock.usage = ".unblock @user_or_number";

export const allcmds = async (params: CommandHandlerParams & { allCommands: Map<string, Command>}) => {
    const { sock, msg, allCommands, prefix, ownerNumbers, botName } = params;
    const senderId = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(senderId)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }
    const currentUptime = formatUptime((process as NodeJS.Process).uptime());
    const senderName = msg.pushName || "Owner";
    
    let menuText = `‎‎╭─‎─‎─‎─‎─‎─❍「 *${botName.toUpperCase()} - ALL COMMANDS* 」❍\n`;
    menuText += `│ Hi! 👋 ${senderName} (${getGreeting()})\n`;
    menuText += `│ Prefix: *${prefix}* | Mode: *${_config.BOT_MODE.toUpperCase()}*\n`;
    menuText += `│ Uptime: ${currentUptime}\n`;
    menuText += `╰─┬────❍\n`;


    const categorizedCommands: { [key: string]: Command[] } = {};
    allCommands.forEach(cmd => {
        const categoryKey = cmd.category || "unknown";
        if (!categorizedCommands[categoryKey]) {
            categorizedCommands[categoryKey] = [];
        }
        if (!categorizedCommands[categoryKey].find(c => c.name === cmd.name)) {
            categorizedCommands[categoryKey].push(cmd);
        }
    });

    const categoryOrder = [
        "general", "ai_chat", "tools", "converters", "games_fun", "downloads", 
        "media", "wallpapers", "waifu", "reactions", 
        "religion", "group", "stalker_tools", 
        "pokemon", "audio_edit", "logo_maker", 
        "premium_users", "economy", "premium_bugs", "anime", "nsfw", "hentai",
        "tiktok_pics", "tiktok_video", "random_pics", "image_effects", "gfx_maker",
        "owner_panel" 
    ];
    
    const categoryTitles: { [key: string]: string } = {
        "general": "✨ General", "ai_chat": "🧠 AI & Chat", "tools": "🛠️ Tools", 
        "converters": "🔄 Converters", "games_fun": "🎮 Games & Fun", "downloads": "📥 Downloads",
        "media": "🖼️ Media (Combined)", "wallpapers": "🏞️ Wallpapers", "waifu": "💖 Waifu", "reactions": "😲 Reactions",
        "religion": "🕌 Religion", "group": "👥 Group Tools", "stalker_tools": "🕵️ Stalker Tools",
        "pokemon": "Ϟ Pokemon", "audio_edit": "🎶 Audio Edit", "logo_maker": "✒️ Logo Maker",
        "premium_users": "💎 Premium", "economy": "💰 Economy", "premium_bugs": "🐞 Bug Simulations",
        "anime": "🌸 Anime (Extended)", "nsfw": "🔞 NSFW (Placeholders)", "hentai": "🔞 Hentai (Placeholders)",
        "tiktok_pics": "🎵 TikTok Pics", "tiktok_video": "📹 TikTok Videos", "random_pics": "🎲 Random Pics",
        "image_effects": "🎨 Image Effects", "gfx_maker": "🖌️ GFX Maker",
        "owner_panel": "👑 Owner Panel"
    };

    const sortedCategories = [...new Set([...categoryOrder, ...Object.keys(categorizedCommands).sort()])];

    for (const categoryKey of sortedCategories) {
        const commandsInCategory = categorizedCommands[categoryKey];
        if (commandsInCategory && commandsInCategory.length > 0) {
            const displayCategoryName = categoryTitles[categoryKey] || categoryKey.toUpperCase().replace(/_/g, ' ');
            
            menuText += `╭─┴❍「 ${displayCategoryName} 」\n`;
            commandsInCategory.sort((a, b) => a.name.localeCompare(b.name)).forEach(cmd => {
                let usage = cmd.usage ? ` ${cmd.usage.replace(new RegExp(`^\\${prefix}${cmd.name}\\s*`), '').trim()}` : '';
                usage = usage.length > 30 ? usage.substring(0, 27) + "..." : usage; 
                menuText += `│ ${prefix}${cmd.name}${usage}\n`;
            });
            menuText += `╰─┬────❍\n`;
        }
    }
    
    if (menuText.endsWith('╰─┬────❍\n')) {
        menuText = menuText.substring(0, menuText.length - '╰─┬────❍\n'.length) + '╰─────────────❍';
    } else if (menuText.endsWith('╰─┬────❍')) { 
         menuText = menuText.substring(0, menuText.length - '╰─┬────❍'.length) + '╰─────────────❍';
    }

    const MAX_MSG_LENGTH = 65536; 
    if (menuText.length > MAX_MSG_LENGTH) {
        await sock.sendMessage(senderId, { 
            image: { url: _config.BOT_IMAGE_URL },
            caption: "The full command list is very long and might exceed chat limits. Displaying a portion or see console for full list.\n" + menuText.substring(0, 1000) + "\n... (list truncated)" 
        });
        console.log("Full command list for owner:\n" + menuText);
    } else {
        await sock.sendMessage(senderId, { 
            image: { url: _config.BOT_IMAGE_URL },
            caption: menuText 
        });
    }
};
allcmds.description = "Lists ALL available commands with details (owner only).";
allcmds.category = "owner_panel";
allcmds.ownerOnly = true;

export const anticall = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAntiCall(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "📞 Anti-call feature enabled. Incoming calls will be blocked and sender notified." });
    } else if (action === 'off') {
        _config.setAntiCall(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "📞 Anti-call feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Anti-call is currently ${_config.ANTI_CALL_ENABLED ? 'ON' : 'OFF'}. Usage: .anticall <on|off>` });
    }
};
anticall.description = "Toggles the anti-call feature (blocks incoming calls). Owner only.";
anticall.category = "owner_panel";
anticall.ownerOnly = true;
anticall.usage = ".anticall <on|off>";

export const setstatus = async ({ sock, msg, fullArgs, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    
    let statusText = fullArgs;
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!statusText && quotedMsg) {
        statusText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
    }

    if (!statusText) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please provide the status text or reply to a message. Usage: .setstatus <your new bio>" });
    }
    try {
        await sock.updateProfileStatus(statusText);
        await sock.sendMessage(msg.key.remoteJid!, { text: `📝 Bot status updated to: "${statusText}"` });
    } catch (e:any) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to update status: ${e.message}` });
    }
};
setstatus.description = "Sets the bot's WhatsApp status (bio). Owner only.";
setstatus.category = "owner_panel";
setstatus.ownerOnly = true;
setstatus.usage = ".setstatus <text>";

export const autobio = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAutoBio(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "🔄 Auto Bio feature enabled. Bio will change periodically." });
    } else if (action === 'off') {
        _config.setAutoBio(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "🔄 Auto Bio feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Auto Bio is currently ${_config.AUTO_BIO_ENABLED ? 'ON' : 'OFF'}. Usage: .autobio <on|off>` });
    }
};
autobio.description = "Toggles automatic bio changing. Owner only.";
autobio.category = "owner_panel";
autobio.ownerOnly = true;
autobio.usage = ".autobio <on|off>";

export const autotyping = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAutoTyping(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "⌨️ Auto Typing feature enabled. Bot will show 'typing...' before responding." });
    } else if (action === 'off') {
        _config.setAutoTyping(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "⌨️ Auto Typing feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Auto Typing is currently ${_config.AUTO_TYPING_ENABLED ? 'ON' : 'OFF'}. Usage: .autotyping <on|off>` });
    }
};
autotyping.description = "Toggles automatic 'typing...' presence before command execution. Owner only.";
autotyping.category = "owner_panel";
autotyping.ownerOnly = true;
autotyping.usage = ".autotyping <on|off>";

export const alwaysonline = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAlwaysOnline(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "🟢 Always Online feature enabled. Bot will periodically set presence to 'available'." });
    } else if (action === 'off') {
        _config.setAlwaysOnline(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "🟢 Always Online feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Always Online is currently ${_config.ALWAYS_ONLINE_ENABLED ? 'ON' : 'OFF'}. Usage: .alwaysonline <on|off>` });
    }
};
alwaysonline.description = "Toggles automatic 'online' presence. Owner only.";
alwaysonline.category = "owner_panel";
alwaysonline.ownerOnly = true;
alwaysonline.usage = ".alwaysonline <on|off>";

export const autoread = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAutoRead(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "📖 Auto Read feature enabled. All incoming messages will be marked as read." });
    } else if (action === 'off') {
        _config.setAutoRead(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "📖 Auto Read feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Auto Read is currently ${_config.AUTO_READ_ENABLED ? 'ON' : 'OFF'}. Usage: .autoread <on|off>` });
    }
};
autoread.description = "Toggles automatic message read receipts. Owner only.";
autoread.category = "owner_panel";
autoread.ownerOnly = true;
autoread.usage = ".autoread <on|off>";

export const autosview = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => { 
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAutoStatusView(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "👀 Auto Status View feature enabled. Bot will attempt to 'view' statuses." });
    } else if (action === 'off') {
        _config.setAutoStatusView(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "👀 Auto Status View feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Auto Status View is currently ${_config.AUTO_STATUS_VIEW_ENABLED ? 'ON' : 'OFF'}. Usage: .autosview <on|off>` });
    }
};
autosview.description = "Toggles automatic viewing of statuses. Owner only.";
autosview.category = "owner_panel";
autosview.ownerOnly = true;
autosview.usage = ".autosview <on|off>";
autosview.aliases = ['autostatusview'];

export const allvar = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });

    let vars = `${commandHeader("Bot Variables", "⚙️")}\n`;
    vars += `│ BOT_NAME: ${_config.BOT_NAME}\n`;
    vars += `│ BOT_PREFIX: ${_config.BOT_PREFIX}\n`;
    vars += `│ OWNER_NUMBERS: ${_config.OWNER_NUMBERS.join(', ')}\n`;
    vars += `│ GEMINI_API_KEY: ${!_config.GEMINI_API_KEY || _config.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY" ? "Not Set/Default" : "Set (Hidden)"}\n`;
    vars += `│ BOT_MODE: ${_config.BOT_MODE}\n`;
    vars += `│ BOT_IMAGE_URL: ${_config.BOT_IMAGE_URL}\n`;
    vars += `│ WELCOME_MESSAGE_ENABLED (Env): ${process.env.WELCOME_MESSAGE_ENABLED === 'true'}\n`;
    vars += `│ GOODBYE_MESSAGE_ENABLED (Env): ${process.env.GOODBYE_MESSAGE_ENABLED === 'true'}\n`;
    vars += sectionSeparator();
    vars += `│ *Feature Toggles (Runtime):*\n`;
    vars += `│ ANTI_CALL_ENABLED: ${_config.ANTI_CALL_ENABLED}\n`;
    vars += `│ AUTO_BIO_ENABLED: ${_config.AUTO_BIO_ENABLED}\n`;
    vars += `│ AUTO_TYPING_ENABLED: ${_config.AUTO_TYPING_ENABLED}\n`;
    vars += `│ ALWAYS_ONLINE_ENABLED: ${_config.ALWAYS_ONLINE_ENABLED}\n`;
    vars += `│ AUTO_READ_ENABLED: ${_config.AUTO_READ_ENABLED}\n`;
    vars += `│ AUTO_STATUS_VIEW_ENABLED: ${_config.AUTO_STATUS_VIEW_ENABLED}\n`;
    vars += `│ ANTI_DELETE_ENABLED: ${_config.ANTI_DELETE_ENABLED}\n`;
    vars += `│ SUDO_USERS: ${_config.SUDO_USERS.join(', ') || 'None'}\n`;
    vars += commandFooter();

    await sock.sendMessage(msg.key.remoteJid!, { text: vars });
};
allvar.description = "Displays current bot configuration and feature states. Owner only.";
allvar.category = "owner_panel";
allvar.ownerOnly = true;

export const antidelete = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        _config.setAntiDelete(true);
        await sock.sendMessage(msg.key.remoteJid!, { text: "🗑️ Anti-Delete feature enabled. Deleted messages will be logged and reported to the owner." });
    } else if (action === 'off') {
        _config.setAntiDelete(false);
        await sock.sendMessage(msg.key.remoteJid!, { text: "🗑️ Anti-Delete feature disabled." });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Anti-Delete is currently ${_config.ANTI_DELETE_ENABLED ? 'ON' : 'OFF'}. Usage: .antidelete <on|off>` });
    }
};
antidelete.description = "Toggles anti-delete (logs deleted messages to owner). Owner only.";
antidelete.category = "owner_panel";
antidelete.ownerOnly = true;
antidelete.usage = ".antidelete <on|off>";

const premiumUsers: { [jid: string]: number | 'permanent' } = {};

export const addpremium = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 Owner only." });
    
    if (args.length < 1) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .addpremium <@user/jid> [duration_days (e.g., 30) | 'permanent' | 'remove']" });
    }

    let targetUserJid: string | null = null;
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mention) {
        targetUserJid = jidNormalizedUser(mention);
    } else if (args[0].startsWith('@')) {
        targetUserJid = `${args[0].substring(1)}@s.whatsapp.net`;
    } else if (args[0].match(/^\d+$/)) {
        targetUserJid = `${args[0]}@s.whatsapp.net`;
    } else if (args[0].includes('@s.whatsapp.net')) {
        targetUserJid = jidNormalizedUser(args[0]);
    }

    if (!targetUserJid) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Invalid user specified. Please mention or provide JID." });
    }
    const targetName = targetUserJid.split('@')[0];

    const durationArg = args[1]?.toLowerCase();
    let expiryTimestamp: number | 'permanent';
    let durationText: string;

    if (durationArg === 'remove') {
        if (premiumUsers[targetUserJid]) {
            delete premiumUsers[targetUserJid];
            await sock.sendMessage(msg.key.remoteJid!, { 
                text: `🚫 Premium access removed for @${targetName}.`,
                mentions: [targetUserJid]
            });
            console.log(`Premium access removed for ${targetUserJid}`);
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { 
                text: `User @${targetName} does not have premium access.`,
                mentions: [targetUserJid]
            });
        }
        return;
    }


    if (durationArg && durationArg === 'permanent') {
        expiryTimestamp = 'permanent';
        durationText = "permanently";
    } else {
        const days = parseInt(durationArg);
        if (isNaN(days) || days <= 0) {
            expiryTimestamp = Date.now() + 30 * 24 * 60 * 60 * 1000; 
            durationText = "for 30 days (default)";
        } else {
            expiryTimestamp = Date.now() + days * 24 * 60 * 60 * 1000;
            durationText = `for ${days} day(s)`;
        }
    }
    
    premiumUsers[targetUserJid] = expiryTimestamp;
    
    await sock.sendMessage(msg.key.remoteJid!, { 
        text: `🌟 User @${targetName} has been granted premium access ${durationText}.`,
        mentions: [targetUserJid]
    });
    console.log(`Premium access granted to ${targetUserJid} until ${expiryTimestamp === 'permanent' ? 'Permanent' : new Date(expiryTimestamp).toISOString()}`);
};
addpremium.description = "Adds/removes premium status for a user. Owner only.";
addpremium.category = "owner_panel";
addpremium.ownerOnly = true;
addpremium.usage = ".addpremium <@user/jid> [days|permanent|remove]";

export const isPremiumUser = (userId: string): boolean => {
    const normalizedUserId = jidNormalizedUser(userId);
    if (_config.OWNER_NUMBERS.includes(normalizedUserId)) return true; 
    const premiumInfo = premiumUsers[normalizedUserId];
    if (!premiumInfo) return false;
    if (premiumInfo === 'permanent') return true;
    return Date.now() < premiumInfo;
};

export const checkpremium = async ({ sock, msg }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);

    if (isPremiumUser(normalizedSender)) {
        const expiry = premiumUsers[normalizedSender];
        const expiryText = expiry === 'permanent' ? 'Permanent' : `Expires on: ${new Date(expiry as number).toLocaleDateString()} ${new Date(expiry as number).toLocaleTimeString()}`;
        await sock.sendMessage(msg.key.remoteJid!, { text: `🌟 You have Premium access! (${expiryText})` });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ You do not have Premium access.` });
    }
};
checkpremium.description = "Checks your premium status.";
checkpremium.category = "premium_users"; 
checkpremium.aliases = ['premiumstatus'];

export const del = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    const quotedMsgInfo = msg.message?.extendedTextMessage?.contextInfo;

    if (!quotedMsgInfo?.quotedMessage || !quotedMsgInfo.stanzaId) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please reply to a message to delete." });
    }

    const botJid = sock.user ? jidNormalizedUser(sock.user.id) : null;
    const isQuotedMsgFromBot = quotedMsgInfo.participant === botJid;

    if (!isQuotedMsgFromBot && !ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 You can only delete messages sent by the bot, or if you are an owner, any replied message." });
    }

    const keyToDelete: proto.IMessageKey = {
        remoteJid: msg.key.remoteJid!,
        id: quotedMsgInfo.stanzaId!,
        fromMe: isQuotedMsgFromBot, // fromMe is true if the *message to be deleted* was sent by the bot
    };

    if (isJidGroup(msg.key.remoteJid!) && quotedMsgInfo.participant) {
        keyToDelete.participant = quotedMsgInfo.participant;
    }
    
    // If owner is deleting someone else's message, ensure `fromMe` is false for that key
    // unless the quoted message was indeed from the bot.
    if (ownerNumbers.includes(jidNormalizedUser(sender)) && !isQuotedMsgFromBot) {
        keyToDelete.fromMe = false; // Owner is deleting a message *not* from the bot
    }


    try {
        await sock.sendMessage(msg.key.remoteJid!, { delete: keyToDelete });
    } catch (e: any) {
        console.error("Delete message error:", e);
        await sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to delete message: ${e.message}.` });
    }
};
del.description = "Deletes the bot's replied message. Owners can use it on any replied message if bot has perms.";
del.category = "owner_panel"; 
del.usage = ".del (reply to bot's message)";


const ENV_FILE_PATH = path.join(__dirname, '..', '..', '.env'); // Adjust path if necessary based on compiled structure

const readEnvFile = (): string[] => {
    try {
        if (!fs.existsSync(ENV_FILE_PATH)) {
            return [];
        }
        return fs.readFileSync(ENV_FILE_PATH, 'utf-8').split('\n');
    } catch (error) {
        console.error("Error reading .env file:", error);
        return [];
    }
};

const writeEnvFile = (lines: string[]): boolean => {
    try {
        fs.writeFileSync(ENV_FILE_PATH, lines.join('\n'), 'utf-8');
        return true;
    } catch (error) {
        console.error("Error writing to .env file:", error);
        return false;
    }
};

const maskSensitiveValue = (key: string, value: string): string => {
    const sensitiveKeys = ['API_KEY', 'TOKEN', 'SECRET', 'PASSWORD'];
    const ownerNumKey = 'OWNER_NUMBERS';

    if (sensitiveKeys.some(sk => key.toUpperCase().includes(sk))) {
        return value ? 'Set (Hidden)' : 'Not Set';
    }
    if (key.toUpperCase() === ownerNumKey) {
        return value ? value.split(',').map(n => n.trim().substring(0, Math.min(3, n.length-5)) + '...').join(', ') : 'Not Set';
    }
    return value;
};

export const settings = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(jidNormalizedUser(sender)) && !msg.key.fromMe) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "🔒 This command is for the bot owner only." });
    }

    const action = args[0]?.toLowerCase();
    const variableName = args[1];
    const newValue = args.slice(2).join(' ');

    let responseText = `${commandHeader("Bot Settings (.env)", "🔧")}\n`;
    responseText += `│ ⚠️ Modifying these settings can impact bot functionality and requires a *RESTART* to take effect.\n`;
    responseText += sectionSeparator() + `\n`;

    if (action === 'view') {
        const envLines = readEnvFile();
        if (envLines.length === 0) {
            responseText += "│ Could not read .env file or it's empty.\n";
        } else {
            responseText += "│ *Current Environment Variables:*\n";
            envLines.forEach(line => {
                if (line.trim() && !line.startsWith('#')) {
                    const [key, ...valParts] = line.split('=');
                    const value = valParts.join('=');
                    responseText += `│  ◦ *${key.trim()}:* ${maskSensitiveValue(key.trim(), value.trim())}\n`;
                } else if (line.trim().startsWith('#')) {
                    responseText += `│  ${line.trim()} (Comment)\n`; // Show comments
                }
            });
        }
    } else if (action === 'list') {
        const envLines = readEnvFile();
        const variables = envLines.filter(line => line.trim() && !line.startsWith('#')).map(line => line.split('=')[0].trim());
        if (variables.length === 0) {
            responseText += "│ No variables found in .env file or file is unreadable.\n";
        } else {
            responseText += "│ *Configurable Variable Names (from .env):*\n";
            variables.forEach(v => responseText += `│  ◦ ${v}\n`);
        }
    } else if (action === 'set') {
        if (!variableName) {
            responseText += "│ Please specify a variable name. Usage: `.settings set VARIABLE_NAME new_value`\n";
        } else if (newValue === undefined || newValue === "") { // Allow setting an empty value
             responseText += `│ Please specify a new value for ${variableName}. Usage: \`.settings set ${variableName} <new_value>\`\n`;
        } else {
            const envLines = readEnvFile();
            let found = false;
            const newEnvLines = envLines.map(line => {
                if (line.startsWith(`${variableName}=`)) {
                    found = true;
                    return `${variableName}=${newValue}`;
                }
                return line;
            });

            if (!found) {
                newEnvLines.push(`${variableName}=${newValue}`);
            }

            if (writeEnvFile(newEnvLines)) {
                responseText += `│ ✅ Variable *${variableName}* has been set to: *${maskSensitiveValue(variableName,newValue)}*\n`;
                responseText += `│ ‼️ **IMPORTANT:** Please use the *${_config.BOT_PREFIX}restart* command for this change to take effect.\n`;
            } else {
                responseText += `│ ❌ Failed to write to .env file. Check server permissions or file status.\n`;
            }
        }
    } else {
        responseText += `│ Usage: ${_config.BOT_PREFIX}settings view|list|set\n`;
        responseText += `│   ◦ view: Show current .env variables (masked).\n`;
        responseText += `│   ◦ list: List variable names from .env.\n`;
        responseText += `│   ◦ set VAR_NAME value: Set a variable in .env.\n`;
    }

    responseText += commandFooter();
    await sock.sendMessage(msg.key.remoteJid!, { text: responseText });
};
settings.description = "Manages bot environment settings from .env file. Owner only.";
settings.category = "owner_panel";
settings.ownerOnly = true;
settings.usage = ".settings view|list|set VAR_NAME value";

// End of src/commands/owner.ts
// The duplicated index.ts content that was here has been removed.
