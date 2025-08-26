
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import { proto } from '@whiskeysockets/baileys'; // Imported proto

// Generic function for logo generation using an external API
// Many such APIs exist, some free with watermarks, some paid.
// Example: https://api.logomakr.com (check their terms and API)
// Example: TextPro.me based APIs (often found in other bots)

const createLogo = async (sock: CommandHandlerParams['sock'], msg: proto.IWebMessageInfo, text1: string, text2: string | undefined, apiUrlTemplate: string) => {
    if (!text1) {
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide text for the logo.' });
        return;
    }

    let fullApiUrl = apiUrlTemplate.replace('{text1}', encodeURIComponent(text1));
    if (text2) {
        fullApiUrl = fullApiUrl.replace('{text2}', encodeURIComponent(text2));
    } else { // If text2 is not provided but the template expects it, remove the placeholder or handle appropriately
        fullApiUrl = fullApiUrl.replace('&text2={text2}', '').replace('text2={text2}', '');
    }
    
    // Some APIs might require an API key in headers or query params
    // const apiKey = "YOUR_LOGO_API_KEY"; 
    // const headers = { 'Authorization': `Bearer ${apiKey}` };
    if (fullApiUrl.includes("YOUR_API_KEY") || fullApiUrl.includes("apikey=") && !fullApiUrl.match(/apikey=[^&]+/)) {
        await sock.sendMessage(msg.key.remoteJid!, { text: `Note: This logo command requires an API key which seems to be missing or is a placeholder in the URL template: ${apiUrlTemplate}` });
        // Optionally return here if API key is strictly required and known to be missing.
    }


    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const response = await axios.get(fullApiUrl, { responseType: 'arraybuffer' }); // Assuming API returns image buffer
        
        if (response.data && response.data.byteLength > 0) { // Check if buffer has content
            await sock.sendMessage(msg.key.remoteJid!, { 
                image: Buffer.from(response.data), 
                caption: `Logo for "${text1}${text2 ? ' & ' + text2 : ''}"` 
            }, { quoted: msg });
        } else {
            throw new Error("API returned no data or empty image");
        }
    } catch (error: any) {
        console.error(`Logo creation error for ${apiUrlTemplate} with URL ${fullApiUrl}:`, error.message);
        let errorText = 'Sorry, I couldn\'t create the logo.';
        if (error.response) {
            errorText += ` (Status: ${error.response.status})`;
             // Try to decode error response if it's JSON
            try {
                const errorData = JSON.parse(Buffer.from(error.response.data).toString());
                if (errorData.message) errorText += ` Message: ${errorData.message}`;
            } catch (e) { /* ignore parsing error */ }
        } else {
            errorText += ` The service might be unavailable or the input is invalid. URL used: ${fullApiUrl}`;
        }
        await sock.sendMessage(msg.key.remoteJid!, { text: errorText });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};

// --- Placeholder Logo Commands ---
// You would need to find actual working API endpoints for these.
// The following are illustrative using a hypothetical structure.

// Example TextPro base URL: https://textpro.me
// Many APIs are wrappers around services like TextPro, e.g., from lolhuman, xteam, etc.
// For example, a Blackpink logo might be:
// https://api.lolhuman.xyz/api/textprome/blackpink?apikey=YOUR_APIKEY&text=YourText

export const logo = async ({ sock, msg, args }: CommandHandlerParams) => {
    // Generic logo, or route to a specific one
    if (args.length === 0) return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .logo <text1> [| text2]" });
    const texts = args.join(" ").split("|").map(s => s.trim());
    // Using a known (example) TextPro style from a common API provider. Replace YOUR_API_KEY.
    // This is just one example, "jokerlogo" is common.
    const apiUrl = `https://api.lolhuman.xyz/api/textprome/jokerlogo?apikey=YOUR_API_KEY&text=${texts[0]}`; 
    await createLogo(sock, msg, texts[0], texts[1], apiUrl);
};
logo.description = "Creates a Joker-style logo (example).";
logo.category = "logo_maker";
logo.usage = ".logo <text1>";


