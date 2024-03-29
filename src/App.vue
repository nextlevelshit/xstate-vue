<template>
  <div id="app" class="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
    <div class="container max-w-xl p-8 bg-white shadow-md rounded-lg">
      <h1 class="text-2xl font-bold mb-4">Risk Game State Machine Monitor</h1>
      <div class="flex flex-col gap-2 mb-4">
        <template v-for="event in events" :key="event">
          <label :for="event" class="cursor-pointer">
            <input type="radio" :id="event" v-model="selectedEvent" :value="event" class="hidden"/>
            <span :class="{'bg-slate-800 text-white': event === selectedEvent}"
                  class="block text-lg font-bold p-3 rounded border-2 border-slate-800 hover:bg-slate-800 hover:text-white">{{
                event
              }}</span>
          </label>
        </template>
      </div>
      <div class="flex flex-col gap-2 mb-4">
        <template v-if="eventInputs[selectedEvent]">
          <template v-for="inputType in eventInputs[selectedEvent]">
            <h2 class="text-xl font-semibold my-2">Select {{ inputType }}:</h2>
            <input v-if="inputType === 'troops'" v-model="input" type="number" placeholder=""
                   class="text-lg font-bold bg-white p-3 w-full rounded border-2 border-slate-800"/>
            <select v-else-if="inputType === 'territory'" v-model="selectedTerritory"
                    class="text-lg font-bold bg-white p-3 w-full rounded border-2 border-slate-800">
              <option v-for="({territory, player, troops}, i) in territoriesDropdown" :key="i" :value="territory">
                {{ territory }} ({{ troops }}) {{player.name}}
              </option>
            </select>
          </template>
        </template>
        <button @click="sendEvent(selectedEvent)"
                class="mt-4 text-white text-xl font-bold bg-slate-800 p-3 py-7 w-full rounded"
                :style="`background-color: ${currentPlayer.color}`">SUBMIT
        </button>
        <button @click="reset()"
                class="mt-4 text-white text-lg font-bold bg-slate-400 p-3 w-full rounded">RESET
        </button>
      </div>
      <details class="mb-4" open>
        <summary class="cursor-pointer text-xl font-semibold mb-2">State:</summary>
        <pre> {{ JSON.stringify(currentState.value, null, 2) }}</pre>
      </details>
      <details class="mb-4" open>
        <summary class="cursor-pointer text-xl font-semibold mb-2">Current Player:</summary>
        <pre> {{ JSON.stringify(currentPlayer, null, 2) }}</pre>
      </details>
      <details class="mb-4">
        <summary class="cursor-pointer text-xl font-semibold mb-2">Combat:</summary>
        <div class="flex gap-2">
          <div class="w-1/2">
            <p class="font-semibold">{{ currentState.context.attacker }}</p>
            <pre>{{ ownership[currentState.context.attacker as Territory] }}</pre>
          </div>
          <div class="w-1/2">
            <p class="font-semibold">{{ currentState.context.target }}</p>
            <pre>{{ ownership[currentState.context.target as Territory] }}</pre>
          </div>
        </div>
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
    </div>
  </div>
</template>

<script lang="ts">
import {ref, computed} from 'vue';
import {useMachine} from '@xstate/vue';
import riskMachine, {RiskEventType} from './states/riskMachine';
import type {Territory} from './config/types';
import {stateKey} from "./config/constants.ts"; // Import Territory type if necessary

export default {
  name: 'App',
  setup() {
    const initialContext = localStorage.getItem(stateKey);
    const initialState = initialContext ? JSON.parse(initialContext) : riskMachine.getInitialSnapshot();

    const {snapshot, send} = useMachine(riskMachine, {
      snapshot: initialState
    });

    const currentState = computed(() => snapshot.value);

    const players = computed(() => {
      const {ownership, players} = currentState.value.context;

      return players.map((player, index) => {
        const territories = Object.keys(ownership).filter(territory => ownership[territory as Territory].player === index);
        const troops = territories.reduce((acc, territory) => acc + ownership[territory as Territory].troops, 0);
        return {
          ...player,
          troops,
          territories
        };
      });
    });

    const currentPlayer = computed(() => {
      const {currentPlayer} = currentState.value.context;
      return {
        index: currentPlayer,
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
      if (currentState.value.value["game"]) {
        const allBorders = currentState.value.context.allBorders;
        if (currentState.value.value.game["deployment"] || currentState.value.value.game["combat"] === "selectingAttackerOrEndTurn") {
          return territories.value.filter(({territory}) => {
            return ownership.value[territory].player === currentPlayer.value.index;
          });
        } else if (currentState.value.value.game["combat"]) {
          const attacker = currentState.value.context.attacker;
          return territories.value.filter(({territory}) => {
            return attacker && new Map(allBorders).get(attacker)?.includes(territory) && ownership.value[territory].player !== currentPlayer.value.index;
          });
        }
      }
      return territories.value;
    });

    const eventInputs: { [key in RiskEventType]?: string[] } = {
      [RiskEventType.ASSIGN_FIRST_PLAYER]: [],
      [RiskEventType.ASSIGN_TERRITORIES]: [],
      [RiskEventType.ASSIGN_TROOPS]: [],
      [RiskEventType.START_GAME]: [],
      [RiskEventType.TERRITORY_CLICKED]: ['territory'],
      [RiskEventType.DEPLOY_TROOPS]: ['troops'],
      [RiskEventType.ATTACK]: ['troops'],
      [RiskEventType.BACK]: [],
      [RiskEventType.END_TURN]: [],
    };

    const events = Object.keys(eventInputs) as RiskEventType[];

    const selectedEvent = ref<RiskEventType>(RiskEventType.ASSIGN_FIRST_PLAYER);
    const input = ref("1");
    const selectedTerritory = ref<Territory | null>(null);
    const sendEvent = (event: RiskEventType) => {
      const eventData: any = {type: event};
      if (eventInputs[event]?.includes('troops')) {
        eventData['troops'] = parseInt(input.value);
      }
      if (eventInputs[event]?.includes('territory') && selectedTerritory.value) {
        eventData['territory'] = selectedTerritory.value;
      }
      console.log("<<", eventData);
      send(eventData);
      // input.value = "1";
      selectedTerritory.value = null;
      localStorage.setItem(stateKey, JSON.stringify(currentState.value));
    };

    const reset = () => {
      localStorage.removeItem(stateKey);
      window.location.reload();
    }

    return {
      currentState,
      currentPlayer,
      ownership,
      territories,
      territoriesDropdown,
      players,
      events,
      selectedEvent,
      input,
      selectedTerritory,
      sendEvent,
      eventInputs,
      reset
    };
  }
};
</script>

<style>
/* No additional styles needed */
</style>
