import { assign } from "xstate";
import { Context } from "../config/types.ts";
import { countDeploymentForPlayer } from "../util/countDeploymentForPlayer.ts";

export const assignTroopsToDeploy = assign({
	players: ({ context }: { context: Context }) => {
		const players = [...context.players];
		players[context.currentPlayer].troopsToDeploy = countDeploymentForPlayer(context.currentPlayer, context.ownership);
		console.log(">> players", players);
		return players;
	}
});
