import {RiskGuard, SelectTerritoryEvent} from "../config/types.ts";

export const isPlayerAllowedToAttack = ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
	const attackerTerritory = context.fromTerritory;
	const targetTerritory = event.territory;
	const ownership = context.ownership;
	const currentPlayer = context.currentPlayer;
	const isValid =
		(attackerTerritory &&
			new Map(context.allBorders).get(attackerTerritory)?.includes(targetTerritory) &&
			ownership[targetTerritory].player !== currentPlayer) ??
		false;
	console.log(">> isPlayerAllowedToAttack", isValid);
	return isValid;
};
