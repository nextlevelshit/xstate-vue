import {Context} from "../config/types.ts";

export const tradeCards = ({context}: {context: Context}) => {
	const players = {...context.players};
	console.log("players[context.currentPlayer].cards", players[context.currentPlayer].cards);
	console.log("players[context.currentPlayer].troopsToDeploy", players[context.currentPlayer].troopsToDeploy);

	const stars = players[context.currentPlayer].cards.reduce((acc, cur) => (acc + cur.stars), 0);
	const tradedStars = Math.min(stars, 10);
	console.log("tradedCards", tradedStars);
	const tradedTroops = tradedStars === 10 ? tradedStars * 2 + tradedStars : (tradedStars >= 7 ? tradedStars * 2 + 1 : (tradedStars >= 9 ? tradedStars * 2 + 3 : tradedStars * 2));
	console.log("tradedTroops", tradedTroops);
	players[context.currentPlayer].troopsToDeploy += tradedTroops;
	let i = 0;
	while (tradedStars && i < tradedStars) {
		const card = players[context.currentPlayer].cards.pop();
		card && context.leftCards.push(card);
		i += card?.stars || 0;
	}
	console.log(">> players[context.currentPlayer].cards", players[context.currentPlayer].cards);
	console.log(">> players[context.currentPlayer].troopsToDeploy", players[context.currentPlayer].troopsToDeploy);
};