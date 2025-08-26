
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import * as config from '../config'; 

const commandHeader = (title: string, icon: string = "✨") => `╭─⊷「 ${icon} ${config.BOT_NAME} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;
const sectionSeparator = () => `│`;

// --- Bible Commands ---
const BIBLE_API_BASE = 'https://bible-api.com/';

export const bible = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a Bible verse reference. Usage: .bible John 3:16' });
    }
    try {
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid!);
        const response = await axios.get(`${BIBLE_API_BASE}${encodeURIComponent(fullArgs)}?translation=kjv`); // KJV for classic feel
        if (response.data && response.data.text) {
            let verseText = `${commandHeader("Verse from the Holy Bible", "📖")}\n`;
            verseText += `│ ✝️ *Reference:* ${response.data.reference}\n`;
            verseText += sectionSeparator();
            verseText += `│ ${response.data.text.replace(/\n/g, '\n│ ')}\n`; // Indent multiline verses
            verseText += sectionSeparator();
            verseText += `│ May these words bring you peace and understanding. 🙏\n`;
            verseText += commandFooter();
            await sock.sendMessage(msg.key.remoteJid!, { text: verseText }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: `Could not find verse: ${fullArgs}. Ensure the format is correct (e.g., John 3:16).` });
        }
    } catch (error) {
        console.error("Bible API error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I could not fetch the Bible verse.' });
    } finally {
        await sock.sendPresenceUpdate('paused', msg.key.remoteJid!);
    }
};
bible.description = "Fetches a Bible verse. Usage: .bible <Book Chapter:Verse>";
bible.category = "religion";
bible.usage = ".bible John 3:16";

export const biblebooks = async ({ sock, msg }: CommandHandlerParams) => {
    const oldTestament = [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", 
        "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", 
        "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", 
        "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", 
        "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", 
        "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", 
        "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", 
        "Zephaniah", "Haggai", "Zechariah", "Malachi"
    ];
    const newTestament = [
        "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
        "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
        "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
        "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
        "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
        "Jude", "Revelation"
    ];

    let booksText = `${commandHeader("Books of The Holy Bible", "🕊️")}\n`;
    booksText += `│ *Old Testament:*\n`;
    oldTestament.forEach((book, i) => booksText += `│  ◦ ${book}${ (i+1) % 3 === 0 && i < oldTestament.length -1 ? '\n│ ' : (i < oldTestament.length -1 ? ', ' : '') }`);
    booksText += `\n` + sectionSeparator() + `\n`;
    booksText += `│ *New Testament:*\n`;
    newTestament.forEach((book, i) => booksText += `│  ◦ ${book}${ (i+1) % 3 === 0 && i < newTestament.length -1 ? '\n│ ' : (i < newTestament.length -1 ? ', ' : '') }`);
    booksText += `\n` + commandFooter();
    
    await sock.sendMessage(msg.key.remoteJid!, { text: booksText.replace(/,\s*$/, '') }); // Remove trailing commas
};
biblebooks.description = "Lists the books of the Bible, organized by testament.";
biblebooks.category = "religion";

// --- Quran Commands ---
const QURAN_API_BASE = 'https://api.alquran.cloud/v1/';

export const surahmenu = async ({ sock, msg }: CommandHandlerParams) => {
    try {
        const response = await axios.get(`${QURAN_API_BASE}meta`);
        if (response.data && response.data.data && response.data.data.surahs && response.data.data.surahs.references) {
            const surahs = response.data.data.surahs.references;
            let menuText = `${commandHeader("Quran Surahs", "📜")}\n`;
            surahs.forEach((surah: any) => {
                menuText += `│ ${surah.number}. ${surah.name} (${surah.englishName}) - ${surah.numberOfAyahs} ayahs\n`;
            });
            menuText += sectionSeparator() + `\n│ Use .surah <number> to read a Surah.\n`;
            menuText += commandFooter();
            await sock.sendMessage(msg.key.remoteJid!, { text: menuText });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: "Could not fetch Surah list." });
        }
    } catch (error) {
        console.error("Quran meta API error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I could not fetch the Surah list.' });
    }
};
surahmenu.description = "Lists all Surahs of the Quran.";
surahmenu.category = "religion";


export const quranvid = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please specify a Surah number or name. Usage: .quranvid <surah_number_or_name>' });
    }
    const searchQuery = `Quran recitation Surah ${fullArgs}`;
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    await sock.sendMessage(msg.key.remoteJid!, { text: `🎥 Searching for Quran videos for "${fullArgs}":\n${youtubeSearchUrl}\n(This is a placeholder, direct video sending requires more setup)` });
};
quranvid.description = "Finds Quran recitation videos (placeholder).";
quranvid.category = "religion";
quranvid.usage = ".quranvid <surah_number_or_name>";

export const qvid = quranvid; 
qvid.description = "Alias for .quranvid.";
qvid.category = "religion";

export const qimg = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please specify a Surah and Ayah number. Usage: .qimg <surah:ayah_number>' });
    }
    try {
        const [surah, ayah] = fullArgs.split(':');
        if (!surah || !ayah || isNaN(parseInt(surah)) || isNaN(parseInt(ayah))) {
            return sock.sendMessage(msg.key.remoteJid!, { text: 'Invalid format. Use Surah:Ayah, e.g., 1:1' });
        }
        const imageUrl = `https://everyayah.com/data/images_png/${surah}/${ayah}.png`;
        await sock.sendMessage(msg.key.remoteJid!, { image: { url: imageUrl }, caption: `🕋 Quran Ayah ${fullArgs}` });
    } catch (error) {
        console.error("Quran image error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: `Sorry, I could not fetch the Quran image for ${fullArgs}. The verse might not exist or the service is unavailable.` });
    }
};
qimg.description = "Sends an image of a Quranic ayah. Usage: .qimg <surah_number:ayah_number>";
qimg.category = "religion";
qimg.usage = ".qimg <surah:ayah>";

