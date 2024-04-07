<script lang="ts">
	import {defineComponent, PropType} from "vue";
	import {Territory, Player} from "../config/types.ts";

	export default defineComponent({
		name: "Ownership",
		props: {
			territories: {
				type: Array as PropType<{territory: Territory; player: Player;}[]>,
				required: true
			},
			currentPlayer: {
				type: Object as PropType<Player>,
				required: false,
				default: 0
			}
		},
		methods: {
			transform(i: number) {
				return `rotate(${360 / this.territories.length * i})`;
			}
		},
		computed: {
			sortedByPlayer() {
				return [...this.territories].sort((a, b) => {
					return a.player.index - b.player.index;
				});
			},
		}
	});
</script>

<template>
	<div>
		<div class="relative">
			<svg viewBox='-50 -50 100 100'>
				<circle fill="transparent" stroke="black" opacity="0.1" r='48'/>
				<!-- markers -->
				<line v-for="(territory, i) in sortedByPlayer"
					  class='major'
					  :y1='territory.player.index === currentPlayer.index ? 38 : 40'
					  :y2='territory.player.index === currentPlayer.index ? 44 : 42'
					  :stroke='territory.player.color || "black"'
					  :stroke-width='territory.player.index === currentPlayer.index ? 3 : 2'
					  stroke-linecap='round'
					  stroke-linejoin='round'
					  :stroke-opacity='territory.player.index === currentPlayer.index ? 1 : 0.5'
					  :transform="transform(i)"
				/>
			</svg>
			<i :style="`color: ${currentPlayer.color}`" class="absolute top-0 bottom-0 flex items-center justify-center font-bold text-6xl w-full">{{currentPlayer.troops}}</i>
		</div>
	</div>
</template>

<style scoped>
.svg line {
	transition: all 0.5s;
}
</style>