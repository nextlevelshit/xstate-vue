<template>
	<main class="w-full max-md:h-screen max-md:overflow-scroll max-md:mb-60">
		<WorldMap
			@territoryClicked="handleTerritoryClick"
			:players="players"
			:ownership="ownership"
			:territories="territories"
			:fromTerritory="fromTerritory"
			:toTerritory="toTerritory"
		/>
	</main>

	<aside
		class="lg:sticky fixed bottom-3 max-md:left-2 max-md:right-2 lg:bottom-8 lg:my-20 flex flex-col items-center justify-center z-10 gap-4"
		style="perspective: 800px; perspective-origin: 50% 50%"
	>
		<div
			class="flex flex-col justify-between p-4 lg:p-6 rounded-2xl lg:rounded-full shadow-2xl w-full lg:w-2/3"
			style="background: rgba(255, 255, 255, 0.9); transform: rotateX(12deg); backdrop-filter: blur(20px); min-height: 18rem"
		>
			<Ownership
				v-if="!preGame && game"
				:current-player="currentPlayer"
				:territories="territories"
				class="w-16 lg:w-60 absolute left-3 lg:left-12 bottom-auto top-4 lg:top-auto lg:bottom-8"
			/>

			<button
				:class="[currentState.matches({game: {deployment: 'selectingTerritoryOrTradeCards'}}) ? 'bg-black text-white' : '']"
				@click="currentState.matches({game: {deployment: 'selectingTerritoryOrTradeCards'}}) && send({type: RiskEventType.TRADE})"
				v-if="currentPlayer?.cards"
				class="flex items-center justify-center gap-2 lg:gap-4 absolute right-3 lg:right-12 bottom-auto top-4 lg:top-auto lg:bottom-28 text-xl lg:text-5xl font-bold p-1 lg:p-4 px-4 lg:px-8 rounded-full"
			>
				{{ currentPlayer?.cards.reduce((acc, cur) => acc + cur?.stars, 0) }}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					xmlns:xlink="http://www.w3.org/1999/xlink"
					class="w-5 h-5 lg:w-12 lg:h-12"
					height="100%"
					width="100%"
					version="1.1"
					id="Capa_1"
					viewBox="0 0 473.486 473.486"
					xml:space="preserve"
				>
					<polygon
						fill="currentColor"
						points="473.486,182.079 310.615,157.952 235.904,11.23 162.628,158.675 0,184.389 117.584,299.641 91.786,462.257   237.732,386.042 384.416,460.829 357.032,298.473 "
					/>
				</svg>
			</button>

			<div class="flex flex-col justify-center items-center gap-10 lg:gap-4 mb-2">
				<div class="flex justify-center items-center text-nowrap w-full lg:gap-8">
					<div
						class="text-lg lg:text-5xl font-bold text-black drop-shadow lg:drop-shadow-sm"
						:class="[
							toTerritory &&
							ownership[toTerritory].troops > 0 &&
							ownership[toTerritory].player !== ownership[fromTerritory].player
								? 'text-right w-1/2'
								: ''
						]"
						:style="`text-decoration: underline ${currentPlayer?.color} 3px;`"
					>
						{{ currentPlayer?.name }}
					</div>
					<template
						v-if="
							toTerritory &&
							ownership[toTerritory].troops > 0 &&
							ownership[toTerritory].player !== ownership[fromTerritory].player
						"
					>
						<div
							class="text-lg lg:text-5xl font-bold text-black drop-shadow-sm w-1/2"
							:style="`text-decoration: underline ${players[ownership[toTerritory].player].color} 3px;`"
						>
							{{ players[ownership[toTerritory].player].name }}
						</div>
					</template>
				</div>
				<div v-if="fromTerritory || toTerritory" class="flex gap-2 justify-center items-center">
					<div
						v-if="fromTerritory"
						class="flex justify-center items-center gap-2 lg:gap-3 uppercase font-light text-sm lg:text-4xl text-black drop-shadow-lg"
					>
						{{ fromTerritory }}
						<span
							v-if="
								!toTerritory ||
								(toTerritory && ownership[toTerritory].player !== ownership[fromTerritory].player) ||
								(toTerritory && ownership[toTerritory].troops > 0)
							"
							class="text-2xl lg:text-5xl font-semibold"
						>{{ ownership[fromTerritory].troops }}</span
						>
					</div>
					<template v-if="toTerritory && ownership[toTerritory].troops > 0">
						<span v-if="ownership[toTerritory].player !== ownership[fromTerritory].player"
							  class="text-4xl lg:text-8xl font-thin">X</span>
						<Continue v-else class="w-3 h-3 lg:w-8 lg:h-8" />
						<div
							class="flex justify-center items-center gap-2 lg:gap-3 uppercase font-light text-sm lg:text-4xl text-black drop-shadow-lg">
							<span class="text-2xl lg:text-5xl font-semibold">{{ ownership[toTerritory].troops }}</span>
							{{ toTerritory }}
						</div>
					</template>
					<template v-else-if="toTerritory">
						<div
							class="inline-block uppercase font-semibold text-2xl lg:text-4xl text-black drop-shadow-lg">
							gewinnt
						</div>
					</template>
				</div>
			</div>

			<div class="flex flex-row justify-center items-center gap-2">
				<button
					:disabled="!nextEvents.includes(RiskEventType.BACK)"
					@click="sendEvent(RiskEventType.BACK)"
					:class="[
						nextEvents.includes(RiskEventType.BACK)
							? 'cursor-pointer hover:bg-white opacity-90 border-2 lg:border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md active:translate-y-[1px] active:drop-shadow-sm'
							: 'cursor-default pointer-events-none opacity-20'
					]"
					class="flex items-center gap-3 font-bold p-3 lg:p-6 rounded-full hover:bg-white opacity-90 border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md active:translate-y-[1px] active:drop-shadow-sm"
				>
					<Back class="h-6 lg:h-8" />
				</button>

				<template v-if="preGame">
					<button
						v-for="phase in preGame"
						class="flex items-center text-nowrap gap-2 lg:gap-3 text-md lg:text-xl font-bold p-2 lg:p-3 rounded-lg bg-white shadow-sm min-h-16 lg:min-h-24"
						:class="[phase.isActive ? `text-white !bg-black` : 'bg-white text-black opacity-20 max-md:hidden']"
						@click="
            phase.isActive && nextEvents.includes(RiskEventType.MOVE)
                ? sendEvent(RiskEventType.MOVE)
                : sendEvent(RiskEventType.CONTINUE)
        "
					>
						<template v-if="phase.isActive && nextEvents.includes(RiskEventType.MOVE)">
							<TroopsStepper :min="2" :max="6" :inputValue="input" @troopsSelected="input = $event" />
							{{ phase.label }}
						</template>
						<template v-else>{{ phase.label }}</template>
					</button>
				</template>

				<button
					v-else-if="game"
					v-for="phase in game"
					class="text-nowrap items-center gap-3 text-xl lg:text-xl font-bold p-2 lg:p-3 rounded-lg bg-white shadow-sm lg:min-h-24"
					:class="[
						phase.isActive
							? `flex text-white cursor-pointer hover:drop-shadow-lg active:translate-y-[1px] active:drop-shadow-sm hover:outline-current outline-opacity-20 hover:outline-8`
							: '!bg-white text-gray-300 opacity-40 cursor-default shadow-lg max-md:hidden'
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
						<template v-if="maxAvailableTroops < 1 && currentState?.matches({game: 'combat'})"> Rückzug
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
					class="flex items-center gap-3 font-bold p-3 lg:p-6 rounded-full hover:bg-white opacity-90 border-4 border-transparent hover:opacity-100 hover:border-white hover:shadow-md active:translate-y-[1px] active:drop-shadow-sm"
				>
					<Continue class="h-6 lg:h-8" />
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
	import {getInitialSnapshot} from "xstate";

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
			const initialState = initialContext ? JSON.parse(initialContext) : getInitialSnapshot(riskMachine);

			const {snapshot, send} = useMachine(riskMachine, {
				snapshot: initialState
			});

			const currentState = computed(() => snapshot.value);
			const fromTerritory = computed<Territory>(() => currentState.value.context.fromTerritory as Territory);
			const toTerritory = computed<Territory>(() => currentState.value.context.toTerritory as Territory);

			const players = computed<Array<Player & {index: number; troops: number}>>(() => {
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
				return players.value[currentPlayer];
			});

			const ownership = computed(() => {
				return currentState.value.context.ownership;
			});

			const territories = computed<{
				territory: Territory;
				player: Player & {index: number};
				troops?: number
			}[]>(() => {
				const allTerritories = currentState.value.context.allTerritories.sort((a, b) => (a > b ? 1 : -1));
				return allTerritories.map((territory) => {
					const ownership = currentState.value.context.ownership[territory as Territory];
					if (!ownership) return {territory, player: {} as Player & {index: number}, troops: 0};
					const {player, troops} = ownership;
					return {
						territory,
						player: players.value[player],
						troops
					};
				});
			});

			const minAvailableTroops = computed<number>(() => {
				if (currentState.value.matches({game: {combat: "fortify"}})) {
					return Math.min(ownership.value[fromTerritory.value].troops - 1, currentState.value.context.attackerTroops);
				}
				return 1;
			});

			const maxAvailableTroops = computed<number>(() => {
				if (currentState.value.matches({game: {combat: "fortify"}})) {
					return ownership.value[fromTerritory.value].troops - 1;
				} else if (currentState.value.matches({game: "deployment"})) {
					return currentPlayer.value.troopsToDeploy;
				} else if (currentState.value.matches({game: "combat"})) {
					return Math.min(3, ownership.value[fromTerritory.value].troops - 1);
				} else if (currentState.value.matches({game: "consolidation"})) {
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
						label:
							(currentState.value.matches({game: "deployment"}) ? currentPlayer.value.troopsToDeploy + " " : "") +
							"Verteilen",
						isActive: currentState.value.matches({game: "deployment"})
					},
					{
						label: currentState.value.matches({game: {combat: "fortify"}}) ? "verschieben" : "Angreifen",
						isActive: currentState.value.matches({game: "combat"})
					},
					{
						label: "Befestigen",
						isActive: currentState.value.matches({game: "consolidation"})
					}
				];
			});

			const preGame = computed(() => {
				if (!currentState.value.matches("setup")) return null;

				const phases = [
					{
						label: "Anzahl Spieler",
						isActive: currentState.value.matches({setup: "selectPlayers"})
					},
					{
						label: "Erster Spieler",
						isActive: currentState.value.matches({setup: "firstPlayer"})
					},
					{
						label: "Territorien",
						isActive: currentState.value.matches({setup: "territoryAssignment"})
					},
					{
						label: "Truppen",
						isActive: currentState.value.matches({setup: "initialDeployment"})
					},
					{
						label: "START",
						isActive: currentState.value.matches({setup: "preparationComplete"})
					}
				];
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

			window.addEventListener("keydown", (event) => {
				switch (event.code) {
					case "Escape":
						reset();
						break;
					case "ArrowRight":
						if (basicEvents.includes(RiskEventType.END_TURN)) {
							sendEvent(RiskEventType.END_TURN);
						} else if (basicEvents.includes(RiskEventType.CONTINUE)) {
							sendEvent(RiskEventType.CONTINUE);
						}
						break;
					case "ArrowLeft":
						sendEvent(RiskEventType.BACK);
						break;
					case "Enter":
						sendEvent(RiskEventType.MOVE);
				}
			});

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
	@media (max-width: 768px) {
		svg#svg1 {
			width: 300vw;
		}
	}
</style>
