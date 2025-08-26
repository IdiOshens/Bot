
import type { WASocket, proto } from '@whiskeysockets/baileys';
import { GoogleGenAI, HarmBlockThreshold, Content, Part } from '@google/genai'; // Updated import
import pino from 'pino';

export interface CommandHandlerParams {
    sock: WASocket;
    msg: proto.IWebMessageInfo;
    command: string;
    args: string[];
    fullArgs: string;
    ownerNumbers: string[];
    botName: string;
    prefix: string;
    ai: GoogleGenAI; 
    logger: pino.Logger; // Added logger
}

export interface Command {
    name: string;
    aliases?: string[];
    description: string;
    category: string;
    usage?: string;
    cooldown?: number; // in seconds
    ownerOnly?: boolean;
    groupOnly?: boolean;
    adminOnly?: boolean;
    botAdminOnly?: boolean;
    execute: (params: CommandHandlerParams | CommandHandlerParams & { allCommands: Map<string, Command>}) => Promise<void>;
}

export enum BotMode {
    PUBLIC = "public",
    PRIVATE = "private"
}

// Re-export types used in multiple places if necessary
export { HarmBlockThreshold, Content, Part };