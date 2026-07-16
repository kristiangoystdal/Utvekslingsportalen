<template>
	<div class="step-body">
		<v-text-field v-model="localExperience.title" :label="$t('experiences.title')"
			:error-messages="submitted && !localExperience.title ? $t('experiences.titleRequired') : ''" variant="outlined"
			density="compact" />
		<v-checkbox v-model="localExperience.anonymous" :label="$t('experiences.anonymous')" hide-details density="compact"
			class="mb-2" />

		<div class="section-divider"><span>{{ $t('wizard.basic.homeInfo') }}</span></div>
		<br />
		<HomeInfoSection
			:homeUniversity="localExperience.homeUniversity"
			:study="localExperience.study"
			:studyYear="localExperience.studyYear"
			:year="localExperience.year"
			@update:homeUniversity="localExperience.homeUniversity = $event"
			@update:study="localExperience.study = $event"
			@update:studyYear="localExperience.studyYear = $event"
			@update:year="localExperience.year = $event"
		/>

		<div class="section-divider"><span>{{ $t('wizard.basic.destination') }}</span></div>
		<br />
		<DestinationSection
			:country="localExperience.country"
			:university="localExperience.university"
			:numSemesters="localExperience.numSemesters"
			:semester="localExperience.semester"
			:countryItems="countryNamesTranslated"
			:universityItems="universityNames"
			@update:country="localExperience.country = $event"
			@update:university="localExperience.university = $event"
			@update:numSemesters="localExperience.numSemesters = $event"
			@update:semester="localExperience.semester = $event"
		/>
	</div>
</template>

<script>
import HomeInfoSection from "../../common/HomeInfoSection.vue";
import DestinationSection from "../../common/DestinationSection.vue";

export default {
	components: { HomeInfoSection, DestinationSection },
	props: {
		experience: { type: Object, required: true },
		countryNamesTranslated: { type: Array, default: () => [] },
		universityNames: { type: Array, default: () => [] },
		submitted: { type: Boolean, default: false },
	},
	emits: ["update"],
	data() {
		return { localExperience: { ...this.experience } };
	},
	watch: {
		experience: {
			deep: true,
			handler(val) { this.localExperience = { ...val }; },
		},
		localExperience: {
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
