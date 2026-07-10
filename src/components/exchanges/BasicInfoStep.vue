<template>
	<div v-if="isInitialized">
		<div class="section-divider"><span>{{ $t('wizard.basic.homeInfo') }}</span></div>
		<br />
		<HomeInfoSection
			:homeUniversity="localExchange.homeUniversity"
			:study="localExchange.study"
			:studyYear="localExchange.studyYear"
			:year="localExchange.year"
			@update:homeUniversity="localExchange.homeUniversity = $event"
			@update:study="localExchange.study = $event"
			@update:studyYear="localExchange.studyYear = $event"
			@update:year="localExchange.year = $event"
		/>

		<div class="section-divider"><span>{{ $t('wizard.basic.destination') }}</span></div>
		<br />
		<DestinationSection
			:country="localExchange.country"
			:university="localExchange.university"
			:numSemesters="localExchange.numSemesters"
			:semester="localSemester"
			:countryItems="countryNamesTranslated"
			:universityItems="universityNames"
			@update:country="localExchange.country = $event"
			@update:university="localExchange.university = $event"
			@update:numSemesters="localExchange.numSemesters = $event"
			@update:semester="localSemester = $event"
		/>

		<template v-if="localExchange.numSemesters === 2">
			<v-checkbox v-model="localExchange.sameUniversity" :label="$t('myExchange.semestersLocation')" hide-details
				class="mt-2 mb-2" />
			<v-row v-if="!localExchange.sameUniversity" dense>
				<v-col cols="12" md="6">
					<v-autocomplete v-model="localExchange.secondCountry" :items="countryNamesTranslated" item-title="name"
						item-value="key" :label="$t('database.country') + ' 2'" variant="outlined" density="compact" clearable
						:hint="$t('hints.secondCountry')" persistent-hint autocomplete="off" />
				</v-col>
				<v-col cols="12" md="6">
					<v-autocomplete v-model="localExchange.secondUniversity" :items="secondUniversityNames"
						:label="$t('database.university') + ' 2'" variant="outlined" density="compact"
						:hint="$t('hints.secondUniversity')" persistent-hint autocomplete="off" />
				</v-col>
			</v-row>
		</template>
	</div>
</template>

<script>
import HomeInfoSection from "../common/HomeInfoSection.vue";
import DestinationSection from "../common/DestinationSection.vue";

export default {
	components: { HomeInfoSection, DestinationSection },
	props: {
		userExchange: { type: Object, default: () => ({}) },
		countryNamesTranslated: Array,
		universityNames: Array,
		secondUniversityNames: Array,
		semesters: Array,
	},
	emits: ["update", "updateSemesters"],
	computed: {
		localSemester: {
			get() { return this.semesters[0] || null; },
			set(val) { this.$emit("updateSemesters", val ? [val] : []); },
		},
	},
	data() {
		return {
			localExchange: {
				homeUniversity: null,
				study: null,
				studyYear: null,
				year: null,
				country: null,
				university: null,
				numSemesters: null,
				sameUniversity: true,
				secondCountry: null,
				secondUniversity: null,
			},
			isInitialized: false,
		};
	},
	watch: {
		userExchange: {
			immediate: true,
			deep: true,
			handler(val) {
				if (!val) return;
				if (!this.isInitialized) {
					this.localExchange = JSON.parse(JSON.stringify(val));
					this.isInitialized = true;

					if (this.localExchange.numSemesters === 1 && (!this.semesters || this.semesters.length === 0)) {
						const courses = val.courses || {};
						const hasFall = "Høst" in courses;
						const hasSpring = "Vår" in courses;
						const hasSummer = "Sommer" in courses;

						let picked = null;
						if (hasFall && !hasSpring && !hasSummer) picked = "Høst";
						else if (!hasFall && hasSpring && !hasSummer) picked = "Vår";
						else if (!hasFall && !hasSpring && hasSummer) picked = "Sommer";
						else if (hasFall) picked = "Høst";
						else if (hasSpring) picked = "Vår";
						else if (hasSummer) picked = "Sommer";

						if (picked) this.$emit("updateSemesters", [picked]);
					}
				}
			},
		},
		localExchange: {
			deep: true,
			handler(val) {
				if (!this.isInitialized) return;
				this.$emit("update", JSON.parse(JSON.stringify(val)));
			},
		},
		'localExchange.numSemesters'(newVal) {
			if (!this.isInitialized) return;
			if (newVal === 1) {
				this.localExchange.sameUniversity = true;
				this.localExchange.secondCountry = null;
				this.localExchange.secondUniversity = null;
			}
		},
		'localExchange.sameUniversity'(newVal) {
			if (!this.isInitialized) return;
			if (newVal) {
				this.localExchange.secondCountry = null;
				this.localExchange.secondUniversity = null;
			}
		},
		'localExchange.secondCountry'(newVal, oldVal) {
			if (!this.isInitialized) return;
			if (newVal !== oldVal) this.localExchange.secondUniversity = null;
		},
	},
};
</script>

<style scoped>
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
