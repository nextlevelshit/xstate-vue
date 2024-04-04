<template>
	<div class="flex overflow-x-auto gap-2 no-scrollbar">
		<button
			v-for="num in nums"
			:key="num"
			@click="selectTroops(num)"
			:class="[
				'bg-white border-2 border-slate-800 text-black font-bold px-3 py-2 rounded-full hover:bg-slate-800 hover:text-white w-12 h-12 flex items-center justify-center',
				num === inputValue ? '!bg-slate-800 !text-white' : ''
			]"
		>
			{{ num }}
		</button>
	</div>
</template>

<script lang="ts">
	import {defineComponent, PropType} from "vue";

	export default defineComponent({
		props: {
			max: {
				type: Number as PropType<number>,
				required: true
			},
			min: {
				type: Number as PropType<number>,
				required: false,
				default: 1
			},
			inputValue: {
				type: Number as PropType<number>,
				required: true
			}
		},
		computed: {
			nums(): number[] {
				const fromOne = Array.from({length: this.max}, (_, i) => i + 1);
				// remove numbers less than min
				return fromOne.filter(num => num >= this.min);
			}
		},
		methods: {
			selectTroops(num: number) {
				this.$emit("troopsSelected", num);
			}
		}
	});
</script>

<style scoped>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.no-scrollbar {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
