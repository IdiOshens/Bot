
import { CommandHandlerParams } from '../types';
import { generateText } from '../services/geminiService'; 
import { BOT_NAME } from '../config';
import { GoogleGenAI, Part, Content } from '@google/genai'; // Import Content

const TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

// Simple in-memory store for chat history (per chat)
const chatHistories: { [chatId: string]: Content[] } = {}; // Updated history type to Content[]

export const ai = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a prompt for the AI. Usage: .ai <your question>' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const response = await generateText(fullArgs); 
        await sock.sendMessage(msg.key.remoteJid!, { text: response }, { quoted: msg });
    } catch (error) {
        console.error("AI command error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I encountered an error trying to respond.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
ai.description = "Ask the AI anything.";
ai.category = "ai_chat";
ai.usage = ".ai <your question>";

export const gpt = ai; // Alias
gpt.description = "Alias for .ai command.";
gpt.category = "ai_chat";
gpt.usage = ".gpt <your question>";


// 🔁 In-memory tracker for bot mode per chat
const activeBotChats: Record<string, boolean> = {};

// ✅ Toggle Bot On/Off
export const togglebot = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    const input = fullArgs?.trim().toLowerCase();

    if (!input) {
        return sock.sendMessage(chatId, {
            text: `🤖 Chatbot is currently *${activeBotChats[chatId] ? 'ON' : 'OFF'}*. Use ".bot on" or ".bot off" to control it.`,
        });
    }

    if (input === "on") {
        activeBotChats[chatId] = true;
        await sock.sendMessage(chatId, { text: "✅ Chatbot is now *ON* in this chat." });
    } else if (input === "off") {
        delete activeBotChats[chatId];
        await sock.sendMessage(chatId, { text: "🛑 Chatbot is now *OFF* in this chat." });
    } else {
        await sock.sendMessage(chatId, {
            text: '❓ Use ".bot on" to activate or ".bot off" to deactivate the chatbot in this chat.',
        });
    }
};
togglebot.description = "Toggle AI chatbot for this chat (.bot on/off)";
togglebot.category = "ai_chat";
togglebot.usage = ".bot on | .bot off";
export const bot = togglebot; // Keep the original `.bot` command name

// 🤖 Auto-response if chat is active
export const passiveBotHandler = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    const text = fullArgs?.trim();

    // If bot is not activated or message is a command, ignore
    if (!activeBotChats[chatId] || msg.message?.conversation?.startsWith(".")) return;

    try {
        await sock.sendPresenceUpdate("composing", chatId);
        const prompt = `You are a friendly and casual AI. Reply to the user in a relaxed, witty style.\nUser: ${text}\nBot:`;
        const response = await generateText(prompt);
        await sock.sendMessage(chatId, { text: response }, { quoted: msg });
    } catch (err) {
        console.error("Passive bot error:", err);
        await sock.sendMessage(chatId, { text: "😅 I glitched a bit. Try again!" });
    } finally {
        await sock.sendPresenceUpdate("paused", chatId);
    }
};


export const lydia = async ({ sock, msg, fullArgs, ai: geminiAIInstance }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    if (!fullArgs) {
        return sock.sendMessage(chatId, { text: 'Hi! I am Lydia, your AI assistant. What can I do for you?' });
    }

    if (!chatHistories[chatId]) {
        // Initial history for Lydia
        chatHistories[chatId] = [
            { role: "user", parts: [{text: `You are Lydia, a helpful AI assistant. You are chatting with ${msg.pushName || 'a user'}. Your responses should be conversational and friendly.`}] },
            { role: "model", parts: [{text: "Okay, I understand. How can I help you today?"}]}
        ];
    }
    
    const userMessageContent: Content = { role: "user", parts: [{text: fullArgs}] };

    try {
        await sock.sendPresenceUpdate('composing', chatId);
        
        const chatSession = geminiAIInstance.chats.create({
            model: TEXT_MODEL,
            history: chatHistories[chatId] 
        });
        const result = await chatSession.sendMessage({ message: fullArgs }); 
        
        const textResponse = result.text;
        
        chatHistories[chatId].push(userMessageContent);
        chatHistories[chatId].push({ role: "model", parts: [{text: textResponse}] });
        
        if (chatHistories[chatId].length > 20) { 
            chatHistories[chatId] = chatHistories[chatId].slice(-20);
        }

        await sock.sendMessage(chatId, { text: textResponse }, { quoted: msg });
    } catch (error) {
        console.error("Lydia AI command error:", error);
        await sock.sendMessage(chatId, { text: 'Sorry, I encountered an error trying to respond.' });
    } finally {
        await sock.sendPresenceUpdate('paused', chatId);
    }
};
lydia.description = "Engage in a continuous conversation with Lydia AI.";
lydia.category = "ai_chat";
lydia.usage = ".lydia <your message>";

