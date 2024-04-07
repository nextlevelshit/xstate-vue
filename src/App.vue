<template>
	<main class="w-full">
		<aside
			hidden
			class="fixed bottom-20 w-1/2 right-20 z-10"
			v-if="
				nextEvents.includes(RiskEventType.END_TURN) ||
				nextEvents.includes(RiskEventType.CONTINUE) ||
				nextEvents.includes(RiskEventType.MOVE)
			"
		>
			<div class="flex gap-8 items-center justify-end text-nowrap">
				<template v-if="nextEvents.includes(RiskEventType.MOVE)">
					<TroopsStepper
						:min="minAvailableTroops"
						:max="maxAvailableTroops"
						:inputValue="input"
						@troopsSelected="input = $event"
					/>

					<button
						@click="sendEvent(RiskEventType.MOVE)"
						class="block text-2xl font-bold p-7 rounded-lg bg-white shadow-md hover:bg-black hover:text-white hover:shadow-3xl"
					>
						Truppen bewegen
					</button>
				</template>
			</div>
		</aside>

			<WorldMap
				@territoryClicked="handleTerritoryClick"
				:players="players"
				:ownership="ownership"
				:territories="territories"
				:fromTerritory="fromTerritory"
				:toTerritory="toTerritory"
				:colors="players.reduce((acc, player) => ({...acc, [player.index]: player.color}), {})"
			/>
	</main>

	<aside
		class="sticky bottom-20 my-20 flex flex-col items-center justify-center z-10"
		style="perspective: 800px; perspective-origin: 50% 50%"
	>
		<div
			class="flex flex-col justify-between p-16 rounded-3xl shadow-2xl w-2/3"
			style="background: rgba(255, 255, 255, 0.9); transform: rotateX(18deg); backdrop-filter: blur(20px); min-height: 20vh"
		>
			<Ownership v-if="!preGame && game" :current-player="currentPlayer" :territories="territories" class="w-48 h-48 absolute right-12 top-12"/>
			<div class="flex flex-col justify-center items-center gap-4 mb-10">
				<div class="flex justify-center items-center text-nowrap w-full gap-8">
					<div
						class="text-6xl font-bold text-black drop-shadow-sm"
						:class="[(toTerritory && ownership[toTerritory].troops > 0) && ownership[toTerritory].player !== ownership[fromTerritory].player ? 'text-right w-1/2' : '']"
						:style="`text-decoration: underline ${currentPlayer.color} 5px;`"
					>
						{{ currentPlayer.name }}
					</div>
					<template v-if="(toTerritory && ownership[toTerritory].troops > 0) && ownership[toTerritory].player !== ownership[fromTerritory].player">
						<div
							class="text-6xl font-bold text-black drop-shadow-sm w-1/2"
							:style="`text-decoration: underline ${players[ownership[toTerritory].player].color} 5px;`"
						>
							{{ players[ownership[toTerritory].player].name }}
						</div>
					</template>
				</div>
				<div v-if="fromTerritory || toTerritory" class="flex gap-2 justify-center items-center">
					<div v-if="fromTerritory" class="flex justify-center items-center gap-3 uppercase font-light inline-block text-4xl text-black drop-shadow-lg">
						{{ fromTerritory }}
						<span v-if="!toTerritory || toTerritory && ownership[toTerritory].player !== ownership[fromTerritory].player || (toTerritory && ownership[toTerritory].troops > 0)" class="text-6xl font-semibold">{{ ownership[fromTerritory].troops }}</span>
					</div>
					<template v-if="toTerritory && ownership[toTerritory].troops > 0">
						<span v-if="ownership[toTerritory].player !== ownership[fromTerritory].player" class="text-8xl font-thin">X</span>
						<Continue v-else class="w-8 h-8" />
						<div class="flex justify-center items-center gap-3 uppercase font-light text-4xl text-black drop-shadow-lg">
							<span class="text-6xl font-semibold">{{ ownership[toTerritory].troops }}</span>
							{{ toTerritory }}
						</div>
					</template>
					<template v-else-if="toTerritory">
						<div class="inline-block uppercase font-semibold text-4xl text-black drop-shadow-lg">
							gewinnt
						</div>
					</template>
				</div>
