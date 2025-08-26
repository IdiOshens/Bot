
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import { pickRandom } from '../utils/utils';

const ANIME_API_BASE_SFW = "https://api.waifu.pics/sfw"; 
const UNSPLASH_BASE = "https://source.unsplash.com/1080x1920/"; // For phone wallpapers

const fetchWallpaper = async (sock: CommandHandlerParams['sock'], jid: string, query: string, categoryName: string, customCaption?: string) => {
    try {
        // Using Unsplash as it's more reliable for diverse SFW wallpapers
        const imageUrl = `${UNSPLASH_BASE}?${encodeURIComponent(query)}&cache_bust=${Date.now()}`; 
        await sock.sendMessage(jid, { 
            image: { url: imageUrl }, 
            caption: customCaption || `🖼️ Here's a ${categoryName} wallpaper for you!` 
        });
    } catch (error) {
        console.error(`Error fetching ${categoryName} wallpaper for query "${query}":`, error);
        await sock.sendMessage(jid, { text: `Sorry, I couldn't find a ${categoryName} wallpaper for "${query}" right now.` });
    }
};

export const animeWp = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "anime scenery, anime landscape, vibrant anime art", "anime", "🌸 Aesthetic Anime Wallpaper");
animeWp.description = "Sends a random SFW anime wallpaper.";
animeWp.category = "wallpapers";
animeWp.aliases = ["anime"]; 

export const uchicha = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "uchiha clan, sharingan, naruto uchiha", "Uchiha Clan", "👁️ Uchiha Clan Wallpaper");
uchicha.description = "Sends a random Uchiha clan wallpaper.";
uchicha.category = "wallpapers";

export const naruto = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "naruto uzumaki, naruto shippuden, nine tails", "Naruto", "🍥 Naruto Uzumaki Wallpaper");
naruto.description = "Sends a random Naruto wallpaper.";
naruto.category = "wallpapers";

export const sasuke = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "sasuke uchiha, rinnegan, chidori", "Sasuke", "⚡ Sasuke Uchiha Wallpaper");
sasuke.description = "Sends a random Sasuke wallpaper.";
sasuke.category = "wallpapers";

export const abstract = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "abstract art, colorful abstract, geometric abstract", "abstract", "🎨 Abstract Wallpaper");
abstract.description = "Sends a random abstract wallpaper.";
abstract.category = "wallpapers";

export const random = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "cool wallpaper, epic scenery, fantasy landscape", "random", "🎲 Random Wallpaper");
random.description = "Sends a random wallpaper.";
random.category = "wallpapers";


// --- Waifu (SFW) ---
const fetchWaifuPicsSfw = async (sock: CommandHandlerParams['sock'], jid: string, category: string, captionCategory?: string) => {
    const displayCategory = captionCategory || category;
    try {
        const response = await axios.get(`${ANIME_API_BASE_SFW}/${category}`);
        if (response.data.url) {
            await sock.sendMessage(jid, { image: { url: response.data.url }, caption: `💖 Here's a SFW ${displayCategory} image!` });
        } else {
            await sock.sendMessage(jid, { text: `Couldn't find a SFW ${displayCategory} image.` });
        }
    } catch (error) {
        console.error(`Error fetching SFW ${category}:`, error);
        await sock.sendMessage(jid, { text: `Sorry, an error occurred while fetching a SFW ${displayCategory} image.` });
    }
};

export const nekoWaifu = async (params: CommandHandlerParams) => fetchWaifuPicsSfw(params.sock, params.msg.key.remoteJid!, 'neko', 'neko girl/boy');
nekoWaifu.description = "Sends a SFW neko (cat girl/boy) image.";
nekoWaifu.category = "waifu";
nekoWaifu.aliases = ["neko"]; 

export const couplepp = async ({ sock, msg }: CommandHandlerParams) => {
    try {
        // Attempt to get one more "masculine" and one "feminine" SFW anime character image
        // These are broad searches and might not always perfectly align.
        const responseMale = await axios.get(`https://api.waifu.im/search/?included_tags=husbando&is_nsfw=false`);
        let maleImgUrl = responseMale.data?.images?.[0]?.url;

        if (!maleImgUrl) { // Fallback for male image
            const unsplashMale = await axios.get(`https://source.unsplash.com/800x800/?anime boy,cool anime character&cache_bust=${Date.now()}`, { responseType: 'blob'});
            if(unsplashMale.request?.responseURL) maleImgUrl = unsplashMale.request.responseURL;
        }


        const responseFemale = await axios.get(`${ANIME_API_BASE_SFW}/waifu`);
        const femaleImgUrl = responseFemale.data?.url;

        if (maleImgUrl && femaleImgUrl) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: maleImgUrl }, caption: "Couple PP 1/2 (SFW)\n(Note: The 'torn apart' look is custom and complex to automate. Here are two distinct character images.)" });
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: femaleImgUrl }, caption: "Couple PP 2/2 (SFW)" });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: "Couldn't fetch SFW couple profile pictures. One or both image sources might have failed." });
        }
    } catch (error) {
        console.error("Error fetching SFW couple PPs:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "Sorry, an error occurred while fetching SFW couple profile pictures." });
    }
};
couplepp.description = "Sends a pair of SFW profile pictures (one male-leaning, one female-leaning).";
couplepp.category = "waifu";

