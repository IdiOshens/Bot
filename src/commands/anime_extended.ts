
import { CommandHandlerParams } from '../types';
import axios from 'axios';

// Using a generic SFW image API. Replace with specific anime image APIs if available.
const SFW_ANIME_API = "https://api.waifu.pics/sfw"; // Good for some specific tags
const UNSPLASH_RANDOM = "https://source.unsplash.com/800x600/"; // For more generic queries

const fetchAnimeImage = async (
    sock: CommandHandlerParams['sock'], 
    jid: string, 
    api: "waifupics" | "unsplash",
    queryOrEndpoint: string, 
    displayName: string,
    captionSuffix: string = "image"
) => {
    try {
        let imageUrl: string | undefined;
        if (api === "waifupics") {
            const response = await axios.get(`${SFW_ANIME_API}/${queryOrEndpoint}`);
            imageUrl = response.data?.url;
        } else if (api === "unsplash") {
            imageUrl = `${UNSPLASH_RANDOM}?${encodeURIComponent(queryOrEndpoint)}`;
        }

        if (imageUrl) {
            await sock.sendMessage(jid, { 
                image: { url: imageUrl }, 
                caption: `🌸 Here's a SFW ${displayName} ${captionSuffix}!`
            });
        } else {
            await sock.sendMessage(jid, { text: `Sorry, I couldn't find a SFW ${displayName} ${captionSuffix} for '${queryOrEndpoint}'.` });
        }
    } catch (error) {
        console.error(`Error fetching SFW ${displayName} (${queryOrEndpoint}):`, error);
        await sock.sendMessage(jid, { text: `An error occurred while fetching a SFW ${displayName} ${captionSuffix}.` });
    }
};

// This neko is specifically for the 'anime' category as per the user's menu.
// There's another 'neko' in misc.ts for the 'waifu' category. Ensure commandHandler handles this.
export const neko = async ({ sock, msg }: CommandHandlerParams) => {
    await fetchAnimeImage(sock, msg.key.remoteJid!, 'waifupics', 'neko', 'neko', 'cat girl/boy');
};
neko.description = "Sends a SFW neko (cat girl/boy) image. (Anime Category)";
neko.category = "anime"; 

export const husbu = async ({ sock, msg }: CommandHandlerParams) => {
    // waifu.pics doesn't have a direct SFW "husbando" category.
    // We can use a general anime boy image from another source.
    await fetchAnimeImage(sock, msg.key.remoteJid!, 'unsplash', 'anime boy, handsome anime male', 'husbando');
};
husbu.description = "Sends a SFW husbando (male anime character) image.";
husbu.category = "anime";

export const loli = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: "The term 'loli' can be sensitive. Sending a SFW 'chibi' or 'cute anime character' image instead to ensure safety." });
    // Using 'neko' as a proxy for cute SFW anime character from waifu.pics
    await fetchAnimeImage(sock, msg.key.remoteJid!, 'waifupics', 'neko', 'cute anime character');
};
loli.description = "Sends a SFW cute anime character image (replaces sensitive term).";
loli.category = "anime";

export const shota = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: "The term 'shota' can be sensitive. Sending a SFW 'cute anime boy' image instead to ensure safety." });
    await fetchAnimeImage(sock, msg.key.remoteJid!, 'unsplash', 'cute anime boy, chibi boy', 'cute anime boy');
};
shota.description = "Sends a SFW cute anime boy image (replaces sensitive term).";
shota.category = "anime";

// This waifu is specifically for the 'anime' category as per the user's menu.
// There's another 'waifu' in misc.ts for the 'waifu' category. Ensure commandHandler handles this.
export const waifu = async ({ sock, msg }: CommandHandlerParams) => {
    await fetchAnimeImage(sock, msg.key.remoteJid!, 'waifupics', 'waifu', 'waifu');
};
waifu.command = "waifu";
waifu.description = "Sends a SFW waifu image. (Anime Category)";
waifu.category = "anime";
