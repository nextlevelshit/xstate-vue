import {Territory} from "../config/types.ts";

/**
 * Depth-first search algorithm to find all connected territories of a player.
 * @param territory - The territory to start the search from
 * @param playerTerritories - The territories owned by the player
 * @param allBorders - The borders of all territories
 * @param visited - The set of visited territories
 */
export const deepFirstSearch = (
	territory: Territory,
	playerTerritories: Territory[],
	allBorders: [Territory, Territory[]][],
	visited: Set<Territory>
): Territory[] => {
	visited.add(territory);

	const bordersMap = new Map(allBorders);
	const connectedTerritories = bordersMap.get(territory);

	if (connectedTerritories) {
		for (const connectedTerritory of connectedTerritories) {
			if (playerTerritories.includes(connectedTerritory) && !visited.has(connectedTerritory)) {
				deepFirstSearch(connectedTerritory, playerTerritories, allBorders, visited);
			}
		}
	}

	return Array.from(visited);
};
