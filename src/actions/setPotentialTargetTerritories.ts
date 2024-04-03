import { assign } from "xstate";
import { Context, SelectTerritoryEvent, Territory } from "../config/types.ts";
import { getConnectedTerritories } from "../util/getConnectedTerritories.ts";

export const setPotentialTargetTerritories = assign({
	potentialTargetTerritories: ({ context, event }: { context: Context; event: SelectTerritoryEvent }) => {
		const ownedTerritories = Object.keys(context.ownership).filter((territory) => {
			return context.ownership[territory as Territory].player === context.currentPlayer;
		}) as Territory[];
		const connectedTerritories = getConnectedTerritories(ownedTerritories, context.allBorders);
		const potentialTargetTerritories = connectedTerritories.get(event.territory) ?? [];
		// Remove event.territory from potentialTargets
		const index = potentialTargetTerritories.indexOf(event.territory);
		if (index > -1) {
			potentialTargetTerritories.splice(index, 1);
		}
		console.log(">> potentialTargetTerritories", potentialTargetTerritories);
		return potentialTargetTerritories;
	}
});
