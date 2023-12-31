export async function scrapeMercadoLibre(product: string) {
	const baseUrl = "https://listado.mercadolibre.com.ve/";
	product = product.replace(" ", "-").toLowerCase();

	return fetch(baseUrl + product).then(async function (response) {
		const html = await response.text();

		const titleRegex = /class="ui-search-item__title shops__item-title">(.+?)<\/h2>/g;
		const titles = html.match(titleRegex)?.map(function (match) {
			return match.replace('class="ui-search-item__title shops__item-title">', "").replace("</h2>", "");
		});

		const numericPrices: string[] = [];
		const priceRegex = /class="andes-visually-hidden">(.+?)<\/span>/g;
		const textPrices = html.match(priceRegex)?.map(function (match) {
			const textPrice = match.replace('class="andes-visually-hidden">', "").replace("</span>", "").replace("Antes: ", "");
			const words = textPrice.split(" ");
			let amount = parseInt(words[0]);
			if (textPrice.includes("centavos") || textPrice.includes("centavo")) {
				amount += 0.01 * parseInt(words[words.length - 2]); 
			}
			numericPrices.push(amount + "");
			return textPrice;
		});

		const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
		const imgs = html.match(imgRegex)?.map(function (match) {
			return match.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, "$1");
		});
		imgs?.shift();

		const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/g;
		let links = html.match(linkRegex)?.map(function (match) {
			return match.replace(/<a[^>]*href="([^"]*)"[^>]*>/g, "$1");
		});
		// And now only the links that go to the product page
		links = links?.filter((link) => link.startsWith("https://articulo.mercadolibre.com.ve/"));
		links = links?.map((link) => link.replace(/#.*$/, ""));

		return [titles, textPrices, numericPrices, imgs, links];
	});
}

// scrapeMercadoLibre("Portaminas delguard").then(function (data) {
// 	console.log(data);
// });
