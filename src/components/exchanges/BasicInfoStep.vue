<template>
	<div v-if="isInitialized">
		<div class="section-divider"><span>{{ $t('wizard.basic.homeInfo') }}</span></div>
		<v-row dense>
			<v-col cols="12" md="6">
				<v-autocomplete
					:items="homeUniversities"
					v-model="localExchange.homeUniversity"
					:label="$t('database.homeUniversity')"
					variant="outlined"
					density="compact"
					clearable
					:hint="$t('hints.homeUniversity')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
			<v-col cols="12" md="6">
				<v-autocomplete
					:items="Object.keys(studies?.studies || {})"
					v-model="localExchange.study"
					:label="$t('database.study')"
					variant="outlined"
					density="compact"
					clearable
					:disabled="!localExchange.homeUniversity"
					:hint="!localExchange.homeUniversity ? $t('hints.selectHomeUniversityFirst') : $t('hints.study')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
			<v-col cols="12" md="6">
				<v-autocomplete
					v-model="localExchange.studyYear"
					:items="['1.', '2.', '3.', '4.', '5.']"
					:label="$t('database.studyYear')"
					variant="outlined"
					density="compact"
					clearable
					:hint="$t('hints.studyYear')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
			<v-col cols="12" md="6">
				<v-text-field
					v-model="localExchange.year"
					type="number"
					:label="$t('database.year')"
					variant="outlined"
					density="compact"
					clearable
					:hint="$t('hints.year')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
		</v-row>

		<div class="section-divider"><span>{{ $t('wizard.basic.destination') }}</span></div>
		<v-row dense>
			<v-col cols="12" md="6">
				<v-autocomplete
					v-model="localExchange.country"
					:items="countryNamesTranslated"
					item-title="name"
					item-value="key"
					:label="$t('database.country')"
					variant="outlined"
					density="compact"
					clearable
					:hint="$t('hints.country')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
			<v-col cols="12" md="6">
				<v-autocomplete
					v-model="localExchange.university"
					:items="universityNames"
					:label="$t('database.university')"
					:disabled="!localExchange.country"
					:hint="!localExchange.country ? $t('hints.selectCountryFirst') : $t('hints.university')"
					variant="outlined"
					density="compact"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
			<v-col cols="12" md="6">
				<v-autocomplete
					v-model="localExchange.numSemesters"
					:items="[1, 2]"
					:label="$t('database.numSemesters')"
					variant="outlined"
					density="compact"
					clearable
					:hint="$t('hints.numSemesters')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
			<v-col v-if="localExchange.numSemesters === 1" cols="12" md="6">
				<v-autocomplete
					v-model="localSemester"
					:items="['Høst', 'Vår', 'Sommer']"
					:label="$t('database.semester')"
					variant="outlined"
					density="compact"
					clearable
					:hint="$t('hints.semester')"
					persistent-hint
					autocomplete="off"
				/>
			</v-col>
		</v-row>

		<template v-if="localExchange.numSemesters === 2">
			<v-checkbox
				v-model="localExchange.sameUniversity"
				:label="$t('myExchange.semestersLocation')"
				hide-details
				class="mt-2 mb-2"
			/>
			<v-row v-if="!localExchange.sameUniversity" dense>
				<v-col cols="12" md="6">
					<v-autocomplete
						v-model="localExchange.secondCountry"
						:items="countryNamesTranslated"
						item-title="name"
						item-value="key"
						:label="$t('database.country') + ' 2'"
						variant="outlined"
						density="compact"
						clearable
						:hint="$t('hints.secondCountry')"
						persistent-hint
						autocomplete="off"
					/>
				</v-col>
				<v-col cols="12" md="6">
					<v-autocomplete
						v-model="localExchange.secondUniversity"
						:items="secondUniversityNames"
						:label="$t('database.university') + ' 2'"
						variant="outlined"
						density="compact"
						:hint="$t('hints.secondUniversity')"
						persistent-hint
						autocomplete="off"
					/>
				</v-col>
			</v-row>
		</template>
	</div>
</template>

<script>
import homeUniversityJson from "../../data/homeUniversities.json";
import ntnu_studies from "../../data/studies/ntnu.json";
import uio_studies from "../../data/studies/uio.json";
import uib_studies from "../../data/studies/uib.json";
import uit_studies from "../../data/studies/uit.json";
import uis_studies from "../../data/studies/uis.json";

export default {
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
		homeUniversities() {
			return Object.values(homeUniversityJson || {});
		},
		studies() {
			if (!this.localExchange.homeUniversity) return {};
			if (this.localExchange.homeUniversity === homeUniversityJson["NTNU"]) return ntnu_studies || { studies: {} };
			if (this.localExchange.homeUniversity === homeUniversityJson["UiO"]) return uio_studies || { studies: {} };
			if (this.localExchange.homeUniversity === homeUniversityJson["UiB"]) return uib_studies || { studies: {} };
			if (this.localExchange.homeUniversity === homeUniversityJson["UiT"]) return uit_studies || { studies: {} };
			if (this.localExchange.homeUniversity === homeUniversityJson["UiS"]) return uis_studies || { studies: {} };
			return { studies: {} };
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
		'localExchange.homeUniversity'(newVal, oldVal) {
			if (!this.isInitialized) return;
			if (newVal !== oldVal) this.localExchange.study = null;
		},
		'localExchange.country'(newVal, oldVal) {
			if (!this.isInitialized) return;
			if (newVal !== oldVal) this.localExchange.university = null;
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
