import { Machine, assign } from 'xstate';
import {TerritoryOwnership, Territory} from "../config/types.ts";

interface Context {
	currentPlayer: number;
	ownership: TerritoryOwnership;
	target: Territory;
	allBorders: [Territory, Territory[]][];
}

interface SelectTerritoryEvent {
	territory: Territory;
}

const riskMachine = Machine<Context>({
	id: 'risk',
	initial: 'selectingAttacker',
	context: {
		currentPlayer: 1, // Assuming player 1 starts
		ownership: {}, // Populate with actual ownership data
		attacker: "",
		target: "",
		allBorders: [], // Populate with actual border data
	},
	states: {
		selectingAttacker: {
			on: {
				TERRITORY_CLICKED: [
					{
						cond: 'isPlayerAllowedToChooseAttacker',
						actions: ['setAttacker'],
						target: 'selectingTarget',
					},
					{
						actions: 'ignoreClick',
					},
				],
			},
		},
		selectingTarget: {
			on: {
				TERRITORY_CLICKED: [
					{
						cond: 'isPlayerAllowedToAttack',
						actions: ['startCombatMode'],
						target: 'selectingAttacker',
					},
					{
						target: 'selectingAttacker',
					},
				],
			},
		},
		combat: {
			// Define combat state here
		},
	},
}, {
	guards: {
		isPlayerAllowedToChooseAttacker: ({context, event}: { context: Context, event: { attacker: number }} ) => {
			const territory = event.target;
			const owner = context.ownership[territory];
			return owner && owner.player === context.currentPlayer;
		},
		isPlayerAllowedToAttack: ({context, event}: { context: Context, event: { target: number }}) => {
			const attackerTerritory = context.attacker;
			const targetTerritory = event.target;

			// Check if the attacker territory can be mapped inside allBorders to the target country
			return context.allBorders.some(([territory, adjacentTerritories]) => {
				if (territory === attackerTerritory) {
					return adjacentTerritories.includes(targetTerritory);
				}
				return false;
			});
		},
	},
	actions: {
		setAttacker: assign({
			attacker: (_, event: SelectTerritoryEvent) => event.territory,
		}),
		setTarget: assign({
			target: (_, event: SelectTerritoryEvent) => event.territory,
		}),
		ignoreClick: ({ event }:  { event: SelectTerritoryEvent }) => {
			console.log("Cannot select attacker", event.territory)
		},
		startCombatMode: ({ context }: { context: Context }) => {
			console.log("Attacking", context.attacker, "from", context.target);
		}
	},
});