<!--				<div-->
<!--					v-if="toTerritory && toTerritory && ownership[toTerritory].troops > 0 && ownership[toTerritory].player !== ownership[fromTerritory].player"-->
<!--					:class="`inline-block text-4xl font-bold text-black drop-shadow-md`"-->
<!--					:style="`border-bottom: 5px solid ${players[ownership[toTerritory].player].color}; mix-blend-mode: multiply`"-->
<!--				>-->
<!--					{{ players[ownership[toTerritory].player].name }}-->
<!--				</div>-->
			</div>

			<div class="flex flex-row justify-center items-center gap-2">
				<button
					:disabled="!nextEvents.includes(RiskEventType.BACK)"
					@click="sendEvent(RiskEventType.BACK)"
					:class="[
						nextEvents.includes(RiskEventType.BACK)
							? 'cursor-pointer hover:bg-white opacity-90 border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md active:translate-y-[1px] active:drop-shadow-sm'
							: 'cursor-default pointer-events-none'
					]"
					class="flex items-center gap-3 text-2xl font-bold p-6 rounded-full"
				>
					<Back class="h-8" />
				</button>

				<template v-if="preGame">
					<div
						v-for="phase in preGame"
						class="block text-2xl font-bold p-7 rounded-lg bg-white shadow-md"
						:class="[phase.isActive ? `text-white !bg-black` : 'bg-white text-black opacity-80']"
					>
						{{ phase.label }}
					</div>
				</template>

				<button
					v-else-if="game"
					v-for="phase in game"
					class="flex items-center gap-3 text-2xl font-bold p-7 rounded-lg bg-white shadow-sm min-h-32"
					:class="[
						phase.isActive
							? `text-white cursor-pointer hover:drop-shadow-lg active:translate-y-[1px] active:drop-shadow-sm hover:outline-current outline-opacity-20 hover:outline-8`
							: '!bg-white text-gray-300 opacity-80 cursor-default shadow-lg'
					]"
					:style="`background-color: ${currentPlayer.color}; outline-color: ${currentPlayer.color}`"
					@click="
						phase.isActive && nextEvents.includes(RiskEventType.MOVE) && maxAvailableTroops >= 1
							? sendEvent(RiskEventType.MOVE)
							: phase.isActive &&
								nextEvents.includes(RiskEventType.MOVE) &&
								maxAvailableTroops <= 1 &&
								sendEvent(RiskEventType.BACK)
					"
				>
					<template v-if="phase.isActive && nextEvents.includes(RiskEventType.MOVE)">
						<template v-if="maxAvailableTroops < 1 && currenState?.matches('combat')">
							Rückzug
							<span>{{ maxAvailableTroops }}</span>
						</template>
						<template v-else>
							<TroopsStepper
								:min="minAvailableTroops"
								:max="maxAvailableTroops"
								:inputValue="input"
								@troopsSelected="input = $event"
							/>
							{{ phase.label }}
						</template>
					</template>

					<template v-else>
						{{ phase.label }}
					</template>
				</button>

				<button
					@click="sendEvent(nextEvents.includes(RiskEventType.END_TURN) ? RiskEventType.END_TURN : RiskEventType.CONTINUE)"
					class="flex items-center gap-3 text-2xl font-bold p-6 rounded-full hover:bg-white opacity-90 border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md active:translate-y-[1px] active:drop-shadow-sm"
				>
					<Continue class="h-8" />
				</button>
			</div>
		</div>
	</aside>
</template>

