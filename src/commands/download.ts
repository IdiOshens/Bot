
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import ytSearch from 'yt-search';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import *_config from '../config'; 
import Tiktok from "@tobyg74/tiktok-api-dl";

const TEMP_DIR_AUDIO = path.join(os.tmpdir(), 'zark_bots_audio');
if (!fs.existsSync(TEMP_DIR_AUDIO)) {
    fs.mkdirSync(TEMP_DIR_AUDIO, { recursive: true });
}

const playCommandUserContext: { [userId: string]: { step: 'selecting_song' | 'selecting_format', searchResults?: ytSearch.VideoSearchResult[], selectedVideo?: ytSearch.VideoSearchResult } } = {};

const commandHeader = (title: string, icon: string = "✨") => `╭─⊷「 ${icon} ${_config.BOT_NAME} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const sectionSeparator = () => `│`;

export const apk = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide the name of the APK to search. Usage: .apk <app_name>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);

        // Use alternative API: https://duniagames.co.id/api/thirdparty/playstore/search?keyword=<app_name>
        const searchUrl = `https://duniagames.co.id/api/thirdparty/playstore/search?keyword=${encodeURIComponent(fullArgs)}`;
        const searchRes = await axios.get(searchUrl);
        // Log the raw response for debugging
        console.log("APK search API response:", JSON.stringify(searchRes.data, null, 2));
        const apps = Array.isArray(searchRes.data?.data?.apps) ? searchRes.data.data.apps : [];

        if (!apps || !Array.isArray(apps) || apps.length === 0) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `❌ No APK found for "${fullArgs}".` });
        }

        const app = apps[0];
        let caption = `${commandHeader("APK Downloader", "📱")}\n`;
        caption += ` *App Name:* ${app.title}\n`;
        caption += ` *Developer:* ${app.developer}\n`;
        caption += ` *Rating:* ${app.rating}\n`;
        caption += ` *Size:* ${app.size}\n`;
        caption += ` *Package:* ${app.packageName}\n`;
        caption += ` *Play Store:* ${app.url}\n`;
        caption += ` *Note:* Direct APK download is not available. Use the Play Store link above.\n`;
        caption += `${commandFooter()}`;

        if (app.icon) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: app.icon }, caption }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: caption }, { quoted: msg });
        }
    } catch (error) {
        console.error("APK search error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while searching for the APK." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
apk.description = "Searches for APK info and Play Store link (direct APK download not supported).";
apk.category = "downloads";
apk.usage = ".apk <app_name>";

export const facebook = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('facebook.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid Facebook video URL. Usage: .facebook <url>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const apiUrl = `https://api.giftedtech.web.id/api/download/facebook?apikey=gifted&url=${encodeURIComponent(fullArgs)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || data.status !== true || !data.result || !data.result.url) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to download Facebook video from "${fullArgs}".` });
        }

        let caption = `${commandHeader("Facebook Downloader", "📘")}\n`;
        caption += ` *Title:* ${data.result.title || "Facebook Video"}\n`;
        caption += ` *Quality:* ${data.result.quality || "Unknown"}\n`;
        caption += ` *Downloading your Facebook video...* ⏳\n`;
        caption += `${commandFooter()}`;

        if (data.result.thumbnail) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: data.result.thumbnail }, caption }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: caption }, { quoted: msg });
        }

        await sock.sendMessage(
            msg.key.remoteJid!,
            { video: { url: data.result.url }, mimetype: "video/mp4", caption: data.result.title || "Facebook Video" },
            { quoted: msg }
        );
    } catch (error) {
        console.error("Facebook download error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while downloading Facebook video." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
facebook.description = "Downloads videos from Facebook using giftedtech API.";
facebook.category = "downloads";
facebook.usage = ".facebook <url>";
export const insta = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('instagram.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid Instagram post/reel URL. Usage: .insta <url>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const apiUrl = `https://api.giftedtech.web.id/api/download/instadl?apikey=gifted&url=${encodeURIComponent(fullArgs)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || data.status !== true || !data.result || !data.result.url) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to download Instagram media from "${fullArgs}".` });
        }

        let caption = `${commandHeader("Instagram Downloader", "📸")}\n`;
        caption += ` *Type:* ${data.result.type || "Unknown"}\n`;
        caption += ` *Downloading your Instagram media...* ⏳\n`;
        caption += `${commandFooter()}`;

        if (data.result.thumbnail) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: data.result.thumbnail }, caption }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: caption }, { quoted: msg });
        }

        if (data.result.type === "video" && data.result.url) {
            await sock.sendMessage(
                msg.key.remoteJid!,
                { video: { url: data.result.url }, mimetype: "video/mp4", caption: "Instagram Video" },
                { quoted: msg }
            );
        } else if (data.result.type === "image" && data.result.url) {
            await sock.sendMessage(
                msg.key.remoteJid!,
                { image: { url: data.result.url }, caption: "Instagram Image" },
                { quoted: msg }
            );
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Unsupported or missing media type." }, { quoted: msg });
        }
    } catch (error) {
        console.error("Instagram download error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while downloading Instagram media." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
insta.description = "Downloads media from Instagram using giftedtech API.";
insta.category = "downloads";
insta.usage = ".insta <url>";

// Removed duplicate placeholder TikTok command to avoid redeclaration error.

export const mediafire = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('mediafire.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid MediaFire download URL. Usage: .mediafire <url>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const apiUrl = `https://api.giftedtech.web.id/api/download/mediafire?apikey=gifted&url=${encodeURIComponent(fullArgs)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || data.status !== true || !data.result || !data.result.url) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `❌ Failed to download file from MediaFire link: "${fullArgs}".` });
        }

        const result = data.result;
        let caption = `${commandHeader("MediaFire Downloader", "🗂️")}\n`;
        caption += ` *File Name:* ${result.filename || "Unknown"}\n`;
        caption += ` *Size:* ${result.size || "Unknown"}\n`;
        caption += ` *Type:* ${result.extension || "Unknown"}\n`;
        caption += ` *Downloading your file...* ⏳\n`;
        caption += `${commandFooter()}`;

        await sock.sendMessage(msg.key.remoteJid!, { text: caption }, { quoted: msg });

        await sock.sendMessage(
            msg.key.remoteJid!,
            { document: { url: result.url }, mimetype: result.mime || "application/octet-stream", fileName: result.filename || "mediafire_file" },
            { quoted: msg }
        );
    } catch (error) {
        console.error("MediaFire download error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while downloading from MediaFire." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
mediafire.description = "Downloads files from MediaFire using giftedtech API.";
mediafire.category = "downloads";
mediafire.usage = ".mediafire <url>";

export const pinterestdl = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('pinterest.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid Pinterest pin URL. Usage: .pinterestdl <url>' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `⬇️ Attempting to download from Pinterest: ${fullArgs}. (Placeholder - requires specific scraping/API).` });
};
pinterestdl.description = "Downloads media from Pinterest (placeholder).";
pinterestdl.category = "downloads";
pinterestdl.usage = ".pinterestdl <url>";

export const gdrive = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('drive.google.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid Google Drive file URL. Usage: .gdrive <url>' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `⬇️ Processing Google Drive link: ${fullArgs}. (Downloading from GDrive might require authentication or specific APIs. Placeholder for now.)` });
};
gdrive.description = "Downloads files from Google Drive (placeholder).";
gdrive.category = "downloads";
gdrive.usage = ".gdrive <url>";


