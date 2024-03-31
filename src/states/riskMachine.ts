import {assign, setup} from 'xstate';
import {Territory, TerritoryOwnership, Player} from "../config/types.ts";
import {
	players,
	allBorders,
	allTerritories,
	initialTroopsPerPlayer,
	playerColors,
	playerNames, diceInterval
} from "../config/constants.ts";
import {countDeploymentForPlayer} from "../util/countDeploymentForPlayer.ts";
import {randomIntFromInterval} from "../util/randomIntFromInterval.ts";
import {getConnectedTerritories} from "../util/getConnectedTerritories.ts";

export interface Context {
	currentPlayer: number;
	ownership: TerritoryOwnership;
	selectedTerritory: Territory | null;
	potentialTargetTerritories: Territory[];
	attacker: Territory | null;
	target: Territory | null;
	allBorders: [Territory, Territory[]][];
	allTerritories: Territory[];
	players: Player[];
	error: string;
}

interface SelectTerritoryEvent {
	type: RiskEventType.SELECT_TERRITORY;
	territory: Territory;
}

interface SelectTroopsEvent {
	type: RiskEventType.DEPLOY_TROOPS | RiskEventType.ATTACK;
	territory?: Territory;
	troops: number;
}

export enum RiskEventType {
	// ASSIGN_FIRST_PLAYER = "ASSIGN_FIRST_PLAYER",
	// ASSIGN_TERRITORIES = "ASSIGN_TERRITORIES",
	// ASSIGN_TROOPS = "ASSIGN_TROOPS",
	// START_GAME = "START_GAME",
	SELECT_TERRITORY = "SELECT_TERRITORY",
	END_TURN = "END_TURN",
	RESOLVE = "RESOLVE",
	GAME_OVER = "GAME_OVER",
	DEPLOY_TROOPS = "DEPLOY_TROOPS",
	ATTACK = "ATTACK",
	BACK = "BACK",
	CONTINUE = "CONTINUE"
}

export type RiskEvent = SelectTerritoryEvent | SelectTroopsEvent | {type: RiskEventType};

export type RiskGuard<T> = {
	context: Context;
	event: T;
}

