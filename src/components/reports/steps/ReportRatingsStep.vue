<template>
	<div class="step-body">
		<div class="section-divider"><span>{{ $t('reports.ratings') }}</span></div>
		<div v-for="key in ratingKeys" :key="key" class="rating-row">
			<span class="rating-label">{{ $t(`reports.${key}`) }}</span>
			<v-rating v-model="localRatings[key]" color="amber" hover length="5" size="24"
				@update:model-value="emitRatings" />
		</div>

		<div class="section-divider mt-3"><span>{{ $t('reports.pros') }}</span></div>
		<br />
		<div v-for="(_, i) in localPros" :key="'pro-' + i" class="list-row">
			<v-text-field v-model="localPros[i]" density="compact" variant="outlined" hide-details
				@update:model-value="$emit('update:pros', [...localPros])" />
			<v-btn icon size="small" variant="text" color="error" @click="removePro(i)">
				<v-icon size="16">mdi-close</v-icon>
			</v-btn>
		</div>
		<v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addPro">
			{{ $t('reports.addPro') }}
		</v-btn>

		<div class="section-divider mt-3"><span>{{ $t('reports.cons') }}</span></div>
		<br />
		<div v-for="(_, i) in localCons" :key="'con-' + i" class="list-row">
			<v-text-field v-model="localCons[i]" density="compact" variant="outlined" hide-details
				@update:model-value="$emit('update:cons', [...localCons])" />
			<v-btn icon size="small" variant="text" color="error" @click="removeCon(i)">
				<v-icon size="16">mdi-close</v-icon>
			</v-btn>
		</div>
		<v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addCon">
			{{ $t('reports.addCon') }}
		</v-btn>
	</div>
</template>

<script>
export default {
	props: {
		ratings: { type: Object, required: true },
		pros: { type: Array, default: () => [""] },
		cons: { type: Array, default: () => [""] },
	},
	emits: ["update:ratings", "update:pros", "update:cons"],
	data() {
		return {
			ratingKeys: ["overall", "academic", "social", "housing", "costOfLiving"],
			localRatings: { ...this.ratings },
			localPros: [...this.pros],
			localCons: [...this.cons],
		};
	},
	watch: {
		ratings: { deep: true, handler(val) { this.localRatings = { ...val }; } },
		pros: { deep: true, handler(val) { this.localPros = [...val]; } },
		cons: { deep: true, handler(val) { this.localCons = [...val]; } },
	},
	methods: {
		emitRatings() { this.$emit("update:ratings", { ...this.localRatings }); },
		addPro() { this.localPros.push(""); this.$emit("update:pros", [...this.localPros]); },
		removePro(i) { this.localPros.splice(i, 1); this.$emit("update:pros", [...this.localPros]); },
		addCon() { this.localCons.push(""); this.$emit("update:cons", [...this.localCons]); },
		removeCon(i) { this.localCons.splice(i, 1); this.$emit("update:cons", [...this.localCons]); },
	},
};
</script>

<style scoped>
.step-body {
	padding: 12px 16px 8px;
}

.section-divider {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(0, 0, 0, 0.38);
	margin: 10px 0 8px;
}

.section-divider::before,
.section-divider::after {
	content: '';
	flex: 1;
	height: 1px;
	background: rgba(0, 0, 0, 0.1);
}

.rating-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 3px 0;
}

.rating-label {
	font-size: 0.88rem;
	font-weight: 500;
	color: rgba(0, 0, 0, 0.75);
}

.list-row {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 6px;
}
</style>
