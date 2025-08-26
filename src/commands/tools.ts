
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import QRCode from 'qrcode';
import Jimp from 'jimp'; 
import jsQR from 'jsqr';
import * as config from '../config'; 
import { infobot as getInfoBotContent } from './general'; 
import { downloadMediaMessage, WAMessageContent, MessageType, proto, USyncQueryResult } from '@whiskeysockets/baileys'; 
import FormData from 'form-data'; // For file uploads

const commandHeader = (title: string, icon: string = "🛠️") => `╭─⊷「 ${icon} ${config.BOT_NAME} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;

export const calculator = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a mathematical expression. Usage: .calculator 2+2' });
    }
    try {
        const sanitizedExpression = fullArgs.replace(/[^-()\d/*+.]/g, '');
        if (sanitizedExpression !== fullArgs) {
            if (/\/\s*0(?![.\d])/.test(sanitizedExpression)) { 
                return sock.sendMessage(msg.key.remoteJid!, { text: 'Error: Division by zero is not allowed.' });
            }
        } else if (/\/\s*0(?![.\d])/.test(sanitizedExpression)) { 
             return sock.sendMessage(msg.key.remoteJid!, { text: 'Error: Division by zero is not allowed.' });
        }

        const result = new Function(`return ${sanitizedExpression}`)();
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            throw new Error("Invalid calculation or result.");
        }
        await sock.sendMessage(msg.key.remoteJid!, { text: `🧮 Result: ${result}` });
    } catch (error) {
        console.error("Calculator error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Invalid mathematical expression or error during calculation.' });
    }
};
calculator.description = "Calculates a mathematical expression.";
calculator.category = "tools";
calculator.usage = ".calculator <expression>";

export const tempfile = async ({ sock, msg, logger }: CommandHandlerParams) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage && !quoted.audioMessage && !quoted.documentMessage)) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please reply to an image, video, audio, or document to upload.' });
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        
        const buffer = await downloadMediaMessage(
            msg.message!.extendedTextMessage!.contextInfo!.quotedMessage! as proto.IWebMessageInfo, 
            'buffer', 
            {}, 
            { logger, reuploadRequest: sock.updateMediaMessage } 
        );
        
        const formData = new FormData();
        formData.append('file', buffer, { filename: 'tempfile' }); 

        await sock.sendMessage(msg.key.remoteJid!, { text: '📁 Tempfile feature is a placeholder. A reliable, free, and anonymous file hosting API is needed for full functionality.' });

    } catch (error) {
        console.error("Tempfile error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t upload the file. The service might be unavailable or an error occurred.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
tempfile.description = "Uploads a replied file to a temporary storage (placeholder).";
tempfile.category = "tools";
tempfile.usage = ".tempfile (reply to media)";


export const checkmail = async ({ sock, msg, args }: CommandHandlerParams) => {
    if (args.length === 0) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide an email address to check. Usage: .checkmail example@example.com' });
    }
    const email = args[0];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return sock.sendMessage(msg.key.remoteJid!, { text: '📧 Invalid email format.' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `📧 Checking email: ${email} (Placeholder - Real validation is complex). This bot currently only checks the format.` });
};
checkmail.description = "Checks if an email address format is valid (placeholder for deeper validation).";
checkmail.category = "tools";
checkmail.usage = ".checkmail <email_address>";

export const trt = async ({ sock, msg, fullArgs, args }: CommandHandlerParams) => {
    let textToTranslate = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                          msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || "";
    let targetLang = 'en'; // Default to English
    let sourceLang = 'auto';

    if (args.length > 0) {
        if (args[0].length === 2 && /^[a-z]{2}$/i.test(args[0])) { // First arg is a lang code
            targetLang = args[0].toLowerCase();
            if (args.length > 1) { // Text is provided after lang code
                textToTranslate = args.slice(1).join(" ");
            } else if (!textToTranslate && fullArgs.split(" ").length > 1) { // if reply has no text but command has text after lang code
                 textToTranslate = fullArgs.split(" ").slice(1).join(" ");
            }
        } else { // First arg is part of the text, translate to 'en'
            textToTranslate = fullArgs;
        }
    } else if (fullArgs && !textToTranslate) { // No args, but fullArgs has text (e.g. .trt some text)
         textToTranslate = fullArgs;
    }


    if (!textToTranslate) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please reply to a message or provide text to translate. Usage: .trt [to_lang_code] <text> OR reply with .trt [to_lang_code]. Defaults to English if no code provided.' });
    }
    
    try {
        const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
        if (response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
            const translatedText = response.data[0].map((segment: any) => segment[0]).join('');
            const detectedSourceLang = response.data[2] || 'unknown';
            await sock.sendMessage(msg.key.remoteJid!, { text: `🌍 Translated from *${detectedSourceLang.toUpperCase()}* to *${targetLang.toUpperCase()}*:\n\n${translatedText}` }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: 'Could not translate the text. Check the language code or try again.' });
        }
    } catch (error) {
        console.error("Translation error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, translation service is unavailable or an error occurred.' });
    }
};
trt.description = "Translates text. Defaults to English if no target language specified. Usage: .trt [to_lang_code] <text_to_translate> or reply with .trt [to_lang_code]";
trt.category = "tools";
trt.usage = ".trt en Hello world OR .trt Hola (replying to text, translates 'Hola' to English)";


export const tts = async ({ sock, msg, fullArgs, args }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide text to convert to speech. Usage: .tts <lang_code> <text> or .tts <text> (default lang en)' });
    }

    let lang = 'en';
    let textToSpeak = fullArgs;

    if (args.length > 1 && args[0].length === 2 && /^[a-z]{2}$/i.test(args[0])) {
        lang = args[0].toLowerCase();
        textToSpeak = args.slice(1).join(" ");
    }
    
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSpeak)}&tl=${lang}&client=tw-ob`;

    try {
        await sock.sendPresenceUpdate('recording', msg.key.remoteJid!);
        await sock.sendMessage(msg.key.remoteJid!, {
            audio: { url: ttsUrl },
            mimetype: 'audio/mpeg',
            ptt: true 
        }, { quoted: msg });
    } catch (error) {
        console.error("TTS error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t convert the text to speech. The service might be unavailable or the language code is invalid.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
tts.description = "Converts text to speech. Usage: .tts [lang_code] <text>";
tts.category = "tools";
tts.usage = ".tts en Hello world";

export const ss = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a URL to screenshot. Usage: .ss <url>' });
    }
    let urlToCapture = fullArgs;
    if (!urlToCapture.startsWith('http://') && !urlToCapture.startsWith('https://')) {
        urlToCapture = 'http://' + urlToCapture;
    }

    try {
        // Using a different, more reliable API if thum.io has issues or auth problems.
        // N Mini Screenshot API: (No API key needed for basic use, but has rate limits)
        const apiUrl = `https://s0.wordpress.com/mshots/v1/${encodeURIComponent(urlToCapture)}?w=1200&h=900`; // Example, adjust w/h as needed
        
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        if (response.data) {
            await sock.sendMessage(msg.key.remoteJid!, { 
                image: Buffer.from(response.data), 
                caption: `Screenshot of ${urlToCapture}` 
            }, { quoted: msg });
        } else {
            throw new Error("API returned no data.");
        }

    } catch (error: any) {
        console.error("Screenshot API error:", error);
        let errorMsg = 'Sorry, I couldn\'t take a screenshot.';
        if(error.response && error.response.status === 400 && error.message.includes('block private IPs')){
            errorMsg = '❌ Error: Cannot screenshot private or local IP addresses.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMsg = '❌ Error: Could not resolve the URL or the site is down.';
        }
        await sock.sendMessage(msg.key.remoteJid!, { text: errorMsg });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
ss.description = "Takes a screenshot of a webpage.";
ss.category = "tools";
ss.usage = ".ss <url>";

export const qr = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide text to encode into a QR code. Usage: .qr <text>' });
    }
    try {
        const qrImage = await QRCode.toDataURL(fullArgs);
        const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        await sock.sendMessage(msg.key.remoteJid!, { 
            image: buffer, 
            caption: `QR Code for: ${fullArgs}` 
        }, { quoted: msg });
    } catch (error) {
        console.error("QR generation error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t generate the QR code.' });
    }
};
qr.description = "Generates a QR code from text.";
qr.category = "tools";
qr.usage = ".qr <text>";

export const readqr = async ({ sock, msg, logger }: CommandHandlerParams) => {
    const quotedMsgInfo = msg.message?.extendedTextMessage?.contextInfo;
    if (!quotedMsgInfo?.quotedMessage?.imageMessage) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please reply to an image containing a QR code.' });
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const buffer = await downloadMediaMessage(
            quotedMsgInfo.quotedMessage as proto.IWebMessageInfo, 
            'buffer', 
            {}, 
            { logger, reuploadRequest: sock.updateMediaMessage } 
        );
        
        const image = await Jimp.read(buffer as Buffer); 
        const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data.buffer), // No changes here, Buffer from ArrayBuffer
            width: image.bitmap.width,
            height: image.bitmap.height,
        };
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
            await sock.sendMessage(msg.key.remoteJid!, { text: `🔎 QR Code Data:\n${code.data}` }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: 'Could not decode QR code from the image.' });
        }

    } catch (error) {
        console.error("QR reading error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t read the QR code. Make sure it\'s clear.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
readqr.description = "Reads a QR code from a replied image.";
readqr.category = "tools";


export const shortenerurl = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a URL to shorten. Usage: .shortenerurl <url>' });
    }
    try {
        const response = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(fullArgs)}`);
        if (response.data && !response.data.startsWith('Error')) {
            await sock.sendMessage(msg.key.remoteJid!, { text: `🔗 Shortened URL: ${response.data}` }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: `Could not shorten URL. Error: ${response.data || 'Unknown error from service.'}` });
        }
    } catch (error) {
        console.error("URL shortener error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, the URL shortening service is unavailable or the URL is invalid.' });
    }
};
shortenerurl.description = "Shortens a URL.";
shortenerurl.category = "tools";
shortenerurl.aliases = ["shorturl", "tinyurl"];
shortenerurl.usage = ".shortenerurl <long_url>";

export const profile = async ({ sock, msg }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    const senderName = msg.pushName || "User";
    
    let profilePicUrl: string | undefined;
    try {
        profilePicUrl = await sock.profilePictureUrl(sender, 'image');
    } catch (e) {
        console.warn("Could not fetch profile picture:", e);
        profilePicUrl = 'https://i.ibb.co/6X4X2gN/User-No-Frame.png'; 
    }

    let statusText: string = "Not available";
    try {
        const fetchedStatusArray = await sock.fetchStatus(sender);
        const statusResult = fetchedStatusArray?.[0]; 
        
        if (statusResult && 'status' in statusResult && typeof statusResult.status === 'string') {
            statusText = statusResult.status;
        } else if (statusResult && 'error' in statusResult) {
            console.warn(`Could not fetch status for profile ${sender}: Error ${statusResult.error}`);
            statusText = "Error fetching status";
        } else {
            statusText = "Not available or private";
        }
    } catch (e) {
        console.warn("Could not fetch status for profile:", e);
    }

    const profileText = `
👤 *User Profile* 👤
*Name:* ${senderName}
*JID:* ${sender}
*Status/Bio:* ${statusText}
    `;
    
    if (profilePicUrl) {
        await sock.sendMessage(msg.key.remoteJid!, { image: { url: profilePicUrl }, caption: profileText.trim() }, { quoted: msg });
    } else {
        await sock.sendMessage(msg.key.remoteJid!, { text: profileText.trim() }, { quoted: msg });
    }
};
profile.description = "Shows your WhatsApp profile information.";
profile.category = "tools";

export const sapk = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide an app name to search. Usage: .sapk <app_name>' });
    }
    const searchUrl = `https://www.apkmirror.com/?s=${encodeURIComponent(fullArgs)}&post_type=app_release&searchtype=apk`;
    await sock.sendMessage(msg.key.remoteJid!, { text: `📱 Searching for APKs for "${fullArgs}" on APKMirror:\n${searchUrl}\n\n(Note: Download from trusted sources only.)` });
};
sapk.description = "Searches for APK files on APKMirror (provides search link).";
sapk.category = "tools";
sapk.usage = ".sapk <app_name>";

