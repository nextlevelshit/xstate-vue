import {Context} from "../config/types.ts";

export const collectCard = ({context}: {context: Context}) => {
	const players = context.players;
	const leftCards = context.leftCards.slice().sort(() => Math.random() - 0.5);
	if (leftCards.length === 0) {
		console.log("No cards left on the stack");
		return;
	}
	const newCard = leftCards.pop()!;
	context.leftCards = leftCards;
	console.log(">> leftCards", leftCards);
	console.log(">> players", players);
	players[context.currentPlayer].cards.push(newCard);
	console.log(">> players[context.currentPlayer]", players[context.currentPlayer]);
};