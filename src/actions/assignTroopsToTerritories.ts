import { assign } from "xstate";
import { Context, TerritoryOwnership, Territory } from "../config/types.ts";
import { initialTroopsPerPlayer } from "../config/constants.ts";

export const assignTroopsToTerritories = assign({
	ownership: ({ context }: { context: Context }) => {
		const ownership: TerritoryOwnership = { ...context.ownership };
		for (let i = 0; i < context.players.length; i++) {
			const territories = Object.keys(ownership).filter(
				(territory) => ownership[territory as Territory].player === i
			) as Territory[];
			const troopsToDeploy = initialTroopsPerPlayer - territories.length;
			territories.forEach((territory) => {
				ownership[territory].troops = 1;
			});
			for (let j = 0; j < troopsToDeploy; j++) {
				// randomly deploy troops to owned territories
				const territoryIndex = Math.floor(Math.random() * territories.length);
				const territory = territories[territoryIndex];
				ownership[territory].troops++;
			}
		}
		console.log(">> ownership", ownership);
		return ownership;
	}
});