export const play = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const userId = msg.key.participant || msg.key.remoteJid!;
    if (!userId) return;

    if (!fullArgs) {
        delete playCommandUserContext[userId];
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a song name to play/download. Usage: .play <query>' });
    }

    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const url = `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(fullArgs)}`;
        const response = await axios.get(url);
        const json = response.data;

        if (!json || json.status !== 200 || !json.result.status) {
            await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Song not found or failed to download!" });
            return;
        }

        const result = {
            title: json.result.metadata.title,
            author: json.result.metadata.author.name,
            duration: json.result.metadata.timestamp,
            views: json.result.metadata.views,
            released: json.result.metadata.published || json.result.metadata.release || json.result.metadata.publishedAt || "Unknown",
            thumb: json.result.metadata.thumbnail,
            audio: json.result.download.url
        };

        let caption = `${commandHeader("Downloader", "🎵")}\n`;
        caption += ` *Title:* ${result.title}\n`;
        caption += ` *Artist:* ${result.author}\n`;
        caption += ` *Duration:* ${result.duration}\n`;
        caption += ` *Views:* ${result.views}\n`;
        caption += ` *Released:* ${result.released}\n`;
        caption += ` *Downloading your song...* ⏳\n`;
        caption += `${commandFooter()}`;

        await sock.sendMessage(msg.key.remoteJid!, { image: { url: result.thumb }, caption }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid!, { audio: { url: result.audio }, mimetype: "audio/mp4" }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while retrieving song data." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
play.description = "Searches and downloads a song from YouTube using external API.";
play.category = "downloads";
play.usage = ".play <song_name>";

export async function handlePlayCommandReply(
    sock: CommandHandlerParams['sock'], 
    msg: CommandHandlerParams['msg'],
    messageText: string,
    prefix: string
) {
    // No reply context needed for this version
    return false;
}

export const song = play; 
song.description = "Alias for .play command.";
song.category = "downloads";
song.usage = ".song <song_name_or_youtube_url>";

export const video = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a video name or URL to search/download. Usage: .video <query/url>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const url = `https://api.vreden.my.id/api/ytplaymp4?query=${encodeURIComponent(fullArgs)}`;
        const response = await axios.get(url);
        const json = response.data;

        if (!json || json.status !== 200 || !json.result.status) {
            await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Video not found or failed to download!" });
            return;
        }

        const result = {
            title: json.result.metadata.title,
            author: json.result.metadata.author.name,
            duration: json.result.metadata.timestamp,
            views: json.result.metadata.views,
            released: json.result.metadata.published || json.result.metadata.release || json.result.metadata.publishedAt || "Unknown",
            thumb: json.result.metadata.thumbnail,
            video: json.result.download.url
        };

        let caption = `${commandHeader("Downloader", "🎬")}\n`;
        caption += ` *Title:* ${result.title}\n`;
        caption += ` *Artist:* ${result.author}\n`;
        caption += ` *Duration:* ${result.duration}\n`;
        caption += ` *Views:* ${result.views}\n`;
        caption += ` *Released:* ${result.released}\n`;
        caption += ` *Downloading your video...* ⏳\n`;
        caption += `${commandFooter()}`;

        await sock.sendMessage(msg.key.remoteJid!, { image: { url: result.thumb }, caption }, { quoted: msg });
        await sock.sendMessage(msg.key.remoteJid!, { video: { url: result.video }, mimetype: "video/mp4", caption: result.title }, { quoted: msg });

    } catch (error) {
        console.error("❌ Error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while retrieving video data." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
video.description = "Searches and downloads a video from YouTube using external API.";
video.category = "downloads";
video.usage = ".video <video_name_or_url>";

export const smedia = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a social media URL to download. Usage: .smedia <url>' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `⬇️ Attempting to download from ${fullArgs}. (This is a generic social media downloader placeholder. Specific commands like .facebook, .insta, .tiktok are preferred.)` });
};
smedia.description = "Downloads media from various social platforms (placeholder).";
smedia.category = "downloads";
export const tiktok = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('tiktok.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid TikTok video URL. Usage: .tiktok <url>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const result = await Tiktok.Downloader(fullArgs, {
            version: "v1",
            // proxy: "YOUR_PROXY", // Uncomment and set if you need a proxy
            showOriginalResponse: false
        });

        if (!result || !result.status || !result.result || !result.result.video) {
            await sock.sendMessage(msg.key.remoteJid!, { text: "❌ Failed to download TikTok video!" });
            return;
        }

        const videoData = result.result;
        let caption = `${commandHeader("TikTok Downloader", "🎵")}\n`;
        caption += ` *Author:* ${videoData.author?.nickname || "Unknown"}\n`;
        caption += ` *Description:* ${videoData.desc || "No description"}\n`;
        caption += ` *Duration:* ${videoData.duration || "Unknown"} seconds\n`;
        caption += ` *Downloading your TikTok video...* ⏳\n`;
        caption += `${commandFooter()}`;

        if (videoData.cover) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: videoData.cover }, caption }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: caption }, { quoted: msg });
        }

        await sock.sendMessage(
            msg.key.remoteJid!,
            { video: { url: videoData.video }, mimetype: "video/mp4", caption: videoData.desc || "TikTok Video" },
            { quoted: msg }
        );
    } catch (error) {
        console.error("❌ TikTok download error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: "❌ An error occurred while downloading TikTok video." });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
tiktok.description = "Downloads videos from TikTok using @tobyg74/tiktok-api-dl.";
tiktok.category = "downloads";
tiktok.usage = ".tiktok <url>";


export const movie = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a movie title to search. Usage: .movie <title>' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `🎬 Searching for movie: "${fullArgs}". (This feature requires a movie database/torrent API and is a placeholder.)` });
    const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(fullArgs)}`;
};
movie.description = "Searches for movie information or download links (placeholder).";
movie.category = "downloads";
movie.usage = ".movie <title>";

export const image = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide search terms for the image. Usage: .image <query>' });
    }
    try {
        const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(fullArgs)}&cache_bust=${Date.now()}`;
        
        await sock.sendMessage(msg.key.remoteJid!, { image: { url: imageUrl }, caption: `🖼️ Here's an image related to "${fullArgs}"` });
    } catch (error) {
        console.error("Image search error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t fetch an image right now.' });
    }
};
image.description = "Searches for an image using Unsplash.";
image.category = "downloads";
image.usage = ".image <query>";


