import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Embed, EmbedBuilder, InteractionResponse, Message, MessageComponentBuilder } from "discord.js";
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

					const EMBED_LIMIT = 10;
					const allEmbeds: EmbedBuilder[][] = [];
					let sum = 0,
						highest = 0,
						lowest = Infinity;
					for (let i = 0; i < Math.floor(titles.length / EMBED_LIMIT); ++i) {
						const embeds: EmbedBuilder[] = [];
						for (let j = i * EMBED_LIMIT; j < EMBED_LIMIT * (i + 1); ++j) {
							const price = parseFloat(numericPrices[j]);
							sum += price;
							if (price > highest) highest = price;
							if (price < lowest) lowest = price;
							const embed = new EmbedBuilder()
								.setColor(0x0099ff)
								.setTitle(titles[j])
								.setURL(links[j])
								.setThumbnail(images[j])
								.addFields({
									name: "Precio",
									value: prices[j] + " (" + price + ")",
									inline: false,
								})
								.setFooter({ text: "Mogu mogu~" })
								.setTimestamp(new Date());

							embeds.push(embed);
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

					const row: any = new ActionRowBuilder().addComponents(
						new ButtonBuilder().setCustomId("first").setLabel("First").setStyle(ButtonStyle.Secondary),
						new ButtonBuilder().setCustomId("previous").setLabel("Previous").setStyle(ButtonStyle.Primary),
						new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Primary),
						new ButtonBuilder().setCustomId("last").setLabel("Last").setStyle(ButtonStyle.Danger)
					);

					let page = 0;

					await message.reply({ files: [{ attachment: Buffer.from(csvHeader + "\n" + csvData, "utf8"), name: "products.csv" }] });
					const response: Message<boolean> | InteractionResponse<boolean> = await message.reply({ embeds: allEmbeds[page], components: [row] });
					await message.reply({ embeds: [dataEmbed] });

					async function acceptButtonInteraction(response: Message<boolean> | InteractionResponse<boolean>) {
						try {
							const confirmation = await response.awaitMessageComponent({ time: 60000 });

							switch (confirmation.customId) {
								case "first":
									page = 0;
									break;
								case "previous":
									page = page === 0 ? allEmbeds.length - 1 : page - 1;
									break;
								case "next":
									page = (page + 1) % allEmbeds.length;
									break;
								case "last":
									page = allEmbeds.length - 1;
									break;
							}

							acceptButtonInteraction(await confirmation.update({ embeds: allEmbeds[page] }));
						} catch (e) {
							await response.edit({ content: "Confirmation not received within 1 minute, cancelling", components: [] });
						}
					}

					acceptButtonInteraction(response);
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