export const url = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || (!fullArgs.startsWith('http://') && !fullArgs.startsWith('https://'))) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid image URL. Usage: .url <image_url>' });
    }
    try {
        await sock.sendMessage(msg.key.remoteJid!, { image: { url: fullArgs }, caption: "Image from URL" }, { quoted: msg });
    } catch (error) {
        console.error("URL to image error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Failed to send image from URL. Make sure it is a direct image link.' });
    }
};
url.description = "Sends an image from a URL.";
url.category = "tools";
url.usage = ".url <image_url>";

export const url2 = url; 
url2.description = "Alias for .url (Sends an image from a URL).";
url2.category = "tools";
url2.usage = ".url2 <image_url>";


export const tourl = async ({ sock, msg, logger }: CommandHandlerParams) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage && !quoted.audioMessage && !quoted.stickerMessage)) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please reply to an image, video, audio, or sticker to get its URL.' });
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const buffer = await downloadMediaMessage(
            quoted as proto.IWebMessageInfo, 
            'buffer', 
            {}, 
            { logger, reuploadRequest: sock.updateMediaMessage } 
        );
        
        const form = new FormData();
        form.append('file', buffer, { filename: `media.${quoted.imageMessage ? 'jpg' : quoted.videoMessage ? 'mp4' : quoted.audioMessage ? 'mp3' : 'webp'}` });

        const response = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders(),
        });

        if (response.data && response.data[0] && response.data[0].src) {
            const mediaUrl = 'https://telegra.ph' + response.data[0].src;
            await sock.sendMessage(msg.key.remoteJid!, { text: `🔗 Media URL: ${mediaUrl}` }, { quoted: msg });
        } else {
            throw new Error('Failed to upload to telegra.ph or invalid response.');
        }

    } catch (error) {
        console.error("ToURL error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t upload the media to get a URL. The service might be down or the file type is unsupported by the hosting service.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
tourl.description = "Uploads replied media and provides a direct URL (uses telegra.ph).";
tourl.category = "tools";


export const support = async ({ sock, msg }: CommandHandlerParams) => {
    const supportInfo = `
*${config.BOT_NAME} - Support*

If you need help or want to report a bug, please contact the owner:
- Wa.me/${config.OWNER_NUMBERS[0].split('@')[0]} (Primary Owner)

You can also check the project's GitHub (which will be uploaded later on) or community group.
(Developer: This bot is Created by Zark Bryan. Feature requests and suggestions are welcomed!)
    `;
    await sock.sendMessage(msg.key.remoteJid!, { text: supportInfo.trim() });
};
support.description = "Provides support information for the bot.";
support.category = "tools";

export const inc = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: `Command '.inc' is not fully specified. If you meant to include/embed something, please clarify. (Placeholder)` });
};
inc.description = "Placeholder for an 'include' or 'increment' type function.";
inc.category = "tools";

