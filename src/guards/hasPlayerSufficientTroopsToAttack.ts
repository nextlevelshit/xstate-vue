import {RiskGuard, SelectTroopsEvent, Territory} from "../config/types.ts";

export const hasPlayerSufficientTroopsToAttack = ({context, event}: RiskGuard<SelectTroopsEvent>) => {
	const isValid = (event.troops > 0 && event.troops <= 3 && context.fromTerritory && context.ownership[context.fromTerritory].troops > event.troops && context.ownership[context.fromTerritory].player !== context.ownership[context.toTerritory as Territory].player) ?? false
	console.log(">> hasPlayerSufficientTroopsToAttack", isValid);
	return isValid;
}