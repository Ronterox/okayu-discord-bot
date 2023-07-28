import { Client, Intents, Message, MessageActionRow, MessageButton } from "discord.js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { scrapeMercadoLibre } from "./scrape";

const prefix = "mg";

const file = readFileSync("susser_tod.txt", "utf8");

const song = file
	.split("\n")
	.filter((line) => line)
	.map((line) => line.toLowerCase().trim());

const client = new Client({ intents: Intents.FLAGS.GUILDS + Intents.FLAGS.GUILD_MESSAGES + Intents.FLAGS.GUILD_MESSAGE_REACTIONS + Intents.FLAGS.GUILD_MESSAGE_TYPING });

function okayuActions(message: Message) {
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift()?.toLowerCase();

	switch (command) {
		case "mogu":
			message.reply("https://www.youtube.com/watch?v=lGixJxddNbg&t=56s");
			break;
		case "buy":
			scrapeMercadoLibre(args.join(" "))
				.then(async function (data) {
					const [titles, prices, numericPrices, images, links] = data;

					if (!titles || !prices || !numericPrices || !images || !links) {
						message.reply("Nanimonai desu~");
						return;
					}

					const buttonNext = new MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY");
					const buttonPrev = new MessageButton().setCustomId("prev").setLabel("Prev").setStyle("SECONDARY");
					const row = new MessageActionRow().addComponents(buttonPrev, buttonNext);

					const EMBED_LIMIT = 10;
					const allEmbeds = [];
					let sum = 0,
						highest = 0,
						lowest = Infinity;
					for (let i = 0; i < Math.floor(titles.length / EMBED_LIMIT); ++i) {
						const embeds = [];
						for (let j = i * EMBED_LIMIT; j < EMBED_LIMIT * (i + 1); ++j) {
							const price = parseFloat(numericPrices[j]);
							sum += price;
							if (price > highest) highest = price;
							if (price < lowest) lowest = price;
							embeds.push({
								color: 0x0099ff,
								title: titles[j],
								url: links[j],
								thumbnail: { url: images[j] },
								fields: [
									{
										name: "Precio",
										value: prices[j] + " (" + price + ")",
										inline: false,
									},
								],
								footer: { text: "Mogu mogu~" },
								timestamp: new Date(),
							});
						}
						allEmbeds.push(embeds);
					}

					const dataEmbed = {
						color: 0x0099ff,
						title: args.join(" "),
						url: "https://listado.mercadolibre.com.ve/" + args.join("-").toLowerCase(),
						fields: [
                            {
                                name: "Cantidad de productos",
                                value: titles.length + "",
                                inline: false,
                            },
							{
								name: "Precio promedio",
								value: sum / numericPrices.length + "",
								inline: false,
							},
							{
								name: "Precio mínimo",
								value: lowest + "",
								inline: true,
							},
							{
								name: "Precio máximo",
								value: highest + "",
								inline: true,
							},
						],
						footer: { text: "Mogu mogu~" },
                        timestamp: new Date(),
					};

					// Write csv file with the data
					const csvHeader = "title,price,link";
					const csvData = titles.map((title, i) => `${title.replace(",", ".")},${numericPrices[i]},${links[i]}`).join("\n");

					await message.reply({ files: [{ attachment: Buffer.from(csvHeader + "\n" + csvData, "utf8"), name: "products.csv" }] });
					await message.reply({ embeds: allEmbeds[0], components: [row] });
					await message.reply({ embeds: [dataEmbed] });
				})
				.catch(function (error) {
					message.reply("Nanimonai desu~");
					console.log(error);
				});
			break;
		default:
			message.reply(`Arere~ ${message.content} te nani~?`);
			break;
	}
}

client.on("ready", () => {
	console.log("Okayuu~");
});

client.on("messageCreate", (message: Message) => {
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
			message.reply(file);
			break;
		case "prefix":
		case "command":
			message.reply(prefix + " desu~");
			break;
		default:
			if (text.startsWith(prefix)) okayuActions(message);

			const lyrics = song.indexOf(text);
			if (lyrics != -1) message.reply(song[lyrics + 1]);

			if (text.includes("okayu")) message.reply(Math.round(Math.random()) == 0 ? "Haai~" : "Mmh?");
			if (text.includes("susser" || "tod")) message.reply("https://www.youtube.com/watch?v=6kguaGI7aZg");
			if (text.includes("oyasumi")) message.reply("Oyasumii~");
			break;
	}
});

config();

client.login(process.env.BOT_TOKEN);

console.log("Mogu moguu...");
