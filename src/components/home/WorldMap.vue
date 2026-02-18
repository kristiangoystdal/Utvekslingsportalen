<template>
	<div ref="mapContainer" class="map-container"></div>
</template>

<script>
import * as d3 from "d3";
import * as topojson from "topojson-client";
import worldData from "../../data/countries-110m.json";

export default {
	name: "WorldMap",
	props: {
		// Example: [{ name: "Norway" }, { name: "USA" }]
		countries: {
			type: Array,
			required: true,
		},
	},
	data() {
		return {
			resizeTimeout: null,
		};
	},
	mounted() {
		this.createMap();
		window.addEventListener("resize", this.debouncedCreateMap);
	},
	beforeUnmount() {
		window.removeEventListener("resize", this.debouncedCreateMap);
		if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
		this.removeTooltip();
	},
	watch: {
		countries: {
			handler() {
				this.createMap();
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		createMap() {
			const container = this.$refs.mapContainer;
			if (!container) return;

			const width = container.clientWidth || 600;
			const height = container.clientHeight || width * 0.5625;

			const tooltip = this.ensureTooltip();

			// Clear previous SVG
			d3.select(container).selectAll("*").remove();

			// Build SVG
			const svg = d3
				.select(container)
				.append("svg")
				.attr("width", "100%")
				.attr("height", "100%")
				.attr("viewBox", `0 0 ${width} ${height}`)
				.attr("preserveAspectRatio", "xMidYMid meet");

			// Clip so nothing draws outside bounds
			svg
				.append("defs")
				.append("clipPath")
				.attr("id", "map-clip")
				.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", width)
				.attr("height", height);

			const g = svg.append("g").attr("clip-path", "url(#map-clip)");

			// Projection + path
			const projection = d3
				.geoMercator()
				.scale(width / 6.5)
				.translate([width / 2, height / 1.5]);

			const path = d3.geoPath().projection(projection);

			// Highlight list
			const highlightedCountryNames = (this.countries || []).map((c) => c.name);
			const adjustedCountryNames = highlightedCountryNames.map((name) =>
				name === "USA" ? "United States of America" : name
			);

			const adjustedSet = new Set(adjustedCountryNames);

			const topoNameToKey = new Map();

			(this.countries || []).forEach((c) => {
				const topoName = c.name === "USA" ? "United States of America" : c.name;
				topoNameToKey.set(topoName, c.name); // e.g. "United States of America" -> "USA"
			});

			// TopoJSON -> GeoJSON
			const mapCountries = topojson.feature(
				worldData,
				worldData.objects.countries
			).features;

			// Draw countries
			g.selectAll("path")
				.data(mapCountries)
				.enter()
				.append("path")
				.attr("d", path)
				.attr("class", (d) =>
					adjustedCountryNames.includes(d.properties.name)
						? "highlighted"
						: "country"
				)
				.style("fill", (d) =>
					adjustedCountryNames.includes(d.properties.name)
						? "var(--second-color)"
						: "lightgray"
				)
				.style("stroke", "#fff")
				.style("stroke-width", "0.5px")
				.style("cursor", "pointer")
				.on("click", (event, d) => {
					this.routeToCountry(d.properties.name);
				})
				.on("mouseover", (event, d) => {
					if (!adjustedSet.has(d.properties.name)) return;

					d3.select(event.currentTarget).style("opacity", 0.85);

					const key = topoNameToKey.get(d.properties.name) || d.properties.name;
					tooltip.style("opacity", 1).text(this.$t(`countries.${key}`));

					tooltip
						.style("left", `${event.pageX + 12}px`)
						.style("top", `${event.pageY + 12}px`);
				})
				.on("mousemove", (event, d) => {
					if (!adjustedSet.has(d.properties.name)) return;

					tooltip
						.style("left", `${event.pageX + 12}px`)
						.style("top", `${event.pageY + 12}px`);
				})
				.on("mouseout", (event, d) => {
					if (!adjustedSet.has(d.properties.name)) return;

					d3.select(event.currentTarget).style("opacity", 1);
					tooltip.style("opacity", 0);
				});

			// Zoom/pan constrained to viewport
			const zoom = d3
				.zoom()
				.scaleExtent([1, 6])
				.translateExtent([
					[0, 0],
					[width, height],
				])
				.extent([
					[0, 0],
					[width, height],
				])
				.on("zoom", (event) => {
					g.attr("transform", event.transform);
				});

			svg.call(zoom);

			// (Optional) disable double-click zoom if you don't want it:
			// svg.on("dblclick.zoom", null);
		},
		ensureTooltip() {
			const id = "worldmap-tooltip";
			let tooltip = d3.select("body").select(`#${id}`);

			if (tooltip.empty()) {
				tooltip = d3
					.select("body")
					.append("div")
					.attr("id", id)
					.style("position", "absolute")
					.style("pointer-events", "none")
					.style("background", "rgba(0,0,0,0.75)")
					.style("color", "#fff")
					.style("padding", "6px 10px")
					.style("border-radius", "6px")
					.style("font-size", "12px")
					.style("line-height", "1.2")
					.style("opacity", 0)
					.style("z-index", 9999);
			}

			return tooltip;
		},
		removeTooltip() {
			d3.select("body").select("#worldmap-tooltip").remove();
		},
		translateCountryName(name) {

		},
		routeToCountry(name) {
			this.$router.push({ name: "Exchanges", query: { search: name } });
		},
		debouncedCreateMap() {
			if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
			this.resizeTimeout = setTimeout(() => {
				this.createMap();
			}, 100);
		},
	},
};
</script>

<style scoped>
.map-container {
	width: 100%;
	height: 100%;
	aspect-ratio: 16 / 9;
	position: relative;
	border: solid 2px var(--second-color);
	border-radius: 20px;
}

.map-container svg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.country {
	fill: lightgray;
}

.highlighted {
	fill: var(--first-color);
}
</style>
