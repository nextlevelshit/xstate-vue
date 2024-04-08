import {assign, setup} from "xstate";
import {Territory, TerritoryOwnership, RiskEvent, Context, Card, Player, RiskEventType} from "../config/types.ts";
import {allBorders, allTerritories, playerColors, playerNames, initialTroopsPerPlayer, diceInterval} from "../config/constants.ts";
import {collectCard} from "../actions/collectCard.ts";
import {countDeploymentForPlayer} from "../util/countDeploymentForPlayer.ts";
import {getConnectedTerritories} from "../util/getConnectedTerritories.ts";
import {randomIntFromInterval} from "../util/randomIntFromInterval.ts";

const riskMachine = setup<Context, RiskEvent>({
	actions: {},
	guards: {}
}).createMachine({
	id: "risk",
	context: {
		error: "",
		currentPlayer: -1,
		ownership: {} as TerritoryOwnership,
		fromTerritory: null,
		toTerritory: null,
		allBorders,
		allTerritories,
		players: [] as Player[],
		potentialTargetTerritories: [] as Territory[],
		attackerTroops: 0,
		leftCards: allTerritories.map((territory) => {
			return {
				territory,
				stars: Math.random() >= 0.3 ? 1 : 2
			};
		})
	},
	initial: "setup",
	states: {
		setup: {
			initial: "selectPlayers",
			states: {
				selectPlayers: {
					on: {
						[RiskEventType.MOVE]: {
							target: "firstPlayer",
							actions: assign({
								players: ({event}: {event: RiskEvent}) => {
									if (RiskEventType.MOVE !== event.type) throw new Error("Invalid event type");

									return Array.from({length: event.troops || 2}, (_, i) => ({
										troopsToDeploy: 0,
										color: playerColors[i],
										name: playerNames[i],
										cards: [] as Card[]
									}));
								}
							})
						}
					}
				},
				firstPlayer: {
					on: {
						[RiskEventType.CONTINUE]: {
							target: "territoryAssignment",
							actions: [
								assign({
									currentPlayer: ({context}: {context: Context}) => {
										const player = Math.floor(Math.random() * context.players.length);
										console.log(">> currentPlayer", player);
										return player;
									}
								})
							]
						}
					}
				},
				territoryAssignment: {
					on: {
						[RiskEventType.CONTINUE]: {
							target: "initialDeployment",
							actions: [
								assign({
									ownership: ({context}: {context: Context}) => {
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
											ownership[shuffledTerritories[territoriesPerPlayer * players.length + playerIndex]].player =
												playerIndex;
											playerTerritoriesCount[playerIndex]++;
											remainingTerritories--;
											playerIndex = (playerIndex + 1) % players.length;
										}
										console.log(">> ownership", ownership);

										return ownership;
									},
									players: ({context}: {context: Context}) => {
										const players = [...context.players];
										console.log(">> players", players);
										return players;
									}
								})
							]
						}
					}
				},
				initialDeployment: {
					on: {
						[RiskEventType.CONTINUE]: {
							target: "preparationComplete",
							actions: [
								assign({
									ownership: ({context}: {context: Context}) => {
										const ownership: TerritoryOwnership = {...context.ownership};
										for (let i = 0; i < context.players.length; i++) {
											const territories = Object.keys(ownership).filter(
												(territory) => ownership[territory as Territory].player === i
											) as Territory[];
											const troopsToDeploy = initialTroopsPerPlayer - territories.length;
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
							]
						}
					}
				},
				preparationComplete: {
					on: {
						[RiskEventType.CONTINUE]: "#risk.game"
					}
				}
			}
		},
		game: {
			initial: "deployment",
			states: {
				deployment: {
					initial: "selectingTerritoryOrTradeCards",
					entry: assign({
						players: ({context}: {context: Context}) => {
							const players = [...context.players];
							players[context.currentPlayer].troopsToDeploy = countDeploymentForPlayer(
								context.currentPlayer,
								context.ownership
							);
							console.log(">> players", players);
							return players;
						}
					}),
					states: {
						selectingTerritoryOrTradeCards: {
							entry: assign({
								fromTerritory: null,
								toTerritory: null
							}),
							on: {
								[RiskEventType.TRADE]: [
									{
										actions: [
											({context}: {context: Context}) => {
												const players = {...context.players};
												console.log("players[context.currentPlayer].cards", players[context.currentPlayer].cards);
												console.log(
													"players[context.currentPlayer].troopsToDeploy",
													players[context.currentPlayer].troopsToDeploy
												);

												const stars = players[context.currentPlayer].cards.reduce((acc, cur) => acc + cur.stars, 0);
												const tradedStars = Math.min(stars, 10);
												console.log("tradedCards", tradedStars);
												const tradedTroops =
													tradedStars === 10
														? tradedStars * 2 + tradedStars
														: tradedStars >= 7
															? tradedStars * 2 + 1
															: tradedStars >= 9
																? tradedStars * 2 + 3
																: tradedStars * 2;
												console.log("tradedTroops", tradedTroops);
												players[context.currentPlayer].troopsToDeploy += tradedTroops;
												let i = 0;
												while (tradedStars && i < tradedStars) {
													const card = players[context.currentPlayer].cards.pop();
													card && context.leftCards.push(card);
													i += card?.stars || 0;
												}
												console.log(
													">> players[context.currentPlayer].cards",
													players[context.currentPlayer].cards
												);
												console.log(
													">> players[context.currentPlayer].troopsToDeploy",
													players[context.currentPlayer].troopsToDeploy
												);
											}
										],
										target: "selectTerritory"
									}
								],
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const territory = event?.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = (owner && owner.player === context.currentPlayer) ?? false;
											console.log(">> isPlayerAllowedToDeploy", isValid);
											return isValid;
										},
										target: "deployingTroops",
										actions: [
											assign({
												fromTerritory: ({event}) => {
													console.log(">> fromTerritory", event.territory);
													return event.territory as Territory;
												}
											})
										]
									}
								]
							}
						},
						selectTerritory: {
							on: {
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const territory = event?.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = (owner && owner.player === context.currentPlayer) ?? false;
											console.log(">> isPlayerAllowedToDeploy", isValid);
											return isValid;
										},
										target: "deployingTroops",
										actions: [
											assign({
												fromTerritory: ({event}) => {
													console.log(">> fromTerritory", event.territory);
													return event.territory as Territory;
												}
											})
										]
									}
								]
							}
						},
						deployingTroops: {
							on: {
								[RiskEventType.MOVE]: [
									{
										guard: ({context, event}) => {
											const troops = event.troops || 0;
											if (!troops) throw new Error("Invalid troops");
											const isValid = context.players[context.currentPlayer].troopsToDeploy >= troops;
											console.log(">> hasPlayerSufficientTroopsToDeploy", isValid);
											return isValid;
										},
										target: "deploymentConditionCheck",
										actions: [
											assign({
												ownership: ({context, event}: {context: Context; event: RiskEvent}) => {
													if (!event.troops) throw new Error("Invalid troops");
													const territory = event?.territory ?? context.fromTerritory;
													const ownership = {...context.ownership};
													ownership[territory as Territory].troops += event.troops;
													console.log(">> ownership", ownership);
													return ownership;
												},
												players: ({context, event}: {context: Context; event: RiskEvent}) => {
													if (!event.troops) throw new Error("Invalid troops");
													const {currentPlayer, players} = context;
													const troops = players[currentPlayer].troopsToDeploy;
													players[currentPlayer].troopsToDeploy = troops - event.troops;
													console.log(">> players", players);
													return players;
												}
											})
										]
									},
									{
										guard: ({context, event}) => {
											const territory = event?.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = (owner && owner.player === context.currentPlayer) ?? false;
											console.log(">> isPlayerAllowedToDeploy", isValid);
											return isValid;
										},
										actions: [
											assign({
												fromTerritory: ({event}) => {
													console.log(">> fromTerritory", event.territory);
													return event.territory as Territory;
												}
											})
										]
									}
								],
								BACK: "selectingTerritoryOrTradeCards"
							}
						},
						deploymentConditionCheck: {
							always: [
								{
									guard: ({context}) => {
										const isValid = context.players[context.currentPlayer].troopsToDeploy > 0;
										console.log(">> hasAnyTroopsToDeploy", isValid);
										return isValid;
									},
									target: "selectingTerritoryOrTradeCards"
								},
								{
									target: "#risk.game.combat"
								}
							]
						}
					},
					on: {
						[RiskEventType.END_TURN]: {
							target: "#risk.game.combat",
							actions: [
								assign({
									ownership: ({context}) => {
										const ownership = {...context.ownership};
										const troopsToDeploy = context.players[context.currentPlayer].troopsToDeploy;
										const territories = Object.keys(ownership).filter(
											(territory) => ownership[territory as Territory].player === context.currentPlayer
										) as Territory[];
										for (let i = 0; i < troopsToDeploy; i++) {
											const territoryIndex = Math.floor(Math.random() * territories.length);
											const territory = territories[territoryIndex];
											ownership[territory].troops++;
										}
										console.log(">> ownership", ownership);
										return ownership;
									},
									players: ({context}) => {
										const players = [...context.players];
										players[context.currentPlayer].troopsToDeploy = 0;
										console.log(">> players[currentPlayer]", players[context.currentPlayer]);
										return players;
									}
								})
							]
						}
					}
				},
				combat: {
					initial: "selectingAttackerOrEndTurn",
					exit: [collectCard],
					states: {
						selectingAttackerOrEndTurn: {
							entry: assign({
								fromTerritory: null,
								toTerritory: null
							}),
							on: {
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const territory = event.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = owner && owner.player === context.currentPlayer && owner.troops >= 2;
											console.log(">> isPlayerAllowedToChooseAttacker", isValid);
											return isValid;
										},
										actions: assign({
											fromTerritory: ({event}) => {
												console.log(">> tromTerritory", event.territory);
												return event.territory as Territory;
											}
										}),
										target: "selectingTarget"
									}
								]
							}
						},
						selectingTarget: {
							entry: assign({
								toTerritory: null
							}),
							on: {
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const attackerTerritory = context.fromTerritory;
											const targetTerritory = event.territory;
											if (!targetTerritory) throw new Error("Invalid territory");
											const ownership = context.ownership;
											const currentPlayer = context.currentPlayer;
											const isValid =
												(attackerTerritory &&
													new Map(context.allBorders).get(attackerTerritory)?.includes(targetTerritory) &&
													ownership[targetTerritory].player !== currentPlayer) ??
												false;
											console.log(">> isPlayerAllowedToAttack", isValid);
											return isValid;
										},
										actions: [
											assign({
												toTerritory: ({event}) => {
													console.log(">> target", event.territory);
													return event.territory as Territory;
												}
											})
										],
										target: "combat"
									},
									{
										guard: ({context, event}) => {
											const territory = event.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = owner && owner.player === context.currentPlayer && owner.troops >= 2;
											console.log(">> isPlayerAllowedToChooseAttacker", isValid);
											return isValid;
										},
										actions: [
											assign({
												fromTerritory: ({event}) => {
													console.log(">> tromTerritory", event.territory);
													return event.territory as Territory;
												}
											})
										]
									}
								],
								BACK: {
									target: "selectingAttackerOrEndTurn"
								}
							}
						},
						combat: {
							on: {
								[RiskEventType.MOVE]: [
									{
										guard: ({context, event}) => {
											const troops = event.troops;
											if (!troops) throw new Error("Invalid troops");
											const isValid =
												(troops > 0 &&
													troops <= 3 &&
													context.fromTerritory &&
													context.ownership[context.fromTerritory].troops > troops &&
													context.ownership[context.fromTerritory].player !==
														context.ownership[context.toTerritory as Territory].player) ??
												false;
											console.log(">> hasPlayerSufficientTroopsToAttack", isValid);
											return isValid;
										},
										actions: assign({
											ownership: ({context, event}) => {
												const attackerTroops = event.troops;
												if (!attackerTroops) throw new Error("No troops to attack with");
												const defenderTroops = Math.min(
													attackerTroops,
													context.ownership[context.toTerritory as Territory].troops
												);
												const ownership = {...context.ownership};

												// Simulate dice roll for attacker and defender
												const attackerDice = Array.from({length: Math.min(attackerTroops, 3)}, () =>
													randomIntFromInterval(diceInterval)
												);
												const defenderDice = Array.from({length: Math.min(defenderTroops, 2)}, () =>
													randomIntFromInterval(diceInterval)
												);

												// Sort dice rolls in descending order
												attackerDice.sort((a, b) => b - a);
												defenderDice.sort((a, b) => b - a);

												// Determine the outcome of the battle
												for (let i = 0; i < Math.min(attackerDice.length, defenderDice.length); i++) {
													if (attackerDice[i] > defenderDice[i]) {
														// Attacker wins, decrease defender's troops
														console.log(
															"Attacker wins:",
															context.fromTerritory,
															attackerDice[i],
															defenderDice[i]
														);
														ownership[context.toTerritory as Territory].troops--;
													} else {
														// Defender wins or it's a tie, decrease attacker's troops
														console.log(
															"Defender wins:",
															context.toTerritory,
															attackerDice[i],
															defenderDice[i]
														);
														ownership[context.fromTerritory as Territory].troops--;
													}
												}

												// Check if territory has been lost
												const remainingTargetTroops = ownership[context.toTerritory as Territory].troops;
												if (remainingTargetTroops === 0) {
													ownership[context.toTerritory as Territory] = {
														player: context.currentPlayer,
														troops: 0
													};
												}

												console.log(">> ownership", ownership);
												return ownership;
											}
										}),
										target: "victoryConditionCheck"
									}
								],
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const territory = event.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = owner && owner.player === context.currentPlayer && owner.troops >= 2;
											console.log(">> isPlayerAllowedToChooseAttacker", isValid);
											return isValid;
										},
										actions: [
											assign({
												fromTerritory: ({event}) => {
													console.log(">> tromTerritory", event.territory);
													return event.territory as Territory;
												}
											})
										],
										target: "selectingTarget"
									}
								],
								[RiskEventType.BACK]: {
									target: "selectingTarget"
								}
							}
						},
						victoryConditionCheck: {
							always: [
								{
									guard: ({context}) => {
										const isValid = context.ownership[context.toTerritory as Territory].troops === 0;
										console.log(">> attackerHasWon", isValid);
										return isValid;
									},
									target: "fortify"
								},
								{
									target: "combat"
								}
							]
						},
						fortify: {
							on: {
								[RiskEventType.MOVE]: [
									{
										guard: ({context}) => {
											const isValid = context.fromTerritory && context.ownership[context.fromTerritory].troops > 1;
											console.log(">> hasPlayerSufficientTroopsToFortify", isValid);
											return isValid ?? false;
										},
										target: "#risk.game.combat.selectingTarget",
										actions: ({context, event}) => {
											const troops = event.troops;
											if (!troops) throw new Error("Invalid troops");
											console.log(
												"Fortifying",
												context.fromTerritory,
												"with",
												event.troops,
												"from",
												context.toTerritory
											);
											context.fromTerritory && (context.ownership[context.fromTerritory].troops -= troops);
											context.toTerritory && (context.ownership[context.toTerritory].troops += troops);
											context.fromTerritory = context.toTerritory;
											context.toTerritory = null;
											context.attackerTroops = 0;
										}
									}
								],
								[RiskEventType.CONTINUE]: {
									target: "#risk.game.combat"
								}
							}
						}
					},
					on: {
						[RiskEventType.END_TURN]: {
							target: "#risk.game.consolidation"
						}
					}
				},
				consolidation: {
					description: "Player can consolidate across inter-connected territories once",
					initial: "selectingOrigin",
					entry: assign({
						fromTerritory: null,
						potentialTargetTerritories: []
					}),
					states: {
						selectingOrigin: {
							on: {
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const territory = event.territory;
											if (!territory) throw new Error("Invalid territory");
											const owner = context.ownership[territory];
											const isValid = owner && owner.player === context.currentPlayer && owner.troops >= 2;
											console.log(">> isPlayerAllowedToChooseAttacker", isValid);
											return isValid;
										},
										actions: [
											assign({
												fromTerritory: ({event}) => {
													console.log(">> fromTerritory", event.territory);
													return event.territory as Territory;
												},
												potentialTargetTerritories: ({context, event}) => {
													const territory = event.territory;
													if (!territory) throw new Error("Invalid territory");
													const ownedTerritories = Object.keys(context.ownership).filter((territory) => {
														return context.ownership[territory as Territory].player === context.currentPlayer;
													}) as Territory[];
													const connectedTerritories = getConnectedTerritories(
														ownedTerritories,
														context.allBorders
													);
													const potentialTargetTerritories = connectedTerritories.get(territory) ?? [];
													// Remove event.territory from potentialTargets
													const index = potentialTargetTerritories.indexOf(territory);
													if (index > -1) {
														potentialTargetTerritories.splice(index, 1);
													}
													console.log(">> potentialTargetTerritories", potentialTargetTerritories);
													return potentialTargetTerritories;
												}
											})
										],
										target: "selectingTarget"
									}
								]
							}
						},
						selectingTarget: {
							on: {
								[RiskEventType.SELECT_TERRITORY]: [
									{
										guard: ({context, event}) => {
											const territory = event.territory;
											if (!territory) throw new Error("Invalid territory");
											const isValid = territory && context.potentialTargetTerritories.includes(territory);
											console.log(">> isTerritoryConnected", isValid);
											return isValid;
										},
										actions: assign({
											toTerritory: ({event}) => {
												console.log(">> target", event.territory);
												return event.territory as Territory;
											}
										}),
										target: "reinforcingTroops"
									}
								],
								[RiskEventType.BACK]: {
									target: "selectingOrigin"
								}
							}
						},
						reinforcingTroops: {
							on: {
								[RiskEventType.MOVE]: {
									guard: ({context, event}) => {
										const troops = event.troops;
										if (!troops) return false;
										const isValid =
											context.fromTerritory && troops > 0 && context.ownership[context.fromTerritory].troops > troops;
										console.log(">> hasPlayerSufficientTroopsToReinforce", isValid);
										return isValid ?? false;
									},
									actions: [
										assign({
											ownership: ({context, event}) => {
												const troops = event.troops || 0;
												if (!troops) new Error("No troops to reinforce with");
												const ownership = {...context.ownership};
												ownership[context.fromTerritory as Territory].troops -= troops;
												ownership[context.toTerritory as Territory].troops += troops;
												console.log(">> ownership", ownership);
												return ownership;
											},
											currentPlayer: ({context}) => {
												console.log(">> currentPlayer", context.currentPlayer);
												// check if player has territories left
												const countTerritories = (p: number) =>
													Object.values(context.ownership).filter(({player}) => player === p).length;

												for (let i = 1; i < context.players.length; i++) {
													const player = (context.currentPlayer + i) % context.players.length;
													if (countTerritories(player) > 0) {
														return player;
													}
												}
												return -1;
											}
										})
									],
									target: "#risk.game.deployment"
								},
								[RiskEventType.BACK]: {
									target: "selectingTarget"
								}
							}
						}
					},
					on: {
						[RiskEventType.END_TURN]: {
							actions: [
								assign({
									currentPlayer: ({context}) => {
										console.log(">> currentPlayer", context.currentPlayer);
										// check if player has territories left
										const countTerritories = (p: number) =>
											Object.values(context.ownership).filter(({player}) => player === p).length;

										for (let i = 1; i < context.players.length; i++) {
											const player = (context.currentPlayer + i) % context.players.length;
											if (countTerritories(player) > 0) {
												return player;
											}
										}
										return -1;
									}
								})
							],
							target: "#risk.game.deployment"
						}
					}
				}
			}
		},
		endGame: {
			initial: "victoryConditionCheck",
			states: {
				victoryConditionCheck: {
					on: {
						RESOLVE: "resolution"
					}
				},
				resolution: {
					on: {
						GAME_OVER: "gameOver"
					}
				},
				gameOver: {
					type: "final"
				}
			}
		}
	}
});

export default riskMachine;
