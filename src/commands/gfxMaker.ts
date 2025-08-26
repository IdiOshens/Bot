
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import { proto } from '@whiskeysockets/baileys';

// This file is similar to logo.ts, but for "GFX" commands.
// Assumes GFX commands might use similar TextPro-like APIs or dedicated GFX APIs.
// Replace 'YOUR_API_KEY' with actual keys if you have them.
// The base URLs and endpoints are examples and may need to be sourced from actual API providers.

const createGfx = async (
    sock: CommandHandlerParams['sock'], 
    msg: proto.IWebMessageInfo, 
    texts: string[], 
    apiUrlTemplate: string,
    gfxName: string
) => {
    if (texts.length === 0 || !texts[0]) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Please provide text for the ${gfxName} GFX.` });
        return;
    }

    let fullApiUrl = apiUrlTemplate;
    texts.forEach((text, index) => {
        fullApiUrl = fullApiUrl.replace(`{text${index + 1}}`, encodeURIComponent(text));
    });
    
    // Remove any unused text placeholders like &text2={text2} or &text3={text3}
    fullApiUrl = fullApiUrl.replace(/&text\d+=\{text\d+\}/g, '').replace(/text\d+=\{text\d+\}/g, '');
    fullApiUrl = fullApiUrl.replace(/\{text\d+\}/g, ''); // Remove any remaining placeholders if not enough texts were provided


    if (fullApiUrl.includes("YOUR_API_KEY") || (fullApiUrl.includes("apikey=") && !fullApiUrl.match(/apikey=([^&]+)/))) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Note: This GFX command ('${gfxName}') requires an API key which seems to be missing or is a placeholder in the URL template. This command might not work as expected.` });
        // For testing, you might let it proceed, or return if the key is absolutely essential and known to be missing.
        // return; 
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        console.log(`Requesting GFX from: ${fullApiUrl}`); // Log the URL for debugging
        const response = await axios.get(fullApiUrl, { responseType: 'arraybuffer' });
        
        if (response.data && response.data.byteLength > 0) {
            await sock.sendMessage(msg.key.remoteJid!, { 
                image: Buffer.from(response.data), 
                caption: `✨ GFX [${gfxName}] for: ${texts.join(' | ')}` 
            }, { quoted: msg });
        } else {
            throw new Error(`API for ${gfxName} returned no data or empty image. URL: ${fullApiUrl}`);
        }
    } catch (error: any) {
        console.error(`GFX creation error for ${gfxName} with URL ${fullApiUrl}:`, error.message);
        let errorText = `Sorry, I couldn't create the ${gfxName} GFX.`;
         if (error.response) {
            errorText += ` (Status: ${error.response.status})`;
            try {
                const errorResponseText = Buffer.from(error.response.data).toString();
                 if (errorResponseText.length < 200) { // Avoid logging huge HTML error pages
                    errorText += ` Response: ${errorResponseText}`;
                } else {
                    errorText += ` (Received a large error response from API)`;
                }
            } catch (e) { /* ignore parsing error if not text */ }
        } else {
            errorText += ` The service might be unavailable or the input is invalid.`;
        }
        if (fullApiUrl.includes("YOUR_API_KEY")) {
             errorText += `\n(Hint: This GFX style might require a valid API key in the config or URL.)`;
        }
        await sock.sendMessage(msg.key.remoteJid!, { text: errorText });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};

// --- GFX Commands Definitions ---
// Structure: commandName: { url: string (template), params: number (max texts), description: string }
// Using common API structures (e.g., textpro.me via aggregators like lolhuman, xteam, etc.)
// **IMPORTANT**: Replace "YOUR_API_KEY" with an actual API key if required by the service.
// These URLs are examples and might not work without a valid key or if the service changes.

