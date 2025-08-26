
import { CommandHandlerParams } from '../types';
import axios from 'axios';
import { pickRandom } from '../utils/utils';
import * as config from '../config'; 

// --- User Stats for Ranking ---
// This should be managed in a more persistent way in a real application (e.g., database)
// For now, it's in-memory.
export const userStats: { [groupId: string]: { [userId: string]: { messageCount: number, name?: string } } } = {};

const commandHeader = (title: string, icon: string = "✨") => `╭─⊷「 ${icon} ${config.BOT_NAME} - ${title.toUpperCase()} ${icon} 」`;
const commandFooter = () => `╰─────────────────────⊷`;

// --- Tic Tac Toe ---
interface TTTGame {
    board: string[][];
    currentPlayer: 'X' | 'O';
    players: { X: string | null; O: string | null };
    playerNames: { X: string | null; O: string | null };
    gameOver: boolean;
    winner: string | null;
}
const tttGames: { [chatId: string]: TTTGame } = {};

const initializeTTT = (chatId: string, playerX: string, playerXName: string): TTTGame => {
    tttGames[chatId] = {
        board: Array(3).fill(null).map(() => Array(3).fill(' ')),
        currentPlayer: 'X',
        players: { X: playerX, O: null },
        playerNames: { X: playerXName, O: null },
        gameOver: false,
        winner: null,
    };
    return tttGames[chatId];
};

const displayTTTBoard = (board: string[][]): string => {
    return board.map(row => row.map(cell => cell === ' ' ? '⬜' : (cell === 'X' ? '❌' : '⭕')).join('')).join('\n');
};

const checkTTTWinner = (board: string[][], player: 'X' | 'O'): boolean => {
    for (let i = 0; i < 3; i++) {
        if (board[i].every(cell => cell === player)) return true; 
        if (board.every(row => row[i] === player)) return true; 
    }
    if ([0, 1, 2].every(i => board[i][i] === player)) return true; 
    if ([0, 1, 2].every(i => board[i][2 - i] === player)) return true; 
    return false;
};

const isTTTFull = (board: string[][]): boolean => {
    return board.every(row => row.every(cell => cell !== ' '));
};

