import {assign, setup} from "xstate";
import {Territory, TerritoryOwnership, RiskEvent, Context, Card} from "../config/types.ts";
import {players, allBorders, allTerritories, playerColors, playerNames} from "../config/constants.ts";
import {isPlayerAllowedToAttack} from "../guards/isPlayerAllowedToAttack.ts";
import {isPlayerAllowedToChooseAttacker} from "../guards/isPlayerAllowedToChooseAttacker.ts";
import {hasPlayerSufficientTroopsToReinforce} from "../guards/hasPlayerSufficientTroopsToReinforce.ts";
import {isPlayerAllowedToDeploy} from "../guards/isPlayerAllowedToDeploy.ts";
import {hasPlayerSufficientTroopsToDeploy} from "../guards/hasPlayerSufficientTroopsToDeploy.ts";
import {hasPlayerSufficientTroopsToAttack} from "../guards/hasPlayerSufficientTroopsToAttack.ts";
import {isTerritoryConnected} from "../guards/isTerritoryConnected.ts";
import {incrementCurrentPlayer} from "../actions/incrementCurrentPlayer.ts";
import {setFromTerritory} from "../actions/setFromTerritory.ts";
import {setToTerritory} from "../actions/setToTerritory.ts";
import {deployRemainingTroops} from "../actions/deployRemainingTroops.ts";
import {reinforceTroops} from "../actions/reinforceTroops.ts";
import {setPotentialTargetTerritories} from "../actions/setPotentialTargetTerritories.ts";
import {rollTheDice} from "../actions/rollTheDice.ts";
import {assignTroopsToTerritories} from "../actions/assignTroopsToTerritories.ts";
import {ignoreClick} from "../actions/ignoreClick.ts";
import {startCombatMode} from "../actions/startCombatMode.ts";
import {assignFirstPlayer} from "../actions/assignFirstPlayer.ts";
import {assignTerritoriesToPlayers} from "../actions/assignTerritoriesToPlayers.ts";
import {deployTroops} from "../actions/deployTroops.ts";
import {assignTroopsToDeploy} from "../actions/assignTroopsToDeploy.ts";
import {selectTerritory} from "../actions/selectTerritory.ts";
import {hasPlayerSufficientTroopsToFortify} from "../guards/hasPlayerSufficientTroopsToFortify.ts";
import {fortifyTroops} from "../actions/fortifyTroops.ts";
import {hasAnyTroopsToDeploy} from "../guards/hasAnyTroopsToDeploy.ts";
import {collectCard} from "../actions/collectCard.ts";
import {tradeCards} from "../actions/tradeCards.ts";

