import {Territory} from "../config/types.ts";
import {deepFirstSearch} from "./deepFirstSearch.ts";

/**
 * Returns a map of territories and their connected territories.
 * @param playerTerritories
 * @param allBorders
 */
export const getConnectedTerritories = (playerTerritories: Territory[], allBorders: [Territory, Territory[]][]): Map<Territory, Territory[]> => {
	const connectedTerritoriesMap = new Map<Territory, Territory[]>();

	playerTerritories.forEach(territory => {
		const visited = new Set<Territory>();
		const connectedTerritories = deepFirstSearch(territory, playerTerritories, allBorders, visited);
		connectedTerritoriesMap.set(territory, connectedTerritories);
	});

	return connectedTerritoriesMap;
}

