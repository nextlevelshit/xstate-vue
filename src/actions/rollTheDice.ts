import {assign} from "xstate";
import {Context, Territory, RiskEvent} from "../config/types.ts";
import {randomIntFromInterval} from "../util/randomIntFromInterval.ts";
import {diceInterval} from "../config/constants.ts";
import type {EventObject} from "xstate";

export const rollTheDice = assign<Context, RiskEvent, any, EventObject, never>({
	ownership: ({context, event}) => {
		const attackerTroops = event.troops;
		if (!attackerTroops) throw new Error("No troops to attack with");
		const defenderTroops = Math.min(attackerTroops, context.ownership[context.toTerritory as Territory].troops);
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
				console.log("Attacker wins:", context.fromTerritory, attackerDice[i], defenderDice[i]);
				ownership[context.toTerritory as Territory].troops--;
			} else {
				// Defender wins or it's a tie, decrease attacker's troops
				console.log("Defender wins:", context.toTerritory, attackerDice[i], defenderDice[i]);
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
});
