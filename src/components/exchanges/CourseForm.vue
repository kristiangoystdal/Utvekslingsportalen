<template>
	<div class="zero-padding">
		<h3>Legg til/Endre fag</h3>
		<v-form ref="form" v-model="valid" lazy-validation class="zero-padding">
			<!-- ECTS Points -->
			<v-text-field v-model="localCourse.ECTSPoints" :label="$t('database.ECTSPoints')" :rules="[
				(v) => !!v || $t('rules.required'),
				(v) => !isNaN(v) || $t('rules.validNumber'),
			]" :hint="$t('hints.ECTSPoints')" required persistent-hint></v-text-field>

			<!-- Course Name -->
			<v-text-field v-model="localCourse.courseName" :label="$t('database.courseName')" :rules="courseRules" required
				:hint="$t('hints.courseName')" persistent-hint></v-text-field>

			<!-- Course Code -->
			<v-text-field v-model="localCourse.courseCode" :label="$t('database.courseCode')" :hint="$t('hints.courseCode')"
				persistent-hint></v-text-field>

			<!-- Replaced Course Name -->
			<v-text-field v-model="localCourse.replacedCourseName" :label="$t('database.replacedCourseName')"
				:hint="$t('hints.replacedCourseName')" persistent-hint></v-text-field>

			<!-- Replaced Course Code -->
			<v-text-field v-model="localCourse.replacedCourseCode" :label="$t('database.replacedCourseCode')"
				:hint="$t('hints.replacedCourseCode')" persistent-hint></v-text-field>

			<!-- Course Type -->
			<v-select v-model="localCourse.courseType" :items="courseTypes" :label="$t('database.courseType')"
				:hint="$t('hints.courseType')" persistent-hint clearable></v-select>

			<!-- Institute -->
			<v-text-field v-model="localCourse.institute" :label="$t('database.institute')" :hint="$t('hints.institute')"
				persistent-hint></v-text-field>

			<!-- Course Year -->
			<v-text-field v-model="localCourse.year" :label="$t('myExchange.courseInformation.courseYear')"
				:rules="[(v) => /^\d{4}$/.test(v) || $t('rules.yearFormat')]" :hint="$t('hints.courseYear')"
				persistent-hint></v-text-field>

			<!-- Comments -->
			<v-textarea v-model="localCourse.comments" :label="$t('database.comments')"></v-textarea>

			<div style="display: flex; justify-content: space-between">
				<!-- Reset Button -->
				<v-btn @click="resetForm" class="btn-accent">
					{{ $t("operations.reset") }}
				</v-btn>
			</div>
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
				year: "",
				courseCode: "",
				courseName: "",
				replacedCourseCode: "",
				replacedCourseName: "",
				courseType: "",
				institute: "",
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
			courseRules: [
				(v) => (v && v.length >= 3) || this.$t("rules.min3Chars"),
			],
			courseTypes: ["O-emne", "I-emne", "K-emne", "Annet"],
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

<style scoped></style>
