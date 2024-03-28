import {assign, AnyEventObject, setup} from 'xstate';
import {Territory, TerritoryOwnership, Player} from "../config/types.ts";
import {players, allBorders, allTerritories, initialTroopsPerPlayer} from "../config/constants.ts";
import {countDeploymentForPlayer} from "../util/countDeploymentForPlayer.ts";

export interface Context {
	currentPlayer: number;
	ownership: TerritoryOwnership;
	selectedTerritory: Territory | null;
	attacker: Territory | null;
	target: Territory | null;
	allBorders: [Territory, Territory[]][];
	allTerritories: Territory[];
	players: Player[];
}

interface SelectTerritoryEvent extends AnyEventObject {
	type: "TERRITORY_CLICKED";
	territory: Territory;
}

interface DeployTroopsEvent extends AnyEventObject {
	type: "DEPLOY";
	territory?: Territory;
	troops: number;
}

export enum RiskEventType {
	ASSIGN_FIRST_PLAYER = "ASSIGN_FIRST_PLAYER",
	ASSIGN_TERRITORIES = "ASSIGN_TERRITORIES",
	ASSIGN_TROOPS = "ASSIGN_TROOPS",
	START_GAME = "START_GAME",
	TERRITORY_CLICKED = "TERRITORY_CLICKED",
	END_TURN = "END_TURN",
	RESOLVE = "RESOLVE",
	GAME_OVER = "GAME_OVER",
	DEPLOY_TROOPS = "DEPLOY_TROOPS"
}

export type RiskEvent = SelectTerritoryEvent | DeployTroopsEvent | { type: RiskEventType};

export type RiskGuard<T> = {
	context: Context;
	event: T;
}

