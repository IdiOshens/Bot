break;
case "ytmp3": {
    if (!text) {
        return replyviex("⚠️ Please enter the song title you want to search for!");
    }
    try {
        await DinzBotz.sendMessage(m.chat, { react: { text: "🔎", key: m.key } });
        let url = `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(text)}`;
        let response = await fetch(url);
        let json = await response.json();
        if (!json || json.status !== 200 || !json.result.status) {
            await DinzBotz.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            return replyviex("❌ Song not found or failed to download!");
        }
        let result = {
            title: json.result.metadata.title,
            author: json.result.metadata.author.name,
            duration: json.result.metadata.timestamp,
            views: json.result.metadata.views,
            link: json.result.metadata.url,
            thumb: json.result.metadata.thumbnail,
            audio: json.result.download.url
        };
        let caption = `*YouTube MP3 Play*\n\n`;
        caption += `*Title:* ${result.title}\n`;
        caption += `*Artist:* ${result.author}\n`;
        caption += `*Duration:* ${result.duration}\n`;
        caption += `*Views:* ${result.views}\n`;
        caption += `*Link:* [YouTube](${result.link})\n\n`;
        caption += `> PLEASE WAIT, SENDING MUSIC`;
        await DinzBotz.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        await DinzBotz.sendMessage(m.chat, { image: { url: result.thumb }, caption }, { quoted: m });
        await DinzBotz.sendMessage(m.chat, { audio: { url: result.audio }, mimetype: "audio/mp4" }, { quoted: m });
    } catch (error) {
        console.error("❌ Error:", error);
        return replyviex("❌ An error occurred while retrieving song data.");
    }
}