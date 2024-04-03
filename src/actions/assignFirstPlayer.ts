import {assign} from "xstate";
import {players} from "../config/constants.ts";

export const assignFirstPlayer = assign({
	currentPlayer: () => {
		const player = Math.floor(Math.random() * players);
		console.log(">> currentPlayer", player);
		return player;
	}
});
