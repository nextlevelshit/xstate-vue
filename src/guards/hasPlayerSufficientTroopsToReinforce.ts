import {RiskGuard, SelectTroopsEvent} from "../config/types.ts";

export const hasPlayerSufficientTroopsToReinforce = ({context, event}: RiskGuard<SelectTroopsEvent>) => {
	const isValid = context.selectedTerritory && event.troops > 0 && context.ownership[context.selectedTerritory].troops > event.troops;
	console.log(">> hasPlayerSufficientTroopsToReinforce", isValid);
	return isValid;
}