<template>
	<div class="flex max-w-28 lg:max-w-48 overflow-x-auto gap-2 no-scrollbar h-full p-2 bg-white rounded-full">
		<button
			v-for="num in nums"
			:key="num"
			@click="selectTroops(num)"
			:class="[
				'bg-white text-md lg:text-2xl font-semibold text-black hover:bg-black hover:text-white hover:shadow-3xl rounded-full min-w-6 lg:min-w-12 h-6 lg:h-12 drop-shadow-sm flex items-center justify-center',
				num === inputValue ? '!bg-black !text-white' : ''
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
				return fromOne.filter((num) => num >= this.min);
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
