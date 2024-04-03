import { assign } from "xstate"
import { Context } from "../config/types.ts"

export const incrementCurrentPlayer = assign({
	currentPlayer: ({ context }: { context: Context }) => {
		console.log(">> currentPlayer", context.currentPlayer);
		// check if player has territories left
		const countTerritories = (p: number) => Object.values(context.ownership).filter(({ player }) => player === p).length;

		for (let i = 1; i < context.players.length; i++) {
			const player = (context.currentPlayer + i) % context.players.length;
			if (countTerritories(player) > 0) {
				return player;
			}
		}
		return -1;
	}
})