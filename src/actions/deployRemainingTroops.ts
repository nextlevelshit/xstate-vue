import {assign} from "xstate";
import {Context, Territory} from "../config/types.ts";

export const deployRemainingTroops = assign({
	ownership: ({context}: {context: Context}) => {
		const ownership = {...context.ownership};
		const troopsToDeploy = context.players[context.currentPlayer].troopsToDeploy;
		const territories = Object.keys(ownership).filter(
			(territory) => ownership[territory as Territory].player === context.currentPlayer
		) as Territory[];
		for (let i = 0; i < troopsToDeploy; i++) {
			const territoryIndex = Math.floor(Math.random() * territories.length);
			const territory = territories[territoryIndex];
			ownership[territory].troops++;
		}
		// debugger;
		console.log(">> ownership", ownership);
		return ownership;
	},
	players: ({context}: {context: Context}) => {
		const players = {...context.players};
		// players[context.currentPlayer].troopsToDeploy = 0;
		console.log(">> players[currentPlayer]", players[context.currentPlayer]);
		return players;
	}
});
