<template>
	<div id="map" class="w-full h-full relative top-0"></div>
</template>

<script lang="ts">
	import {onMounted, PropType, watch} from "vue";
	import * as d3 from "d3";
	import {Territory, Player, TerritoryOwnership} from "../config/types"; // Import Territory type if necessary

	export default {
		name: "WorldMap",
		props: {
			territories: {
				type: Array as PropType<{territory: Territory; player: Player; troops: number}[]>,
				required: true
			},
			colors: {
				type: Object as PropType<string[]>,
				required: true
			},
			players: {
				type: Object as PropType<Player[]>,
				required: true
			},
			ownership: {
				type: Object as PropType<TerritoryOwnership>,
				required: true
			},
			fromTerritory: {
				type: String as PropType<Territory>,
				required: false
			},
			toTerritory: {
				type: String as PropType<Territory>,
				required: false
			}
		},
		methods: {},
		setup(props, {emit}) {
			const renderMap = () => {
				// Load your SVG map
				d3.xml("/map.svg").then((data: any) => {
					// Remove old SVG if it exists
					d3.select("#map svg").remove();
					// Append the loaded SVG to your div
					const svg = d3
						.select("#map")
						.append("svg")
						.attr("width", "100%")
						.attr("height", "100%")
						// .call(d3.zoom().on('zoom', (event: any) => {
						//   svg.attr('transform', event.transform);
						// }))
						.append("g");

					svg.node()?.append(data.documentElement);

					props.territories.forEach(({territory, troops, player}) => {
						const territoryElement = d3.select(`#${territory}`);
						const playerColor = player.color || "black";
						player.color && territoryElement.style("fill", playerColor);
						const bbox = territoryElement.node()?.getBBox();
						const middleX = bbox.x + bbox.width / 2;
						const middleY = bbox.y + bbox.height / 2;
						svg.select("svg #territories")
							.append("circle")
							.attr("cx", middleX)
							.attr("cy", middleY)
							.attr("r", 16)
							.attr("fill", playerColor)
							.attr("class", "troopsBackground")
							.attr("stroke", "white");
						svg.select("svg #territories")
							.append("text") // Append SVG text element
							.attr("x", middleX)
							.attr("y", middleY)
							.attr("fill", "white")
							// .attr('fill', playerColor)
							.attr("dominant-baseline", "central")
							.attr("class", "troops")
							.text(troops); // Set the text content
						territoryElement.on("click", () => {
							emit("territory-clicked", territory);
						});
					});

					if (props.fromTerritory && props.toTerritory) {
						const from = d3.select(`#${props.fromTerritory}`).node()?.getBBox();
						const to = d3.select(`#${props.toTerritory}`).node()?.getBBox();
						if (from && to) {
							const x = (from.x - (from.width / 2) - to.x - (to.width / 2)) * 4;
							const y = (from.y - (from.height / 2) - to.y - (to.height / 2)) * 4;
							// const y = (from.y - to.y);

							// Calculate the translation needed to center the point between the two territories
							// const translateX = (svg.node()?.getBBox().width / 2 - x)// * 0.5;
							// const translateY = (svg.node()?.getBBox().height / 2 - y)// * 0.5;

							// debugger;

							// svg.attr("transform", `translate(${x}, ${y}) scale(2)`);
						}
					}
				});
			};

			// const zoomTo = (ids: Territory[]) => {
			// 	const svg = d3.select("#map svg");
			// 	const paths = ids.map(id => d3.select(`#${id}`).node()?.getBBox());
			// 	const x = paths.reduce((sum, path) => sum + path.x + path.width / 2, 0) / paths.length;
			// 	const y = paths.reduce((sum, path) => sum + path.y + path.height / 2, 0) / paths.length;
			// 	svg.attr('transform', `translate(${-x}, ${-y}) scale(4)`);
			// 	// const zoom = d3.zoom().on('zoom', (event) => {
			// 	// 	svg.attr('transform', event.transform);
			// 	// });
			// 	// svg.call(zoom.transform, d3.zoomIdentity.translate(-x, -y).scale(4));
			// }

			onMounted(renderMap);

			watch(() => [props.territories, props.colors, props.players, props.ownership, props.fromTerritory, props.toTerritory], renderMap, {deep: true});
			// watch(() => [props.fromTerritory, props.toTerritory], ([from, to]) => {
			// 	if (!(from && to)) return;
			// 	zoomTo([from, to]);
			// });
		}
	};
</script>

<style>
	svg {
		@apply absolute inset-0;
		transition: transform 0.8s;
		//transform: rotateX(8deg) translate(0, 0) scale(1);
	}

	svg * {
		@apply pointer-events-none cursor-pointer;
	}

	svg #territories path {
		@apply pointer-events-auto cursor-pointer;
		display: inline;
		enable-background: accumulate;
		fill-opacity: 1;
		fill-rule: evenodd;
		fill: none;
		filter: url(#filter12951);
		marker-end: none;
		marker-mid: none;
		marker-start: none;
		marker: none;
		opacity: 1;
		overflow: hidden;
		stroke-dasharray: none;
		stroke-dashoffset: 0;
		stroke-linecap: butt;
		stroke-linejoin: miter;
		stroke-miterlimit: 4.32165003;
		stroke-opacity: 1;
		stroke-width: 0.75;
		stroke: #000;
		visibility: visible;
		mix-blend-mode: multiply;
	}

	svg #territories path:hover {
		fill-opacity: 0.8 !important;
	}

	svg #continents path {
		stroke: black;
		stroke-width: 8 !important;
		stroke-opacity: 0.2 !important;
		fill: white !important;
	}

	.troops {
		font-weight: 700;
		font-size: 16px;
		text-anchor: middle;
		font-family: Dosis, Teko, Helvetica, Arial, sans-serif;
	}

	.troopsBackground {
		fill: black;
		stroke-width: 3;
		stroke-opacity: 0.4;
		fill-opacity: 0.7;
		mix-blend-mode: multiply;
	}
</style>
