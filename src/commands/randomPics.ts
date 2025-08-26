
import { CommandHandlerParams } from '../types';
import axios from 'axios';

// Using Unsplash Source for random images based on keywords.
// It's simple and doesn't require an API key for basic use.
// Format: https://source.unsplash.com/WIDTHxHEIGHT/?keyword1,keyword2
const UNSPLASH_BASE_URL = "https://source.unsplash.com/800x600/?";

const fetchRandomImage = async (
    sock: CommandHandlerParams['sock'], 
    jid: string, 
    query: string, 
    captionPrefix: string = "🖼️ Here's an image"
) => {
    try {
        const imageUrl = `${UNSPLASH_BASE_URL}${encodeURIComponent(query)}&cache_bust=${Date.now()}`; // Add cache buster
        
        await sock.sendMessage(jid, { 
            image: { url: imageUrl }, 
            caption: `${captionPrefix}: ${query}` 
        });
    } catch (error) {
        console.error(`Error fetching random image for ${query} from Unsplash:`, error);
        // Fallback or simpler placeholder if Unsplash fails
        await sock.sendMessage(jid, { text: `Sorry, I couldn't find an image for "${query}" right now. You can try searching on Google Images!` });
    }
};

export const aesthetic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "aesthetic,vaporwave,art", "Aesthetic vibe");
aesthetic.description = "Sends a random aesthetic picture.";
aesthetic.category = "random_pics";

export const antiwork = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "office humor,work stress,funny work", "Anti-work vibes");
antiwork.description = "Sends a random 'antiwork' themed picture.";
antiwork.category = "random_pics";

export const bike = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "motorcycle,sport bike,custom bike", "Cool bike");
bike.description = "Sends a random bike picture.";
bike.category = "random_pics";

export const blackpink_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "blackpink,kpop girl group", "🖤💖 Blackpink");
blackpink_pic.description = "Sends a random Blackpink picture.";
blackpink_pic.category = "random_pics";
blackpink_pic.aliases = ["blackpink"]; // Alias for menu consistency

export const boneka = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "cute doll,toy doll,anime doll", "Boneka (Doll)");
boneka.description = "Sends a random doll (boneka) picture.";
boneka.category = "random_pics";

export const car = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "sports car,luxury car,exotic car", "Cool car");
car.description = "Sends a random car picture.";
car.category = "random_pics";

export const cat_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "cute cat,kitten", "Meow 😺");
cat_pic.description = "Sends a random cat picture.";
cat_pic.category = "random_pics";
cat_pic.aliases = ["cat"]; // Alias for menu consistency

// 'cosplay' is in misc.ts for the "waifu" category. This is for "random_pics".
export const cosplay_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "cosplay,anime cosplay", "Cosplay");
cosplay_pic.description = "Sends a random cosplay picture (Random Pic category).";
cosplay_pic.category = "random_pics";
cosplay_pic.aliases = ["randomcosplay", "cosplay"]; // Alias 'cosplay' for menu simplicity if not clashing.

export const dogo = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "cute dog,puppy", "Woof 🐶");
dogo.description = "Sends a random dog picture.";
dogo.category = "random_pics";
dogo.aliases = ["dog"];

export const justina = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "Justina Xie,model", "Justina (Model)");
justina.description = "Sends a random Justina picture (generic image search for the name).";
justina.category = "random_pics";

export const kayes_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "Kayes,gamer girl,influencer", "Kayes");
kayes_pic.description = "Sends a random Kayes picture (generic image search for the name).";
kayes_pic.category = "random_pics";
kayes_pic.aliases = ["kayes"]; // To be disambiguated by command handler if needed

export const kpop_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "kpop,kpop group,kpop idol", "K-Pop!");
kpop_pic.description = "Sends a random K-Pop group or idol picture.";
kpop_pic.category = "random_pics";
kpop_pic.aliases = ["kpop"]; // Alias for menu consistency

export const notnot_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "Notnot Lidiawaty,gamer girl,influencer", "NotNot");
notnot_pic.description = "Sends a random NotNot picture (generic image search for the name).";
notnot_pic.category = "random_pics";
notnot_pic.aliases = ["notnot"]; // To be disambiguated by command handler if needed

export const ppcouple_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "couple goals,romantic couple,anime couple", "Couple Goals");
ppcouple_pic.description = "Sends a random couple picture.";
ppcouple_pic.category = "random_pics";
ppcouple_pic.aliases = ["ppcouple"]; // Alias for menu consistency

// `.profile` is a specific command in tools.ts. This is `randomprofilepic`.
export const profile_pic = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "profile picture,avatar,cool avatar", "Random PFP");
profile_pic.description = "Sends a random picture suitable for a profile.";
profile_pic.category = "random_pics";
profile_pic.aliases = ["randompfp", "profile"]; // Alias 'profile' carefully, may conflict with tool.


export const pubg = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "PUBG game,battle royale,gaming wallpaper", "PUBG");
pubg.description = "Sends a random PUBG game picture.";
pubg.category = "random_pics";

export const rose = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "Rose Blackpink,kpop idol Rose", "Rosé from Blackpink");
rose.description = "Sends a random Rosé (Blackpink) picture.";
rose.category = "random_pics";

export const ryujin = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "Shin Ryujin,ITZY Ryujin,kpop idol", "Ryujin from ITZY");
ryujin.description = "Sends a random Ryujin (ITZY) picture.";
ryujin.category = "random_pics";

export const wallhp = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "phone wallpaper,mobile background,cool wallpaper", "Phone Wallpaper");
wallhp.description = "Sends a random phone wallpaper.";
wallhp.category = "random_pics";

export const wallml = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "Mobile Legends wallpaper,MLBB art,gaming background", "Mobile Legends Wallpaper");
wallml.description = "Sends a random Mobile Legends wallpaper.";
wallml.category = "random_pics";

export const ulzzangboy = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "ulzzang boy,korean boy fashion,handsome asian boy", "Ulzzang Boy");
ulzzangboy.description = "Sends a random Ulzzang boy picture.";
ulzzangboy.category = "random_pics";

export const ulzzanggirl = async (params: CommandHandlerParams) => fetchRandomImage(params.sock, params.msg.key.remoteJid!, "ulzzang girl,korean girl fashion,cute asian girl", "Ulzzang Girl");
ulzzanggirl.description = "Sends a random Ulzzang girl picture.";
ulzzanggirl.category = "random_pics";
ulzzanggirl.aliases = ["ulizzanggirl"]; // Menu spelling
