
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import { pickRandom } from '../utils/utils';

const ANIME_API_BASE_SFW = "https://api.waifu.pics/sfw";
const UNSPLASH_RANDOM_SFW = "https://source.unsplash.com/800x600/";

const sendNsfwNotice = async (
    sock: CommandHandlerParams['sock'], 
    jid: string, 
    commandName: string, 
    sfwAlternativeCategory?: string, 
    alternativeName?: string,
    altApi: "waifupics" | "unsplash" = "waifupics"
) => {
    let message = `🔞 The command '.${commandName}' is associated with NSFW content. 
This bot *does not* provide explicit material due to safety and platform policies.`;

    if (sfwAlternativeCategory) {
        message += `\n\nInstead, here's a SFW (Safe For Work) image related to '${alternativeName || sfwAlternativeCategory}':`;
        try {
            let imageUrl: string | undefined;
            if (altApi === "waifupics") {
                const response = await axios.get(`${ANIME_API_BASE_SFW}/${sfwAlternativeCategory}`);
                imageUrl = response.data?.url;
            } else { // unsplash
                imageUrl = `${UNSPLASH_RANDOM_SFW}?${encodeURIComponent(sfwAlternativeCategory)}`;
            }

            if (imageUrl) {
                await sock.sendMessage(jid, { 
                    image: { url: imageUrl }, 
                    caption: message 
                });
            } else {
                await sock.sendMessage(jid, { text: `${message}\n(Could not fetch SFW alternative image for '${sfwAlternativeCategory}' at the moment.)` });
            }
        } catch (error) {
            console.error(`Error fetching SFW alternative for ${commandName} (category ${sfwAlternativeCategory}):`, error);
            await sock.sendMessage(jid, { text: `${message}\n(Error fetching SFW alternative image for '${sfwAlternativeCategory}'.)` });
        }
    } else {
        await sock.sendMessage(jid, { text: message });
    }
};

// --- Hentai Category (SFW Placeholders) ---
export const hwaifu = async (params: CommandHandlerParams) => {
    try {
        const response = await axios.get(`${ANIME_API_BASE_SFW}/waifu`);
        const imageUrl = response.data?.url;
        if (imageUrl) {
            await params.sock.sendMessage(params.msg.key.remoteJid!, {
                image: { url: imageUrl },
                caption: "Here's a SFW waifu image!"
            });
        } else {
            await params.sock.sendMessage(params.msg.key.remoteJid!, {
                text: "Could not fetch a SFW waifu image at the moment."
            });
        }
    } catch (error) {
        console.error("Error fetching SFW waifu image:", error);
        await params.sock.sendMessage(params.msg.key.remoteJid!, {
            text: "Error fetching SFW waifu image."
        });
    }
};
hwaifu.description = "Sends a SFW waifu image.";
hwaifu.category = "hentai";

export const trap = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'trap', 'neko', 'a SFW neko (cat person)');
};
trap.description = "Sends a SFW neko image as a safe alternative for 'trap'.";
trap.category = "hentai";

export const blowjob_hentai = async (params: CommandHandlerParams) => { // Actual command name
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'blowjob');
};
blowjob_hentai.description = "This command is not implemented due to its explicit nature (SFW placeholder).";
blowjob_hentai.category = "hentai";
blowjob_hentai.aliases = ['blowjob']; // User-facing alias for hentai category

export const neko_hentai = async (params: CommandHandlerParams) => { // Actual command name
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'neko (hentai context)', 'neko', 'a SFW neko');
};
neko_hentai.description = "Sends a SFW neko image as a safe alternative for 'hneko'.";
neko_hentai.category = "hentai";
neko_hentai.aliases = ['hneko']; // User-facing alias


// --- NSFW Category (SFW Placeholders / Disclaimers) ---
// Note: Some command names might conflict if not handled with aliases or unique names
// `blowjob` (from Hentai category) and `neko` (from Hentai category) are already aliased.
// We need to ensure that the command handler prioritizes correctly or uses distinct internal names.
// For now, these are explicitly SFW.

export const cuckold = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'cuckold', 'hug', 'a SFW hug image', "waifupics");
};
cuckold.description = "NSFW command placeholder. Sends a SFW hug image.";
cuckold.category = "nsfw";

export const eba = async (params: CommandHandlerParams) => {
    // 'eba' is too generic, let's provide a random cute animal as a placeholder
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'eba', 'happy', 'a SFW happy image', "waifupics");
};
eba.description = "NSFW command placeholder. Sends SFW happy image instead.";
eba.category = "nsfw";

export const foot = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'foot', 'kick', 'an action pose (SFW)', "waifupics");
};
foot.description = "NSFW command placeholder. Sends a SFW action image instead.";
foot.category = "nsfw";

export const milf = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'milf', 'waifu', 'a SFW waifu');
};
milf.description = "NSFW command placeholder. Sends SFW waifu image instead.";
milf.category = "nsfw";

export const pussy = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'pussy', 'cat', 'a cute SFW cat (actual cat)', "unsplash");
};
pussy.description = "This command is not implemented due to its explicit nature. Sends SFW cat image.";
pussy.category = "nsfw";

export const yuri = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'yuri', 'handhold', 'a SFW romantic/handhold image', "waifupics");
};
yuri.description = "Suggestive command placeholder. Sends SFW 'handhold' image instead.";
yuri.category = "nsfw";

export const zettai = async (params: CommandHandlerParams) => {
    await sendNsfwNotice(params.sock, params.msg.key.remoteJid!, 'zettai', 'waifu', 'a SFW character image');
};
zettai.description = "NSFW-associated term placeholder. Sends SFW waifu image instead.";
zettai.category = "nsfw";
zettai.aliases = ["zettairyouiki"];
