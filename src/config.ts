
export const BOT_NAME = process.env.BOT_NAME || "Zark-Bots";
export const BOT_PREFIX = process.env.BOT_PREFIX || ".";
// Default owner number updated as per user request
export const OWNER_NUMBERS = (process.env.OWNER_NUMBERS || "256707983832").split(',').map(num => num.trim() + "@s.whatsapp.net"); 
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""; // MUST be set in environment variables
export const AUTO_REPLY_ENABLED = process.env.AUTO_REPLY_ENABLED === 'true' || false;
export const BOT_MODE = process.env.BOT_MODE || "public"; // "public" or "private"
export const WELCOME_MESSAGE_ENABLED = process.env.WELCOME_MESSAGE_ENABLED === 'true' || false;
export const GOODBYE_MESSAGE_ENABLED = process.env.GOODBYE_MESSAGE_ENABLED === 'true' || false;
export const BOT_IMAGE_URL = process.env.BOT_IMAGE_URL || "menu.png"; // Generic placeholder, user can override

// New Owner Feature Flags
export let ANTI_CALL_ENABLED = process.env.ANTI_CALL_ENABLED === 'true' || false;
export let AUTO_BIO_ENABLED = process.env.AUTO_BIO_ENABLED === 'true' || false;
export let AUTO_TYPING_ENABLED = process.env.AUTO_TYPING_ENABLED === 'true' || false;
export let ALWAYS_ONLINE_ENABLED = process.env.ALWAYS_ONLINE_ENABLED === 'true' || false;
export let AUTO_READ_ENABLED = process.env.AUTO_READ_ENABLED === 'true' || false;
export let AUTO_STATUS_VIEW_ENABLED = process.env.AUTO_STATUS_VIEW_ENABLED === 'true' || false;
export let ANTI_DELETE_ENABLED = process.env.ANTI_DELETE_ENABLED === 'true' || false;

// Sudo users (can use bot in private mode, managed by owner)
export let SUDO_USERS: string[] = (process.env.SUDO_USERS || "").split(',').filter(Boolean).map(num => num.trim() + "@s.whatsapp.net");

// Functions to update these settings at runtime (used by owner commands)
export const setAntiCall = (value: boolean) => { ANTI_CALL_ENABLED = value; };
export const setAutoBio = (value: boolean) => { AUTO_BIO_ENABLED = value; };
export const setAutoTyping = (value: boolean) => { AUTO_TYPING_ENABLED = value; };
export const setAlwaysOnline = (value: boolean) => { ALWAYS_ONLINE_ENABLED = value; };
export const setAutoRead = (value: boolean) => { AUTO_READ_ENABLED = value; };
export const setAutoStatusView = (value: boolean) => { AUTO_STATUS_VIEW_ENABLED = value; };
export const setAntiDelete = (value: boolean) => { ANTI_DELETE_ENABLED = value; };

export const addSudoUser = (jid: string) => {
    if (!SUDO_USERS.includes(jid)) {
        SUDO_USERS.push(jid);
        // Persist SUDO_USERS to env or a file if needed beyond runtime
    }
};
export const removeSudoUser = (jid: string) => {
    SUDO_USERS = SUDO_USERS.filter(user => user !== jid);
    // Persist SUDO_USERS to env or a file if needed beyond runtime
};


if (!GEMINI_API_KEY) {
    console.error(`🛑 CRITICAL: Gemini API Key for ${BOT_NAME} is NOT SET. AI features will be disabled. Please set the GEMINI_API_KEY environment variable.`);
} else if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_MUST_BE_SET_IN_ENV" || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY" || GEMINI_API_KEY === "AIzaSyDEw3hjX5PL-XXyoSgKCPq0TFuHJJoeRac" && process.env.GEMINI_API_KEY !== "AIzaSyDEw3hjX5PL-XXyoSgKCPq0TFuHJJoeRac") { // Check for common placeholders, but allow if it's genuinely the user's key set in env
     console.warn(`️⚠️ WARNING: Gemini API Key for ${BOT_NAME} might be using a default placeholder value if not set directly in environment. AI features may not work. Please ensure a valid GEMINI_API_KEY environment variable is correctly set and loaded.`);
}