const textProLogoStyles: { [key: string]: { url: string, params: number } } = {
    // Format: commandName: { url_template_from_api_provider, number_of_text_params }
    // Example using lolhuman structure (replace YOUR_API_KEY)
    blackpink: { url: "https://api.lolhuman.xyz/api/textprome/blackpink?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    neon: { url: "https://api.lolhuman.xyz/api/textprome/neon?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    greenneon: { url: "https://api.lolhuman.xyz/api/textprome/greenneon?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    advanceglow: { url: "https://api.lolhuman.xyz/api/textprome/advanceglow?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    futuremultilight: { url: "https://api.lolhuman.xyz/api/textprome/futuremultilight?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    sandwriting: { url: "https://api.lolhuman.xyz/api/textprome/sandwriting?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    sandsummer: { url: "https://api.lolhuman.xyz/api/textprome/sandsummer?apikey=YOUR_API_KEY&text={text1}&text2={text2}", params: 2 }, // Example with 2 texts
    horrorblood: { url: "https://api.lolhuman.xyz/api/textprome/horrorblood?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    dropwater: { url: "https://api.lolhuman.xyz/api/textprome/dropwater?apikey=YOUR_API_KEY&text={text1}", params: 1 },
    logo1: { url: "https://api.lolhuman.xyz/api/ephoto1/freefire?apikey=YOUR_API_KEY&text={text1}", params: 1}, // Example for ephoto
    logo2: { url: "https://api.lolhuman.xyz/api/ephoto1/cod?apikey=YOUR_API_KEY&text={text1}", params: 1},
    // Add more logo styles here with their respective API URL templates and param counts
    // These are just examples, actual URLs and API keys are needed.
};


Object.entries(textProLogoStyles).forEach(([logoCmdName, style]) => {
    const cmdFunction = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
        if (!fullArgs) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `Please provide text for the ${logoCmdName} logo. Usage: .${logoCmdName} <text1>${style.params === 2 ? ' | <text2>' : ''}` });
        }
        const texts = fullArgs.split("|").map(s => s.trim());
        if (texts.length < style.params) {
             return sock.sendMessage(msg.key.remoteJid!, { text: `This logo style requires ${style.params} text argument(s). Usage: .${logoCmdName} <text1>${style.params === 2 ? ' | <text2>' : ''}` });
        }
        await createLogo(sock, msg, texts[0], texts[1], style.url);
    };
    
    (cmdFunction as any).description = `Creates a ${logoCmdName} style logo.`;
    (cmdFunction as any).category = "logo_maker";
    (cmdFunction as any).usage = `.${logoCmdName} <text1>${style.params === 2 ? ' | <text2>' : ''}`;
    
    // @ts-ignore - Exporting dynamically
    exports[logoCmdName] = cmdFunction;
});


// Fallback for explicitly listed logos if not covered by the dynamic generator
// or if they need special handling beyond the generic textProLogoStyles structure.
const placeholderLogo = async (cmdName: string, { sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: `Please provide text for the ${cmdName} logo. Usage: .${cmdName} <text>` });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `🎨 ${cmdName} logo for "${fullArgs}" (Placeholder - this style is not yet implemented or API URL is missing).` });
};

// Generate placeholders for logo4 to logo19 if not defined in textProLogoStyles
for (let i = 4; i <= 19; i++) {
    const cmdName = `logo${i}`;
    if (!exports[cmdName as keyof typeof exports] && !textProLogoStyles[cmdName]) { // Check if not already defined
        const fn = async (params: CommandHandlerParams) => placeholderLogo(cmdName, params);
        fn.description = `Creates logo style ${i} (placeholder).`;
        fn.category = "logo_maker";
        fn.usage = `.${cmdName} <text>`;
        // @ts-ignore
        exports[cmdName] = fn;
    }
}