export const ttt = async ({ sock, msg, args, fullArgs }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    const sender = msg.key.participant || msg.key.remoteJid!;
    const senderName = msg.pushName || sender.split('@')[0];

    if (args[0]?.toLowerCase() === 'join') {
        if (!tttGames[chatId] || tttGames[chatId].gameOver) {
            return sock.sendMessage(chatId, { text: "No active Tic Tac Toe game. Start one with `.ttt start`." });
        }
        if (tttGames[chatId].players.O) {
            return sock.sendMessage(chatId, { text: "Game already has two players." });
        }
        if (tttGames[chatId].players.X === sender) {
            return sock.sendMessage(chatId, { text: "You are already Player X." });
        }
        tttGames[chatId].players.O = sender;
        tttGames[chatId].playerNames.O = senderName;
        await sock.sendMessage(chatId, { text: `⭕ ${senderName} has joined as Player O. Player ❌ (${tttGames[chatId].playerNames.X}), it's your turn!\n\n${displayTTTBoard(tttGames[chatId].board)}` });
        return;
    }

    if (args[0]?.toLowerCase() === 'start' || !tttGames[chatId] || tttGames[chatId].gameOver) {
        initializeTTT(chatId, sender, senderName);
        await sock.sendMessage(chatId, { text: `Tic Tac Toe game started! ${senderName} is Player ❌. Waiting for Player ⭕ to join with '.ttt join'.\n\n${displayTTTBoard(tttGames[chatId].board)}` });
        return;
    }

    const game = tttGames[chatId];
    if (game.gameOver) {
        return sock.sendMessage(chatId, { text: `Game over! ${game.winner ? `Player ${game.winner === 'X' ? '❌' : '⭕'} (${game.winner === 'X' ? game.playerNames.X : game.playerNames.O}) wins!` : "It's a draw!"} Start a new game with .ttt start` });
    }

    if (!game.players.O) {
        return sock.sendMessage(chatId, { text: "Waiting for Player ⭕ to join. Use `.ttt join`." });
    }
    
    if ((game.currentPlayer === 'X' && sender !== game.players.X) || (game.currentPlayer === 'O' && sender !== game.players.O)) {
        return sock.sendMessage(chatId, { text: "It's not your turn." });
    }

    const move = parseInt(fullArgs);
    if (isNaN(move) || move < 1 || move > 9) {
        return sock.sendMessage(chatId, { text: "Invalid move. Enter a number from 1 to 9 (corresponding to the board cells left-to-right, top-to-bottom)." });
    }

    const row = Math.floor((move - 1) / 3);
    const col = (move - 1) % 3;

    if (game.board[row][col] !== ' ') {
        return sock.sendMessage(chatId, { text: "That cell is already taken. Try again." });
    }

    game.board[row][col] = game.currentPlayer;
    const currentPlayerSymbol = game.currentPlayer === 'X' ? '❌' : '⭕';
    const currentPlayerName = game.currentPlayer === 'X' ? game.playerNames.X : game.playerNames.O;


    if (checkTTTWinner(game.board, game.currentPlayer)) {
        game.gameOver = true;
        game.winner = game.currentPlayer;
        await sock.sendMessage(chatId, { text: `${displayTTTBoard(game.board)}\n🎉 Player ${currentPlayerSymbol} (${currentPlayerName}) wins!` });
    } else if (isTTTFull(game.board)) {
        game.gameOver = true;
        await sock.sendMessage(chatId, { text: `${displayTTTBoard(game.board)}\n🤝 It's a draw!` });
    } else {
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        const nextPlayerSymbol = game.currentPlayer === 'X' ? '❌' : '⭕';
        const nextPlayerName = game.currentPlayer === 'X' ? game.playerNames.X : game.playerNames.O;
        await sock.sendMessage(chatId, { text: `${displayTTTBoard(game.board)}\nPlayer ${nextPlayerSymbol}'s turn (${nextPlayerName})` });
    }
};
ttt.description = "Play Tic Tac Toe. Usage: .ttt start | .ttt join | .ttt <1-9>";
ttt.category = "games_fun";

export const resetttt = async ({ sock, msg }: CommandHandlerParams) => {
    const chatId = msg.key.remoteJid!;
    if (tttGames[chatId]) {
        delete tttGames[chatId];
        await sock.sendMessage(chatId, { text: "Tic Tac Toe game reset." });
    } else {
        await sock.sendMessage(chatId, { text: "No active Tic Tac Toe game to reset." });
    }
};
resetttt.description = "Resets the current Tic Tac Toe game.";
resetttt.category = "games_fun";

// --- Word Chain Game (WCG) ---
export const wcg = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: '🔠 Word Chain Game (WCG) is a complex feature requiring persistent state management (current word, used words, player turn) per chat. It is not yet fully implemented. Placeholder.' });
};
wcg.description = "Play Word Chain Game (placeholder).";
wcg.category = "games_fun";

export const resetwcg = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: 'WCG reset (placeholder).' });
};
resetwcg.description = "Resets the Word Chain Game (placeholder).";
resetwcg.category = "games_fun";

// --- Connect Four ---
export const connect4 = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: '🔵🔴 Connect Four game is not yet implemented. This involves a game board, player turns, and win condition checking.' });
};
connect4.description = "Play Connect Four (placeholder).";
connect4.category = "games_fun";

export const resetc4 = async ({ sock, msg }: CommandHandlerParams) => {
    await sock.sendMessage(msg.key.remoteJid!, { text: 'Connect Four reset (placeholder).' });
};
resetc4.description = "Resets the Connect Four game (placeholder).";
resetc4.category = "games_fun";


