
import { CommandHandlerParams } from '../types';
import { getSender, pickRandom } from '../utils/utils';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

// Simple in-memory store for economy data. For persistence, use a database.
interface UserEconomy {
    balance: number;
    lastDaily: number; // Timestamp of last daily claim
    lastEarn: number; // Timestamp of last earn action
    lastRob?: number; // Timestamp of last rob attempt (as victim or perpetrator)
}
const economyData: { [userId: string]: UserEconomy } = {};
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const EARN_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds
const ROB_COOLDOWN = 30 * 60 * 1000; // 30 minutes in milliseconds

const ensureUserData = (userId: string) => {
    const normalizedId = jidNormalizedUser(userId);
    if (!economyData[normalizedId]) {
        economyData[normalizedId] = { 
            balance: 100, 
            lastDaily: 0, 
            lastEarn: 0,
            lastRob: 0,
        };
    }
    // Ensure all properties exist if migrating from an older structure
    if (economyData[normalizedId].lastEarn === undefined) {
        economyData[normalizedId].lastEarn = 0;
    }
    if (economyData[normalizedId].lastRob === undefined) {
        economyData[normalizedId].lastRob = 0;
    }
};

export const economy = async ({ sock, msg, prefix }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);
    ensureUserData(normalizedSender);
    await sock.sendMessage(msg.key.remoteJid!, { 
        text: `💰 *Welcome to the Zark-Bots Economy!* 💰\n\nYour current balance: ${economyData[normalizedSender].balance} Zark Coins™️\n\nUse commands like:\n▫️ ${prefix}balance - Check your coins\n▫️ ${prefix}daily - Claim daily reward\n▫️ ${prefix}earn - Work for some coins\n▫️ ${prefix}leaderboard - See who's rich!\n▫️ ${prefix}transfer @user amount - Send coins\n▫️ ${prefix}spend amount - Spend your coins (concept)\n▫️ ${prefix}rob @user - Try to rob someone (risky!)` 
    });
};
economy.description = "Shows your economy status and commands.";
economy.category = "economy";

export const balance = async ({ sock, msg }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);
    ensureUserData(normalizedSender);
    await sock.sendMessage(msg.key.remoteJid!, { text: `💰 Your current balance is: ${economyData[normalizedSender].balance} Zark Coins™️.` });
};
balance.description = "Checks your current balance.";
balance.category = "economy";
balance.aliases = ['bal', 'coins'];

export const daily = async ({ sock, msg }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);
    ensureUserData(normalizedSender);

    const now = Date.now();
    const lastDaily = economyData[normalizedSender].lastDaily;

    if (now - lastDaily < DAILY_COOLDOWN) {
        const timeLeft = DAILY_COOLDOWN - (now - lastDaily);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return sock.sendMessage(msg.key.remoteJid!, { text: `You have already claimed your daily reward. Try again in ${hours}h ${minutes}m.` });
    }

    const reward = Math.floor(Math.random() * 100) + 150; // Random reward between 150 and 250
    economyData[normalizedSender].balance += reward;
    economyData[normalizedSender].lastDaily = now;

    await sock.sendMessage(msg.key.remoteJid!, { text: `🎉 You claimed your daily reward of ${reward} Zark Coins™️! Your new balance is ${economyData[normalizedSender].balance}.` });
};
daily.description = "Claim your daily reward (once every 24 hours).";
daily.category = "economy";

export const leaderboard = async ({ sock, msg }: CommandHandlerParams) => {
    const sortedUsers = Object.entries(economyData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10); // Top 10

    let lbText = "🏆 *Zark Coins™️ Leaderboard (Top 10)* 🏆\n\n";
    if (sortedUsers.length === 0) {
        lbText += "No users on the leaderboard yet. Be the first to `.earn`!";
    } else {
        const mentions = [];
        for (let i = 0; i < sortedUsers.length; i++) {
            const user = sortedUsers[i];
            let userName = user.id.split('@')[0]; // Default to number part of JID
            
            // Attempt to get pushName or name from group metadata if in a group
            if (msg.key.remoteJid?.endsWith('@g.us')) {
                try {
                    const groupMeta = await sock.groupMetadata(msg.key.remoteJid);
                    const participantInfo = groupMeta.participants.find(p => p.id === user.id);
                    if (participantInfo) {
                       // Baileys might not directly provide pushName in groupMetadata participants.
                       // Use a generic placeholder or rely on tagging.
                       userName = `@${user.id.split('@')[0]}`; 
                       mentions.push(user.id);
                    }
                } catch (e) { /* ignore if metadata fails */ }
            } else if (user.id === (msg.key.participant || msg.key.remoteJid)) {
                userName = msg.pushName || `@${user.id.split('@')[0]}`;
                mentions.push(user.id);
            } else {
                 userName = `@${user.id.split('@')[0]}`;
                 mentions.push(user.id);
            }
             lbText += `${i + 1}. ${userName}: ${user.balance} Zark Coins™️\n`;
        }
         await sock.sendMessage(msg.key.remoteJid!, { text: lbText, mentions: [...new Set(mentions)] }); // Ensure unique mentions
         return;
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: lbText });
};
leaderboard.description = "Shows the economy leaderboard.";
leaderboard.category = "economy";
leaderboard.aliases = ['lb', 'top'];

