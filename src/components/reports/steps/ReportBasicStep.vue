<template>
	<div class="step-body">
		<v-text-field v-model="localReport.title" :label="$t('reports.title')"
			:error-messages="submitted && !localReport.title ? $t('reports.titleRequired') : ''" variant="outlined"
			density="compact" />
		<v-checkbox v-model="localReport.anonymous" :label="$t('reports.anonymous')" hide-details density="compact"
			class="mb-2" />

		<div class="section-divider"><span>{{ $t('wizard.basic.homeInfo') }}</span></div>
		<br />
		<HomeInfoSection
			:homeUniversity="localReport.homeUniversity"
			:study="localReport.study"
			:studyYear="localReport.studyYear"
			:year="localReport.year"
			@update:homeUniversity="localReport.homeUniversity = $event"
			@update:study="localReport.study = $event"
			@update:studyYear="localReport.studyYear = $event"
			@update:year="localReport.year = $event"
		/>

		<div class="section-divider"><span>{{ $t('wizard.basic.destination') }}</span></div>
		<br />
		<DestinationSection
			:country="localReport.country"
			:university="localReport.university"
			:numSemesters="localReport.numSemesters"
			:semester="localReport.semester"
			:countryItems="countryNamesTranslated"
			:universityItems="universityNames"
			@update:country="localReport.country = $event"
			@update:university="localReport.university = $event"
			@update:numSemesters="localReport.numSemesters = $event"
			@update:semester="localReport.semester = $event"
		/>
	</div>
</template>

<script>
import HomeInfoSection from "../../common/HomeInfoSection.vue";
import DestinationSection from "../../common/DestinationSection.vue";

export default {
	components: { HomeInfoSection, DestinationSection },
	props: {
		report: { type: Object, required: true },
		countryNamesTranslated: { type: Array, default: () => [] },
		universityNames: { type: Array, default: () => [] },
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
</style>
