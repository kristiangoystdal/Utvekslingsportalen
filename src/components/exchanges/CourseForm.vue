<template>
	<div class="zero-padding">
		<h3>Legg til/Endre fag</h3>
		<br />
		<v-form ref="form" v-model="valid" class="form-grid" lazy-validation>
			<!-- ECTS -->
			<v-text-field v-model="localCourse.ECTSPoints" :label="$t('database.ECTSPoints')" :hint="$t('hints.ECTSPoints')"
				persistent-hint variant="outlined" density="comfortable" inputmode="decimal" :rules="ectsRules"
				@blur="normalizeEcts" />

			<br />

			<!-- Course Name -->
			<v-text-field v-model="localCourse.courseName" :label="$t('database.courseName')" :hint="$t('hints.courseName')"
				persistent-hint variant="outlined" density="comfortable" :rules="courseNameRules" />

			<!-- Course Code -->
			<v-text-field v-model="localCourse.courseCode" :label="$t('database.courseCode')" :hint="$t('hints.courseCode')"
				persistent-hint variant="outlined" density="comfortable" autocapitalize="characters"
				@blur="normalizeCourseCode" />

			<!-- Replaced Course Name -->
			<v-text-field v-model="localCourse.replacedCourseName" :label="$t('database.replacedCourseName')"
				:hint="$t('hints.replacedCourseName')" persistent-hint variant="outlined" density="comfortable" />

			<!-- Replaced Course Code -->
			<v-text-field v-model="localCourse.replacedCourseCode" :label="$t('database.replacedCourseCode')"
				:hint="$t('hints.replacedCourseCode')" persistent-hint variant="outlined" density="comfortable"
				@blur="normalizeReplacedCourseCode" />

			<!-- Comments (full width) -->
			<v-textarea v-model="localCourse.comments" :label="$t('database.comments')" variant="outlined"
				density="comfortable" rows="3" auto-grow counter="500" class="comments" />
		</v-form>
	</div>
</template>

<script>
export default {
	props: {
		course: {
			type: Object,
			default: () => ({
				exchangeID: "",
				courseCode: "",
				courseName: "",
				replacedCourseCode: "",
				replacedCourseName: "",
				ECTSPoints: "",
				comments: "",
			}),
		},
		updateExchange: Function,
		unsavedChanges: Boolean,
		removeCourse: Function, // Adding removeCourse prop
	},
	emits: ["submit-course"], // Declare the custom event
	data() {
		return {
			valid: false,
			localCourse: { ...this.course },
			courseNameRules: [
				(v) => (v && v.length >= 3) || this.$t("rules.min3Chars"),
			],
			ectsRules: [
				(v) =>
					(!v || (!isNaN(v) && Number(v) >= 0 && Number(v) <= 60)) ||
					this.$t("rules.validEcts"),
			],
		};
	},
	watch: {
		localCourse: {
			handler() {
				this.$emit("submit-course", { ...this.localCourse });
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		submit() {
			if (this.$refs.form.validate()) {
				this.updateExchange({ ...this.localCourse });
			}
		},
		resetForm() {
			for (const key in this.course) {
				this.localCourse[key] = "";
			}
		},
	},
};
</script>

<style scoped>
.course-card {
	border-radius: 16px;
}

.form-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 14px;
}

@media (min-width: 900px) {
	.form-grid {
		grid-template-columns: 1fr 1fr;
	}

	.comments {
		grid-column: 1 / -1;
	}
}

.actions {
	padding: 12px 16px;
}
</style>
