
import { CommandHandlerParams } from '../types';
import { isPremiumUser } from './owner'; 
import { OWNER_NUMBERS } from '../config'; // Import directly from config
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const premiumOnlyMessage = "💎 This command is for premium users only. Contact the owner to get premium access.";

export const hentaivid = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    // Use ownerNumbers from params for consistency, or OWNER_NUMBERS (imported from config) if preferred globally
    if (!isPremiumUser(sender) && !ownerNumbers.includes(jidNormalizedUser(sender))) { 
        return sock.sendMessage(msg.key.remoteJid!, { text: premiumOnlyMessage });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: '🔞 Hentai video command (placeholder).\nAccess to this type of content is restricted and not available in this bot version due to content policies.' });
};
hentaivid.description = "Fetches hentai videos (Placeholder - Premium & Content Policy Restricted).";
hentaivid.category = "premium_users";
hentaivid.usage = ".hentaivid [search_term]";

export const xnx = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!isPremiumUser(sender) && !ownerNumbers.includes(jidNormalizedUser(sender))) {
        return sock.sendMessage(msg.key.remoteJid!, { text: premiumOnlyMessage });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: '🔞 XNXX search/download command (Placeholder).\nAccess to this type of content is restricted and not available in this bot version due to content policies.' });
};
xnx.description = "Searches/downloads from XNXX (Placeholder - Premium & Content Policy Restricted).";
xnx.category = "premium_users";
xnx.usage = ".xnx <search_term>";

export const xxvideo = async ({ sock, msg, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!isPremiumUser(sender) && !ownerNumbers.includes(jidNormalizedUser(sender))) {
        return sock.sendMessage(msg.key.remoteJid!, { text: premiumOnlyMessage });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: '🔞 XXX video command (Placeholder).\nAccess to this type of content is restricted and not available in this bot version due to content policies.' });
};
xxvideo.description = "Searches/downloads XXX videos (Placeholder - Premium & Content Policy Restricted).";
xxvideo.category = "premium_users";
xxvideo.usage = ".xxvideo <search_term>";
