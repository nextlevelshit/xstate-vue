import {RiskGuard, SelectTroopsEvent} from "../config/types.ts";

export const hasAnyTroopsToDeploy = ({context}: RiskGuard<SelectTroopsEvent>) => {
	const isValid = context.players[context.currentPlayer].troopsToDeploy > 0;
	console.log(">> hasAnyTroopsToDeploy", isValid);
	return isValid;
};
