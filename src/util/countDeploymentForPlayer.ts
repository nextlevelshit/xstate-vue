import {TerritoryOwnership, Territory} from "../config/types.ts";

export const countDeploymentForPlayer = (player: number, ownership: TerritoryOwnership): number => {
	let deployment = 0;
	for (const territory in Object.keys(ownership) as Territory[]) {
		if (ownership[territory as Territory].player === player) {
			deployment += ownership[territory as Territory].troops;
		}
	}
	return Math.max(3, Math.floor(deployment / 3));
}