export const earn = async ({ sock, msg }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);
    ensureUserData(normalizedSender);

    const now = Date.now();
    const lastEarn = economyData[normalizedSender].lastEarn;

    if (now - lastEarn < EARN_COOLDOWN) {
        const timeLeft = EARN_COOLDOWN - (now - lastEarn);
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        return sock.sendMessage(msg.key.remoteJid!, { text: `You need to rest a bit. Try again in ${minutes}m ${seconds}s.` });
    }

    const amountEarned = Math.floor(Math.random() * 20) + 10; // Earn between 10 and 30
    economyData[normalizedSender].balance += amountEarned;
    economyData[normalizedSender].lastEarn = now;
    await sock.sendMessage(msg.key.remoteJid!, { text: `💪 You worked hard and earned ${amountEarned} Zark Coins™️! Your new balance is ${economyData[normalizedSender].balance}.` });
};
earn.description = "Earn some coins by working (cooldown applies).";
earn.category = "economy";
earn.aliases = ['work'];

export const spend = async ({ sock, msg, args }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);
    ensureUserData(normalizedSender);
    const amountToSpend = parseInt(args[0]);

    if (isNaN(amountToSpend) || amountToSpend <= 0) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please specify a valid amount to spend. Usage: .spend <amount>" });
    }
    if (economyData[normalizedSender].balance < amountToSpend) {
        return sock.sendMessage(msg.key.remoteJid!, { text: `💸 You don't have enough Zark Coins™️. Your balance is ${economyData[normalizedSender].balance}.` });
    }

    economyData[normalizedSender].balance -= amountToSpend;
    await sock.sendMessage(msg.key.remoteJid!, { text: `🛍️ You spent ${amountToSpend} Zark Coins™️. Your new balance is ${economyData[normalizedSender].balance}. (Note: Actual items to buy are not yet implemented)` });
};
spend.description = "Spend coins (placeholder for future shop items).";
spend.category = "economy";
spend.usage = ".spend <amount>";

export const deposit = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: "🏦 Deposit feature (e.g., to a bank) is not yet implemented in this economy system." });
};
deposit.description = "Deposit coins to a virtual bank (placeholder).";
deposit.category = "economy";

export const withdraw = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: "🏧 Withdraw feature (e.g., from a bank) is not yet implemented in this economy system." });
};
withdraw.description = "Withdraw coins from a virtual bank (placeholder).";
withdraw.category = "economy";

export const transfer = async ({ sock, msg, args }: CommandHandlerParams) => {
    const sender = msg.key.participant || msg.key.remoteJid!;
    if (!sender) return;
    const normalizedSender = jidNormalizedUser(sender);
    ensureUserData(normalizedSender);

    if (args.length < 2) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .transfer @user <amount> OR .transfer <number> <amount>" });
    }

    let targetJid: string | null = null;
    const amountToTransfer = parseInt(args[1]);

    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mention) {
        targetJid = jidNormalizedUser(mention);
    } else if (args[0].startsWith('@')) {
        targetJid = jidNormalizedUser(`${args[0].substring(1)}@s.whatsapp.net`);
    } else if (args[0].match(/^\d+$/)) {
        targetJid = jidNormalizedUser(`${args[0]}@s.whatsapp.net`);
    }  else if (args[0].includes('@s.whatsapp.net')) {
        targetJid = jidNormalizedUser(args[0]);
    }


    if (!targetJid || !targetJid.includes('@s.whatsapp.net')) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Invalid user specified. Please mention a user or use their WhatsApp number (without +)." });
    }
    
    if (targetJid === normalizedSender) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "You cannot transfer coins to yourself." });
    }

    if (isNaN(amountToTransfer) || amountToTransfer <= 0) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Please specify a valid positive amount to transfer." });
    }

    if (economyData[normalizedSender].balance < amountToTransfer) {
        return sock.sendMessage(msg.key.remoteJid!, { text: `💸 You don't have enough Zark Coins™️ to transfer. Your balance is ${economyData[normalizedSender].balance}.` });
    }

    ensureUserData(targetJid); // Ensure recipient exists in the economy system
    economyData[normalizedSender].balance -= amountToTransfer;
    economyData[targetJid].balance += amountToTransfer;

    await sock.sendMessage(msg.key.remoteJid!, { 
        text: `💸 Transferred ${amountToTransfer} Zark Coins™️ to @${targetJid.split('@')[0]}.\nYour new balance: ${economyData[normalizedSender].balance}.`,
        mentions: [targetJid, normalizedSender] 
    });
    // Notify recipient (optional, can be a bit spammy in groups)
    try {
        await sock.sendMessage(targetJid, { text: `🎁 You received ${amountToTransfer} Zark Coins™️ from @${normalizedSender.split('@')[0]}! Your new balance: ${economyData[targetJid].balance}.`, mentions: [normalizedSender] });
    } catch (e) {
        console.log(`Could not notify ${targetJid} about the transfer directly.`);
    }
};
transfer.description = "Transfer coins to another user.";
transfer.category = "economy";
transfer.usage = ".transfer <@user/number> <amount>";
transfer.aliases = ['pay', 'givemoney'];