export const lydea = lydia; // Alias for common misspelling
lydea.description = "Alias for .lydia command.";
lydea.category = "ai_chat";
lydea.usage = ".lydea <your message>";


let autoReplyEnabled = false; 
let autoReplyMessage = "I'm currently busy. I'll get back to you soon.";

export const autoreply = async ({ sock, msg, args, ownerNumbers }: CommandHandlerParams) => {
    const sender = msg.key.remoteJid!;
    const userId = msg.key.participant || msg.key.remoteJid!;
    if (!ownerNumbers.includes(userId) && !msg.key.fromMe) { 
        return sock.sendMessage(sender!, { text: "❌ This command is for the bot owner only." });
    }

    if (args.length === 0) {
        return sock.sendMessage(sender, { text: `Auto-reply is currently ${autoReplyEnabled ? 'ON' : 'OFF'}. Usage: .autoreply <on|off> [message]` });
    }

    const action = args[0].toLowerCase();
    if (action === 'on') {
        autoReplyEnabled = true;
        if (args.length > 1) {
            autoReplyMessage = args.slice(1).join(' ');
        }
        await sock.sendMessage(sender, { text: `✅ Auto-reply turned ON. Message: "${autoReplyMessage}"` });
    } else if (action === 'off') {
        autoReplyEnabled = false;
        await sock.sendMessage(sender, { text: '❌ Auto-reply turned OFF.' });
    } else {
        await sock.sendMessage(sender, { text: 'Invalid action. Use "on" or "off".' });
    }
};
autoreply.description = "Toggle auto-reply. Owner only. Usage: .autoreply <on|off> [message]";
autoreply.category = "ai_chat";
autoreply.ownerOnly = true;

export function getAutoReplyState() { 
    return { enabled: autoReplyEnabled, message: autoReplyMessage };
}


export const chat = async ({ sock, msg, fullArgs, ai: geminiAIInstance, botName }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    if (!fullArgs) {
        return sock.sendMessage(chatId, { text: 'What would you like to chat about?' });
    }

    if (!chatHistories[chatId]) {
        chatHistories[chatId] = [
            { role: "user", parts: [{text: `You are ${botName}, a helpful AI Chatbot. Your responses should be conversational.`}] },
            { role: "model", parts: [{text: "Okay, I'm ready to chat!"}]}
        ];
    }
    
    const userMessageContent: Content = { role: "user", parts: [{text: fullArgs}] };

    try {
        await sock.sendPresenceUpdate('composing', chatId);
        
        const chatSession = geminiAIInstance.chats.create({ 
            model: TEXT_MODEL,
            history: chatHistories[chatId] 
        });
        const result = await chatSession.sendMessage({ message: fullArgs });
        const textResponse = result.text;
        
        chatHistories[chatId].push(userMessageContent); 
        chatHistories[chatId].push({ role: "model", parts: [{text: textResponse}] }); 
        
        if (chatHistories[chatId].length > 20) {
            chatHistories[chatId] = chatHistories[chatId].slice(-20);
        }

        await sock.sendMessage(chatId, { text: textResponse }, { quoted: msg });
    } catch (error) {
        console.error("Chat command error:", error);
        await sock.sendMessage(chatId, { text: 'Sorry, I had trouble processing your message.' });
    } finally {
        await sock.sendPresenceUpdate('paused', chatId);
    }
};
chat.description = "Engage in a continuous conversation with the AI.";
chat.category = "ai_chat";
chat.usage = ".chat <your message>";

export const remini = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: '🖼️ Remini (image enhancement) feature is not yet implemented. It requires an image processing API.' });
};
remini.description = "Enhance image quality (placeholder).";
remini.category = "ai_chat"; 
remini.usage = ".remini <attach_image>";


export const voicechat = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide text to convert to speech.' });
    }
    await sock.sendMessage(msg.key.remoteJid!, { text: `🗣️ Voice chat (TTS) for: "${fullArgs}" is a premium feature or requires specific API setup. For now, I'll just echo your text. You can use the .tts command.` });
};
voicechat.description = "Convert text to speech (placeholder, use .tts).";
voicechat.category = "ai_chat"; 
voicechat.usage = ".voicechat <text>";