<script lang="ts">
	import {ref, computed} from "vue";
	import {useMachine} from "@xstate/vue";
	import riskMachine from "./states/riskMachine";
	import {Territory, Player, RiskEventType} from "./config/types";
	import {stateKey} from "./config/constants.ts";
	import WorldMap from "./components/WorldMap.vue";
	import TroopsStepper from "./components/TroopsStepper.vue";
	import Back from "./components/Back.vue";
	import Continue from "./components/Continue.vue";
	import Ownership from "./components/Ownership.vue";

	export default {
		name: "App",
		computed: {
			RiskEventType() {
				return RiskEventType;
			}
		},
		components: {Ownership, Continue, Back, TroopsStepper, WorldMap},
		methods: {
			handleTerritoryClick(territory: Territory) {
				const event = {
					type: RiskEventType.SELECT_TERRITORY,
					territory
				};
				console.log("<<", event);
				this.send(event);
			}
		},
		setup() {
			const initialContext = localStorage.getItem(stateKey);
			const initialState = initialContext ? JSON.parse(initialContext) : riskMachine.getInitialSnapshot();

			const {snapshot, send} = useMachine(riskMachine, {
				snapshot: initialState
			});

			const currentState = computed(() => snapshot.value);
			const fromTerritory = computed<Territory>(() => currentState.value.context.fromTerritory as Territory);
			const toTerritory = computed<Territory>(() => currentState.value.context.toTerritory as Territory);

			const players = computed<Array<Player & {index: number}>>(() => {
				const {ownership, players} = currentState.value.context;

				if (!players) return [];

				return players.map((player, index) => {
					const territories = Object.keys(ownership).filter((territory) => ownership[territory as Territory].player === index);
					const troops = territories.reduce((acc, territory) => acc + ownership[territory as Territory].troops, 0);
					return {
						...player,
						troops,
						territories,
						index
					};
				});
			});

			const currentPlayer = computed(() => {
				const {currentPlayer} = currentState.value.context;
				return {
					// index: currentPlayer,
					...players.value[currentPlayer]
				};
			});

			const ownership = computed(() => {
				return currentState.value.context.ownership;
			});

			const territories = computed(() => {
				const allTerritories = currentState.value.context.allTerritories.sort((a, b) => (a > b ? 1 : -1));
				return allTerritories.map((territory) => {
					const ownership = currentState.value.context.ownership[territory as Territory];
					if (!ownership) return {territory, player: -1, troops: 0};
					const {player, troops} = currentState.value.context.ownership[territory as Territory];
					return {
						territory,
						player: players.value[player],
						troops: troops
					};
				});
			});

			const minAvailableTroops = computed<number>(() => {
				if (currentState.value.matches("game.combat.fortify")) {
					return Math.min(ownership.value[fromTerritory.value].troops - 1, currentState.value.context.attackerTroops);
				}
				return 1;
			});

			const maxAvailableTroops = computed<number>(() => {
				if (currentState.value.matches("game.combat.fortify")) {
					return ownership.value[fromTerritory.value].troops - 1;
				} else if (currentState.value.matches("game.deployment")) {
					return currentPlayer.value.troopsToDeploy;
				} else if (currentState.value.matches("game.combat")) {
					return Math.min(3, ownership.value[fromTerritory.value].troops - 1);
				} else if (currentState.value.matches("game.consolidation")) {
					return ownership.value[fromTerritory.value].troops - 1;
				}
				return 0;
			});

			const nextEvents = computed<RiskEventType[]>(() => {
				return [...new Set([...currentState.value._nodes.flatMap((sn) => sn.ownEvents)])] as RiskEventType[];
			});

			const basicEvents = [RiskEventType.BACK, RiskEventType.CONTINUE, RiskEventType.END_TURN];

			const nextBasicEvents = computed<RiskEventType[]>(() => {
				return nextEvents.value.filter((event) => basicEvents.includes(event));
			});

			const game = computed(() => {
				return [
					{
						label: "Verteilen",
						isActive: currentState.value.matches("game.deployment")
					},
					{
						label: currentState.value.matches("game.combat.fortify") ? "Truppen verschieben" : "Angreifen",
						isActive: currentState.value.matches("game.combat")
					},
					{
						label: "Befestigen",
						isActive: currentState.value.matches("game.consolidation")
					}
				];
			});

			const preGame = computed(() => {
				if (!currentState.value.matches("setup")) return null;

				const phases = [
					{
						label: "Erster Spieler",
						isActive: currentState.value.matches("setup.firstPlayer")
					},
					{
						label: "Territorien verteilen",
						isActive: currentState.value.matches("setup.territoryAssignment")
					},
					{
						label: "Truppen verteilen",
						isActive: currentState.value.matches("setup.initialDeployment")
					}
				];

				// if (currentState.value.matches("setup.preparationComplete")) {
				// 	phases.push({
				// 		label: "Go go go!",
				// 		isActive: true
				// 	})
				// }
				return phases;
			});

			const input = ref(1);
			const sendEvent = (event: RiskEventType) => {
				const eventData: any = {type: event};

				switch (event) {
					case RiskEventType.MOVE:
						eventData["troops"] = input.value;
						break;
					default:
						console.log("No data to append to event", event);
				}

				console.log("<<", eventData);
				send(eventData);
				localStorage.setItem(stateKey, JSON.stringify(currentState.value));
			};

			const reset = () => {
				const isResetConfirmed = window.confirm("Are you sure, you want to reset?");
				if (isResetConfirmed) {
					localStorage.removeItem(stateKey);
					window.location.reload();
				}
			};

			return {
				currentState,
				currentPlayer,
				ownership,
				territories,
				players,
				input,
				sendEvent,
				reset,
				send,
				fromTerritory,
				toTerritory,
				nextEvents,
				basicEvents,
				nextBasicEvents,
				maxAvailableTroops,
				minAvailableTroops,
				game,
				preGame
			};
		}
	};
</script>

<style>
	/* No additional styles needed */
</style>
