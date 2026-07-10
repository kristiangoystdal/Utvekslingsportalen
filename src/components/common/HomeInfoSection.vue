<template>
	<v-row>
		<v-col cols="12" md="6">
			<v-autocomplete :model-value="homeUniversity" :items="homeUniversities"
				:label="$t('database.homeUniversity')" variant="outlined" density="compact" clearable
				:hint="$t('hints.homeUniversity')" persistent-hint autocomplete="off"
				@update:model-value="onHomeUniversityChange" />
		</v-col>
		<v-col cols="12" md="6">
			<v-autocomplete :model-value="study" :items="availableStudies" :label="$t('database.study')"
				variant="outlined" density="compact" clearable :disabled="!homeUniversity"
				:hint="!homeUniversity ? $t('hints.selectHomeUniversityFirst') : $t('hints.study')"
				persistent-hint autocomplete="off"
				@update:model-value="$emit('update:study', $event)" />
		</v-col>
		<v-col cols="12" md="6">
			<v-autocomplete :model-value="studyYear" :items="['1.', '2.', '3.', '4.', '5.']"
				:label="$t('database.studyYear')" variant="outlined" density="compact" clearable
				:hint="$t('hints.studyYear')" persistent-hint autocomplete="off"
				@update:model-value="$emit('update:studyYear', $event)" />
		</v-col>
		<v-col cols="12" md="6">
			<v-text-field :model-value="year" type="number" :label="$t('database.year')" variant="outlined"
				density="compact" clearable :hint="$t('hints.year')" persistent-hint autocomplete="off"
				@update:model-value="$emit('update:year', $event)" />
		</v-col>
	</v-row>
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
		homeUniversity: { type: String, default: null },
		study: { type: String, default: null },
		studyYear: { type: String, default: null },
		year: { type: [String, Number], default: null },
	},
	emits: ["update:homeUniversity", "update:study", "update:studyYear", "update:year"],
	computed: {
		homeUniversities() {
			return Object.values(homeUniversityJson || {});
		},
		availableStudies() {
			if (!this.homeUniversity) return [];
			if (this.homeUniversity === homeUniversityJson["NTNU"]) return Object.keys(ntnu_studies?.studies || {});
			if (this.homeUniversity === homeUniversityJson["UiO"]) return Object.keys(uio_studies?.studies || {});
			if (this.homeUniversity === homeUniversityJson["UiB"]) return Object.keys(uib_studies?.studies || {});
			if (this.homeUniversity === homeUniversityJson["UiT"]) return Object.keys(uit_studies?.studies || {});
			if (this.homeUniversity === homeUniversityJson["UiS"]) return Object.keys(uis_studies?.studies || {});
			return [];
		},
	},
	methods: {
		onHomeUniversityChange(val) {
			this.$emit("update:homeUniversity", val);
			this.$emit("update:study", null);
		},
	},
};
</script>
