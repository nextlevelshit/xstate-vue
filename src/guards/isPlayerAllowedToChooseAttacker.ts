import {RiskGuard, SelectTerritoryEvent} from "../config/types.ts";

export const isPlayerAllowedToChooseAttacker = ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
	const territory = event.territory;
	const owner = context.ownership[territory];
	const isValid = owner && owner.player === context.currentPlayer && owner.troops >= 2;
	console.log(">> isPlayerAllowedToChooseAttacker", isValid);
	return isValid;
}