const riskMachine = setup<Context, RiskEvent>({
	// types: {
	// 	context: {} as Context,
	// 	events: {} as MachineEvent
	// },
	actions: {
		setAttacker: assign({
			attacker: ({event}) => event.territory,
		}),
		setTarget: assign({
			target: ({event}) => event.territory,
		}),
		ignoreClick: ({event}: { event: SelectTerritoryEvent }) => {
			console.log('Not allowed to select territory', event.territory);
		},
		startCombatMode: ({context}: { context: Context }) => {
			console.log('Attacking', context.attacker, 'from', context.target);
		},
		assignFirstPlayer: assign({
			currentPlayer: () => {
				const player = Math.floor(Math.random() * players);
				console.log(">> currentPlayer", player);
				return player;
			},
		}),
		assignTerritoriesToPlayers: assign({
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
				// debugger;
				console.log(">> players", players);
				// players[context.currentPlayer].territories = Object.values(context.ownership).filter(({ player }) => player === context.currentPlayer).length;
				return players;
			}
		}),
		deployTroops: assign({
			ownership: ({context, event}: { context: Context, event: DeployTroopsEvent }) => {
				debugger;
				const {territory, troops} = event;
				const ownership = {...context.ownership};
				ownership[territory as Territory].troops += troops;
				console.log(">> ownership", ownership);
				return ownership;
			},
		}),
		assignTroopsToDeploy: assign({
			players: ({context}: { context: Context }) => {
				const players = [...context.players];
				players[context.currentPlayer].troopsToDeploy = countDeploymentForPlayer(context.currentPlayer, context.ownership);
				console.log(">> players", players);
				return players;
			},
		}),
		selectTerritory: assign({
			selectedTerritory: ({event}: { event: SelectTerritoryEvent }) => {
				console.log(">> selectedTerritory", event.territory);
				return event.territory;
			},
		}),
		assignTroopsToTerritories: assign({
			ownership: ({context}: { context: Context }) => {
				const ownership: TerritoryOwnership = {...context.ownership};
				for (let i = 0; i < context.players.length; i++) {
					const territories = Object.keys(ownership).filter((territory) => ownership[territory as Territory].player === i) as Territory[];
					const troopsToDeploy = initialTroopsPerPlayer - territories.length
					territories.forEach((territory) => {
						ownership[territory].troops = 1;
					});
					for (let j = 0; j < troopsToDeploy; j++) {
						// randomly deploy troops to owned territories
						const territoryIndex = Math.floor(Math.random() * territories.length);
						const territory = territories[territoryIndex];
						ownership[territory].troops++;
					}
				}
				console.log(">> ownership", ownership);
				return ownership;
			}
		})
	},
	guards: {
		isPlayerAllowedToChooseAttacker: ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
			const territory = event.territory;
			const owner = context.ownership[territory];
			return owner && owner.player === context.currentPlayer;
		},
		isPlayerAllowedToAttack: ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
			const attackerTerritory = context.attacker;
			const targetTerritory = event.territory;

			// Check if the attacker territory can be mapped inside allBorders to the target country
			return context.allBorders.some(([territory, adjacentTerritories]) => {
				if (territory === attackerTerritory) {
					return adjacentTerritories.includes(targetTerritory);
				}
				return false;
			});
		},
		isPlayerAllowedToDeploy: ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
			const territory = event?.territory;
			const owner = context.ownership[territory];
			const isValid = (owner && owner.player === context.currentPlayer) ?? false;
			console.log(">> isPlayerAllowedToDeploy", isValid);
			return isValid;
		},
		hasPlayerSufficientTroops: (context: Context, event: DeployTroopsEvent) => {
			const {selectedTerritory, ownership} = context;
			const {territory, troops} = event;
			if (!territory || !selectedTerritory) {
				throw new Error("No territory selected");
			}
			debugger;
			const owner = ownership[(territory || selectedTerritory) as Territory];
			const isValid = owner && owner.troops >= troops;
			console.log(">> hasPlayerSufficientTroops", isValid);
			return isValid;
		},
	},
}).createMachine({
	id: 'risk',
	context: {
		currentPlayer: -1,
		ownership: {} as TerritoryOwnership,
		attacker: null,
		target: null,
		selectedTerritory: null,
		allBorders,
		allTerritories,
		players: Array.from({length: players}, () => ({troopsToDeploy: 0})),
	},
	initial: 'setup',
	states: {
		setup: {
			initial: 'firstPlayer',
			states: {
				firstPlayer: {
					on: {
						ASSIGN_FIRST_PLAYER: {
							target: 'territoryAssignment',
							actions: ['assignFirstPlayer'],
						},
					},
				},
				territoryAssignment: {
					on: {
						ASSIGN_TERRITORIES: {
							target: 'initialDeployment',
							actions: ['assignTerritoriesToPlayers'],
						},
					},

				},
				initialDeployment: {
					on: {
						ASSIGN_TROOPS: {
							target: 'preparationComplete',
							actions: ['assignTroopsToTerritories']
						}
					},
				},
				preparationComplete: {
					on: {
						START_GAME: '#risk.game',
					},
				},
			},
		},
		game: {
			initial: 'deployment',
			entry: "assignTroopsToDeploy",
			states: {
				deployment: {
					initial: 'selectingTerritory',
					states: {
						selectingTerritory: {
							on: {
								TERRITORY_CLICKED: [
									{
										guard: 'isPlayerAllowedToDeploy',
										target: "deployingTroops",
										actions: ['selectTerritory'],
									},
									{
										actions: ['ignoreClick'],
									},
								],
								END_TURN: '#risk.game.combat',
							}
						},
						deployingTroops: {
							on: {
								DEPLOY: [
									{
										guard: "hasPlayerSufficientTroops",
										target: "selectingTerritory",
										actions: ["deployTroops"],
									}
								]
							}
						}
					}
				},
				combat: {
					initial: 'selectingAttackerOrEndTurn',
					states: {
						selectingAttackerOrEndTurn: {
							on: {
								TERRITORY_CLICKED: [
									{
										guard: 'isPlayerAllowedToChooseAttacker',
										actions: ['setAttacker'],
										target: 'selectingTarget',
									}, {
										actions: ['ignoreClick'],
									},
								],
								END_TURN: '#risk.game.consolidation',
							},
						},
						selectingTarget: {
							on: {
								TERRITORY_CLICKED: [{
									guard: 'isPlayerAllowedToAttack',
									actions: ['setTarget', 'startCombatMode'],
									target: 'selectingAttackerOrEndTurn',
								}, {
									target: 'selectingAttackerOrEndTurn',
								},],
							},
						},
						combat: {
							// Define combat state here
						},
					}
				},
				consolidation: {
					on: {
						END_TURN: '#risk.endGame.victoryConditionCheck',
					},
				},
			},
		},
		endGame: {
			initial: 'victoryConditionCheck',
			states: {
				victoryConditionCheck: {
					on: {
						RESOLVE: 'resolution',
					},
				},
				resolution: {
					on: {
						GAME_OVER: 'gameOver',
					},
				},
				gameOver: {
					type: 'final',
				},
			},
		},
	},
});

export default riskMachine;
