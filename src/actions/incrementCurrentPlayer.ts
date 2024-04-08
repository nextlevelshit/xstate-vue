import {assign} from "xstate";
import {Context, RiskEvent} from "../config/types.ts";
import type {EventObject} from "xstate";

export const incrementCurrentPlayer = assign<Context, RiskEvent, any, EventObject, never>({
	currentPlayer: ({context}) => {
		console.log(">> currentPlayer", context.currentPlayer);
		// check if player has territories left
		const countTerritories = (p: number) => Object.values(context.ownership).filter(({player}) => player === p).length;

		for (let i = 1; i < context.players.length; i++) {
			const player = (context.currentPlayer + i) % context.players.length;
			if (countTerritories(player) > 0) {
				return player;
			}
		}
		return -1;
	}
});
