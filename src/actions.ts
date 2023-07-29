import { Message } from "discord.js";
import { scrapeMercadoLibre } from "./scrape";

export function okayuActions(prefix: string, message: Message) {
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

					// const buttonNext = new MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY");
					// const buttonPrev = new MessageButton().setCustomId("prev").setLabel("Prev").setStyle("SECONDARY");
					// const row = new MessageActionRow().addComponents(buttonPrev, buttonNext);

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
								timestamp: new Date().toISOString(),
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
						timestamp: new Date().toISOString(),
					};

					// Write csv file with the data
					const csvHeader = "title,price,link";
					const csvData = titles.map((title, i) => `${title.replace(",", ".")},${numericPrices[i]},${links[i]}`).join("\n");

					await message.reply({ files: [{ attachment: Buffer.from(csvHeader + "\n" + csvData, "utf8"), name: "products.csv" }] });
					await message.reply({ embeds: allEmbeds[0], components: [] });
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