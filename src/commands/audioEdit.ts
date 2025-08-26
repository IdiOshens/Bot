
import { CommandHandlerParams } from '../types';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// Ensure ffmpeg is installed and in PATH or specify path
// ffmpeg.setFfmpegPath('/path/to/ffmpeg'); 

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp_audio');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const processAudio = async (
    sock: CommandHandlerParams['sock'],
    msg: CommandHandlerParams['msg'],
    filter: string,
    filterOptions?: string | string[]
): Promise<void> => {
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg?.audioMessage) {
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Please reply to an audio message.' });
        return;
    }

    try {
        await sock.sendPresenceUpdate('recording', msg.key.remoteJid!);
        // @ts-ignore
        const buffer = await downloadMediaMessage(quotedMsg, 'buffer', {});
        const inputPath = path.join(TEMP_DIR, `${randomBytes(8).toString('hex')}_input.ogg`);
        const outputPath = path.join(TEMP_DIR, `${randomBytes(8).toString('hex')}_output.mp3`);
        
        fs.writeFileSync(inputPath, buffer);

        await new Promise<void>((resolve, reject) => {
            let command = ffmpeg(inputPath);
            if (filterOptions) {
                command = command.audioFilter(`${filter}=${Array.isArray(filterOptions) ? filterOptions.join(':') : filterOptions}`);
            } else {
                command = command.audioFilter(filter);
            }
            
            command
                .toFormat('mp3')
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(new Error(`FFmpeg error: ${err.message}`));
                })
                .on('end', () => {
                    console.log('FFmpeg processing finished.');
                    resolve();
                })
                .save(outputPath);
        });

        if (fs.existsSync(outputPath)) {
            await sock.sendMessage(msg.key.remoteJid!, {
                audio: { url: outputPath },
                mimetype: 'audio/mpeg',
                ptt: true // Send as voice note if desired, or false for regular audio
            }, { quoted: msg });
        } else {
            throw new Error("Output file not found after processing.");
        }

    } catch (error) {
        console.error(`Error processing audio with ${filter}:`, error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `Sorry, an error occurred while applying the ${filter} effect.` });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
        // Clean up temp files (optional, or use a cron job)
        // fs.unlinkSync(inputPath);
        // fs.unlinkSync(outputPath);
    }
};

export const say = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    // This is essentially TTS, implemented in tools.ts. We can call it or re-implement.
    // For simplicity, let's point to the existing TTS command.
    await sock.sendMessage(msg.key.remoteJid!, { text: `Use the .tts command for text-to-speech. Example: .tts ${fullArgs || 'hello'}` });
};
say.description = "Converts text to speech (alias for .tts).";
say.category = "audio_edit";

export const bass = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'bass', 'g=10'); // g for gain
bass.description = "Applies a bass boost effect to audio. Reply to an audio.";
bass.category = "audio_edit";

export const blowin = async ({ sock, msg }: CommandHandlerParams) => {
    // This effect is not standard in ffmpeg. Placeholder.
    await sock.sendMessage(msg.key.remoteJid!, { text: "🌬️ Blowin effect: This specific effect is not standard and requires custom processing or a specialized tool. Placeholder." });
};
blowin.description = "Applies a 'blowin' effect (placeholder).";
blowin.category = "audio_edit";

export const deep = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'atempo=0.8,asetrate=44100*0.8'); // Lower tempo and pitch
deep.description = "Applies a deep voice effect to audio. Reply to an audio.";
deep.category = "audio_edit";

export const earrape = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'volume=20dB'); // Increase volume significantly
earrape.description = "Applies an earrape effect (increases volume significantly). Reply to an audio.";
earrape.category = "audio_edit";

export const fast = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'atempo=1.5'); // Increase speed
fast.description = "Speeds up the audio. Reply to an audio.";
fast.category = "audio_edit";

export const fat = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'atempo=0.85,asetrate=44100*0.7'); // Slower and deeper
fat.description = "Applies a 'fat' (slower, deeper) voice effect. Reply to an audio.";
fat.category = "audio_edit";

export const nighttime = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'atempo=0.9,tremolo=f=5:d=0.5'); // Slower with tremolo
nighttime.description = "Applies a 'nightcore'-like slowdown effect. Reply to an audio.";
nighttime.category = "audio_edit";

export const reverse = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'areverse');
reverse.description = "Reverses the audio. Reply to an audio.";
reverse.category = "audio_edit";

export const robot = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75');
robot.description = "Applies a robot voice effect. Reply to an audio.";
robot.category = "audio_edit";

export const slow = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'atempo=0.75'); // Decrease speed
slow.description = "Slows down the audio. Reply to an audio.";
slow.category = "audio_edit";

export const smooth = async (params: CommandHandlerParams) => processAudio(params.sock, params.msg, 'lowpass=f=500'); // Low-pass filter for smoothing
smooth.description = "Applies a smoothing effect to audio. Reply to an audio.";
smooth.category = "audio_edit";

export const typai = async ({ sock, msg }: CommandHandlerParams) => {
    // This likely refers to a specific AI voice modulation. Placeholder.
    await sock.sendMessage(msg.key.remoteJid!, { text: "🎤 Typai (AI voice effect): This feature requires a specialized AI voice model and is not implemented. Placeholder." });
};
typai.description = "Applies an AI voice effect (placeholder).";
typai.category = "audio_edit";
