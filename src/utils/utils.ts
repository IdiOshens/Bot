
import { proto } from '@whiskeysockets/baileys';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

export const getSender = (msg: proto.IWebMessageInfo): string => {
    return msg.key.remoteJid || '';
};

export const getGroupJid = (msg: proto.IWebMessageInfo): string | null => {
    return msg.key.remoteJid?.endsWith('@g.us') ? msg.key.remoteJid : null;
};

export const getMessageText = (msg: proto.IWebMessageInfo): string => {
    return msg.message?.conversation || 
           msg.message?.extendedTextMessage?.text || 
           msg.message?.imageMessage?.caption || 
           msg.message?.videoMessage?.caption || 
           '';
};

export const isGroupAdmin = async (
    sock: any, 
    groupJid: string, 
    participantJid: string
): Promise<boolean> => {
    if (!groupJid.endsWith('@g.us')) return false;
    try {
        const groupMetadata = await sock.groupMetadata(groupJid);
        const normalizedUserJid = jidNormalizedUser(participantJid);
        const participant = groupMetadata.participants.find(
            (p: any) => jidNormalizedUser(p.id) === normalizedUserJid
        );
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
};

export const isBotAdmin = async (
    sock: any, 
    groupJid: string
): Promise<boolean> => {
    if (!groupJid.endsWith('@g.us')) return false;
    try {
        const groupMetadata = await sock.groupMetadata(groupJid);
        // Use jidNormalizedUser to ensure correct comparison
        const botJidRaw = sock.user?.id || "";
        const normalizedBotJid = jidNormalizedUser(botJidRaw);
        const botParticipant = groupMetadata.participants.find(
            (p: any) => jidNormalizedUser(p.id) === normalizedBotJid
        );
        return botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
    } catch (error) {
        console.error("Error checking bot admin status:", error);
        return false;
    }
};

export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const pickRandom = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const parseJsonFromText = (text: string): any | null => {
    try {
        let jsonStr = text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        return null;
    }
};