const riskMachine = setup<Context, RiskEvent>({
	actions: {
		incrementCurrentPlayer: assign({
			currentPlayer: ({context}: { context: Context }) => {
				console.log(">> currentPlayer", context.currentPlayer);
				// check if player has territories left
				const countTerritories = (p: number) => Object.values(context.ownership).filter(({player}) => player === p).length;

				for (let i = 1; i < context.players.length; i++) {
					const player = (context.currentPlayer + i) % context.players.length;
					if (countTerritories(player) > 0) {
						return player;
					}
				}
				return -1;
			}
		}),
		setAttacker: assign({
			attacker: ({event}: { event: SelectTerritoryEvent }) => {
				console.log(">> attacker", event.territory);
				return event.territory;
			},
		}),
		setTarget: assign({
			target: ({event}: { event: SelectTerritoryEvent }) => {
				console.log(">> target", event.territory);
				return event.territory;
			},
		}),
		ignoreClick: (error: any) => {
			console.log('Not allowed', error);
		},
		startCombatMode: ({context, event}: { context: Context, event: SelectTroopsEvent }) => {
			console.log('Attacking', context.attacker, 'from', event.territory);
		},
		assignFirstPlayer: assign({
			currentPlayer: () => {
				const player = Math.floor(Math.random() * players);
				console.log(">> currentPlayer", player);
				return player;
			},
		}),
		assignTerritoriesToPlayers: assign({
			ownership: ({context}: { context: Context }) => {
				const {allTerritories, players} = context;
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
					ownership[territory] = {player: playerIndex, troops: 0};
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
			players: ({context}: { context: Context }) => {
				const players = [...context.players];
				console.log(">> players", players);
				return players;
			}
		}),
		deployTroops: assign({
			ownership: ({context, event}: { context: Context, event: SelectTroopsEvent }) => {
				const territory = event?.territory ?? context.selectedTerritory;
				const ownership = {...context.ownership};
				ownership[territory as Territory].troops += event.troops;
				console.log(">> ownership", ownership);
				return ownership;
			},
			players: ({context, event}: { context: Context, event: SelectTroopsEvent }) => {
				const {currentPlayer, players} = context;
				const troops = players[currentPlayer].troopsToDeploy;
				players[currentPlayer].troopsToDeploy = troops - event.troops;
				return players;
			}
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
		}),
		rollTheDice: assign({
			ownership: ({context, event}: { context: Context, event: SelectTroopsEvent }) => {
				const attackerTroops = event.troops;
				const defenderTroops = Math.min(event.troops, context.ownership[context.target as Territory].troops);
				const ownership = {...context.ownership};

				// Simulate dice roll for attacker and defender
				const attackerDice = Array.from({length: Math.min(attackerTroops, 3)}, () => randomIntFromInterval(diceInterval));
				const defenderDice = Array.from({length: Math.min(defenderTroops, 2)}, () => randomIntFromInterval(diceInterval));

				// Sort dice rolls in descending order
				attackerDice.sort((a, b) => b - a);
				defenderDice.sort((a, b) => b - a);

				// Determine the outcome of the battle
				for (let i = 0; i < Math.min(attackerDice.length, defenderDice.length); i++) {
					if (attackerDice[i] > defenderDice[i]) {
						// Attacker wins, decrease defender's troops
						console.log("Attacker wins:", context.attacker, attackerDice[i], defenderDice[i]);
						ownership[context.target as Territory].troops--;
					} else {
						// Defender wins or it's a tie, decrease attacker's troops
						console.log("Defender wins:", context.target, attackerDice[i], defenderDice[i]);
						ownership[context.attacker as Territory].troops--;
					}
				}

				// Check if territory has been lost
				const remainingAttackerTroops = ownership[context.attacker as Territory].troops;
				const remainingTargetTroops = ownership[context.target as Territory].troops;
				if (remainingTargetTroops === 0) {
					ownership[context.target as Territory] = {
						player: context.currentPlayer,
						troops: attackerTroops
					};
					ownership[context.attacker as Territory].troops = remainingAttackerTroops - attackerTroops;
				}

				console.log(">> ownership", ownership);
				return ownership;
			}
		}),
		deployRemainingTroops: assign({
			ownership: ({context}: { context: Context }) => {
				const ownership = {...context.ownership};
				const troopsToDeploy = context.players[context.currentPlayer].troopsToDeploy;
				const territories = Object.keys(ownership).filter((territory) => ownership[territory as Territory].player === context.currentPlayer) as Territory[];
				for (let i = 0; i < troopsToDeploy; i++) {
					const territoryIndex = Math.floor(Math.random() * territories.length);
					const territory = territories[territoryIndex];
					ownership[territory].troops++;
				}
				console.log(">> ownership", ownership);
				return ownership;
			}
		}),
		reinforceTroops: assign({
			ownership: ({context, event}: { context: Context, event: SelectTroopsEvent }) => {
				const ownership = {...context.ownership};
				ownership[context.selectedTerritory as Territory].troops -= event.troops;
				ownership[context.target as Territory].troops += event.troops;
				console.log(">> ownership", ownership);
				return ownership;
			}
		}),
		setPotentialTargetTerritories: assign({
			potentialTargetTerritories: ({context, event}: { context: Context, event: SelectTerritoryEvent }) => {
				const ownedTerritories = Object.keys(context.ownership).filter((territory) => {
					return context.ownership[territory as Territory].player === context.currentPlayer;
				}) as Territory[];
				const connectedTerritories = getConnectedTerritories(ownedTerritories, context.allBorders);
				const potentialTargetTerritories = connectedTerritories.get(event.territory) ?? [];
				// Remove event.territory from potentialTargets
				const index = potentialTargetTerritories.indexOf(event.territory);
				if (index > -1) {
					potentialTargetTerritories.splice(index, 1);
				}
				console.log(">> potentialTargetTerritories", potentialTargetTerritories);
				return potentialTargetTerritories;
			}
		}),
	},
	guards: {
		isPlayerAllowedToChooseAttacker: ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
			const territory = event.territory;
			const owner = context.ownership[territory];
			const isValid = owner && owner.player === context.currentPlayer && owner.troops >= 2;
			console.log(">> isPlayerAllowedToChooseAttacker", isValid);
			return isValid;
		},
		isPlayerAllowedToAttack: ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
			const attackerTerritory = context.attacker;
			const targetTerritory = event.territory;
			const ownership = context.ownership;
			const currentPlayer = context.currentPlayer;
			const isValid = (attackerTerritory && new Map(context.allBorders).get(attackerTerritory)?.includes(targetTerritory) && ownership[targetTerritory].player !== currentPlayer) ?? false;
			console.log(">> isPlayerAllowedToAttack", isValid);
			return isValid;
		},
		isPlayerAllowedToDeploy: ({context, event}: RiskGuard<SelectTerritoryEvent>) => {
			const territory = event?.territory;
			const owner = context.ownership[territory];
			const isValid = (owner && owner.player === context.currentPlayer) ?? false;
			console.log(">> isPlayerAllowedToDeploy", isValid);
			return isValid;
		},
		hasPlayerSufficientTroopsToDeploy: ({context, event}: RiskGuard<SelectTroopsEvent>) => {
			const isValid = context.players[context.currentPlayer].troopsToDeploy >= event.troops;
			console.log(">> hasPlayerSufficientTroopsToDeploy", isValid);
			return isValid;
		},
		hasPlayerSufficientTroopsToAttack: ({context, event}: RiskGuard<SelectTroopsEvent>) => {
			const isValid = (event.troops > 0 && event.troops <= 3 && context.attacker && context.ownership[context.attacker].troops > event.troops && context.ownership[context.attacker].player !== context.ownership[context.target as Territory].player) ?? false
			console.log(">> hasPlayerSufficientTroopsToAttack", isValid);
			return isValid;
		},
		isTerritoryConnected: ({context, event} : { context: Context, event: SelectTerritoryEvent}) => {
			const isValid = event.territory && context.potentialTargetTerritories.includes(event.territory);
			console.log(">> isTerritoryConnected", isValid);
			return isValid;
		},
		hasPlayerSufficientTroopsToReinforce: ({context, event}: RiskGuard<SelectTroopsEvent>) => {
			const isValid = context.selectedTerritory && event.troops > 0 && context.ownership[context.selectedTerritory].troops > event.troops;
			console.log(">> hasPlayerSufficientTroopsToReinforce", isValid);
			return isValid;
		}
	},
}).createMachine({
	id: 'risk',
	context: {
		error: "",
		currentPlayer: -1,
		ownership: {} as TerritoryOwnership,
		attacker: null,
		target: null,
		selectedTerritory: null,
		allBorders,
		allTerritories,
		players: Array.from({length: players}, (_,i) => ({
			troopsToDeploy: 0,
			color: playerColors[i],
			name: playerNames[i]
		})),
		potentialTargetTerritories: [] as Territory[]
	},
	initial: 'setup',
	states: {
		setup: {
			initial: 'firstPlayer',
			states: {
				firstPlayer: {
					on: {
						CONTINUE: {
							target: 'territoryAssignment',
							actions: ['assignFirstPlayer'],
						},
					},
				},
				territoryAssignment: {
					on: {
						CONTINUE: {
							target: 'initialDeployment',
							actions: ['assignTerritoriesToPlayers'],
						},
					},

				},
				initialDeployment: {
					on: {
						CONTINUE: {
							target: 'preparationComplete',
							actions: ['assignTroopsToTerritories']
						}
					},
				},
				preparationComplete: {
					on: {
						CONTINUE: '#risk.game',
					},
				},
			},
		},
		game: {
			initial: 'deployment',
			states: {
				deployment: {
					initial: 'selectingTerritoryOrEndTurn',
					entry: "assignTroopsToDeploy",
					states: {
						selectingTerritoryOrEndTurn: {
							entry: assign({
								selectedTerritory: null,
							}),
							on: {
								SELECT_TERRITORY: [
									{
										guard: 'isPlayerAllowedToDeploy',
										target: "deployingTroops",
										actions: ['selectTerritory'],
									},
									{
										actions: ['ignoreClick'],
									},
								],
							}
						},
						deployingTroops: {
							on: {
								DEPLOY_TROOPS: [
									{
										guard: "hasPlayerSufficientTroopsToDeploy",
										target: "selectingTerritoryOrEndTurn",
										actions: ["deployTroops"],
									},
									{

										guard: 'isPlayerAllowedToDeploy',
										actions: ['selectTerritory'],
									},
									{
										actions: ['ignoreClick'],
									},
								],
								BACK: "selectingTerritoryOrEndTurn"
							}
						}
					},
					on: {
						END_TURN: {
							target: '#risk.game.combat',
							actions: ['deployRemainingTroops']
						},
					}
				},
				combat: {
					initial: 'selectingAttackerOrEndTurn',
					states: {
						selectingAttackerOrEndTurn: {
							entry: assign({
								attacker: null,
								target: null
							}),
							on: {
								SELECT_TERRITORY: [
									{
										guard: 'isPlayerAllowedToChooseAttacker',
										actions: ['setAttacker'],
										target: 'selectingTarget',
									},
									{
										actions: ['ignoreClick'],
									},
								],
							},
						},
						selectingTarget: {
							entry: assign({
								target: null
							}),
							on: {
								SELECT_TERRITORY: [
									{
										guard: 'isPlayerAllowedToAttack',
										actions: ['setTarget', 'startCombatMode'],
										target: 'combat',
									},
									{
										guard: 'isPlayerAllowedToChooseAttacker',
										actions: ['setAttacker'],
									},
									{
										actions: ["ignoreClick"]
									},
								],
								BACK: {
									target: "selectingAttackerOrEndTurn"
								},
							},
						},
						combat: {
							on: {
								ATTACK: [
									{
										guard: "hasPlayerSufficientTroopsToAttack",
										actions: ["rollTheDice"],
										target: "combat"
									},
								],
								SELECT_TERRITORY: [
									{
										guard: 'isPlayerAllowedToChooseAttacker',
										actions: ['setAttacker'],
										target: 'selectingTarget',
									}
								],
								BACK: {
									target: "selectingTarget"
								},
							}
						},
					},
					on: {
						END_TURN: {
							target: "#risk.game.consolidation"
						}
					}
				},
				consolidation: {
					description: "Player can consolidate across connected territories once",
					initial: "selectingOrigin",
					entry: assign({
						selectedTerritory: null,
						potentialTargetTerritories: []
					}),
					states: {
						selectingOrigin: {
							on: {
								SELECT_TERRITORY: [
									{
										guard: 'isPlayerAllowedToChooseAttacker',
										actions: ["selectTerritory", "setPotentialTargetTerritories"],
										target: 'selectingTarget',
									},
									{
										action: ["ignoreClick"]
									}
								],
							}
						},
						selectingTarget: {
							on: {
								SELECT_TERRITORY: [
									{
										guard: "isTerritoryConnected",
										actions: ["setTarget"],
										target: "reinforcingTroops"
									},
									{
										actions: ["ignoreClick"]
									}
								],
								BACK: {
									target: "selectingOrigin"
								},
							}
						},
						reinforcingTroops: {
							on: {
								DEPLOY_TROOPS: {
									guard: "hasPlayerSufficientTroopsToReinforce",
									actions: ["reinforceTroops", "incrementCurrentPlayer"],
									target: "#risk.game.deployment"
								},
								BACK: {
									target: "selectingTarget"
								}
							}
						}
					},
					on: {
						END_TURN: {
							actions: ["incrementCurrentPlayer"],
							target: "#risk.game.deployment"
						}
					}
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