export const yts = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a search query for YouTube. Usage: .yts <query>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const searchResults = await ytSearch(fullArgs);
        if (!searchResults.videos.length) {
            return sock.sendMessage(msg.key.remoteJid!, { text: `No YouTube results found for "${fullArgs}".` });
        }
        
        let responseHeader = `${commandHeader(`YouTube Search: ${fullArgs}`, "▶️")}\n`;
        responseHeader += `│ Showing top results. Use .play <name> to download.\n`;
        await sock.sendMessage(msg.key.remoteJid!, { text: responseHeader });

        const topResults = searchResults.videos.slice(0, 10); // Show top 10 results

        for (let i = 0; i < topResults.length; i++) {
            const video = topResults[i];
            let videoInfo = `*${i + 1}. ${video.title}*\n`;
            videoInfo += `   🎤 Author: ${video.author.name}\n`;
            videoInfo += `   👀 Views: ${video.views.toLocaleString()}\n`;
            videoInfo += `   ⏰ Duration: ${video.timestamp}\n`;
            videoInfo += `   🔗 Link: ${video.url}\n`;
            
            if (video.thumbnail) {
                await sock.sendMessage(msg.key.remoteJid!, {
                    image: { url: video.thumbnail },
                    caption: videoInfo
                }, { quoted: msg });
            } else {
                 await sock.sendMessage(msg.key.remoteJid!, { text: videoInfo }, { quoted: msg });
            }
        }
    } catch (error) {
        console.error("Error in yts command:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, an error occurred while searching YouTube.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
yts.description = "Searches YouTube and lists top results with thumbnails.";
yts.category = "downloads";
yts.usage = ".yts <query>";

export const lyrics = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a song title to search for lyrics. Usage: .lyrics song title [by artist]' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const [title, artist] = fullArgs.split(' by ');

        // Attempt to get song thumbnail from YouTube
        let thumbnailUrl: string | undefined;
        try {
            const searchResults = await ytSearch(fullArgs);
            if (searchResults.videos.length > 0) {
                thumbnailUrl = searchResults.videos[0].thumbnail;
            }
        } catch (ytError) {
            console.warn("Could not fetch thumbnail for lyrics:", ytError);
        }

        // Use the new lyrics API
        const apiUrl = `https://lyricsapi.fly.dev/?title=${encodeURIComponent(title)}${artist ? `&artist=${encodeURIComponent(artist)}` : ''}`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.lyrics) {
            let lyricsText = response.data.lyrics;
            if (lyricsText.length > 3500) lyricsText = lyricsText.substring(0, 3500) + "\n... (lyrics truncated due to length)";
            
            let lyricsMessageCaption = `${commandHeader("Lyrics Finder", "🎶")}\n`;
            lyricsMessageCaption += `│ 🎶 Lyrics for: *${title}${artist ? ' by ' + artist : ''}*\n`;
            lyricsMessageCaption += sectionSeparator() + `\n${lyricsText}\n` + sectionSeparator() + `\n`;
            lyricsMessageCaption += commandFooter();

            if (thumbnailUrl) {
                await sock.sendMessage(msg.key.remoteJid!, { 
                    image: { url: thumbnailUrl }, 
                    caption: lyricsMessageCaption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(msg.key.remoteJid!, { text: lyricsMessageCaption }, { quoted: msg });
            }

        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: `Sorry, couldn't find lyrics for "${fullArgs}". Try format: .lyrics <song title> by <artist>` });
        }
    } catch (error: any) {
        console.error("Lyrics API error:", error);
        let errorMsg = `Sorry, I couldn't fetch lyrics for "${fullArgs}".`;
        if (error.response && error.response.status === 404) {
            errorMsg = `Sorry, lyrics for "${fullArgs}" were not found. Please check the spelling or try the format: .lyrics <song title> by <artist>`;
        } else {
            errorMsg = `Sorry, an error occurred with the lyrics service. Please try again later.`;
        }
        await sock.sendMessage(msg.key.remoteJid!, { text: errorMsg });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
lyrics.description = "Fetches song lyrics with thumbnail. Usage: .lyrics <song_title> [by artist]";
lyrics.category = "downloads";
lyrics.usage = ".lyrics <song_title> [by artist_name]";

export const twitter = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || !fullArgs.includes('twitter.com') && !fullArgs.includes('x.com')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a valid Twitter/X post URL. Usage: .twitter <url>' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `⬇️ Attempting to download Twitter/X media: ${fullArgs}. (This feature is complex and often requires APIs or specialized libraries. Placeholder for now.)` });
};
twitter.description = "Downloads media from Twitter/X (placeholder).";
twitter.category = "downloads";
twitter.usage = ".twitter <url>";

export { playCommandUserContext };
