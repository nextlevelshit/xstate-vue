import {RiskGuard, SelectTroopsEvent} from "../config/types.ts";

export const hasPlayerSufficientTroopsToReinforce = ({context, event}: RiskGuard<SelectTroopsEvent>) => {
	const isValid = context.fromTerritory && event.troops > 0 && context.ownership[context.fromTerritory].troops > event.troops;
	console.log(">> hasPlayerSufficientTroopsToReinforce", isValid);
	return isValid;
}