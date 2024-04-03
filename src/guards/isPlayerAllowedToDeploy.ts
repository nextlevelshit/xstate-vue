import { RiskGuard, SelectTerritoryEvent } from "../config/types.ts";

export const isPlayerAllowedToDeploy = ({ context, event }: RiskGuard<SelectTerritoryEvent>) => {
	const territory = event?.territory;
	const owner = context.ownership[territory];
	const isValid = (owner && owner.player === context.currentPlayer) ?? false;
	console.log(">> isPlayerAllowedToDeploy", isValid);
	return isValid;
};