const riskMachine = setup<Context, RiskEvent>({
	actions: {
		incrementCurrentPlayer,
		setAttacker: setFromTerritory,
		setTarget: setToTerritory,
		ignoreClick,
		startCombatMode,
		assignFirstPlayer,
		assignTerritoriesToPlayers,
		deployTroops,
		assignTroopsToDeploy,
		selectTerritory,
		assignTroopsToTerritories,
		rollTheDice,
		deployRemainingTroops,
		reinforceTroops,
		setPotentialTargetTerritories,
		fortifyTroops,
		collectCard,
		tradeCards
	},
	guards: {
		isPlayerAllowedToChooseAttacker,
		isPlayerAllowedToAttack,
		isPlayerAllowedToDeploy,
		hasPlayerSufficientTroopsToDeploy,
		hasPlayerSufficientTroopsToAttack,
		isTerritoryConnected,
		hasPlayerSufficientTroopsToReinforce,
		hasPlayerSufficientTroopsToFortify,
		hasAnyTroopsToDeploy,
		attackerHasWon: ({context}: {context: Context}) => {
			const isValid = context.ownership[context.toTerritory as Territory].troops === 0;
			console.log(">> attackerHasWon", isValid);
			return isValid;
		}
	}
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
		players: Array.from({length: players}, (_, i) => ({
			troopsToDeploy: 0,
			color: playerColors[i],
			name: playerNames[i],
			cards: [] as Card[]
		})),
		potentialTargetTerritories: [] as Territory[],
		attackerTroops: 0,
		leftCards: allTerritories.map(territory => {
			return {
				territory,
				stars: Math.random() >= 0.3 ? 1 : 2
			}
		})
	},
	initial: "setup",
	states: {
		setup: {
			initial: "firstPlayer",
			states: {
				firstPlayer: {
					on: {
						CONTINUE: {
							target: "territoryAssignment",
							actions: ["assignFirstPlayer"]
						}
					}
				},
				territoryAssignment: {
					on: {
						CONTINUE: {
							target: "initialDeployment",
							actions: ["assignTerritoriesToPlayers"]
						}
					}
				},
				initialDeployment: {
					on: {
						CONTINUE: {
							target: "preparationComplete",
							actions: ["assignTroopsToTerritories"]
						}
					}
				},
				preparationComplete: {
					on: {
						CONTINUE: "#risk.game"
					}
				}
			}
		},
		game: {
			initial: "deployment",
			// after: ["deployRemainingTroops"],
			states: {
				deployment: {
					initial: "selectingTerritoryOrTradeCards",
					entry: "assignTroopsToDeploy",
					// after: ["deployRemainingTroops"],
					states: {
						selectingTerritoryOrTradeCards: {
							entry: assign({
								fromTerritory: null,
								toTerritory: null
							}),
							on: {
								TRADE: [
									{
										actions: ["tradeCards"],
										target: "selectTerritory",
									}
								],
								SELECT_TERRITORY: [
									{
										guard: "isPlayerAllowedToDeploy",
										target: "deployingTroops",
										actions: ["selectTerritory"]
									},
									{
										actions: ["ignoreClick"]
									}
								]
							}
						},
						selectTerritory: {
							on: {
								SELECT_TERRITORY: [
									{
										guard: "isPlayerAllowedToDeploy",
										target: "deployingTroops",
										actions: ["selectTerritory"]
									},
									{
										actions: ["ignoreClick"]
									}
								]
							}
						},
						deployingTroops: {
							on: {
								MOVE: [
									{
										guard: "hasPlayerSufficientTroopsToDeploy",
										target: "deploymentConditionCheck",
										actions: ["deployTroops"]
									},
									{
										guard: "isPlayerAllowedToDeploy",
										actions: ["selectTerritory"]
									},
									{
										actions: ["ignoreClick"]
									}
								],
								BACK: "selectingTerritoryOrTradeCards"
							}
						},
						deploymentConditionCheck: {
							always: [
								{
									guard: "hasAnyTroopsToDeploy",
									target: "selectingTerritoryOrTradeCards"
								},
								{
									target: "#risk.game.combat"
								}
							]
						}
					},
					on: {
						END_TURN: {
							target: "#risk.game.combat",
							actions: ["deployRemainingTroops"]
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
								SELECT_TERRITORY: [
									{
										guard: "isPlayerAllowedToChooseAttacker",
										actions: ["setAttacker"],
										target: "selectingTarget"
									},
									{
										actions: ["ignoreClick"]
									}
								]
							}
						},
						selectingTarget: {
							entry: assign({
								toTerritory: null
							}),
							on: {
								SELECT_TERRITORY: [
									{
										guard: "isPlayerAllowedToAttack",
										actions: ["setTarget", "startCombatMode"],
										target: "combat"
									},
									{
										guard: "isPlayerAllowedToChooseAttacker",
										actions: ["setAttacker"]
									},
									{
										actions: ["ignoreClick"]
									}
								],
								BACK: {
									target: "selectingAttackerOrEndTurn"
								}
							}
						},
						combat: {
							on: {
								MOVE: [
									{
										guard: "hasPlayerSufficientTroopsToAttack",
										actions: ["rollTheDice"],
										target: "victoryConditionCheck"
									}
								],
								SELECT_TERRITORY: [
									{
										guard: "isPlayerAllowedToChooseAttacker",
										actions: ["setAttacker"],
										target: "selectingTarget"
									}
								],
								BACK: {
									target: "selectingTarget"
								}
							}
						},
						victoryConditionCheck: {
							always: [
								{
									guard: "attackerHasWon",
									target: "fortify"
								},
								{
									target: "combat"
								}
							]
						},
						fortify: {
							on: {
								MOVE: [
									{
										guard: "hasPlayerSufficientTroopsToFortify",
										target: "#risk.game.combat.selectingTarget",
										actions: ["fortifyTroops"]
									},
									{
										actions: ["ignoreClick"]
									}
								],
								CONTINUE: {
									target: "#risk.game.combat"
								}
							}
						}
					},
					on: {
						END_TURN: {
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
								SELECT_TERRITORY: [
									{
										guard: "isPlayerAllowedToChooseAttacker",
										actions: ["selectTerritory", "setPotentialTargetTerritories"],
										target: "selectingTarget"
									},
									{
										action: ["ignoreClick"]
									}
								]
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
								}
							}
						},
						reinforcingTroops: {
							on: {
								MOVE: {
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
