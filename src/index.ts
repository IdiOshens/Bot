
/// <reference types="node" />
import dotenv from 'dotenv'; // Import dotenv
dotenv.config(); // Load .env file at the very beginning

import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    WAMessage,
    type GroupParticipantsUpdate, // Using type import
    getAggregateVotesInPollMessage,
    WAMessageKey,
    WAMessageStubType,
    isJidGroup,
    isJidUser,
    jidNormalizedUser,
    downloadMediaMessage,
    proto,
    AnyMessageContent,
    WASocket,
    getDevice,
    ParticipantAction 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { GoogleGenAI } from '@google/genai';
import qrcode from 'qrcode-terminal';

import { handleCommand, commands as allCommandsMap } from './commandHandler'; // Import exported commands map
import * as config from './config';
import { getMessageText, getGroupJid, isGroupAdmin, isBotAdmin } from './utils/utils';
import { formatUptime, getGreeting, userMenuContext, getAllMenuCategories, displayCategoryCommands } from './commands/general'; 
import { getAutoReplyState } from './commands/ai'; 
import { isWelcomeEnabled, isGoodbyeEnabled, getGroupSettings } from './commands/group'; 
import { handlePlayCommandReply, playCommandUserContext } from './commands/download'; // For play command replies


const logger = pino({ level: process.env.LOG_LEVEL || 'silent' }); 

let ai: GoogleGenAI | null = null;
if (config.GEMINI_API_KEY && config.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" && config.GEMINI_API_KEY !== "") {
    ai = new GoogleGenAI({apiKey: config.GEMINI_API_KEY});
} else {
    // Warning already handled in config.ts, but an additional console log here is fine.
    console.warn(`[${config.BOT_NAME}] Gemini AI features are disabled or limited due to missing/placeholder API key.`);
}

declare global {
  var deletedMessagesStore: { [chatId: string]: { [msgId: string]: proto.IWebMessageInfo } };
}
global.deletedMessagesStore = {}; 

