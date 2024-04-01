import {Context, SelectTerritoryEvent} from "../config/types.ts";

export const isTerritoryConnected = ({context, event} : { context: Context, event: SelectTerritoryEvent}) => {
	const isValid = event.territory && context.potentialTargetTerritories.includes(event.territory);
	console.log(">> isTerritoryConnected", isValid);
	return isValid;
}