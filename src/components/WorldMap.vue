<template>
  <div id="map" class="w-full h-full relative top-0"></div>
</template>

<script lang="ts">
import {onMounted, PropType, watch} from 'vue';
import * as d3 from "d3";
import {Territory, Player, TerritoryOwnership} from '../config/types'; // Import Territory type if necessary


export default {
  name: 'WorldMap',
  props: {
    territories: {
      type: Array as PropType<{ territory: Territory, player: Player, troops: number }[]>,
      required: true,
    },
    colors: {
      type: Object as PropType<string[]>,
      required: true,
    },
    players: {
      type: Object as PropType<Player[]>,
      required: true
    },
    ownership: {
      type: Object as PropType<TerritoryOwnership>,
      required: true
    }
  },
  setup(props, {emit}) {
    const renderMap = (() => {
      // Load your SVG map
      d3.xml('/map.svg').then((data: any) => {
        // Remove old SVG if it exists
        d3.select("#map svg").remove();
        // Append the loaded SVG to your div
        const svg = d3.select('#map').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            // .call(d3.zoom().on('zoom', (event: any) => {
            //   svg.attr('transform', event.transform);
            // }))
            .append('g');

        svg.node()?.append(data.documentElement);

        props.territories.forEach(({territory, troops, player}) => {
          const territoryElement = d3.select(`#${territory}`);
          player.color && territoryElement.style('fill', player.color);
          const bbox = territoryElement.node()?.getBBox();
          const middleX = bbox.x + bbox.width / 2;
          const middleY = bbox.y + bbox.height / 2;
          svg.select("svg #territories").append('text') // Append SVG text element
              .attr('x', middleX)
              .attr('y', middleY)
              .attr('fill', player.color || "black")
              .attr('class', 'troops')
              .text(troops); // Set the text content
          territoryElement.on('click', () => {
            emit('territory-clicked', territory);
          });
        });
      });
    });

    onMounted(renderMap);

    watch(() => [props.territories, props.colors, props.players, props.ownership], renderMap, {deep: true});
  },
};
</script>

<style>
svg {
  @apply absolute inset-0;
  transition: transform 0.8s;
  transform: rotateX(8deg) translate(0, 0) scale(1);
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
}

svg #territories path:hover {
  fill-opacity: 0.3 !important;
}

svg #continents path {
  opacity: 0 !important;
  display: none;
}

.troops {
  font-weight: 900;
  font-family: sans-serif;
  stroke: black;
  stroke-opacity: 0.4;
  stroke-width: 1.4;
  font-size: 32px;
  text-anchor: middle;
  dominant-baseline: central;
}

.troops:before {
  content: "";
}

</style>