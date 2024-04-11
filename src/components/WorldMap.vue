<template>
	<div id="map" class="w-full h-full overflow-hidden"></div>
</template>

<script lang="ts">
	import {onMounted, PropType, watch} from "vue";
	import * as d3 from "d3";
	import {Territory, Player, TerritoryOwnership} from "../config/types"; // Import Territory type if necessary
	import * as d3Zoom from "d3-zoom";
	// import {ZoomTransform} from "d3";

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
					// Append svg to map canvas
					(map.node() as HTMLElement)?.append(data.documentElement);

					// Append zoom to map canvas
					let zoom: d3Zoom.ZoomBehavior<Element, unknown>;
					zoom = d3.zoom().on("zoom", (e) => {
						console.log(e.transform.toString());
						d3.select("#map svg #g0").attr("transform", e.transform);
					});
					d3.select<Element, any>("#map svg").call(zoom);

					props.territories.forEach(({territory}) => {
						// Add click event listener to each territory
						const territoryElement = map.select(`#${territory}`);
						// Add click event listener to each territory
						territoryElement.on("click", () => {
							emit("territory-clicked", territory);
						});
						// Calculate the middle of the territory
						const territoryDimensions = (territoryElement.node() as SVGGraphicsElement).getBBox();
						const middleX = territoryDimensions.x + territoryDimensions.width / 2;
						const middleY = territoryDimensions.y + territoryDimensions.height / 2;

						// Append troops and territory name to each territory
						const bgElement = map.select("svg #territories")
							.append("circle")
							.attr("id", `${territory}-circle`)
							.attr("cx", middleX)
							.attr("cy", middleY)
							.attr("r", 20)
							.attr("class", "troopsBackground")
							.attr("stroke", "white");

						const troopsElement = map.select("svg #territories")
							.append("text") // Append SVG text element
							.attr("id", `${territory}-troops`)
							.attr("x", middleX)
							.attr("y", middleY)
							.attr("font-size", 16)
							.attr("dominant-baseline", "central")
							.attr("class", "troops");

						const labelElement = map.select("svg #territories")
							.append("text") // Append SVG text element
							.attr("id", `${territory}-territory`)
							.attr("x", middleX)
							.attr("y", middleY + 24)
							.attr("fill", "black")
							.attr("font-size", 10)
							.attr("dominant-baseline", "central")
							.attr("class", "territory");

						// // Add mouseover event listener to each territory
						territoryElement.on("mouseover", () => {
							bgElement.attr("r", 24);
							troopsElement.attr("font-size", 22);
							labelElement.attr("font-size", 20).attr("y", middleY + 36);
						});

						// Add mouseout event listener to each territory
						territoryElement.on("mouseout", () => {
							bgElement.attr("r", 20);
							troopsElement.attr("font-size", 20);
							labelElement.attr("font-size", 10).attr("y", middleY + 24);
						});
					});

					renderMap();
				});
			};
			const renderMap = () => {
				const map = d3.select<Element, any>("#map svg");

				props.territories.forEach(({territory, troops, player}) => {
					const hasCombat = territory === props.fromTerritory || territory === props.toTerritory;
					const hasCombatOrNoCombat = hasCombat || !(props.toTerritory && props.fromTerritory);
					const territoryElement = map.select<Element>(`#${territory}`);
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

					// console.log(territoryElement.getContext("2d"));
				});
				// const mapWidth = (map.select("#g0").node() as SVGGraphicsElement).getBBox().width;
				// const mapHeight = (map.select("#g0").node() as SVGGraphicsElement).getBBox().height;

				// const centerX = mapWidth * 0.5;
				// const centerY = mapHeight * 0.5;

				if (props.fromTerritory && props.toTerritory) {
					const from = (d3.select(`#${props.fromTerritory}`).node() as SVGGraphicsElement).getBBox();
					const to = (d3.select(`#${props.toTerritory}`).node() as SVGGraphicsElement).getBBox();
					// let transform = new ZoomTransform(
					// 	1.6
					// 	centerX * 0.5 - ((from.x - from.width / 2) + (to.x - to.width / 2)) *.5,
					// 	centerY * 0.5 - ((from.y - from.width / 2) + (to.y - to.width / 2)) *.5,
					// );
					// d3.select("#map svg #g0").attr("transform", transform.toString());
					if (from && to) {
						map.attr("class", "combat");
					}
				} else {
					map.attr("class", "");
					// map.attr("transform", `translate(0, 0) scale(1)`);
					// map.select("#g0").attr("transform", `translate(0, 0) scale(1)`);
				}
			};

			onMounted(bootstrapMap);

			watch(() => [props.territories, props.players, props.ownership, props.fromTerritory, props.toTerritory], renderMap, {
				deep: true
			});
		}
	};
</script>

<style>
	svg g {
		transition: all 400ms ease-in-out;
	}

	svg g,
	svg #territories path {
		transition: opacity 200ms ease-in-out;
	}

	svg.combat #territories path:not(.combat) {
		opacity: 0.2 !important;
	}

	svg.combat #continents,
	svg.combat #sea_borders {
		opacity: 0.3;
		/*transition: all 460ms ease-in;*/
	}

	svg:not(.combat) #territories path {
		/*transition: all 260ms ease-in;*/
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
		/*transition: all 460ms ease-in;*/
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
		text-anchor: middle;
		font-family: Dosis, Teko, Helvetica, Arial, sans-serif;
		transition: all 180ms;
	}

	.troopsBackground {
		fill: black;
		stroke-width: 0.1;
		stroke-opacity: 1;
		transition: all 180ms;
		fill-opacity: 0.8;
	}

	.territory {
		font-weight: 500;
		text-anchor: middle;
		font-family: Teko, Helvetica, Arial, sans-serif;
		transition: all 180ms;
		text-transform: uppercase;
	}
</style>
