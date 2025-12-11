<!-- src/components/BarChart.vue -->
<template>
  <div ref="chartContainer" class="bar-chart-container"></div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "BarChart",
  props: {
    items: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      chart: null,
    };
  },
  mounted() {
    this.initChart();
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
    if (this.chart) this.chart.dispose();
  },
  watch: {
    items: {
      deep: true,
      handler() {
        this.updateChart();
      },
    },
  },
  methods: {
    initChart() {
      const container = this.$refs.chartContainer;
      if (!container) return;

      this.chart = echarts.init(container);

      this.chart.on("click", (params) => {
        if (!params || params.componentType !== "series") return;


        const name = params.name;
        const index = params.dataIndex;

        // Show tooltip
        this.chart.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: index,
        });

        this.routeToCountry(name);
      });


      this.updateChart();
    },

    updateChart() {
      if (!this.chart || !this.items || !this.items.length) return;

      const labels = this.items.map((i) => i.name);
      const values = this.items.map((i) => i.count);

      const option = {
        grid: {
          left: "3%",
          right: "8%",
          bottom: "3%",
          top: 20,
          containLabel: true,
        },
        tooltip: {
          trigger: "item",
          confine: true,
          formatter: (params) =>
            `${params.name}<br/>${this.$t("common.count")}: ${params.value}`,
        },
        xAxis: { type: "value" },
        yAxis: {
          type: "category",
          data: labels,
          axisLabel: {
            fontSize: 12,
            formatter: (value) => {
              const maxCharsPerLine = 20;     // adjust as needed
              const words = value.split(" ");
              let lines = [""];
              let currentLine = 0;
              for (let word of words) {
                if ((lines[currentLine] + " " + word).trim().length <= maxCharsPerLine) {
                  lines[currentLine] += (lines[currentLine] ? " " : "") + word;
                } else {
                  currentLine++;
                  if (currentLine > 1) break; // stop after 3 lines
                  lines[currentLine] = word;
                }
              }
              // If text was too long for 3 lines → add ellipsis to last line
              if (currentLine > 1) {
                lines[1] += " ...";
              }
              return lines.join("\n");
            }
          },
          inverse: true,
        },
        series: [
          {
            type: "bar",
            data: values,
            itemStyle: {
              cursor: "pointer",
            },
          },
        ],
      };

      this.chart.setOption(option);
    },

    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    },

    routeToCountry(name) {
      this.$router.push({ name: "Exchanges", query: { search: name } });
    },
  },
};
</script>

<style scoped>
.bar-chart-container {
  width: 100%;
  height: 400px;
  min-height: 300px;
}
</style>
