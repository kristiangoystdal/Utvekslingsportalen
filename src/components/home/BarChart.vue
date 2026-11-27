<!-- Horizontal bar list. Each bar links to the exchange search for that item. -->
<template>
  <ol class="bar-chart">
    <li v-for="item in items" :key="item.name">
      <router-link class="bar-row" :to="{ name: 'Exchanges', query: { search: item.name } }"
        :title="`${item.name}: ${item.count}`">
        <span class="bar-label">{{ item.name }}</span>
        <span class="bar-track">
          <span class="bar-fill" :style="{ width: barWidth(item.count) }"></span>
        </span>
        <span class="bar-count">{{ item.count }}</span>
      </router-link>
    </li>
  </ol>
</template>

<script>
export default {
  name: "BarChart",
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  computed: {
    max() {
      return Math.max(1, ...this.items.map((i) => i.count));
    },
  },
  methods: {
    barWidth(count) {
      return `${Math.max(2, (count / this.max) * 100)}%`;
    },
  },
};
</script>

<style scoped>
.bar-chart {
  list-style: none;
  width: 100%;
  max-width: 760px;
  padding: 0;
  margin: 0.5rem auto 1.5rem;
  text-align: left;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(8rem, 14rem) 1fr 2.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
}

.bar-row:hover,
.bar-row:focus-visible {
  background: rgba(var(--v-theme-primary), 0.08);
}

.bar-row:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.bar-label {
  font-size: 0.9rem;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bar-track {
  height: 0.9rem;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  transition: width 0.4s ease;
}

.bar-count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  text-align: right;
}

@media (max-width: 600px) {
  .bar-row {
    grid-template-columns: 1fr 2.5rem;
    row-gap: 0.25rem;
  }

  .bar-label {
    grid-column: 1 / -1;
  }
}
</style>
