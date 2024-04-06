<template>
	<aside class="fixed bottom-20 max-w-1/2 right-20 left-20 z-10">
		<div class="flex flex-col justify-center items-center gap-2 mb-10">
			<div :class="`inline-block text-6xl font-bold text-black drop-shadow-lg`" :style="`border-bottom: 5px solid ${currentPlayer.color}; mix-blend-mode: multiply`">
				{{currentPlayer.name}}
			</div>
			<div v-if="fromTerritory || toTerritory" class="flex gap-2 justify-center items-center">
				<div v-if="fromTerritory" class="uppercase font-light inline-block text-6xl text-black drop-shadow-lg">
					{{fromTerritory}}
					<span class="text-6xl font-semibold">{{ ownership[fromTerritory].troops }}</span>
				</div>
				<template v-if="toTerritory">
					<span class="text-8xl font-thin">X</span>
					<div  class="uppercase font-light inline-block text-6xl text-black drop-shadow-lg">
						<span class="text-6xl font-semibold">{{ ownership[toTerritory].troops }}</span>
						{{toTerritory}}
					</div>
				</template>
			</div>
			<div v-if="toTerritory" :class="`inline-block text-6xl font-bold text-black drop-shadow-lg`" :style="`border-bottom: 5px solid ${players[ownership[toTerritory].player].color}; mix-blend-mode: multiply`">
				{{players[ownership[toTerritory].player].name}}
			</div>
		</div>

		<div class="flex flex-row justify-center items-center gap-2">
			<button :disabled="!nextEvents.includes(RiskEventType.BACK)"
					@click="sendEvent(RiskEventType.BACK)"
					class="flex items-center gap-3 text-2xl font-bold p-6 rounded-full hover:bg-white opacity-90 border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md"
			>
				Zurück
			</button>

			<template v-if="preGame">
				<div v-for="phase in preGame"
					 class="block text-2xl font-bold p-7 rounded-lg bg-white shadow-md"
					 :class="[phase.isActive ? `text-white !bg-black` : 'bg-white text-black opacity-80']"
				>
					{{phase.label}}
				</div>

			</template>

			<div v-else-if="game"
				v-for="phase in game"
				class="flex items-center gap-3 text-2xl font-bold p-7 rounded-lg bg-white shadow-md min-h-32"
				:class="[phase.isActive ? `text-white cursor-pointer drop-shadow-lg` : '!bg-white text-black opacity-80']"
				 :style="`background-color: ${currentPlayer.color};`"
				 @click="(phase.isActive && nextEvents.includes(RiskEventType.MOVE) && maxAvailableTroops >= 1) ? sendEvent(RiskEventType.MOVE) : (phase.isActive && nextEvents.includes(RiskEventType.MOVE) && maxAvailableTroops <= 1) && sendEvent(RiskEventType.BACK)">

				<template v-if="phase.isActive && nextEvents.includes(RiskEventType.MOVE)">
					<template v-if="maxAvailableTroops < 1 && currenState?.value?.matches('combat')">
						Rückzug

						<span>{{maxAvailableTroops}}</span>
					</template>
					<template v-else>
						<TroopsStepper
							:min="minAvailableTroops"
							:max="maxAvailableTroops"
							:inputValue="input"
							@troopsSelected="input = $event"
						/>
						{{phase.label}}
					</template>

				</template>

				<template v-else>
					{{phase.label}}
				</template>
			</div>

			<button
				@click="sendEvent(nextEvents.includes(RiskEventType.END_TURN) ? RiskEventType.END_TURN : RiskEventType.CONTINUE)"
				class="flex items-center gap-3 text-2xl font-bold p-6 rounded-full hover:bg-white opacity-90 border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md"
			>
				Weiter
			</button>
		</div>
	</aside>

	<aside hidden class="fixed bottom-20 w-1/2 right-20 z-10" v-if="nextEvents.includes(RiskEventType.END_TURN) || nextEvents.includes(RiskEventType.CONTINUE) || nextEvents.includes(RiskEventType.MOVE)">
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

	<main class="w-full h-screen">

		<div class="flex gap-2 py-8 h-full">
			<div class="w-1/4 relative" v-if="false">
				<details class="p-8 bg-[#fffffff1] shadow-md rounded-lg absolute z-10">
					<summary class="text-2xl font-bold mb-4">DEBUG</summary>
					<div class="flex flex-col gap-4 mb-4">
						<div class="flex gap-2 justify-between">
							<template v-for="event in nextBasicEvents" :key="event">
								<button
									@click="sendEvent(event)"
									class="block text-lg font-bold p-3 rounded border-2 border-slate-800 hover:bg-slate-800 hover:text-white"
								>
									{{ event }}
								</button>
							</template>
						</div>

						<div class="flex gap-2" v-if="nextEvents.includes(RiskEventType.MOVE)">
							<div class="w-1/2">
