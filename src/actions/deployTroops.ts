import {assign} from "xstate";
import {Context, SelectTroopsEvent, Territory} from "../config/types.ts";

export const deployTroops = assign({
	ownership: ({context, event}: {context: Context; event: SelectTroopsEvent}) => {
		const territory = event?.territory ?? context.fromTerritory;
		const ownership = {...context.ownership};
		ownership[territory as Territory].troops += event.troops;
		console.log(">> ownership", ownership);
		return ownership;
	},
	players: ({context, event}: {context: Context; event: SelectTroopsEvent}) => {
		const {currentPlayer, players} = context;
		const troops = players[currentPlayer].troopsToDeploy;
		players[currentPlayer].troopsToDeploy = troops - event.troops;
		console.log(">> players", players);
		return players;
	}
});
