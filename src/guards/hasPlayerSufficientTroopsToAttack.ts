import {RiskGuard, SelectTroopsEvent, Territory} from "../config/types.ts";

export const hasPlayerSufficientTroopsToAttack = ({context, event}: RiskGuard<SelectTroopsEvent>) => {
	const isValid = (event.troops > 0 && event.troops <= 3 && context.attacker && context.ownership[context.attacker].troops > event.troops && context.ownership[context.attacker].player !== context.ownership[context.target as Territory].player) ?? false
	console.log(">> hasPlayerSufficientTroopsToAttack", isValid);
	return isValid;
}