<!--								<TroopsStepper-->
<!--									:min="minAvailableTroops"-->
<!--									:max="maxAvailableTroops"-->
<!--									:inputValue="input"-->
<!--									@troopsSelected="input = $event"-->
<!--								/>-->
							</div>
							<button
								@click="sendEvent(RiskEventType.MOVE)"
								class="block w-1/2 text-lg font-bold p-3 rounded border-2 border-slate-800 hover:bg-slate-800 hover:text-white"
							>
								MOVE TROOPS
							</button>
						</div>

						<div
							v-if="currentPlayer.name"
							class="mt-4 text-white text-xl font-bold bg-slate-800 p-3 py-7 w-full rounded"
							:style="`background-color: ${currentPlayer.color}; text-shadow: 1px 2px 2px rgba(0, 0, 0, 0.2)`"
						>
							{{ currentPlayer.name }} ({{ currentPlayer.troops }})
						</div>

						<button @click="reset()" class="mt-4 text-white text-lg font-bold bg-slate-400 p-3 w-full rounded">RESET</button>
					</div>

					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Current State:</summary>
						<pre> {{ JSON.stringify(currentState.value, null, 2) }}</pre>
					</details>

					<details class="mb-4" open>
						<summary class="cursor-pointer text-xl font-semibold mb-2">Combat:</summary>
						<div class="flex gap-2">
							<div class="w-1/2">
								<p class="font-semibold">{{ fromTerritory }}</p>
								<pre>{{ ownership[fromTerritory] }}</pre>
							</div>
							<div class="w-1/2">
								<p class="font-semibold">{{ toTerritory }}</p>
								<pre>{{ ownership[toTerritory] }}</pre>
							</div>
						</div>
					</details>
					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Current Player:</summary>
						<pre> {{ JSON.stringify(currentPlayer, null, 2) }}</pre>
					</details>
					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Ownership:</summary>
						<pre> {{ JSON.stringify(ownership, null, 2) }}</pre>
					</details>
					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Players:</summary>
						<pre> {{ JSON.stringify(players, null, 2) }}</pre>
					</details>
					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Territories:</summary>
						<pre> {{ JSON.stringify(territories, null, 2) }}</pre>
					</details>
					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Next events</summary>
						<pre> {{ JSON.stringify(nextEvents, null, 2) }}</pre>
					</details>
					<details class="mb-4">
						<summary class="cursor-pointer text-xl font-semibold mb-2">Full State:</summary>
						<pre> {{ JSON.stringify(currentState, null, 2) }}</pre>
					</details>
				</details>
			</div>
			<div class="absolute z-0 px-20 top-0 right-96 left-96 max-w-full">
				<WorldMap
					@territoryClicked="handleTerritoryClick"
					:players="players"
					:ownership="ownership"
					:territories="territories"
					:fromTerritory="fromTerritory"
					:toTerritory="toTerritory"
					:colors="players.reduce((acc, player) => ({...acc, [player.index]: player.color}), {})"
				/>
			</div>
		</div>
	</main>
</template>

<script lang="ts">
	import {ref, computed} from "vue";
	import {useMachine} from "@xstate/vue";
	import riskMachine from "./states/riskMachine";
	import {Territory, Player, RiskEventType} from "./config/types";
	import {stateKey} from "./config/constants.ts";
	import WorldMap from "./components/WorldMap.vue";
	import TroopsStepper from "./components/TroopsStepper.vue";

	export default {
		name: "App",
		computed: {
			RiskEventType() {
				return RiskEventType;
			}
		},
		components: {TroopsStepper, WorldMap},
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
						player: currentState.value.context.players[player],
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
						label: (currentPlayer.value.troopsToDeploy > 0 ? currentPlayer.value.troopsToDeploy + " " : "") + "Truppen verteilen",
						isActive: currentState.value.matches("game.deployment")
					},
					{
						label: currentState.value.matches("game.combat.fortify") ? "Truppen bewegen" : "Angreifen",
						isActive: currentState.value.matches("game.combat")
					},
					{
						label: "Verschieben",
						isActive: currentState.value.matches("game.consolidation")
					}
				]
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
					},
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