export const rob = async ({ sock, msg, args }: CommandHandlerParams) => {
    const robberJid = jidNormalizedUser(msg.key.participant || msg.key.remoteJid!);
    ensureUserData(robberJid);

    const now = Date.now();
    if (now - (economyData[robberJid].lastRob || 0) < ROB_COOLDOWN) {
        const timeLeft = ROB_COOLDOWN - (now - (economyData[robberJid].lastRob || 0));
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        return sock.sendMessage(msg.key.remoteJid!, { text: `You need to lay low for a bit. Try robbing again in ${minutes}m ${seconds}s.` });
    }
    
    let targetJid: string | null = null;
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mention) {
        targetJid = jidNormalizedUser(mention);
    } else if (args[0]?.startsWith('@')) {
        targetJid = jidNormalizedUser(`${args[0].substring(1)}@s.whatsapp.net`);
    } else if (args[0]?.match(/^\d+$/)) {
        targetJid = jidNormalizedUser(`${args[0]}@s.whatsapp.net`);
    } else if (args[0]?.includes('@s.whatsapp.net')) {
        targetJid = jidNormalizedUser(args[0]);
    }


    if (!targetJid) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "Who do you want to rob? Usage: .rob @user or .rob <number>" });
    }

    if (targetJid === robberJid) {
        return sock.sendMessage(msg.key.remoteJid!, { text: "You can't rob yourself, silly!" });
    }

    ensureUserData(targetJid);
    economyData[robberJid].lastRob = now; // Set cooldown regardless of success

    const targetBalance = economyData[targetJid].balance;
    const robberBalance = economyData[robberJid].balance;

    if (targetBalance < 50) { // Minimum balance to rob
        return sock.sendMessage(msg.key.remoteJid!, { text: `@${targetJid.split('@')[0]} is too poor to rob.`, mentions: [targetJid] });
    }

    const successChance = 0.4; // 40% chance of success
    const isSuccess = Math.random() < successChance;

    if (isSuccess) {
        const maxRobAmount = Math.floor(targetBalance * 0.25); // Rob up to 25% of their balance
        const amountRobbed = Math.floor(Math.random() * maxRobAmount) + 1;
        
        economyData[targetJid].balance -= amountRobbed;
        economyData[robberJid].balance += amountRobbed;
        
        await sock.sendMessage(msg.key.remoteJid!, { 
            text: `💰 Success! You robbed ${amountRobbed} Zark Coins™️ from @${targetJid.split('@')[0]}! Your new balance: ${economyData[robberJid].balance}.`,
            mentions: [robberJid, targetJid]
        });
        try {
           await sock.sendMessage(targetJid, { text: `🚨 Oh no! @${robberJid.split('@')[0]} just robbed ${amountRobbed} Zark Coins™️ from you! Your new balance: ${economyData[targetJid].balance}.`, mentions: [robberJid] });
        } catch (e) { /* ignore if can't dm target */ }

    } else {
        const finePercentage = Math.random() * 0.10 + 0.05; // Lose 5-15% of your own balance
        const fineAmount = Math.floor(robberBalance * finePercentage);
        
        economyData[robberJid].balance -= fineAmount;
        if (economyData[robberJid].balance < 0) economyData[robberJid].balance = 0;

        await sock.sendMessage(msg.key.remoteJid!, { 
            text: `🚓 Failed! You got caught trying to rob @${targetJid.split('@')[0]} and paid a fine of ${fineAmount} Zark Coins™️. Your balance: ${economyData[robberJid].balance}.`,
            mentions: [robberJid, targetJid]
        });
    }
};
rob.description = "Attempt to rob coins from another user (risky!).";
rob.category = "economy";
rob.usage = ".rob <@user/number>";
rob.cooldown = 300; // 5 minutes cooldown, separate from the internal ROB_COOLDOWN logic for failed attempts etc.