// --- Score ---
export const score = async ({ sock, msg }: CommandHandlerParams) => {
    const groupId = msg.key.remoteJid!;
    if (!groupId.endsWith('@g.us')) {
        return sock.sendMessage(groupId, { text: "Score/Rank is typically viewed within a group context." });
    }
    const senderId = msg.key.participant || msg.key.remoteJid!;

    let scoreText = `${commandHeader("Group Activity Score", "🏆")}\n`;
    scoreText += `│ This score is based on message count in this group.\n`;
    
    if (userStats[groupId]) {
        const groupRanks = Object.entries(userStats[groupId])
            .map(([id, data]) => ({ id, count: data.messageCount, name: data.name || id.split('@')[0] }))
            .sort((a, b) => b.count - a.count);

        if (groupRanks.length > 0) {
            scoreText += `│ Top 5 Active Members:\n`;
            const top5 = groupRanks.slice(0, 5);
            const mentions = [];
            top5.forEach((user, index) => {
                scoreText += `│  ${index + 1}. @${user.id.split('@')[0]} (${user.name}): ${user.count} messages\n`;
                mentions.push(user.id);
            });

            const userRank = groupRanks.findIndex(u => u.id === senderId);
            if (userRank !== -1) {
                scoreText += `│\n│ Your Rank: #${userRank + 1} with ${groupRanks[userRank].count} messages.\n`;
            }
            scoreText += commandFooter();
            await sock.sendMessage(groupId, { text: scoreText, mentions: [...new Set(mentions)] });
        } else {
            scoreText += `│ No activity recorded yet in this group.\n` + commandFooter();
            await sock.sendMessage(groupId, { text: scoreText });
        }
    } else {
        scoreText += `│ No activity recorded yet in this group.\n` + commandFooter();
        await sock.sendMessage(groupId, { text: scoreText });
    }
};
score.description = "Displays group activity scores based on message count.";
score.category = "games_fun";


// --- Fun Commands ---
export const joke = async ({ sock, msg }: CommandHandlerParams) => {
    try {
        const response = await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single');
        if (response.data && !response.data.error) {
            let jokeText = `${commandHeader("Joke Time!", "😂")}\n`;
            jokeText += `│ ${response.data.joke}\n`;
            jokeText += commandFooter();
            await sock.sendMessage(msg.key.remoteJid!, { text: jokeText });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: "Couldn't fetch a joke right now, try again later!" });
        }
    } catch (error) {
        console.error("Joke API error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t tell a joke right now.' });
    }
};
joke.description = "Tells a random joke.";
joke.category = "games_fun";