const gfxStyles: { [key: string]: { url: string, params: number, description: string } } = {
    carbon: { 
        url: "https://api.lolhuman.xyz/api/carbon?apikey=YOUR_API_KEY&text={text1}&language=auto", // Lolhuman example
        params: 1,
        description: "Creates a carbon code snippet image.",
    },
    gfx: { // Main .gfx command, can be a default style
        url: "https://api.lolhuman.xyz/api/textpro/matrix?apikey=YOUR_API_KEY&text={text1}", 
        params: 1,
        description: "Creates a default GFX Style (e.g., Matrix).",
    },
    gfx1: { 
        url: "https://api.lolhuman.xyz/api/ephoto1/freefire?apikey=YOUR_API_KEY&text={text1}", 
        params: 1,
        description: "Creates GFX Style 1 (FreeFire Theme).",
    },
    gfx2: { 
        url: "https://api.lolhuman.xyz/api/ephoto1/codm?apikey=YOUR_API_KEY&text={text1}",
        params: 1,
        description: "Creates GFX Style 2 (Call of Duty Mobile Theme).",
    },
    gfx3: { 
        url: "https://api.lolhuman.xyz/api/ephoto1/pubg?apikey=YOUR_API_KEY&text={text1}", 
        params: 1,
        description: "Creates GFX Style 3 (PUBG Theme).",
    },
    gfx4: { 
        url: "https://api.lolhuman.xyz/api/photooxy1/fortnite?apikey=YOUR_API_KEY&text={text1}", 
        params: 1,
        description: "Creates GFX Style 4 (Fortnite Theme).",
    },
    gfx5: { 
        url: "https://api.lolhuman.xyz/api/photooxy1/battlegrounds?apikey=YOUR_API_KEY&text={text1}", 
        params: 1,
        description: "Creates GFX Style 5 (Battlegrounds Theme).",
    },
    gfx6: { // Example: Different style
        url: "https://api.lolhuman.xyz/api/textpro/blackpink?apikey=YOUR_API_KEY&text={text1}",
        params: 1,
        description: "Creates GFX Style 6 (Blackpink Logo Style).",
    },
    gfx7: {
        url: "https://api.lolhuman.xyz/api/textpro/neon?apikey=YOUR_API_KEY&text={text1}",
        params: 1,
        description: "Creates GFX Style 7 (Neon Text).",
    },
    gfx8: {
        url: "https://api.lolhuman.xyz/api/textpro/toxic?apikey=YOUR_API_KEY&text={text1}",
        params: 1,
        description: "Creates GFX Style 8 (Toxic Text Effect).",
    },
    gfx9: { // Example of a 2-text GFX
        url: "https://api.lolhuman.xyz/api/textpro/graffiti3?apikey=YOUR_API_KEY&text1={text1}&text2={text2}",
        params: 2,
        description: "Creates GFX Style 9 (Graffiti, 2 texts).",
    },
    gfx10: { // Example of another 2-text GFX
        url: "https://api.lolhuman.xyz/api/ephoto1/ytchannelcs?apikey=YOUR_API_KEY&text1={text1}&text2={text2}", // ytchannel or similar ephoto
        params: 2,
        description: "Creates GFX Style 10 (e.g., YouTube Channel Art, 2 texts).",
    },
     gfx11: { 
        url: "https://api.lolhuman.xyz/api/ephoto1/logogaming?apikey=YOUR_API_KEY&text={text1}", 
        params: 1,
        description: "Creates GFX Style 11 (Generic Gaming Logo).",
    },
};

// Dynamically create and export command functions
Object.entries(gfxStyles).forEach(([gfxCmdName, style]) => {
    const cmdFunction = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
        if (!fullArgs && style.params > 0) { // Ensure text is needed if params > 0
            let usageText = `.${gfxCmdName} <text1>`;
            if (style.params > 1) {
                for (let i = 2; i <= style.params; i++) {
                    usageText += ` | <text${i}>`;
                }
            }
            return sock.sendMessage(msg.key.remoteJid!, { text: `Please provide text for the ${gfxCmdName} GFX. Usage: ${usageText}` });
        }
        
        const texts = fullArgs.split("|").map(s => s.trim()).filter(s => s.length > 0);
        
        if (style.params > 0 && texts.length === 0) {
             return sock.sendMessage(msg.key.remoteJid!, { text: `Please provide text for the ${gfxCmdName} GFX.` });
        }
        if (texts.length > style.params && style.params > 0) { // Check if more texts are provided than the style supports
             return sock.sendMessage(msg.key.remoteJid!, { text: `This GFX style ('${gfxCmdName}') accepts a maximum of ${style.params} text argument(s). You provided ${texts.length}.` });
        }
        
        await createGfx(sock, msg, texts, style.url, gfxCmdName);
    };
    
    (cmdFunction as any).description = style.description;
    (cmdFunction as any).category = "gfx_maker";
    let usageText = `.${gfxCmdName}`;
    if (style.params > 0) usageText += ` <text1>`;
    if (style.params > 1) {
        for (let i = 2; i <= style.params; i++) {
            usageText += ` | <text${i}>`;
        }
    }
    (cmdFunction as any).usage = usageText;
    
    // @ts-ignore - Exporting dynamically
    exports[gfxCmdName] = cmdFunction;
});
