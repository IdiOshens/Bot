
import { CommandHandlerParams } from '../types';
import axios from 'axios';

export const attp = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide text to convert to an animated sticker. Usage: .attp <text>' });
    }
    try {
        // This often uses external APIs that render text to animated stickers (e.g., APNG or WebP)
        // Example using a public API (availability might vary)
        const apiUrl = `https://api.xteam.xyz/attp?text=${encodeURIComponent(fullArgs)}`; // Replace with a working API if needed
        // You might need an API key for some services.
        
        // Since Baileys expects a buffer for stickers:
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        if (response.status === 200 && response.data) {
            await sock.sendMessage(msg.key.remoteJid!, { 
                sticker: Buffer.from(response.data),
            }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: 'Failed to generate animated sticker. The API might be down or the input is invalid.' });
        }
    } catch (error) {
        console.error("ATTP error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I could not create the animated sticker. The service might be unavailable.' });
    }
};
attp.description = "Creates an animated text sticker.";
attp.category = "converters";
attp.usage = ".attp <text>";

export const binary = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide text to convert to binary. Usage: .binary <text>' });
    }
    try {
        const binaryText = fullArgs.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join(' ');
        await sock.sendMessage(msg.key.remoteJid!, { text: `Binary: ${binaryText}` }, { quoted: msg });
    } catch (error) {
        console.error("Binary conversion error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Error converting to binary.' });
    }
};
binary.description = "Converts text to binary representation.";
binary.category = "converters";
binary.usage = ".binary <text>";

export const ebinary = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide binary code to convert to text. Usage: .ebinary <binary_code>' });
    }
    try {
        const text = fullArgs.split(' ')
            .map(bin => String.fromCharCode(parseInt(bin, 2)))
            .join('');
        await sock.sendMessage(msg.key.remoteJid!, { text: `Text: ${text}` }, { quoted: msg });
    } catch (error) {
        console.error("Ebinary conversion error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Error converting from binary. Make sure it is valid binary code separated by spaces.' });
    }
};
ebinary.description = "Converts binary representation back to text.";
ebinary.category = "converters";
ebinary.usage = ".ebinary <binary_code>";

export const emomix = async ({ sock, msg, args }: CommandHandlerParams) => {
    if (args.length < 2) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide two emojis to mix. Usage: .emomix 😂😭' });
    }
    const emoji1 = args[0];
    const emoji2 = args[1];

    // This feature typically relies on specific APIs like Google's Emoji Kitchen (which isn't publicly accessible for direct API calls).
    // Some third-party APIs might offer this, or one could try to find pre-rendered combinations.
    // For this example, we'll use a placeholder or a simple conceptual response.
    
    // Placeholder using a public (but potentially rate-limited or unstable) API
    // This specific API might not exist or work as described, it's illustrative.
    try {
        const apiUrl = `https://api.example.com/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`; // Fictional API
        // For a real implementation, you'd search for an actual "emoji kitchen" API or use local image manipulation if assets are available.
        // A common way this is done is via services that scrape Google's Gboard emoji kitchen results.
        
        // Fallback or if no API is available:
        await sock.sendMessage(msg.key.remoteJid!, { text: `Mixing ${emoji1} and ${emoji2} is a fun idea! This feature is complex and often relies on specific APIs. Imagine a cool mix here!` });
        
        // If an API like emojik.vercel.app/s/ is used (check its terms and stability):
        // const mixUrl = `https://emojik.vercel.app/s/${emoji1}_${emoji2}`;
        // try {
        //     const response = await axios.get(mixUrl, { responseType: 'arraybuffer' });
        //     await sock.sendMessage(msg.key.remoteJid!, { sticker: Buffer.from(response.data) }, { quoted: msg });
        // } catch (e) {
        //     await sock.sendMessage(msg.key.remoteJid!, { text: `Sorry, couldn't mix ${emoji1} and ${emoji2}. Maybe this combination isn't supported.` });
        // }

    } catch (error) {
        console.error("Emomix error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I could not mix the emojis.' });
    }
};
emomix.description = "Mixes two emojis to create a new one (placeholder/conceptual).";
emomix.category = "converters";
emomix.usage = ".emomix <emoji1> <emoji2>";
