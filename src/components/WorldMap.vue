<template>
	<div id="map" class="w-full h-full lg:overflow-hidden"></div>
</template>

<script lang="ts">
	import {onMounted, PropType, watch} from "vue";
	import * as d3 from "d3";
	import {Territory, Player, TerritoryOwnership} from "../config/types"; // Import Territory type if necessary

	export default {
		name: "WorldMap",
		props: {
			territories: {
				type: Array as PropType<{territory: Territory; player: Player; troops?: number}[]>,
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
				d3.xml("map5.svg").then((data: any) => {
					d3.select("#map svg").remove();
					const map = d3.select("#map");

					(map.node() as HTMLElement)?.append(data.documentElement);

					props.territories.forEach(({territory}) => {
						// Add click event listener to each territory
						const territoryElement = map.select(`#${territory}`);

						territoryElement.on("click", () => {
							emit("territory-clicked", territory);
						});

						// Calculate the middle of the territory
						const territoryDimensions = (territoryElement.node() as SVGGraphicsElement).getBBox();
						const middleX = territoryDimensions.x + territoryDimensions.width / 2;
						const middleY = territoryDimensions.y + territoryDimensions.height / 2;

						// Append troops and territory name to each territory
						map.select("svg #territories")
							.append("circle")
							.attr("id", `${territory}-circle`)
							.attr("cx", middleX)
							.attr("cy", middleY)
							.attr("r", 16)
							.attr("class", "troopsBackground")
							.attr("stroke", "white");

						map.select("svg #territories")
							.append("text") // Append SVG text element
							.attr("id", `${territory}-troops`)
							.attr("x", middleX)
							.attr("y", middleY)
							.attr("dominant-baseline", "central")
							.attr("class", "troops");

						map.select("svg #territories")
							.append("text") // Append SVG text element
							.attr("id", `${territory}-territory`)
							.attr("x", middleX)
							.attr("y", middleY + 24)
							.attr("fill", "black")
							.attr("dominant-baseline", "central")
							.attr("class", "territory");
					});

					renderMap();
				});
			};
			const renderMap = () => {
				const map = d3.select("#map svg");

				props.territories.forEach(({territory, troops, player}) => {
					const hasCombat = territory === props.fromTerritory || territory === props.toTerritory;
					const hasCombatOrNoCombat = hasCombat || !(props.toTerritory && props.fromTerritory);
					const territoryElement = map.select(`#${territory}`);
					const playerColor = player.color || "black";

					player.color && territoryElement.style("fill", playerColor);

					if (hasCombat) {
						territoryElement.attr("class", "combat");
					} else {
						territoryElement.attr("class", "");
					}

					map.select(`svg #territories #${territory}-circle`)
						.attr("fill", playerColor)
						.attr("opacity", hasCombatOrNoCombat ? 1 : 0);

					map.select(`svg #territories #${territory}-troops`)
						.attr("opacity", hasCombatOrNoCombat ? 1 : 0)
						.attr("fill", hasCombat || troops === 0 ? "white" : playerColor)
						.text(troops || 0);

					map.select(`svg #territories #${territory}-territory`)
						.attr("opacity", hasCombatOrNoCombat ? 1 : 0.2)
						.text(territory);
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
						// const [marginX, marginY] = [20 - 191.39741, 20 - 137.15072];
						// debugger;
						// const x = (from.x + from.width / 2) * 0.5 + (to.x + to.width / 2) * 0.5 + marginX;
						// const y = (from.y + from.height / 2) * 0.5 + (to.y + to.height / 2) * 0.5 + marginY;
						//
						// const deltaX = from.x + from.width * 0.5 - (to.x + to.width * 0.5);
						// const deltaY = from.y + from.height * 0.5 - (to.y + to.height * 0.5);

						// const mapWidth = (map.node() as SVGGraphicsElement)?.getBBox().width;
						// const mapHeight = (map.node() as SVGGraphicsElement)?.getBBox().height;

						// const centerX = mapWidth * 0.5;
						// const centerY = mapHeight * 0.5;
						//
						// const centerCombatX = ((from.x + from.width) * 0.5 + (to.x + to.width) * 0.5) * 0.5;
						// const centerCombatY = ((from.y + from.height) * 0.5 + (to.y + to.height) * 0.5) * 0.5;

						// map.append("circle")
						// 	.attr("r", 10)
						// 	.attr("fill", "transparent")
						// 	.attr("stroke", "black")
						// 	.attr("stroke-width", 5)
						// 	// .attr("cx", )
						// 	.attr("cx", centerX - deltaX)
						// 	.attr("cy", centerY - deltaY);
						//
						// map.append("circle")
						// 	.attr("r", 10)
						// 	.attr("fill", "black")
						// 	// .attr("cx", )
						// 	.attr("cx", centerX)
						// 	.attr("cy", centerY);
						//
						// map.append("circle")
						// 	.attr("r", 20)
						// 	.attr("fill", "red")
						// 	// .attr("cx", )
						// 	.attr("cx", from.x - from.width * 0.5)
						// 	.attr("cy", from.y - from.height * 0.5);
						//
						// map.append("circle")
						// 	.attr("r", 20)
						// 	.attr("fill", "green")
						// 	// .attr("cx", )
						// 	.attr("cx", to.x - to.width * 0.5)
						// 	.attr("cy", to.y - to.height * 0.5);
						//
						// debugger;

						// debugger;
						// debugger;

						// Calculate the translation needed to center the point between the two territories
						// const translateX = (svg.node()?.getBBox().width / 2 - x)// * 0.5;
						// const translateY = (svg.node()?.getBBox().height / 2 - y)// * 0.5;

						// debugger;

						// map.attr(
						// 	"transform",
						// 	`translate(${-(centerX - deltaX * 4)}, ${-(centerY + deltaY)}) scale(1.5)`
						//
						// );

						map.attr("class", "combat");
					} else {
					}
				} else {
					map.attr("class", "");

					map.attr("transform", `translate(0, 0) scale(1)`);
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

			watch(() => [props.territories, props.players, props.ownership, props.fromTerritory, props.toTerritory], renderMap, {
				deep: true
			});
			// watch(() => [props.fromTerritory, props.toTerritory], ([from, to]) => {
			// 	if (!(from && to)) return;
			// 	zoomTo([from, to]);
			// });
		}
	};
</script>

<style>
	svg {
	}

	svg.combat #territories path:not(.combat) {
		opacity: 0.2 !important;
	}

	svg.combat #continents,
	svg.combat #sea_borders {
		opacity: 0.3;
		transition: all 460ms ease-in;
	}

	svg:not(.combat) #territories path {
		transition: all 260ms ease-in;
	}

	svg * {
		@apply pointer-events-none cursor-default;
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
		transition: all 460ms ease-in;
	}

	svg:not(.combat) #territories path:hover {
		opacity: 0.8 !important;
		stroke-width: 2;
		stroke-opacity: 0.9;
		stroke: white;
	}

	svg #continents path {
		stroke: black;
		stroke-width: 6 !important;
		stroke-opacity: 0.1 !important;
		fill: white !important;
	}

	.troops {
		font-weight: 800;
		font-size: 16px;
		text-anchor: middle;
		font-family: Dosis, Teko, Helvetica, Arial, sans-serif;
		transition: all 360ms;
	}

	.troopsBackground {
		fill: black;
		stroke-width: 0.1;
		stroke-opacity: 1;
		transition: all 360ms;
		fill-opacity: 0.8;
	}

	.territory {
		font-weight: 500;
		font-size: 10px;
		text-anchor: middle;
		font-family: Teko, Helvetica, Arial, sans-serif;
		transition: all 360ms;
		text-transform: uppercase;
	}
</style>
