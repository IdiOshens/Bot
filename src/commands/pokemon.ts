
import { CommandHandlerParams } from '../types';

// Feature is under developing, wait for the update from Zark

export const pokemon = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    // Feature is under developing, wait for the update from Zark
    await sock.sendMessage(msg.key.remoteJid!, { text: `ϞϞ(๑⚈ ․̫ ⚈๑)∩ Pokemon command: ${fullArgs || 'Feature is under developing, wait for the update from Zark'}` });
    await sock.sendMessage(msg.key.remoteJid!, { text: 'Feature is under developing, wait for the update from Zark' });

};
pokemon.description = "Feature is under developing, wait for the update from Zark";
pokemon.category = "pokemon";
pokemon.note = "Feature is under developing, wait for the update from Zark";

export const wallet = async ({ sock, msg }: CommandHandlerParams) => {
    // Feature is under developing, wait for the update from Zark
    const userId = msg.key.participant || msg.key.remoteJid!;
    // Feature is under developing, wait for the update from Zark
    const userMoney = Math.floor(Math.random() * 10000); // Feature is under developing, wait for the update from Zark
    await sock.sendMessage(msg.key.remoteJid!, { text: `Feature is under developing, wait for the update from Zark` });
};
wallet.description = "Feature is under developing, wait for the update from Zark";
wallet.category = "pokemon";

export const buy = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    // Feature is under developing, wait for the update from Zark
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Feature is under developing, wait for the update from Zark' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `Feature is under developing, wait for the update from Zark` });
};
buy.description = "Feature is under developing, wait for the update from Zark";
buy.category = "pokemon";
buy.usage = ".buy <item_name>";

export const winmoney = async ({ sock, msg }: CommandHandlerParams) => {
    // Feature is under developing, wait for the update from Zark
    const amountWon = Math.floor(Math.random() * 100) + 50;
    await sock.sendMessage(msg.key.remoteJid!, { text: `Feature is under developing, wait for the update from Zark` });
};
winmoney.description = "Feature is under developing, wait for the update from Zark";
winmoney.category = "pokemon";