export const i = async (params: CommandHandlerParams) => {
    const infoBotData = await getInfoBotContent(params);
    // Assuming getInfoBotContent now returns { text: string, mentions: string[] }
    // and we need to send it.
    await params.sock.sendMessage(params.msg.key.remoteJid!, {
        text: infoBotData.text,
        mentions: infoBotData.mentions
    }, { quoted: params.msg });
};
i.description = "Alias for .infobot command.";
i.category = "tools"; 

export const app = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide an app name to search. Usage: .app <app_name>' });
    }
    const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(fullArgs)}&c=apps`;
    await sock.sendMessage(msg.key.remoteJid!, { text: `📱 Searching for app "${fullArgs}" on Google Play Store:\n${searchUrl}\n\n(Note: This provides a search link. Use .sapk for APKMirror search.)` });
};
app.description = "Searches for an app on the Play Store (provides search link).";
app.category = "tools";
app.usage = ".app <app_name>";

export const appsearch = app; 
appsearch.description = "Alias for .app command (searches Play Store).";
appsearch.category = "tools";
appsearch.usage = ".appsearch <app_name>";


export const playstore = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide an app name to search on the Play Store. Usage: .playstore <app_name>' });
    }
    const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(fullArgs)}&c=apps`;
    await sock.sendMessage(msg.key.remoteJid!, { text: `📱 Searching for "${fullArgs}" on Google Play Store:\n${searchUrl}` });
    
};
playstore.description = "Searches for an app on the Google Play Store (provides search link).";
playstore.category = "tools";
playstore.usage = ".playstore <app_name>";