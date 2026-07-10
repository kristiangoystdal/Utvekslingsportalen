<template>
	<v-row>
		<v-col cols="12" md="6">
			<v-autocomplete :model-value="country" :items="countryItems" item-title="name" item-value="key"
				:label="$t('database.country')" variant="outlined" density="compact" clearable
				:hint="$t('hints.country')" persistent-hint autocomplete="off"
				@update:model-value="onCountryChange" />
		</v-col>
		<v-col cols="12" md="6">
			<v-autocomplete :model-value="university" :items="universityItems" :label="$t('database.university')"
				:disabled="!country" variant="outlined" density="compact" clearable
				:hint="!country ? $t('hints.selectCountryFirst') : $t('hints.university')"
				persistent-hint autocomplete="off"
				@update:model-value="$emit('update:university', $event)" />
		</v-col>
		<v-col cols="12" md="6">
			<v-autocomplete :model-value="numSemesters" :items="[1, 2]" :label="$t('database.numSemesters')"
				variant="outlined" density="compact" clearable :hint="$t('hints.numSemesters')"
				persistent-hint autocomplete="off"
				@update:model-value="$emit('update:numSemesters', $event)" />
		</v-col>
		<v-col v-if="numSemesters === 1" cols="12" md="6">
			<v-autocomplete :model-value="semester" :items="['Høst', 'Vår', 'Sommer']" :label="$t('database.semester')"
				variant="outlined" density="compact" clearable :hint="$t('hints.semester')"
				persistent-hint autocomplete="off"
				@update:model-value="$emit('update:semester', $event)" />
		</v-col>
	</v-row>
</template>

<script>
export default {
	props: {
		country: { type: String, default: null },
		university: { type: String, default: null },
		numSemesters: { type: Number, default: null },
		semester: { type: String, default: null },
		countryItems: { type: Array, default: () => [] },
		universityItems: { type: Array, default: () => [] },
	},
	emits: ["update:country", "update:university", "update:numSemesters", "update:semester"],
	methods: {
		onCountryChange(val) {
			this.$emit("update:country", val);
			this.$emit("update:university", null);
		},
	},
};
</script>
