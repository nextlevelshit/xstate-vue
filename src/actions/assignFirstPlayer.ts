import {assign} from "xstate";
import {Context} from "../config/types.ts";

export const assignFirstPlayer = assign({
	currentPlayer: ({context}: {context: Context}) => {
		const player = Math.floor(Math.random() * context.players.length);
		console.log(">> currentPlayer", player);
		return player;
	}
});
