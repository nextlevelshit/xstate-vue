import { TerritoryOwnership, Territory } from "../config/types.ts";
import { continentBonuses } from "../config/constants.ts";

export const territoriesOwned = (player: number, ownership: TerritoryOwnership) => {
	const territories = Object.keys({ ...ownership });

	return territories.reduce((acc, territory) => {
		if (player === ownership[territory as Territory].player) {
			return acc + 1;
		}
		return acc;
	}, 0);
};
export const countDeploymentForPlayer = (player: number, ownership: TerritoryOwnership): number => {
	const fromTerritories = Math.max(3, Math.floor(territoriesOwned(player, ownership) / 3));
	const fromContinents = continentBonuses.reduce((acc, continent) => {
		if (continent.territories.every((territory) => ownership[territory].player === player)) {
			return acc + continent.bonus;
		}
		return acc;
	}, 0);
	return fromTerritories + fromContinents;
};
