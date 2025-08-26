
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import * as config from '../config'; 

const commandHeader = (title: string, icon: string = "🕵️") => `╭─⊷「 ${icon} ${config.BOT_NAME} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const listItem = (key: string, value: any) => `│  ◦ *${key}:* ${value || 'N/A'}`;
/**
 * Fetch TikTok user profile info using RapidAPI.
 * @param username TikTok username (without @)
 * @returns TikTok user profile data or null if error
 */
export async function fetchTiktokProfile(username: string): Promise<any | null> {
    try {
        const response = await axios.get(
            `https://tiktok-video-downloader-api.p.rapidapi.com/user/${encodeURIComponent(username)}`,
            {
                headers: {
                    'x-rapidapi-key': 'aa2ac47b9fmsh3a66d9bbdd80ba0p168c17jsn342554652715',
                    'x-rapidapi-host': 'tiktok-video-downloader-api.p.rapidapi.com'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("TikTok profile fetch error:", error);
        return null;
    }
}
export const truecaller = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: "Feature is under developing, wait for the update from Zark" });
};
truecaller.description = "Feature is under developing, wait for the update from Zark";
truecaller.category = "stalker_tools";
truecaller.usage = ".truecaller <phone_number>";

export const instastalk = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: "Feature is under developing, wait for the update from Zark" });
};
instastalk.description = "Feature is under developing, wait for the update from Zark";
instastalk.category = "stalker_tools";
instastalk.usage = ".instastalk <username>";

export const tiktokstalk = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a TikTok username. Usage: .tiktokstalk <username>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const username = fullArgs.replace('@', '');
        const data = await fetchTiktokProfile(username);

        if (!data || !data.user) {
            await sock.sendMessage(msg.key.remoteJid!, { text: `Could not fetch TikTok profile for ${fullArgs}. User might not exist or API error.` });
            return;
        }

        const user = data.user;
        let profileInfo = `${commandHeader(`TikTok Profile: ${user.uniqueId}`, "🎵")}\n`;
        profileInfo += listItem("Name", user.nickname);
        profileInfo += `\n` + listItem("Username", `@${user.uniqueId}`);
        profileInfo += `\n` + listItem("Bio", user.signature ? user.signature.replace(/\n/g, '\n│      ') : 'N/A');
        profileInfo += `\n` + listItem("Followers", user.stats?.followerCount);
        profileInfo += `\n` + listItem("Following", user.stats?.followingCount);
        profileInfo += `\n` + listItem("Hearts", user.stats?.heartCount);
        profileInfo += `\n` + listItem("Videos", user.stats?.videoCount);
        profileInfo += `\n` + listItem("Verified", user.verified ? "Yes" : "No");
        profileInfo += `\n│  ◦ *Profile URL:* https://www.tiktok.com/@${user.uniqueId}\n`;
        profileInfo += commandFooter();

        if (user.avatarLarger) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: user.avatarLarger }, caption: profileInfo.trim() }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: profileInfo.trim() }, { quoted: msg });
        }
    } catch (error) {
        console.error("TikTok stalk error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `Could not fetch TikTok profile for ${fullArgs}. User might not exist or API error.` });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
tiktokstalk.description = "Gets public information about a TikTok user.";
tiktokstalk.category = "stalker_tools";
tiktokstalk.usage = ".tiktokstalk <username>";

export const githubstalk = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a GitHub username. Usage: .githubstalk <username>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const response = await axios.get(`https://api.github.com/users/${fullArgs.replace('@','')}`);
        const data = response.data;
        
        let profileInfo = `${commandHeader(`GitHub Profile: ${data.login}`, "💻")}\n`;
        profileInfo += listItem("Name", data.name);
        profileInfo += `\n` + listItem("Username", `@${data.login}`);
        profileInfo += `\n` + listItem("Bio", data.bio ? data.bio.replace(/\n/g, '\n│      ') : 'N/A'); // Indent multiline bio
        profileInfo += `\n` + listItem("Followers", data.followers);
        profileInfo += `\n` + listItem("Following", data.following);
        profileInfo += `\n` + listItem("Public Repos", data.public_repos);
        profileInfo += `\n` + listItem("Public Gists", data.public_gists);
        profileInfo += `\n` + listItem("Location", data.location);
        profileInfo += `\n` + listItem("Company", data.company);
        profileInfo += `\n` + listItem("Blog/Website", data.blog || (data.html_url && data.html_url.startsWith('http') ? data.html_url : 'N/A'));
        profileInfo += `\n` + listItem("Joined", new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        profileInfo += `\n│  ◦ *Profile URL:* ${data.html_url}\n`;
        profileInfo += commandFooter();
        
        if (data.avatar_url) {
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: data.avatar_url }, caption: profileInfo.trim() }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: profileInfo.trim() }, { quoted: msg });
        }
    } catch (error) {
        console.error("GitHub stalk error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `Could not fetch GitHub profile for ${fullArgs}. User might not exist or API limit reached.` });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
githubstalk.description = "Gets public information about a GitHub user.";
githubstalk.category = "stalker_tools";
githubstalk.usage = ".githubstalk <username>";

export const npmstalk = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide an NPM package name. Usage: .npmstalk <package-name>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const response = await axios.get(`https://registry.npmjs.org/${fullArgs}`);
        const data = response.data;
        const latestVersion = data['dist-tags']?.latest;
        const versionData = latestVersion ? data.versions[latestVersion] : null;

        let packageInfo = `${commandHeader(`NPM Package: ${data.name}`, "📦")}\n`;
        packageInfo += listItem("Description", data.description ? data.description.replace(/\n/g, '\n│      ') : 'N/A');
        packageInfo += `\n` + listItem("Latest Version", latestVersion);
        if (versionData) {
            packageInfo += `\n` + listItem("Author", versionData.author?.name || data.author?.name);
            packageInfo += `\n` + listItem("License", versionData.license);
            packageInfo += `\n` + listItem("Homepage", versionData.homepage || data.homepage);
            const repoUrl = versionData.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '') || data.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '');
            packageInfo += `\n` + listItem("Repository", repoUrl);
            packageInfo += `\n` + listItem("Last Modified", new Date(data.time?.modified).toLocaleString());
        }
        packageInfo += `\n│  ◦ *NPM Link:* https://www.npmjs.com/package/${fullArgs}\n`;
        packageInfo += commandFooter();
        
        await sock.sendMessage(msg.key.remoteJid!, { text: packageInfo.trim() });
    } catch (error) {
        console.error("NPM stalk error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `Could not fetch NPM package info for ${fullArgs}. Package might not exist or API error.` });
    } finally {
         await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
npmstalk.description = "Gets public information about an NPM package.";
npmstalk.category = "stalker_tools";
npmstalk.usage = ".npmstalk <package-name>";