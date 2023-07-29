import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import { config } from "dotenv";
import { readFile } from "fs";
import { okayuActions } from "./actions";

const prefix = "mg";
var song: string[] = [];

readFile("susser_tod.txt", (err, data) => {
	if (err) throw err;

	song = data
		.toString()
		.split("\n")
		.filter((line) => line)
		.map((line) => line.toLowerCase().trim());
});

const client = new Client({ intents: GatewayIntentBits.Guilds + GatewayIntentBits.MessageContent + GatewayIntentBits.GuildMessages + GatewayIntentBits.GuildMessageReactions + GatewayIntentBits.GuildMessageTyping });

client.on(Events.ClientReady, () => console.log("Okayuu~"));

client.on(Events.MessageCreate, (message: Message) => {
	console.log(message);
	if (message.author.bot) return;

	const text = message.content.toLowerCase();

	switch (text) {
		case "mogu mogu":
			message.reply("```yaml\n\nOkayuuu~```").then(() => message.react("❤️"));
			break;
		case "korone":
			message.reply("Suki~");
			break;
		case "lyrics":
			message.reply(song.join("\n"));
			break;
		case "prefix":
		case "command":
			message.reply(prefix + " desu~");
			break;
		default:
			if (text.startsWith(prefix)) okayuActions(prefix, message);

			const lyrics = song.indexOf(text);
			if (lyrics != -1) message.reply(song[lyrics + 1]);

			if (text.includes("okayu")) message.reply(Math.random() > 0.5 ? "Haai~" : "Mmh?");
			if (text.includes("susser" || "tod")) message.reply("https://www.youtube.com/watch?v=6kguaGI7aZg");
			if (text.includes("oyasumi")) message.reply("Oyasumii~");
			break;
	}
});

config();
client.login(process.env.BOT_TOKEN);
console.log("Mogu moguu...");