export const cosplay = async (params: CommandHandlerParams) => fetchWallpaper(params.sock, params.msg.key.remoteJid!, "anime cosplay, game cosplay, cool cosplay", "cosplay", "🎭 Cosplay Image");
cosplay.description = "Sends a random cosplay image.";
cosplay.category = "waifu";

export const megumin = async (params: CommandHandlerParams) => fetchWaifuPicsSfw(params.sock, params.msg.key.remoteJid!, 'megumin', 'Megumin (Konosuba)');
megumin.description = "Sends a Megumin (Konosuba) SFW image.";
megumin.category = "waifu";

export const shinobuWaifu = async (params: CommandHandlerParams) => fetchWaifuPicsSfw(params.sock, params.msg.key.remoteJid!, 'shinobu', 'Shinobu Kocho');
shinobuWaifu.description = "Sends a Shinobu Kocho (Demon Slayer) SFW image.";
shinobuWaifu.category = "waifu";


// --- Reactions ---
const fetchReactionGif = async (sock: CommandHandlerParams['sock'], jid: string, category: string) => {
    try {
        const response = await axios.get(`${ANIME_API_BASE_SFW}/${category}`); 
        if (response.data.url) {
            await sock.sendMessage(jid, { image: { url: response.data.url }, caption: `Reaction: ${category}`, gifPlayback: true });
        } else {
            const fallbackResponse = await axios.get(`https://anime. Reaktion.moe/api/v1/gif/${category}`); // Another potential API
            if (fallbackResponse.data && fallbackResponse.data.url) {
                 await sock.sendMessage(jid, { image: { url: fallbackResponse.data.url }, caption: `Reaction: ${category}`, gifPlayback: true });
            } else {
                await sock.sendMessage(jid, { text: `Couldn't find a ${category} reaction GIF.` });
            }
        }
    } catch (error) {
         console.error(`Error fetching ${category} reaction from primary API:`, error);
         try { 
            const fallbackResponse = await axios.get(`https://api.otakugifs.xyz/gif?reaction=${category}`);
            if (fallbackResponse.data && fallbackResponse.data.url) {
                 await sock.sendMessage(jid, { image: { url: fallbackResponse.data.url }, caption: `Reaction: ${category}`, gifPlayback: true });
            } else {
                await sock.sendMessage(jid, { text: `Sorry, an error occurred while fetching a ${category} reaction GIF.` });
            }
         } catch (fallbackError) {
            console.error(`Error fetching ${category} reaction from fallback API:`, fallbackError);
            await sock.sendMessage(jid, { text: `Sorry, an error occurred while fetching a ${category} reaction GIF from all sources.` });
         }
    }
};

export const highfive = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'highfive');
highfive.description = "Sends a highfive reaction GIF.";
highfive.category = "reactions";

export const glomp = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'bonk'); // 'glomp' not common, 'bonk' or 'hug' might be SFW alternatives from waifu.pics
glomp.description = "Sends a SFW bonk/impact reaction GIF (alternative for 'glomp').";
glomp.category = "reactions";

export const handhold = async (params: CommandHandlerParams) => fetchWaifuPicsSfw(params.sock, params.msg.key.remoteJid!, 'handhold', 'handholding');
handhold.description = "Sends a handhold reaction image/GIF.";
handhold.category = "reactions";

export const shinobuReaction = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'shinobu'); 
shinobuReaction.description = "Sends a Shinobu reaction GIF.";
shinobuReaction.category = "reactions";
shinobuReaction.aliases = ["shinobu"]; 

export const cuddle = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'cuddle');
cuddle.description = "Sends a cuddle reaction GIF.";
cuddle.category = "reactions";

export const cringe = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'cringe');
cringe.description = "Sends a cringe reaction GIF.";
cringe.category = "reactions";

export const sad = async ({ sock, msg }: CommandHandlerParams) => fetchReactionGif(sock, msg.key.remoteJid!, 'cry');
sad.description = "Sends a sad reaction GIF.";
sad.category = "reactions";

export const happy = async ({ sock, msg }: CommandHandlerParams) => fetchReactionGif(sock, msg.key.remoteJid!, 'happy'); 
happy.description = "Sends a happy reaction GIF.";
happy.category = "reactions";

export const dance = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'dance');
dance.description = "Sends a dance reaction GIF.";
dance.category = "reactions";

export const smug = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'smug');
smug.description = "Sends a smug reaction GIF.";
smug.category = "reactions";

export const blush = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'blush');
blush.description = "Sends a blush reaction GIF.";
blush.category = "reactions";

export const awo = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'awoo'); // waifu.pics has 'awoo'
awo.description = "Sends an 'awoo' reaction GIF.";
awo.category = "reactions";

export const wave = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'wave');
wave.description = "Sends a wave reaction GIF.";
wave.category = "reactions";

export const smile = async (params: CommandHandlerParams) => fetchReactionGif(params.sock, params.msg.key.remoteJid!, 'smile');
smile.description = "Sends a smile reaction GIF.";
smile.category = "reactions";
