import {RiskGuard, SelectTroopsEvent} from "../config/types.ts";

export const hasPlayerSufficientTroopsToDeploy = ({context, event}: RiskGuard<SelectTroopsEvent>) => {
	const isValid = context.players[context.currentPlayer].troopsToDeploy >= event.troops;
	console.log(">> hasPlayerSufficientTroopsToDeploy", isValid);
	return isValid;
}