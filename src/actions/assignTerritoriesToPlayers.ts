import { assign } from "xstate";
import { Context, TerritoryOwnership } from "../config/types.ts";

export const assignTerritoriesToPlayers = assign({
	ownership: ({ context }: { context: Context }) => {
		const { allTerritories, players } = context;
		const ownership = {} as TerritoryOwnership;

		// Copy territories array and shuffle it
		const shuffledTerritories = allTerritories.slice().sort(() => Math.random() - 0.5);

		// Calculate territories per player
		const territoriesPerPlayer = Math.floor(allTerritories.length / players.length);

		// Initialize player territories count
		const playerTerritoriesCount = new Array(players.length).fill(0);

		// Assign territories to players
		shuffledTerritories.forEach((territory, index) => {
			const playerIndex = index % players.length;
			ownership[territory] = { player: playerIndex, troops: 0 };
			playerTerritoriesCount[playerIndex]++;
		});

		// Redistribute remaining territories to players
		let remainingTerritories = allTerritories.length - territoriesPerPlayer * players.length;
		let playerIndex = 0;
		while (remainingTerritories > 0) {
			ownership[shuffledTerritories[territoriesPerPlayer * players.length + playerIndex]].player = playerIndex;
			playerTerritoriesCount[playerIndex]++;
			remainingTerritories--;
			playerIndex = (playerIndex + 1) % players.length;
		}
		console.log(">> ownership", ownership);

		return ownership;
	},
	players: ({ context }: { context: Context }) => {
		const players = [...context.players];
		console.log(">> players", players);
		return players;
	}
});
