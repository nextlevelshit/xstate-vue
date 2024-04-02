<template>

  <main class="w-full h-screen">
    <div class="flex gap-2 py-8 h-full">
      <div class="w-1/4">
        <div class="p-8 bg-white shadow-md rounded-lg">
          <h1 class="text-2xl font-bold mb-4">Risk Game State Machine Monitor</h1>
          <div class="flex flex-col gap-4 mb-4">
            <div class="flex gap-2 justify-between">
              <template v-for="event in nextBasicEvents" :key="event">
                  <button @click="sendEvent(event)" class="block text-lg font-bold p-3 rounded border-2 border-slate-800 hover:bg-slate-800 hover:text-white">
                    {{event}}
                  </button>
              </template>
            </div>

            <div class="flex gap-2" v-if="nextEvents.includes(RiskEventType.MOVE)">
              <div class="w-1/2">
                <TroopsStepper :maxAvailableTroops="maxAvailableTroops" :inputValue="input" @troopsSelected="input = $event" />
              </div>
              <button @click="sendEvent(RiskEventType.MOVE)" class="block w-1/2 text-lg font-bold p-3 rounded border-2 border-slate-800 hover:bg-slate-800 hover:text-white">MOVE TROOPS</button>
            </div>

            <div v-if="currentPlayer.name"
                 class="mt-4 text-white text-xl font-bold bg-slate-800 p-3 py-7 w-full rounded"
                 :style="`background-color: ${currentPlayer.color}; text-shadow: 1px 2px 2px rgba(0, 0, 0, 0.2)`">{{currentPlayer.name}} ({{currentPlayer.troops}})
            </div>

            <button @click="reset()"
                    class="mt-4 text-white text-lg font-bold bg-slate-400 p-3 w-full rounded">RESET
            </button>
          </div>

          <details class="mb-4" open>
            <summary class="cursor-pointer text-xl font-semibold mb-2">Current State:</summary>
            <pre> {{ JSON.stringify(currentState.value, null, 2) }}</pre>
          </details>

          <details class="mb-4">
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
        </div>
      </div>
      <div class="w-3/4 z-0 h-full">
        <WorldMap @territoryClicked="handleTerritoryClick" :players="players" :ownership="ownership" :territories="territories" :colors="players.reduce((acc, player) => ({...acc, [player.index]: player.color}), {})"/>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import {ref, computed} from 'vue';
import {useMachine} from '@xstate/vue';
import riskMachine from './states/riskMachine';
import {Territory, Player, RiskEventType} from './config/types';
import {stateKey} from "./config/constants.ts";
import WorldMap from "./components/WorldMap.vue";
import TroopsStepper from "./components/TroopsStepper.vue";

export default {
  name: 'App',
  computed: {
    RiskEventType() {
      return RiskEventType
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

    const players = computed<Array<Player & { index: number}>>(() => {
      const {ownership, players} = currentState.value.context;

      return players.map((player, index) => {
        const territories = Object.keys(ownership).filter(territory => ownership[territory as Territory].player === index);
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
        ...players.value[currentPlayer],
      };
    });

    const ownership = computed(() => {
      return currentState.value.context.ownership;
    });

    const territories = computed(() => {
      const allTerritories = currentState.value.context.allTerritories.sort((a, b) => (a > b ? 1 : -1));
      return allTerritories.map(territory => {
        const ownership = currentState.value.context.ownership[territory as Territory];
        if (!ownership) return ({territory, player: -1, troops: 0});
        const {player, troops} = currentState.value.context.ownership[territory as Territory];
        return {
          territory,
          player: currentState.value.context.players[player],
          troops: troops
        };
      });
    });

    const territoriesDropdown = computed(() => {
      if (currentState.value.matches("game")) {
        const allBorders = currentState.value.context.allBorders;
        if (currentState.value.matches("game.deyploment") || currentState.value.matches("combat.selectingAttackerOrEndTurn")) {
          return territories.value.filter(({territory}) => {
            return ownership.value[territory].player === currentPlayer.value.index;
          });
        } else if (currentState.value.matches("combat")) {
          const attacker = currentState.value.context.fromTerritory;
          return territories.value.filter(({territory}) => {
            return attacker && new Map(allBorders).get(attacker)?.includes(territory) && ownership.value[territory].player !== currentPlayer.value.index;
          });
        }
      }
      return territories.value;
    });

    const maxAvailableTroops = computed<number>(() => {
      if (currentState.value.matches("game.deployment")) {
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

    const basicEvents = [
      RiskEventType.BACK,
      RiskEventType.CONTINUE,
      RiskEventType.END_TURN,
    ];

    const nextBasicEvents = computed<RiskEventType[]>(() => {
      return nextEvents.value.filter(event => basicEvents.includes(event))
    });

    const input = ref(1);
    const sendEvent = (event: RiskEventType) => {
      const eventData: any = {type: event};

      switch (event) {
        case RiskEventType.MOVE:
          eventData['troops'] = input.value;
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
    }

    return {
      currentState,
      currentPlayer,
      ownership,
      territories,
      territoriesDropdown,
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
      maxAvailableTroops
    };
  }
};
</script>

<style>
/* No additional styles needed */
</style>