export const surahaudio = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || isNaN(parseInt(fullArgs))) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a Surah number. Usage: .surahaudio <surah_number>' });
    }
    const surahNumber = parseInt(fullArgs);
    try {
        const response = await axios.get(`${QURAN_API_BASE}surah/${surahNumber}/ar.alafasy`);
        if (response.data && response.data.data && response.data.data.ayahs && response.data.data.ayahs.length > 0) {
            const firstAyahAudio = response.data.data.ayahs[0].audio;
            if (firstAyahAudio) {
                await sock.sendMessage(msg.key.remoteJid!, {
                    audio: { url: firstAyahAudio },
                    mimetype: 'audio/mpeg',
                    ptt: false, 
                    caption: `🎧 Audio for Surah ${surahNumber}, Ayah 1 (Mishary Alafasy)`
                });
                await sock.sendMessage(msg.key.remoteJid!, { text: `Note: This sends the first ayah. Full surah audio might be too large or require a different source.`});
            } else {
                await sock.sendMessage(msg.key.remoteJid!, { text: `Could not find audio for Surah ${surahNumber}.` });
            }
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: `Could not find Surah ${surahNumber}.` });
        }
    } catch (error) {
        console.error("Surah audio error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I could not fetch the Surah audio.' });
    }
};
surahaudio.description = "Sends audio recitation of a Surah (first ayah example). Usage: .surahaudio <surah_number>";
surahaudio.category = "religion";
surahaudio.usage = ".surahaudio <surah_number>";

export const surahurdu = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    if (!fullArgs || isNaN(parseInt(fullArgs))) {
        return sock.sendMessage(msg.key.remoteJid!, { text: 'Please provide a Surah number. Usage: .surahurdu <surah_number>' });
    }
    const surahNumber = parseInt(fullArgs);
    try {
        const response = await axios.get(`${QURAN_API_BASE}surah/${surahNumber}/ur.maududi`);
        if (response.data && response.data.data && response.data.data.ayahs) {
            let surahText = `${commandHeader(`${response.data.data.name} (${response.data.data.englishName}) - Urdu`, "🕌")}\n\n`;
            response.data.data.ayahs.forEach((ayah: any) => {
                surahText += `${ayah.numberInSurah}. ${ayah.text}\n`;
            });
            if (surahText.length > 4096) surahText = surahText.substring(0, 4090) + "\n... (truncated)";
            await sock.sendMessage(msg.key.remoteJid!, { text: surahText }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: `Could not find Urdu translation for Surah ${surahNumber}.` });
        }
    } catch (error) {
        console.error("Surah Urdu translation error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I could not fetch the Urdu translation.' });
    }
};
surahurdu.description = "Fetches Urdu translation of a Surah. Usage: .surahurdu <surah_number>";
surahurdu.category = "religion";
surahurdu.usage = ".surahurdu <surah_number>";


export const asmaulhusna = async ({ sock, msg }: CommandHandlerParams) => {
    const names = [
        "Ar-Rahman (الرحمن): The All-Compassionate", "Ar-Rahim (الرحيم): The All-Merciful",
        "Al-Malik (الملك): The Absolute Ruler", "Al-Quddus (القدوس): The Pure One",
        "As-Salam (السلام): The Source of Peace", "Al-Mu'min (المؤمن): The Inspirer of Faith",
        "Al-Muhaymin (المهيمن): The Guardian", "Al-Aziz (العزيز): The Victorious",
        "Al-Jabbar (الجبار): The Compeller", "Al-Mutakabbir (المتكبر): The Greatest" 
    ];
    let namesText = `${commandHeader("Asmaul Husna", "🌟")}\n│ Some of The Most Beautiful Names of Allah:\n`;
    names.forEach(name => namesText += `│  ◦ ${name}\n`);
    namesText += `│ (This is a partial list)\n` + commandFooter();
    await sock.sendMessage(msg.key.remoteJid!, { text: namesText });
};
asmaulhusna.description = "Lists some of the Asmaul Husna (Names of Allah).";
asmaulhusna.category = "religion";

export const prophetname = async ({ sock, msg }: CommandHandlerParams) => {
    const names = [
        "Adam (آدم عليه السلام)", "Nuh (نوح عليه السلام) - Noah",
        "Ibrahim (إبراهيم عليه السلام) - Abraham", "Musa (موسى عليه السلام) - Moses",
        "Isa (عيسى عليه السلام) - Jesus", "Muhammad (محمد صلى الله عليه وسلم) - Muhammad (PBUH)"
    ];
    let prophetsText = `${commandHeader("Prophets in Islam", "📜")}\n│ Some of the Prophets of Allah:\n`;
    names.forEach(name => prophetsText += `│  ◦ ${name}\n`);
    prophetsText += `│ (This is a partial list)\n` + commandFooter();
    await sock.sendMessage(msg.key.remoteJid!, { text: prophetsText });
};
prophetname.description = "Lists names of some Prophets in Islam.";
prophetname.category = "religion";
