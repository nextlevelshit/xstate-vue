<template>
	<div id="map" class="w-full h-full relative top-0 bottom-20"></div>
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
			const bootstrapMap = () => {
				d3.xml("/map5.svg").then((data: any) => {
					d3.select("#map svg").remove();
					const map = d3.select("#map");

					(map.node() as HTMLElement)?.append(data.documentElement);

					renderMap();
				});
			};
			const renderMap = () => {
				const map = d3.select("#map svg");

				props.territories.forEach(({territory, troops, player}) => {
					debugger;
					const hasCombat = territory === props.fromTerritory || territory === props.toTerritory;
					const hasCombatOrNoCombat = hasCombat || !(props.toTerritory && props.fromTerritory);
					const territoryElement = map.select(`#${territory}`);
					const playerColor = player.color || "black";
					player.color && territoryElement.style("fill", playerColor);
					const bbox = (territoryElement.node() as SVGGraphicsElement).getBBox();
					const middleX = bbox.x + bbox.width / 2;
					const middleY = bbox.y + bbox.height / 2;

					if (hasCombat) {
						territoryElement.attr("class", "combat");
					}

					map.select("svg #territories")
						.append("circle")
						.attr("cx", middleX)
						.attr("cy", middleY)
						.attr("r", 16)
						.attr("fill", playerColor)
						.attr("opacity", hasCombatOrNoCombat ? 1 : 0)
						.attr("class", "troopsBackground")
						.attr("stroke", "white");

					map.select("svg #territories")
						.append("text") // Append SVG text element
						.attr("x", middleX)
						.attr("y", middleY)
						// .attr("fill", "white")
						.attr("opacity", hasCombatOrNoCombat ? 1 : 0)
						.attr("fill", hasCombat || troops === 0 ? "white" : playerColor)
						.attr("dominant-baseline", "central")
						.attr("class", "troops")
						.text(troops); // Set the text content

					map.select("svg #territories")
						.append("text") // Append SVG text element
						.attr("x", middleX)
						.attr("y", middleY + 24)
						.attr("fill", "black")
						.attr("opacity", hasCombatOrNoCombat ? 1 : 0.2)
						.attr("dominant-baseline", "central")
						.attr("class", "territory")
						.text(territory);

					territoryElement.on("click", () => {
						emit("territory-clicked", territory);
					});
				});

				if (props.fromTerritory && props.toTerritory) {
					const from = (d3.select(`#${props.fromTerritory}`).node() as SVGGraphicsElement).getBBox();
					const to = (d3.select(`#${props.toTerritory}`).node() as SVGGraphicsElement).getBBox();
					if (from && to) {
						// const x = (from.x - (from.width / 2) + to.x - (to.width / 2));
						// const y = (from.y - (from.height / 2) + to.y - (to.height / 2));

						// SVGs built with Inkscape leave strange transform properties to the top layer
						// and each group of paths. This values can be found in the SVG itself under ids:
						// g1 and all groups inside like terrutories, continents etc.
						//
						//                                    .---------------.--------- top layer translate
						//                          .--------|-------.-------|---------- group translate
						const [marginX, marginY] = [20 - 191.39741, 20 - 137.15072];
						// debugger;
						const x = (from.x + from.width / 2) * 0.5 + (to.x + to.width / 2) * 0.5 + marginX;
						const y = (from.y + from.height / 2) * 0.5 + (to.y + to.height / 2) * 0.5 + marginY;

						const detlaX = from.x + from.width * 0.5 - (to.x + to.width * 0.5);
						const deltaY = from.y + from.height * 0.5 - (to.y + to.height * 0.5);

						const centerCombatX = (from.x + from.width * 0.5 + (to.x + to.width * 0.5)) * 0.5;
						const centerCombatY = (from.y + from.height * 0.5 + (to.y + to.height * 0.5)) * 0.5;

						const mapWidth = map.select("svg").node()?.getBBox().width;
						const mapHeight = map.select("svg").node()?.getBBox().height;

						const centerX = mapWidth * 0.5;
						const centerY = mapHeight * 0.5;

						// map.select("svg").append("circle")
						// 	.attr("r", 60)
						// 	.attr("fill", "transparent")
						// 	.attr("stroke", "black")
						// 	.attr("stroke-width", 5)
						// 	// .attr("cx", )
						// 	.attr("cx", x)
						// 	.attr("cy", y);

						// debugger;
						// debugger;

						// Calculate the translation needed to center the point between the two territories
						// const translateX = (svg.node()?.getBBox().width / 2 - x)// * 0.5;
						// const translateY = (svg.node()?.getBBox().height / 2 - y)// * 0.5;

						// debugger;

						map.select("svg").attr(
							"transform",
							`translate(${-(centerCombatX - centerX) * 2}, ${-(centerCombatY - centerY) * 2}) scale(1.3)`
						);

						map.attr("class", "combat");
					} else {
					}
				} else {
					map.attr("class", "");
				}
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

			onMounted(bootstrapMap);

			watch(
				() => [props.territories, props.colors, props.players, props.ownership, props.fromTerritory, props.toTerritory],
				renderMap,
				{deep: true}
			);
			// watch(() => [props.fromTerritory, props.toTerritory], ([from, to]) => {
			// 	if (!(from && to)) return;
			// 	zoomTo([from, to]);
			// });
		}
	};
</script>

<style>
	svg {
		/*@apply absolute inset-0;*/
		/*transition: transform 0.2s;*/
		/*transform: scale(0.9);*/
	}

	div.combat #territories path:not(.combat) {
		opacity: 0.2;
		//transform: rotateX(20deg);
	}

	div.combat #continents,
	div.combat #sea_borders {
		opacity: 0.3;
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
		fill-opacity: 0.5 !important;
	}

	svg #continents path {
		stroke: black;
		stroke-width: 8 !important;
		stroke-opacity: 0.2 !important;
		fill: white !important;
	}

	.troops {
		font-weight: 800;
		font-size: 16px;
		text-anchor: middle;
		font-family: Dosis, Teko, Helvetica, Arial, sans-serif;
	}

	.troopsBackground {
		fill: black;
		stroke-width: 0.1;
		stroke-opacity: 1;
		fill-opacity: 0.8;
		//mix-blend-mode: multiply;
	}

	.territory {
		font-weight: 400;
		font-size: 10px;
		text-anchor: middle;
		font-family: Teko, Helvetica, Arial, sans-serif;
		text-transform: uppercase;
	}
</style>
