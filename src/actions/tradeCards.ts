import {Context} from "../config/types.ts";

export const tradeCards = ({context}: {context: Context}) => {
	const players = {...context.players};
	console.log("players[context.currentPlayer].cards", players[context.currentPlayer].cards);
	console.log("players[context.currentPlayer].troopsToDeploy", players[context.currentPlayer].troopsToDeploy);

	const stars = players[context.currentPlayer].cards.reduce((acc, cur) => (acc + cur.stars), 0);
	const tardedStars = Math.min(stars, 10);
	console.log(">> tradedCards", tardedStars);
	let i = 0;
	while (tardedStars && i < tardedStars) {
		const stars = players[context.currentPlayer].cards.pop()?.stars;
		i += stars || 0;
	}
	console.log("players[context.currentPlayer].cards", players[context.currentPlayer].cards);
	console.log("players[context.currentPlayer].troopsToDeploy", players[context.currentPlayer].troopsToDeploy);
	players[context.currentPlayer].troopsToDeploy += Math.floor(tardedStars + (tardedStars * tardedStars) * 0.5);
	return {...context, players};
};