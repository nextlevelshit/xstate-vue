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
		console.log(">> ownership", ownership);
		return ownership;
	}
});
