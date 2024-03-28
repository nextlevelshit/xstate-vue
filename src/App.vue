<template>
  <div id="app" class="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
    <div class="container max-w-xl p-8 bg-white shadow-md rounded-lg">
      <h1 class="text-2xl font-bold mb-4">Risk Game State Machine Monitor</h1>
      <div class="state mb-4">
        <h2 class="text-xl font-semibold mb-2">Current Player:</h2>
        <pre> {{ JSON.stringify(currentState.context.currentPlayer, null, 2) }}</pre>
      </div>
      <div class="state mb-4">
        <h2 class="text-xl font-semibold mb-2">Ownership:</h2>
        <pre> {{ JSON.stringify(currentState.context.ownership, null, 2) }}</pre>
      </div>
      <div class="state mb-4">
        <h2 class="text-xl font-semibold mb-2">Players:</h2>
        <pre> {{ JSON.stringify(currentState.context.players, null, 2) }}</pre>
      </div>
      <div class="events mb-4">
        <h2 class="text-xl font-semibold mb-2">Events:</h2>
        <button v-for="event in events" :key="event" @click="sendEvent(event)" class="btn mr-2">{{ event }}</button>
      </div>
      <div class="actions mb-4">
        <h2 class="text-xl font-semibold mb-2">Actions:</h2>
        <ul>
          <li v-for="action in actions" :key="action">{{ action }}</li>
        </ul>
      </div>
      <div class="inputs mb-4">
        <h2 class="text-xl font-semibold mb-2">Inputs:</h2>
        <input type="text" v-model="input" placeholder="Enter input" class="input mr-2" />
        <button @click="sendInput" class="btn">Submit</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue';
import { useMachine } from '@xstate/vue';
import riskMachine, {RiskEvent} from './states/riskMachine';

export default {
  name: 'App',
  setup() {
    const { snapshot, send } = useMachine(riskMachine);

    const currentState = computed(() => snapshot.value);

    const events: RiskEvent[] = [
      // List of events supported by your state machine
      RiskEvent.ASSIGN_FIRST_PLAYER,
      RiskEvent.ASSIGN_TERRITORIES,
      RiskEvent.ASSIGN_TROOPS,
      RiskEvent.START_GAME,
      RiskEvent.TERRITORY_CLICKED,
      RiskEvent.END_TURN
    ];

    const actions = ref<string[]>([]);

    const input = ref('');

    const sendEvent = (event: RiskEvent) => {
      console.log(">>", event);
      send({ type: event });
    };

    const sendInput = () => {
      return;
      // send({ type: 'USER_INPUT', data: input.value });
      // input.value = '';
    };

    return { currentState, events, actions, input, sendEvent, sendInput };
  }
};
</script>

<style>
/* No additional styles needed */
</style>