const commandHeader = (title: string) => `╭─⊷「 ✨ ${config.BOT_NAME} - ${title.toUpperCase()} ✨ 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const sectionSeparator = () => `│`;

function sendOnlinePresence(sock: WASocket) {
    if (sock.user?.id && config.ALWAYS_ONLINE_ENABLED) {
        sock.sendPresenceUpdate('available', sock.user.id);
    }
}

const bioOptions = [
    `Prefix: ${config.BOT_PREFIX} | Mode: ${config.BOT_MODE}`,
    `${config.BOT_NAME} - By Zark Bryan`,
    `Ask me anything with ${config.BOT_PREFIX}ai`,
    `Uptime: {uptime}`,
    `Currently serving users! Type ${config.BOT_PREFIX}menu`,
    `Have a great day! ✨ - ${config.BOT_NAME}`
];
let bioIndex = 0;
async function updateAutoBio(sock: WASocket) {
    if (sock.user?.id && config.AUTO_BIO_ENABLED) {
        try {
            let newBio = bioOptions[bioIndex % bioOptions.length];
            if (newBio.includes("{uptime}")) {
                newBio = newBio.replace("{uptime}", formatUptime((process as NodeJS.Process).uptime()));
            }
            await sock.updateProfileStatus(newBio.substring(0, 139)); 
            console.log(`Auto bio updated to: "${newBio}"`);
            bioIndex++;
        } catch (e) {
            console.warn("Auto bio update failed:", e);
        }
    }
}


async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`🤖 Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`);
    console.log(`🌟 Initializing ${config.BOT_NAME}... (Created by Zark Bryan)`);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        getMessage: async (key: WAMessageKey): Promise<proto.IMessage | undefined> => {
            if (key.remoteJid && global.deletedMessagesStore[key.remoteJid!] && global.deletedMessagesStore[key.remoteJid!][key.id!]) {
                return global.deletedMessagesStore[key.remoteJid!][key.id!].message || undefined;
            }
            // For poll updates, if we need to fetch the original poll creation message
            // and it's not in our store, Baileys might fetch it from its internal store
            // if this function returns undefined.
            // If you have another persistent store, you can check there.
            return undefined; 
        }
    });

    sock.ev.on('creds.update', saveCreds);

    let onlineInterval: NodeJS.Timeout | null = null;
    let bioInterval: NodeJS.Timeout | null = null;

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("------------------------------------------------");
            console.log(`Scan QR for ${config.BOT_NAME} Pairing`);
            console.log("------------------------------------------------");
            qrcode.generate(qr, { small: true });
            console.log("Scan QR with WhatsApp > Linked Devices. Or use Pairing Code if shown.");
        }
        if (connection === 'close') {
            if (onlineInterval) clearInterval(onlineInterval);
            if (bioInterval) clearInterval(bioInterval);

            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                    statusCode !== DisconnectReason.connectionReplaced &&
                                    statusCode !== DisconnectReason.badSession && 
                                    statusCode !== DisconnectReason.multideviceMismatch; 

            console.log(`Connection closed due to: ${lastDisconnect?.error}, statusCode: ${statusCode}, reconnecting: ${shouldReconnect}`);
            
            if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession || statusCode === DisconnectReason.multideviceMismatch) {
                console.error("🛑 Connection issue: Logged out, bad session, or multi-device mismatch. Please delete the 'baileys_auth_info' folder and restart the bot to re-pair.");
                (process as NodeJS.Process).exit(1);
            } else if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 5000); 
            } else if (statusCode === DisconnectReason.connectionReplaced) {
                console.error("🛑 Connection replaced, another session for this bot number was started elsewhere. Please close other sessions or restart.");
                (process as NodeJS.Process).exit(1);
            }
        } else if (connection === 'open') {
            console.log(`🎉 ${config.BOT_NAME} connected successfully! Bot is ready.`);
            console.log(`Bot Number: ${jidNormalizedUser(sock.user?.id || "Unknown")}`);
            if (config.OWNER_NUMBERS.length > 0 && config.OWNER_NUMBERS[0]) {
                try {
                    sock.sendMessage(jidNormalizedUser(config.OWNER_NUMBERS[0]), {text: `🚀 *${config.BOT_NAME} is now online and ready!* \nMode: ${config.BOT_MODE}\nPrefix: ${config.BOT_PREFIX}`});
                } catch (e) {
                    console.warn("Could not send online notification to owner:", e);
                }
            }
            if (config.ALWAYS_ONLINE_ENABLED) {
                sendOnlinePresence(sock); 
                onlineInterval = setInterval(() => sendOnlinePresence(sock), 60000); 
            }
            if (config.AUTO_BIO_ENABLED) {
                updateAutoBio(sock); 
                bioInterval = setInterval(() => updateAutoBio(sock), 5 * 60 * 1000); 
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') {
            if (config.AUTO_STATUS_VIEW_ENABLED && msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe && msg.key.participant) {
                try {
                    await sock.readMessages([{ remoteJid: 'status@broadcast', id: msg.key.id!, participant: msg.key.participant }]);
                    console.log(`👀 Viewed status from ${msg.key.participant}`);
                } catch (e) { /* ignore */ }
            }
            return;
        }

        if (msg.key.remoteJid && msg.key.id && !msg.key.fromMe) { 
            if (!global.deletedMessagesStore[msg.key.remoteJid]) {
                global.deletedMessagesStore[msg.key.remoteJid] = {};
            }
            global.deletedMessagesStore[msg.key.remoteJid][msg.key.id] = JSON.parse(JSON.stringify(msg)); 
            const chatMessageIds = Object.keys(global.deletedMessagesStore[msg.key.remoteJid]);
            if (chatMessageIds.length > 200) { 
                delete global.deletedMessagesStore[msg.key.remoteJid][chatMessageIds[0]];
            }
        }

        const senderJid = msg.key.remoteJid!;
        const messageText = getMessageText(msg).trim();
        const groupJid = getGroupJid(msg);
        const participantJid = msg.key.participant ? jidNormalizedUser(msg.key.participant) : jidNormalizedUser(senderJid);
        const isOwner = config.OWNER_NUMBERS.includes(participantJid);

        if (msg.key.fromMe && !isOwner && !messageText.startsWith(config.BOT_PREFIX)) { // Allow owner to command self
            return;
        }
        
        if (config.AUTO_READ_ENABLED && !msg.key.fromMe) {
            await sock.readMessages([msg.key]);
        }
        
        const isTypingForCommand = messageText.startsWith(config.BOT_PREFIX) && (!msg.key.fromMe || isOwner);
        if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) {
            await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        }

        const autoReplyState = getAutoReplyState();
        if (autoReplyState.enabled && !messageText.startsWith(config.BOT_PREFIX) && !msg.key.fromMe && !groupJid && !isOwner) { 
            await sock.sendMessage(senderJid, { text: autoReplyState.message }, { quoted: msg });
            if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
            return;
        }
        
        // Interactive Menu Handling & Play Command Replies
        const userIdForContext = msg.key.participant || msg.key.remoteJid!;
        if (userMenuContext[userIdForContext] && userMenuContext[userIdForContext].state.startsWith("main_menu")) {
            const selection = parseInt(messageText.trim());
            if (!isNaN(selection)) {
                if (selection === 0) {
                    await sock.sendMessage(senderJid, { text: "Menu exited." });
                    delete userMenuContext[userIdForContext];
                } else {
                    const categories = getAllMenuCategories();
                    if (selection > 0 && selection <= categories.length) {
                        const selectedCategory = categories[selection - 1];
                        userMenuContext[userIdForContext] = { state: `category_${selectedCategory.key}`, currentCategory: selectedCategory.key };
                        // Pass the globally imported allCommandsMap
                        await displayCategoryCommands(sock, senderJid, selectedCategory.key, allCommandsMap, config.BOT_PREFIX, config.BOT_NAME);

                    } else {
                        await sock.sendMessage(senderJid, { text: "Invalid category number. Please reply with a number from the menu or 0 to exit." });
                    }
                }
                if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
                return; // Interaction handled
            }
        }
        // Handle play command replies
        if (playCommandUserContext[userIdForContext]) {
            const handledByPlay = await handlePlayCommandReply(sock, msg, messageText, config.BOT_PREFIX);
            if (handledByPlay) {
                 if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
                return; // Interaction handled
            }
        }


        if (groupJid) {
            const settings = getGroupSettings(groupJid);
            const senderIsAdmin = await isGroupAdmin(sock, groupJid, participantJid);
            const botIsAdminInGroup = await isBotAdmin(sock, groupJid);

            if (!senderIsAdmin && !isOwner) { // Anti-link and Anti-sticker for non-admins/non-owners
                if (settings.antilink && settings.antilink !== 'off' && /(https?:\/\/[^\s]+)/gi.test(messageText)) {
                    if (botIsAdminInGroup) {
                        const originalMsgKey = msg.key;
                        await sock.sendMessage(groupJid, { 
                            text: `🔗 @${participantJid.split('@')[0]}, links are not allowed here! Message deleted.`, 
                            mentions: [participantJid] 
                        });
                        await sock.sendMessage(groupJid, { delete: originalMsgKey });
                        
                        if (settings.antilink === 'kick') {
                            await sock.sendMessage(groupJid, { 
                                text: `👢 Kicking @${participantJid.split('@')[0]} for sending a link (Anti-Link Kick).`, 
                                mentions: [participantJid] 
                            });
                            await sock.groupParticipantsUpdate(groupJid, [participantJid], "remove");
                        }
                        if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
                        return; 
                    } else {
                         await sock.sendMessage(groupJid, { text: `🔗 Detected a link from @${participantJid.split('@')[0]}, but I'm not admin to enforce anti-link rules.`, mentions: [participantJid] });
                    }
                }

                if (settings.antisticker && msg.message?.stickerMessage) {
                     if (botIsAdminInGroup) {
                        await sock.sendMessage(groupJid, { text: `🎨 @${participantJid.split('@')[0]}, stickers are not allowed here! Sticker deleted.`, mentions: [participantJid] });
                        await sock.sendMessage(groupJid, { delete: msg.key });
                        if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
                        return; 
                     } else {
                        await sock.sendMessage(groupJid, { text: `🎨 Detected a sticker from @${participantJid.split('@')[0]}, but I'm not admin to delete it.`, mentions: [participantJid] });
                     }
                }
            }
        }


        if (messageText.startsWith(config.BOT_PREFIX)) {
            const [command, ...args] = messageText.slice(config.BOT_PREFIX.length).trim().split(/ +/);
            const fullArgs = args.join(' ');

            if (!ai && ['ai', 'gpt', 'lydia', 'lydea', 'chat', 'remini'].includes(command.toLowerCase())) {
                await sock.sendMessage(senderJid, { text: "⚠️ Gemini AI features are currently disabled. Please configure the GEMINI_API_KEY." });
                if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
                return;
            }
            
            console.log(`[CMD] From: ${msg.pushName || participantJid} in ${groupJid || 'DM'}. Command: ${command}, Args: ${args}`);

            try {
                 await handleCommand({
                    sock,
                    msg,
                    command,
                    args,
                    fullArgs,
                    ownerNumbers: config.OWNER_NUMBERS,
                    botName: config.BOT_NAME,
                    prefix: config.BOT_PREFIX,
                    ai: ai!, 
                    logger
                });
            } catch (error) {
                 console.error(`Error processing command: ${command}`, error);
                 await sock.sendMessage(senderJid, { text: `An error occurred while executing the command: ${command}` });
            } finally {
                 if (config.AUTO_TYPING_ENABLED && msg.key.remoteJid && isTypingForCommand) {
                    await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
                }
            }

        } else if (msg.message?.pollUpdateMessage) { 
            const pollUpdate = msg.message.pollUpdateMessage;
            const voterJid = msg.key.participant || msg.key.remoteJid; 

            if (pollUpdate.pollCreationMessageKey && pollUpdate.vote && voterJid) {
                console.log(`Poll update received for poll ID ${pollUpdate.pollCreationMessageKey.id} from ${voterJid}`);
                const selectedOptionHexes = pollUpdate.vote?.selectedOptionHashes?.map(hash => Buffer.from(hash).toString('hex')).join(', ') || 'No option selected'; // Changed to selectedOptionHashes
                console.log(`Selected options hashes: ${selectedOptionHexes}`);
                
                const originalPollMsgKey = pollUpdate.pollCreationMessageKey;
                const originalPollMsg = global.deletedMessagesStore?.[originalPollMsgKey.remoteJid!]?.[originalPollMsgKey.id!];

                if (originalPollMsg && originalPollMsg.message?.pollCreationMessage) {
                    const pollUpdateForAggregator: proto.IPollUpdate = {
                        pollUpdateMessageKey: msg.key, 
                        vote: pollUpdate.vote, 
                        senderTimestampMs: pollUpdate.senderTimestampMs,
                    };
                    try {
                        const aggregatedVotes = getAggregateVotesInPollMessage({
                            message: originalPollMsg.message!, 
                            pollUpdates: [pollUpdateForAggregator], 
                        });
                        console.log(`Aggregated votes for poll ${originalPollMsgKey.id}:`, JSON.stringify(aggregatedVotes, null, 2));
                    } catch (e) {
                        console.error("Error aggregating poll votes:", e);
                    }
                }
            }
        }
    });

    sock.ev.on('messages.update', async (updates) => {
        for (const { key, update } of updates) {
            if (update.messageStubType === WAMessageStubType.REVOKE && config.ANTI_DELETE_ENABLED) {
                const deletedMsg = global.deletedMessagesStore?.[key.remoteJid!]?.[key.id!];
                if (deletedMsg) {
                    const deleterJid = key.participant || key.remoteJid; 
                    const originalSenderJid = deletedMsg.key.participant || deletedMsg.key.remoteJid;
                    
                    const deleterName = (deleterJid ? deleterJid.split('@')[0] : 'Unknown'); // Corrected: No access to current 'msg' from upsert
                    const originalSenderName = deletedMsg.pushName || (originalSenderJid ? originalSenderJid.split('@')[0] : 'Unknown');


                    let groupNameText = '';
                    if (isJidGroup(key.remoteJid!)) {
                        try {
                            const groupMeta = await sock.groupMetadata(key.remoteJid!);
                            groupNameText = `in group *${groupMeta.subject}*`;
                        } catch { groupNameText = `in group ${key.remoteJid!}`; }
                    } else {
                        groupNameText = 'in a DM';
                    }

                    let notificationText = `╭─⊷「 🗑️ ANTI-DELETE 🗑️ 」\n`;
                    notificationText += `│ Message deleted ${groupNameText}.\n`;
                    notificationText += sectionSeparator();
                    notificationText += `│ 👤 *Original Sender:* @${originalSenderJid?.split('@')[0]} (${originalSenderName})\n`;
                    notificationText += `│ 🔪 *Deleted By:* @${deleterJid?.split('@')[0]} (${deleterName})\n`;
                    
                    const messageType = Object.keys(deletedMsg.message!)[0];
                    notificationText += `│ 📜 *Message Type:* ${messageType.replace('Message', '')}\n`;

                    let contentPreview = "";
                    if (deletedMsg.message?.conversation) {
                        contentPreview = deletedMsg.message.conversation;
                    } else if (deletedMsg.message?.extendedTextMessage?.text) {
                        contentPreview = deletedMsg.message.extendedTextMessage.text;
                    } else if (deletedMsg.message?.imageMessage?.caption) {
                        contentPreview = `🖼️ Image: ${deletedMsg.message.imageMessage.caption || "(No caption)"}`;
                    } else if (deletedMsg.message?.videoMessage?.caption) {
                        contentPreview = `🎬 Video: ${deletedMsg.message.videoMessage.caption || "(No caption)"}`;
                    } else if (deletedMsg.message?.documentMessage?.caption) {
                         contentPreview = `📄 Document: ${deletedMsg.message.documentMessage.fileName || "(No name)"} ${deletedMsg.message.documentMessage.caption || ""}`;
                    } else if (deletedMsg.message?.stickerMessage){
                        contentPreview = `🎨 Sticker (not forwarded)`;
                    } else if (deletedMsg.message?.audioMessage){
                        contentPreview = `🎵 Audio (not forwarded as text)`;
                    }
                     else {
                        contentPreview = `[Complex message type: ${messageType.replace('Message', '')}]`;
                    }
                    notificationText += `│ 💬 *Content Preview:* ${contentPreview.substring(0, 100)}${contentPreview.length > 100 ? "..." : ""}\n`;
                    notificationText += commandFooter();
                    
                    for (const owner of config.OWNER_NUMBERS) {
                        try {
                            const mentions = [];
                            if (deleterJid) mentions.push(jidNormalizedUser(deleterJid));
                            if (originalSenderJid) mentions.push(jidNormalizedUser(originalSenderJid));

                            await sock.sendMessage(owner, { 
                                text: notificationText, 
                                mentions: mentions.length > 0 ? mentions.filter(Boolean) as string[] : undefined
                            });

                            // Forward certain types of media directly
                            if (deletedMsg.message) {
                                const msgContent = deletedMsg.message;
                                const mediaCaption = `(Deleted ${messageType.replace('Message','')} from @${originalSenderName}) ${
                                    msgContent.imageMessage?.caption || 
                                    msgContent.videoMessage?.caption || 
                                    msgContent.documentMessage?.caption || ''
                                }`.trim();

                                if (msgContent.imageMessage || msgContent.videoMessage || msgContent.audioMessage || msgContent.stickerMessage || msgContent.documentMessage) {
                                     // Create a forwardable message.
                                    const forwardableMsg = {
                                        key: deletedMsg.key,
                                        message: deletedMsg.message,
                                        pushName: deletedMsg.pushName,
                                        messageTimestamp: deletedMsg.messageTimestamp
                                    } as WAMessage;

                                    if(msgContent.imageMessage || msgContent.videoMessage || msgContent.documentMessage){
                                         await sock.sendMessage(owner, { forward: forwardableMsg, caption: mediaCaption, mentions: originalSenderJid ? [jidNormalizedUser(originalSenderJid)] : undefined } );
                                    } else {
                                        await sock.sendMessage(owner, { forward: forwardableMsg }); // For audio/sticker that don't take caption in forward
                                    }
                                } else if (msgContent.conversation || msgContent.extendedTextMessage) {
                                    await sock.sendMessage(owner, { forward: deletedMsg });
                                }
                            }
                        } catch (e: any) {
                            console.error(`Failed to send anti-delete notification or media to ${owner}: ${e.message}`);
                        }
                    }
                    console.log(`Anti-delete: Message ${key.id} from ${originalSenderJid} (deleted by ${deleterJid}) in ${key.remoteJid} was captured.`);
                }
            }
        }
    });

    sock.ev.on('group-participants.update', async (updateEvent: GroupParticipantsUpdate) => { 
        const { id, participants, action } = updateEvent;
        const groupSettingsForEvent = getGroupSettings(id);
        const botIsAdminInGroup = await isBotAdmin(sock, id);

        for (const jid of participants) {
            let userName = jid.split('@')[0]; 
            try {
                if (sock.user && jid === jidNormalizedUser(sock.user.id)) {
                    userName = config.BOT_NAME; 
                } else {
                    // pushName is not available here, use JID part
                    userName = jid.split('@')[0];
                }
            } catch (e) { /* ignore */ }


            if (action === 'add' && isWelcomeEnabled(id) && !config.OWNER_NUMBERS.includes(jid)) {
                if (jid === jidNormalizedUser(sock.user?.id)) continue; 
                try {
                    const groupMetadata = await sock.groupMetadata(id);
                    await sock.sendMessage(id, { 
                        text: `🎉 Welcome @${userName} to *${groupMetadata.subject}*! We're glad to have you. Type ${config.BOT_PREFIX}menu to see what I can do!`,
                        mentions: [jid]
                    });
                } catch (e) {
                    console.error("Error sending welcome message:", e);
                }
            } else if (action === 'remove' && isGoodbyeEnabled(id) && !config.OWNER_NUMBERS.includes(jid)) {
                if (jid === jidNormalizedUser(sock.user?.id)) continue; 
                try {
                     const groupMetadata = await sock.groupMetadata(id);
                    await sock.sendMessage(id, { 
                        text: `👋 Goodbye @${userName} from *${groupMetadata.subject}*. We'll not miss you!`,
                        mentions: [jid]
                    });
                } catch (e) {
                    console.error("Error sending goodbye message:", e);
                }
            }

            if (action === 'add' && groupSettingsForEvent.antibot && botIsAdminInGroup) {
                 if (jid !== jidNormalizedUser(sock.user?.id) && !config.OWNER_NUMBERS.includes(jid)) { 
                    try {
                        const JidDevice = getDevice(jid);
                        const isLikelyBot = /bot/i.test(jid) || (JidDevice !== 'android' && JidDevice !== 'ios' && JidDevice !== 'web');

                        if (isLikelyBot) { 
                            await sock.sendMessage(id, { text: `🤖 Detected potential bot @${userName}. Removing...`, mentions: [jid] });
                            await sock.groupParticipantsUpdate(id, [jid], "remove");
                            console.log(`AntiBot: Kicked ${userName} from ${id}`);
                        }
                    } catch (e) {
                        console.error(`AntiBot check error for ${userName} in ${id}:`, e);
                    }
                }
            }

            if (action === 'leave' && groupSettingsForEvent.antileft && botIsAdminInGroup) {
                if (jid !== jidNormalizedUser(sock.user?.id) && !config.OWNER_NUMBERS.includes(jid)) { 
                    try {
                        await sock.sendMessage(id, { text: `🤔 @${userName} left, but anti-left is on. Attempting to re-add...`, mentions: [jid] });
                        const addResult = await sock.groupParticipantsUpdate(id, [jid], "add" as ParticipantAction); 
                        const firstResult = addResult[0];
                        
                        if (firstResult && (firstResult.status === '200' || firstResult.status?.startsWith('20')) ) {
                           console.log(`AntiLeft: Successfully re-added ${userName} to ${id}`);
                        } else if (firstResult && firstResult.status) {
                           console.warn(`AntiLeft: Failed to re-add ${userName} to ${id}. Status: ${firstResult.status}`);
                           await sock.sendMessage(id, { text: `⚠️ Could not re-add @${userName}. They might have blocked the bot or have privacy settings preventing re-add. (Status: ${firstResult.status})`, mentions: [jid] });
                        } else {
                           console.warn(`AntiLeft: Failed to re-add ${userName} to ${id}. Response:`, addResult);
                           await sock.sendMessage(id, { text: `⚠️ Could not re-add @${userName} due to an unknown issue or privacy settings.`, mentions: [jid] });
                        }
                    } catch (e: any) {
                        console.error(`AntiLeft: Failed to re-add ${userName} to ${id}:`, e);
                        await sock.sendMessage(id, { text: `⚠️ Could not re-add @${userName} due to an error: ${e.message || 'Unknown error'}.`, mentions: [jid] });
                    }
                }
            }
        }
    });

    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer' && config.ANTI_CALL_ENABLED && !config.OWNER_NUMBERS.includes(jidNormalizedUser(call.from))) {
                console.log(`📞 Incoming call from ${call.from} (ID: ${call.id}), rejecting due to anti-call.`);
                await sock.rejectCall(call.id, call.from);
                try {
                    await sock.sendMessage(call.from, { text: `🔔 *${config.BOT_NAME}* does not accept calls. Your call has been declined. Please use text messages.\n\n_I'll get back to you later when am less busy._` });
                } catch (e) {
                    console.warn(`Failed to send anti-call notification to ${call.from}:`, e);
                }
            }
        }
    });
}

connectToWhatsApp().catch(err => console.error("Unhandled promise rejection in connectToWhatsApp:", err));

(process as NodeJS.Process).on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(process as NodeJS.Process).on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