export const advice = async ({ sock, msg }: CommandHandlerParams) => {
    try {
        const response = await axios.get('https://api.adviceslip.com/advice');
        if (response.data && response.data.slip) {
            let adviceText = `${commandHeader("Wise Words", "💡")}\n`;
            adviceText += `│ "${response.data.slip.advice}"\n`;
            adviceText += commandFooter();
            await sock.sendMessage(msg.key.remoteJid!, { text: adviceText });
        } else {
            await sock.sendMessage(msg.key.remoteJid!, { text: "Couldn't fetch advice right now, try again later!" });
        }
    } catch (error) {
        console.error("Advice API error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, I couldn\'t get any advice for you right now.' });
    }
};
advice.description = "Gives a random piece of advice.";
advice.category = "games_fun";

export const meme = async ({ sock, msg }: CommandHandlerParams) => {
    try {
        // Reddit Meme API is often more reliable for SFW memes
        const response = await axios.get('https://meme-api.com/gimme');
        if (response.data && response.data.url && !response.data.nsfw) { // Ensure SFW
            await sock.sendMessage(msg.key.remoteJid!, { image: { url: response.data.url }, caption: response.data.title || '🤣 Here is your meme!' });
        } else {
             // Fallback to imgflip (can be less reliable or have different content mix)
            const imgflipResponse = await axios.get('https://api.imgflip.com/get_memes');
            if (imgflipResponse.data && imgflipResponse.data.success && imgflipResponse.data.data.memes.length > 0) {
                const memes: { url: string; name: string }[] = imgflipResponse.data.data.memes;
                const randomMeme = pickRandom(memes);
                await sock.sendMessage(msg.key.remoteJid!, { image: { url: randomMeme.url }, caption: randomMeme.name || '🤣 Here is your meme!' });
            } else {
                await sock.sendMessage(msg.key.remoteJid!, { text: "Couldn't fetch a meme right now, try again later!" });
            }
        }
    } catch (error) {
        console.error("Meme API error:", error);
        await sock.sendMessage(msg.key.remoteJid!, { text: 'Sorry, all meme sources seem to be unavailable right now.' });
    }
};
meme.description = "Sends a random meme.";
meme.category = "games_fun";

export const rank = async (handlerParams: CommandHandlerParams) => {
    // This now aliases the score command which shows message-based rank.
    await score({ ...handlerParams, command: 'score', args: [], fullArgs: '' });
};
rank.description = "Displays user ranks based on group activity (message count).";
rank.category = "games_fun";

export const roast = async ({ sock, msg, fullArgs }: CommandHandlerParams) => {
    const target = fullArgs || "You";
    const roasts = [
        `${target}, are you a parking ticket? Because you've got 'fine' written all over you.`,
        `Is your name Google? Because you have everything I've been searching for... in the cringe department.`,
        `If ${target} were a spice, they'd be flour.`,
        `${target}, I'm not saying you're stupid, I'm just saying you have bad luck when thinking.`,
        `Are you from Tennessee? Because you're the only ten I see... out of a hundred.`,
        `I'd agree with you ${target}, but then we'd both be wrong.`,
        `Mirrors can't talk. Lucky for you, ${target}, they can't laugh either.`
    ];
    let roastText = `${commandHeader("Roast Session", "🔥")}\n`;
    roastText += `│ ${pickRandom(roasts)}\n`;
    roastText += commandFooter();
    await sock.sendMessage(msg.key.remoteJid!, { text: roastText });
};
roast.description = "Roasts someone (or yourself).";
roast.category = "games_fun";
roast.usage = ".roast [target_name]";

export const quote = async ({ sock, msg }: CommandHandlerParams) => {
    try {
        const response = await axios.get('https://api.quotable.io/random');
        if (response.data && response.data.content && response.data.author) {
            let quoteText = `${commandHeader("Inspirational Quote", "📜")}\n`;
            quoteText += `│ "${response.data.content}"\n`;
            quoteText += `│ - *${response.data.author}*\n`;
            quoteText += commandFooter();
            await sock.sendMessage(msg.key.remoteJid!, { text: quoteText });
        } else {
             // Fallback quote
            const fallbackQuotes = [
                { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { content: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
                { content: "The mind is everything. What you think you become.", author: "Buddha" }
            ];
            const randomFallback = pickRandom(fallbackQuotes);
            let quoteText = `${commandHeader("Inspirational Quote", "📜")}\n`;
            quoteText += `│ "${randomFallback.content}"\n`;
            quoteText += `│ - *${randomFallback.author}*\n`;
            quoteText += `│ (Source: Fallback)\n`;
            quoteText += commandFooter();
            await sock.sendMessage(msg.key.remoteJid!, { text: quoteText });
        }
    } catch (error) {
        console.error("Quote API error:", error);
         const fallbackQuotes = [
            { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { content: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" }
        ];
        const randomFallback = pickRandom(fallbackQuotes);
        let quoteText = `${commandHeader("Inspirational Quote", "📜")}\n`;
        quoteText += `│ "${randomFallback.content}"\n`;
        quoteText += `│ - *${randomFallback.author}*\n`;
        quoteText += `│ (Source: Fallback due to API error)\n`;
        quoteText += commandFooter();
        await sock.sendMessage(msg.key.remoteJid!, { text: quoteText });
    }
};
quote.description = "Sends a random quote.";
quote.category = "games_fun";
