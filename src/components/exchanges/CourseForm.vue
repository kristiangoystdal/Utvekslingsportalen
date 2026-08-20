<template>
	<div class="zero-padding">
		<h3>{{ $t('myExchange.courseFormTitle') }}</h3>
		<br />
		<v-form ref="form" v-model="valid" class="form-grid" lazy-validation>
			<!-- ECTS -->
			<v-text-field v-model="localCourse.ECTSPoints" :label="$t('database.ECTSPoints')" :hint="$t('hints.ECTSPoints')"
				persistent-hint variant="outlined" density="comfortable" inputmode="decimal" :rules="ectsRules"
				@blur="normalizeEcts" />

			<br />

			<!-- Course Name -->
			<v-combobox v-model="localCourse.courseName" :items="exchangeCourseNames" :label="$t('database.courseName')"
				:hint="$t('hints.courseName')" persistent-hint variant="outlined" density="comfortable"
				:rules="courseNameRules" @update:model-value="onCourseNameChange" />

			<!-- Course Code -->
			<v-combobox v-model="localCourse.courseCode" :items="exchangeCourseCodes" :label="$t('database.courseCode')"
				:hint="$t('hints.courseCode')" persistent-hint variant="outlined" density="comfortable"
				autocapitalize="characters" @update:model-value="onCourseCodeChange" @blur="normalizeCourseCode" />

			<!-- Replaced Course Name -->
			<v-combobox v-model="localCourse.replacedCourseName" :items="homeCourseNames"
				:label="$t('database.replacedCourseName')" :hint="$t('hints.replacedCourseName')" persistent-hint
				variant="outlined" density="comfortable" @update:model-value="onReplacedCourseNameChange" />

			<!-- Replaced Course Code -->
			<v-combobox v-model="localCourse.replacedCourseCode" :items="homeCourseCodes"
				:label="$t('database.replacedCourseCode')" :hint="$t('hints.replacedCourseCode')" persistent-hint
				variant="outlined" density="comfortable" @update:model-value="onReplacedCourseCodeChange"
				@blur="normalizeReplacedCourseCode" />

			<!-- Comments (full width) -->
			<v-textarea v-model="localCourse.comments" :label="$t('database.comments')" variant="outlined"
				density="comfortable" rows="3" auto-grow counter="500" class="comments" />
		</v-form>
	</div>
</template>

