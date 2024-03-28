import {TerritoryOwnership, Territory} from "../config/types.ts";

export const territoriesOwned = (player: number, ownership: TerritoryOwnership) => {
	const territories = Object.keys({...ownership});

	return territories.reduce((acc, territory) => {
		if (player === ownership[territory as Territory].player) {
			return acc + 1;
		}
		return acc;
	}, 0);
}
export const countDeploymentForPlayer = (player: number, ownership: TerritoryOwnership): number => {
	return Math.max(3, Math.floor(territoriesOwned(player, ownership) / 3));
}