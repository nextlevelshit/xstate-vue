import {Context} from "../config/types.ts";

export const collectCard = ({context}: {context: Context}) => {
	const players = {...context.players};
	const leftCards = context.leftCards.slice().sort(() => Math.random() - 0.5);
	const newCard = leftCards.splice(0, 1)[0];
	if (!newCard) {
		throw new Error("Card could not be assigned to player");
	}
	console.log(">> leftCards", leftCards);
	console.log(">> players", players);
	players[context.currentPlayer].cards.push(newCard);
	console.log(">> players[context.currentPlayer]", players[context.currentPlayer]);
	return {...context, players, leftCards};
};