<script>
import { getCourseSuggestions } from "../../js/coursesCache.js";
import { getHomeCoursesForUniversity } from "../../js/homeCoursesData.js";

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
		unsavedChanges: Boolean,
		homeUniversity: { type: String, default: null },
		university: { type: String, default: null },
	},
	emits: ["submit-course"], // Declare the custom event
	data() {
		return {
			valid: false,
			localCourse: { ...this.course },
			exchangeCourseOptions: [],
			allExchangeCourseOptions: [],
			dbHomeCourseOptions: [],
			allDbHomeCourseOptions: [],
			fileHomeCourseOptions: [],
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
	computed: {
		exchangeCourseNames() {
			return [...new Set(this.exchangeCourseOptions.map((c) => c.name).filter(Boolean))].sort();
		},
		exchangeCourseCodes() {
			return [...new Set(this.exchangeCourseOptions.map((c) => c.code).filter(Boolean))].sort();
		},
		// Home-university courses come primarily from the static per-university
		// files (loaded on demand in loadHomeCourses); only fall back to the
		// courses database when the file has no entries for this university.
		homeCourseOptions() {
			return this.fileHomeCourseOptions.length ? this.fileHomeCourseOptions : this.dbHomeCourseOptions;
		},
		homeCourseNames() {
			return [...new Set(this.homeCourseOptions.map((c) => c.name).filter(Boolean))].sort();
		},
		homeCourseCodes() {
			return [...new Set(this.homeCourseOptions.map((c) => c.code).filter(Boolean))].sort();
		},
	},
	mounted() {
		this.loadSuggestions();
		this.loadHomeCourses();
	},
	watch: {
		localCourse: {
			handler() {
				this.$emit("submit-course", { ...this.localCourse });
			},
			deep: true,
			immediate: true,
		},
		university() {
			this.loadSuggestions();
		},
		homeUniversity() {
			this.loadSuggestions();
			this.loadHomeCourses();
		},
	},
	methods: {
		async loadHomeCourses() {
			try {
				this.fileHomeCourseOptions = await getHomeCoursesForUniversity(this.homeUniversity);
			} catch (error) {
				console.error("Error loading home university courses:", error);
			}
		},
		async loadSuggestions() {
			try {
				// Scoped lists (matching this exchange's university) drive the
				// dropdown suggestions. Unscoped lists are kept only as a
				// fallback so autofill still finds a course logged under a
				// slightly different university spelling or an older record.
				const [scoped, all] = await Promise.all([
					getCourseSuggestions({
						university: this.university,
						homeUniversity: this.homeUniversity,
					}),
					getCourseSuggestions(),
				]);
				this.exchangeCourseOptions = scoped.exchangeCourses;
				this.dbHomeCourseOptions = scoped.homeCourses;
				this.allExchangeCourseOptions = all.exchangeCourses;
				this.allDbHomeCourseOptions = all.homeCourses;
			} catch (error) {
				console.error("Error loading course suggestions:", error);
			}
		},
		normalizeEcts() {
			if (this.localCourse.ECTSPoints) {
				this.localCourse.ECTSPoints = String(parseFloat(this.localCourse.ECTSPoints) || "");
			}
		},
		normalizeCourseCode() {
			if (this.localCourse.courseCode) {
				this.localCourse.courseCode = this.localCourse.courseCode.toUpperCase().trim();
				this.onCourseCodeChange(this.localCourse.courseCode);
			}
		},
		normalizeReplacedCourseCode() {
			if (this.localCourse.replacedCourseCode) {
				this.localCourse.replacedCourseCode = this.localCourse.replacedCourseCode.toUpperCase().trim();
				this.onReplacedCourseCodeChange(this.localCourse.replacedCourseCode);
			}
		},
		// Picking (or typing the exact match of) a known course fills in its
		// paired code/name/ECTS, overwriting whatever was there before, since
		// the user has just told us which course this is. Tries the
		// university-scoped list first, then falls back to searching across
		// all universities so autofill still works even if this exact
		// exchange has no matching history yet.
		findCourseMatch(list, fallbackList, predicate) {
			return list.find(predicate) || fallbackList.find(predicate);
		},
		onCourseNameChange(value) {
			if (!value) return;
			const match = this.findCourseMatch(
				this.exchangeCourseOptions,
				this.allExchangeCourseOptions,
				(c) => c.name === value
			);
			if (!match) return;
			if (match.code && this.localCourse.courseCode !== match.code) {
				this.localCourse.courseCode = match.code;
			}
			if (match.ects && this.localCourse.ECTSPoints !== match.ects) {
				this.localCourse.ECTSPoints = match.ects;
			}
		},
		onCourseCodeChange(value) {
			const normalized = (value || "").toUpperCase().trim();
			if (!normalized) return;
			const match = this.findCourseMatch(
				this.exchangeCourseOptions,
				this.allExchangeCourseOptions,
				(c) => c.code === normalized
			);
			if (!match) return;
			if (match.name && this.localCourse.courseName !== match.name) {
				this.localCourse.courseName = match.name;
			}
			if (match.ects && this.localCourse.ECTSPoints !== match.ects) {
				this.localCourse.ECTSPoints = match.ects;
			}
		},
		onReplacedCourseNameChange(value) {
			if (!value) return;
			const match = this.findCourseMatch(
				this.homeCourseOptions,
				this.allDbHomeCourseOptions,
				(c) => c.name === value
			);
			if (match && match.code && this.localCourse.replacedCourseCode !== match.code) {
				this.localCourse.replacedCourseCode = match.code;
			}
		},
		onReplacedCourseCodeChange(value) {
			const normalized = (value || "").toUpperCase().trim();
			if (!normalized) return;
			const match = this.findCourseMatch(
				this.homeCourseOptions,
				this.allDbHomeCourseOptions,
				(c) => c.code === normalized
			);
			if (match && match.name && this.localCourse.replacedCourseName !== match.name) {
				this.localCourse.replacedCourseName = match.name;
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
