<template>
	<v-row no-gutters>
		<v-col cols="12" md="6" class="pa-1">
			<v-autocomplete :model-value="homeUniversity" :items="homeUniversities"
				:label="$t('database.homeUniversity')" variant="outlined" density="compact" clearable
				:hint="$t('hints.homeUniversity')" persistent-hint autocomplete="off"
				@update:model-value="onHomeUniversityChange" />
		</v-col>
		<v-col cols="12" md="6" class="pa-1">
			<v-autocomplete :model-value="study" :items="availableStudies" :label="$t('database.study')"
				variant="outlined" density="compact" clearable :disabled="!homeUniversity"
				:hint="!homeUniversity ? $t('hints.selectHomeUniversityFirst') : $t('hints.study')"
				persistent-hint autocomplete="off"
				@update:model-value="$emit('update:study', $event)" />
		</v-col>
		<v-col cols="12" md="6" class="pa-1">
			<v-autocomplete :model-value="studyYear" :items="['1.', '2.', '3.', '4.', '5.']"
				:label="$t('database.studyYear')" variant="outlined" density="compact" clearable
				:hint="$t('hints.studyYear')" persistent-hint autocomplete="off"
				@update:model-value="$emit('update:studyYear', $event)" />
		</v-col>
		<v-col cols="12" md="6" class="pa-1">
			<v-text-field :model-value="year" type="number" :label="$t('database.year')" variant="outlined"
				density="compact" clearable :hint="$t('hints.year')" persistent-hint autocomplete="off"
				@update:model-value="$emit('update:year', $event)" />
		</v-col>
	</v-row>
</template>

<script>
import homeUniversityJson from "../../data/homeUniversities.json";
import { getStudiesForHomeUniversity } from "../../js/homeStudiesData.js";

export default {
	props: {
		homeUniversity: { type: String, default: null },
		study: { type: String, default: null },
		studyYear: { type: String, default: null },
		year: { type: [String, Number], default: null },
	},
	emits: ["update:homeUniversity", "update:study", "update:studyYear", "update:year"],
	data() {
		return {
			availableStudies: [],
		};
	},
	computed: {
		homeUniversities() {
			return Object.values(homeUniversityJson || {});
		},
	},
	watch: {
		homeUniversity: {
			immediate: true,
			async handler(val) {
				try {
					this.availableStudies = await getStudiesForHomeUniversity(val);
				} catch (error) {
					console.error("Error loading studies for home university:", error);
					this.availableStudies = [];
				}
			},
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
