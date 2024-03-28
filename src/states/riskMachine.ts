import {assign, AnyEventObject, setup} from 'xstate';
import {Territory, TerritoryOwnership, Player} from "../config/types.ts";
import {players, allBorders, allTerritories} from "../config/constants.ts";
import {countDeploymentForPlayer} from "../util/countDeploymentForPlayer.ts";

export interface Context {
	currentPlayer: number;
	ownership: TerritoryOwnership;
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
	territory: Territory;
	troops: number;
}

export enum RiskEvent {
	ASSIGN_FIRST_PLAYER = "ASSIGN_FIRST_PLAYER",
	ASSIGN_TERRITORIES = "ASSIGN_TERRITORIES",
	ASSIGN_TROOPS = "ASSIGN_TROOPS",
	START_GAME = "START_GAME",
	TERRITORY_CLICKED = "TERRITORY_CLICKED",
	END_TURN = "END_TURN",
	RESOLVE = "RESOLVE",
	GAME_OVER = "GAME_OVER",
}

export type MachineEvent = SelectTerritoryEvent | DeployTroopsEvent | { type: RiskEvent};


const riskMachine = setup<Context, MachineEvent>({
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
			console.log('Cannot select attacker', event.territory);
		},
		startCombatMode: ({context}: { context: Context }) => {
			console.log('Attacking', context.attacker, 'from', context.target);
		},
		assignFirstPlayer: assign({
			currentPlayer: () => Math.floor(Math.random() * players),
		}),
		assignTerritoriesToPlayers: assign({
			ownership: ({context}: { context: Context}) => {
				const ownership = {} as TerritoryOwnership;
				const territories = context.allTerritories.map((territory: Territory) => territory);
				const shuffledTerritories = territories.sort(() => Math.random() - 0.5);
				const playersTerritories = Math.floor(territories.length / players);
				for (let i = 0; i < playersTerritories; i++) {
					const player = i % players;
					const territory = shuffledTerritories[i];
					ownership[territory] = {
						player, troops: 1,
					};
				}
				return ownership;
			},
		}),
		deployTroops: assign({
			ownership: ({context, event}) => {
				const {territory, troops} = event as DeployTroopsEvent;
				const ownership = {...context.ownership};
				ownership[territory].troops += troops;
				return ownership;
			},
		}),
		assignTroopsToDeploy: assign({
			players: ({context}) => {
				const players = [...context.players];
				players[context.currentPlayer].troopsToDeploy = countDeploymentForPlayer(context.currentPlayer, context.ownership);
				return players;
			},
		}),
		selectTerritory: () => console.log("Not implemented")
	},
	guards: {
		isPlayerAllowedToChooseAttacker: (context: Context, event: SelectTerritoryEvent) => {
			const territory = event.territory;
			const owner = context.ownership[territory];
			return owner && owner.player === context.currentPlayer;
		},
		isPlayerAllowedToAttack: (context: Context, event: SelectTerritoryEvent) => {
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
		isPlayerAllowedToDeploy: (context: Context, event: SelectTerritoryEvent) => {
			const territory = event.territory;
			const owner = context.ownership[territory];
			return owner && owner.player === context.currentPlayer;
		},
		hasPlayerSufficientTroops: (context: Context, event: DeployTroopsEvent) => {
			const {territory, troops} = event;
			const owner = context.ownership[territory];
			return owner && owner.troops >= troops;
		},
	},
}).createMachine({
	id: 'risk',
	context: {
		currentPlayer: -1,
		ownership: {} as TerritoryOwnership,
		attacker: null,
		target: null,
		allBorders,
		allTerritories,
		players: Array.from({length: players}, () => ({territories: 0, troopsToDeploy: 0, troops: 0})),
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
										target: 'selectingTerritory',
										actions: ['selectTerritory'],
									},
									{
										actions: 'ignoreClick',
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
										actions: 'ignoreClick',
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
