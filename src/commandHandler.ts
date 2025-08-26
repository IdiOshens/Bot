import { Boom } from '@hapi/boom';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { GoogleGenAI } from '@google/genai';
import { CommandHandlerParams, Command, BotMode } from './types';
import * as config from './config';
import { isGroupAdmin, getGroupJid, isBotAdmin } from './utils/utils';
import { isPremiumUser } from './commands/owner';

// Import command modules
import * as generalCommands from './commands/general';
import * as aiCommands from './commands/ai';
import * as toolCommands from './commands/tools';
import * as converterCommands from './commands/converters';
import * as funCommands from './commands/fun';
import * as downloadCommands from './commands/download';
import * as religionCommands from './commands/religion';
import * as groupCommands from './commands/group';
import * as stalkerCommands from './commands/stalker';
import * as miscCommands from './commands/misc';
import * as logoCommands from './commands/logo';
import * as ownerCommands from './commands/owner';
import * as audioEditCommands from './commands/audioEdit';
import * as pokemonCommands from './commands/pokemon';

// New command modules
import * as premiumUserCommands from './commands/premium';
import * as economyCommands from './commands/economy';
import * as bugCommands from './commands/bugs';
import * as animeExtendedCommands from './commands/anime_extended';
import * as nsfwCommands from './commands/nsfw';
import * as tiktokMediaCommands from './commands/tiktokMedia';
import * as randomPicsCommands from './commands/randomPics';
import * as imageEffectsCommands from './commands/imageEffects';
import * as gfxMakerCommands from './commands/gfxMaker';

const allModules: Record<string, any> = { 
    ...generalCommands,
    ...aiCommands,
    ...toolCommands,
    ...converterCommands,
    ...funCommands,
    ...downloadCommands,
    ...religionCommands,
    ...groupCommands,
    ...stalkerCommands,
    ...miscCommands, 
    ...logoCommands,
    ...ownerCommands,
    ...audioEditCommands,
    ...pokemonCommands,
    ...premiumUserCommands,
    ...economyCommands,
    ...bugCommands,
    ...animeExtendedCommands,
    ...nsfwCommands,
    ...tiktokMediaCommands,
    ...randomPicsCommands,
    ...imageEffectsCommands,
    ...gfxMakerCommands,
};

export const commands: Map<string, Command> = new Map();

// Register commands
for (const commandNameInModule in allModules) {
    const cmdExecutor = allModules[commandNameInModule];
    if (typeof cmdExecutor === 'function' && cmdExecutor.description && cmdExecutor.category) {
        const commandObject: Command = {
            name: commandNameInModule.toLowerCase()
                .replace(/_cmd$/, '')
                .replace(/wp$/, '')
                .replace(/pic$/, '')
                .replace(/_tiktok$/, '')
                .replace(/waifu$/, '')
                .replace(/reaction$/, '')
                .replace(/_nsfw$/, '')
                .replace(/_hentai$/, ''),
            description: cmdExecutor.description,
            category: cmdExecutor.category,
            usage: cmdExecutor.usage,
            aliases: cmdExecutor.aliases?.map((a: string) => a.toLowerCase()) || [],
            cooldown: cmdExecutor.cooldown || 3, 
            ownerOnly: cmdExecutor.ownerOnly || false,
            groupOnly: cmdExecutor.groupOnly || false,
            adminOnly: cmdExecutor.adminOnly || false,
            botAdminOnly: cmdExecutor.botAdminOnly || false,
            execute: cmdExecutor,
        };

        if (!commands.has(commandObject.name)) {
            commands.set(commandObject.name, commandObject);
        }
        commandObject.aliases?.forEach(alias => {
            if (!commands.has(alias)) {
                commands.set(alias, commandObject);
            }
        });
    }
}

const userCooldowns = new Map<string, Map<string, number>>(); // userID -> Map<commandName, lastExecutionTime>

export async function handleCommand(params: CommandHandlerParams): Promise<void> {
    const { sock, msg, command, ownerNumbers, prefix, ai } = params;
    const sender = msg.key.remoteJid!;
    const userId = msg.key.participant || msg.key.remoteJid!;
    const groupJid = getGroupJid(msg);

    const cmd = commands.get(command.toLowerCase());

    if (!cmd) return;

    // Special handling for commands that need the full command list
    if (cmd.name === 'menu' || cmd.name === 'allcmds') {
        try {
            // @ts-ignore
            await cmd.execute({ ...params, allCommands: commands });
        } catch (error) {
            console.error(`Error executing special command ${command}:`, error);
            await sock.sendMessage(sender, { text: 'An error occurred while generating the command list.' });
        }
        return;
    }

    // Bot mode check
    if (config.BOT_MODE === BotMode.PRIVATE && !ownerNumbers.includes(userId) && !msg.key.fromMe) {
        console.log(`Bot is in private mode. Ignoring message from ${userId} for command ${cmd.name}`);
        return;
    }

    // Owner check
    if (cmd.ownerOnly && !ownerNumbers.includes(userId) && !msg.key.fromMe) {
        await sock.sendMessage(sender, { text: "🔒 This command is restricted to the bot owner only." });
        return;
    }

    // Group only check
    if (cmd.groupOnly && !groupJid) {
        await sock.sendMessage(sender, { text: "ℹ️ This command can only be used in groups." });
        return;
    }

    // Admin check
    if (cmd.adminOnly && groupJid) {
        const isAdmin = await isGroupAdmin(sock, groupJid, userId);
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: "🛡️ You need to be a group admin to use this command." });
            return;
        }
    }

    // Bot admin check
    if (cmd.botAdminOnly && groupJid) {
        const botIsAdmin = await isBotAdmin(sock, groupJid);
        if (!botIsAdmin) {
            await sock.sendMessage(sender, { text: "I need to be an admin in this group to perform this action." });
            return;
        }
    }

    // Cooldown check
    if (cmd.cooldown && cmd.cooldown > 0 && !ownerNumbers.includes(userId)) { 
        if (!userCooldowns.has(userId)) {
            userCooldowns.set(userId, new Map());
        }
        const userCommandCooldowns = userCooldowns.get(userId)!;
        const lastExecution = userCommandCooldowns.get(cmd.name);
        const now = Date.now();
        if (lastExecution && (now - lastExecution) < cmd.cooldown * 1000) {
            const timeLeft = Math.ceil((lastExecution + cmd.cooldown * 1000 - now) / 1000);
            await sock.sendMessage(sender, { text: `⏳ Please wait ${timeLeft} more second(s) before using this command again.` });
            return;
        }
        userCommandCooldowns.set(cmd.name, now);
    }

    try {
        await cmd.execute(params);
    } catch (error) {
        console.error(`Error executing command ${command}:`, error);
        let errorMessage = 'An error occurred while processing your command.';
        if (error instanceof Error) {
            errorMessage += `\nError: ${error.message}`;
        }
        if (error instanceof Boom && error.output?.payload?.message) {
            errorMessage += `\nDetails: ${error.output.payload.message}`;
        }
        await sock.sendMessage(sender, { text: errorMessage });
    }
}