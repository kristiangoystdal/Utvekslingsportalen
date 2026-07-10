<template>
	<div class="step-body">
		<v-text-field
			v-model="localReport.title"
			:label="$t('reports.title')"
			:error-messages="submitted && !localReport.title ? $t('reports.titleRequired') : ''"
			variant="outlined"
			density="compact"
		/>
		<v-checkbox
			v-model="localReport.anonymous"
			:label="$t('reports.anonymous')"
			hide-details
			density="compact"
			class="mb-2"
		/>

		<div class="section-divider"><span>{{ $t('reports.destination') }}</span></div>

		<v-row dense>
			<v-col cols="12" sm="6">
				<v-autocomplete
					v-model="localReport.country"
					:items="countryNamesTranslated"
					item-title="name"
					item-value="key"
					:label="$t('database.country')"
					variant="outlined"
					density="compact"
					clearable
				/>
			</v-col>
			<v-col cols="12" sm="6">
				<v-autocomplete
					v-model="localReport.university"
					:items="universityNames"
					:label="$t('database.university')"
					:disabled="!localReport.country"
					variant="outlined"
					density="compact"
					clearable
				/>
			</v-col>
			<v-col cols="12" sm="4">
				<v-autocomplete
					v-model="localReport.study"
					:items="studyNames"
					:label="$t('database.study')"
					variant="outlined"
					density="compact"
					clearable
				/>
			</v-col>
			<v-col cols="12" sm="4">
				<v-text-field
					v-model="localReport.year"
					type="number"
					:label="$t('database.year')"
					variant="outlined"
					density="compact"
				/>
			</v-col>
			<v-col cols="12" sm="4">
				<v-select
					v-model="localReport.semester"
					:items="['Høst', 'Vår']"
					:label="$t('database.semester')"
					variant="outlined"
					density="compact"
					clearable
				/>
			</v-col>
		</v-row>
	</div>
</template>

<script>
export default {
	props: {
		report: { type: Object, required: true },
		countryNamesTranslated: { type: Array, default: () => [] },
		universityNames: { type: Array, default: () => [] },
		studyNames: { type: Array, default: () => [] },
		submitted: { type: Boolean, default: false },
	},
	emits: ["update"],
	data() {
		return { localReport: { ...this.report } };
	},
	watch: {
		report: {
			deep: true,
			handler(val) { this.localReport = { ...val }; },
		},
		localReport: {
			deep: true,
			handler(val) { this.$emit("update", { ...val }); },
		},
	},
};
</script>

<style scoped>
.step-body { padding: 12px 16px 8px; }

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
</style>
