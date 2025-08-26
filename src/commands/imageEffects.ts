
import { CommandHandlerParams } from '../types';
import { downloadMediaMessage, WAMessageContent, proto } from '@whiskeysockets/baileys';
import Jimp from 'jimp'; 

// Helper function for applying effects
const applyImageEffect = async (
    { sock, msg, logger }: CommandHandlerParams, // Added logger
    effectName: string,
    effectLogic: (image: Jimp) => Promise<Jimp> 
) => {
    const quotedInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessageContent = quotedInfo?.quotedMessage;

    if (!quotedMessageContent?.imageMessage) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please reply to an image to apply the effect.' });
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        
        const quotedMsgForDownload: proto.IWebMessageInfo = {
            key: {
                remoteJid: msg.key.remoteJid!,
                id: quotedInfo?.stanzaId || msg.key.id!, 
                fromMe: !!sock.user && quotedInfo?.participant === sock.user?.id?.split(':')[0] + '@s.whatsapp.net',
                participant: quotedInfo?.participant,
            },
            message: quotedMessageContent,
            pushName: msg.pushName || '', 
            messageTimestamp: msg.messageTimestamp || Date.now() / 1000
        };

        const buffer = await downloadMediaMessage(
            quotedMsgForDownload, 
            'buffer', 
            {}, 
            { logger, reuploadRequest: sock.updateMediaMessage } 
        );
        
        if (!(buffer instanceof Buffer)) {
            throw new Error("Downloaded media is not a buffer.");
        }

        let image: Jimp = await Jimp.read(buffer as Buffer); 
        image = await effectLogic(image);
        
        const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG); 

        await sock.sendMessage(msg.key.remoteJid!, { 
            image: processedImageBuffer, 
            caption: `Applied ${effectName} effect!` 
        }, { quoted: msg });

    } catch (error: any) {
        console.error(`Error applying ${effectName} effect:`, error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `Sorry, I couldn't apply the ${effectName} effect. ${error.message}` });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};

export const wanted = async (params: CommandHandlerParams) => {
    // Placeholder - requires complex image templating (e.g., overlaying face onto a wanted poster template)
    // This could be done with Jimp by loading a template image and compositing the user's image.
    await params.sock.sendMessage(params.msg.key.remoteJid!, { text: '🖼️ Wanted poster effect (Placeholder - requires advanced image manipulation or an external API).' });
};
wanted.description = "Creates a 'Wanted' poster effect from an image (placeholder).";
wanted.category = "image_effects";
wanted.usage = ".wanted (reply to image)";

export const ad = async (params: CommandHandlerParams) => {
    await params.sock.sendMessage(params.msg.key.remoteJid!, { text: '🖼️ Advertisement effect (Placeholder - requires image templating or API).' });
};
ad.description = "Creates an 'Advertisement' style image (placeholder).";
ad.category = "image_effects";
ad.usage = ".ad (reply to image)";

export const beautiful = async (params: CommandHandlerParams) => {
    // Placeholder - could use Jimp for some filters (e.g., contrast, brightness, sepia)
    await applyImageEffect(params, "beautiful (basic enhance)", async (image: Jimp) => { 
        return image.brightness(0.1).contrast(0.1); // Example: slight brightness and contrast adjustment
    });
};
beautiful.description = "Applies a 'Beautiful' filter/effect (basic enhancement). Reply to an image.";
beautiful.category = "image_effects";
beautiful.usage = ".beautiful (reply to image)";

export const blur = async (params: CommandHandlerParams) => {
    await applyImageEffect(params, "blur", async (image: Jimp) => { 
        return image.blur(5); // Blur radius of 5
    });
};
blur.description = "Applies a blur effect to an image. Reply to an image.";
blur.category = "image_effects";
blur.usage = ".blur (reply to image)";

export const rip = async (params: CommandHandlerParams) => {
    // Placeholder - similar to 'wanted', requires templating
    await params.sock.sendMessage(params.msg.key.remoteJid!, { text: '🖼️ RIP gravestone effect (Placeholder - requires image templating or API).' });
};
rip.description = "Creates an 'RIP' gravestone image (placeholder).";
rip.category = "image_effects";
rip.usage = ".rip (reply to image)";

export const jail = async (params: CommandHandlerParams) => {
    // Placeholder - requires overlaying a jail bars image
    await params.sock.sendMessage(params.msg.key.remoteJid!, { text: '🖼️ Jail bars effect (Placeholder - requires image overlay or API).' });
};
jail.description = "Adds jail bars overlay to an image (placeholder).";
jail.category = "image_effects";
jail.usage = ".jail (reply to image)";

export const crown = async (params: CommandHandlerParams) => {
    // Placeholder - requires face detection and overlaying a crown image
    await params.sock.sendMessage(params.msg.key.remoteJid!, { text: '👑 Crown effect (Placeholder - requires image overlay/face detection or API).' });
};
crown.description = "Adds a crown to a face in an image (placeholder).";
crown.category = "image_effects";
crown.usage = ".crown (reply to image)";