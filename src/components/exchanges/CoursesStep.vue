<template>
	<div>
		<div v-for="semester in semesters" :key="semester" class="mb-6">
			<div class="semester-header">
				<div class="semester-title">
					{{ semester === 'Høst'
						? $t('myExchange.courseInformation.courseFallTitle')
						: $t('myExchange.courseInformation.courseSpringTitle') }}
					<span class="semester-count">({{ courseCount(semester) }} {{ $t('wizard.courses.courses') }})</span>
				</div>
				<v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addCourse(semester)">
					{{ $t('wizard.courses.addCourse') }}
				</v-btn>
			</div>

			<div v-if="courseCount(semester) === 0" class="empty-courses">
				<v-icon size="32" color="primary" class="mb-2">mdi-book-plus-outline</v-icon>
				<div class="text-body-2 text-medium-emphasis">{{ $t('wizard.review.noCourses') }}</div>
			</div>

			<v-expansion-panels v-else variant="accordion" class="course-panels">
				<v-expansion-panel v-for="(course, index) in coursesForSemester(semester)" :key="index" rounded="lg">
					<v-expansion-panel-title>
						<div class="course-panel-title">
							<div class="course-name">
								{{ course.courseName || $t('wizard.courses.newCourse') }}
								<span v-if="course.ECTSPoints" class="course-ects">{{ course.ECTSPoints }} ECTS</span>
							</div>
							<div class="course-actions" @click.stop>
								<v-tooltip v-if="isCourseInvalid(course)" location="top">
									<template #activator="{ props }">
										<v-icon v-bind="props" color="warning" size="18">mdi-alert-circle</v-icon>
									</template>
									{{ $t('wizard.courses.missingFields') }}: {{ missingFields(course).join(', ') }}
								</v-tooltip>
								<v-btn v-if="semesters.length === 2" icon size="x-small" variant="text"
									@click="moveToOtherSemester(semester, index)">
									<v-icon size="16">mdi-swap-horizontal</v-icon>
								</v-btn>
								<v-btn icon size="x-small" variant="text" color="error"
									style="display: flex; align-items: center; justify-content: center;"
									@click="toggleDialog(semester, index)">
									<v-icon size="16">mdi-trash-can-outline</v-icon>
								</v-btn>
							</div>
						</div>
					</v-expansion-panel-title>
					<v-expansion-panel-text>
						<CourseForm :course="course" :unsavedChanges="true"
							@submit-course="updateCourse(semester, index, $event)" />
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</div>

		<!-- Delete confirmation -->
		<v-dialog v-model="deleteCourseDialog" max-width="400">
			<v-card rounded="xl">
				<v-card-title class="pa-4 pb-2">
					<div style="display: flex; align-items: center;">
						<span class="text-h6 font-weight-bold" style="flex: 1;">{{ $t('actions.confirmDelete') }}</span>
						<v-btn icon variant="text" size="small" style="display: flex; align-items: center; justify-content: center;"
							@click="toggleDialog()">
							<v-icon>mdi-close</v-icon>
						</v-btn>
					</div>
				</v-card-title>
				<v-card-text class="pa-4 pt-1 text-medium-emphasis">
					{{ $t('actions.confirmCourseDelete') }}
				</v-card-text>
				<v-card-actions class="pa-4 pt-0 ga-2">
					<v-spacer />
					<v-btn color="success" variant="tonal" @click="toggleDialog()">{{ $t('actions.no') }}</v-btn>
					<v-btn color="error" variant="tonal" @click="removeCourse(currentSemester, currentCourse)">
						{{ $t('actions.yes') }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
import CourseForm from "./CourseForm.vue";

export default {
	components: { CourseForm },
	props: {
		userExchange: Object,
		semesters: Array,
	},
	data() {
		return {
			deleteCourseDialog: false,
			currentSemester: null,
			currentCourse: null,
		};
	},
	emits: ["update"],
	methods: {
		coursesForSemester(semester) {
			return Object.values(this.userExchange.courses[semester] || {});
		},
		courseCount(semester) {
			return Object.keys(this.userExchange.courses[semester] || {}).length;
		},
		addCourse(semester) {
			const courses = this.userExchange.courses[semester] || {};
			const index = Object.keys(courses).length;
			courses[index] = {
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
			};
			this.emitUpdate();
		},
		updateCourse(semester, index, updatedCourse) {
			this.userExchange.courses[semester][index] = updatedCourse;
			this.emitUpdate();
		},
		removeCourse(semester, index) {
			const courses = { ...this.userExchange.courses[semester] };
			delete courses[index];
			const reindexed = {};
			Object.values(courses).forEach((c, i) => { reindexed[i] = c; });
			this.userExchange.courses[semester] = reindexed;
			this.emitUpdate();
			this.deleteCourseDialog = false;
		},
		missingFields(course) {
			const missing = [];
			if (!course.courseName) missing.push(this.$t("database.courseName"));
			if (!course.ECTSPoints) missing.push(this.$t("database.ECTSPoints"));
			return missing;
		},
		isCourseInvalid(course) {
			return this.missingFields(course).length > 0;
		},
		emitUpdate() {
			this.$emit("update", JSON.parse(JSON.stringify(this.userExchange)));
		},
		toggleDialog(semester = null, index = null) {
			this.deleteCourseDialog = !this.deleteCourseDialog;
			this.currentSemester = semester;
			this.currentCourse = index;
		},
		moveToOtherSemester(currentSemester, courseIndex) {
			const otherSemester = this.semesters.find((s) => s !== currentSemester);
			const courseToMove = this.userExchange.courses[currentSemester][courseIndex];
			this.removeCourse(currentSemester, courseIndex);
			const coursesInOther = this.userExchange.courses[otherSemester] || {};
			const newIndex = Object.keys(coursesInOther).length;
			this.userExchange.courses[otherSemester][newIndex] = courseToMove;
			this.emitUpdate();
		},
	},
};
</script>

<style scoped>
.semester-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 8px;
}

.semester-title {
	flex: 1;
	font-size: 14px;
	font-weight: 700;
	color: var(--first-color, #112d4e);
}

.semester-count {
	font-size: 13px;
	font-weight: 400;
	color: rgba(0, 0, 0, 0.45);
	margin-left: 6px;
}

.course-panels {
	gap: 6px;
	display: flex;
	flex-direction: column;
}

.course-panels :deep(.v-expansion-panel-title) {
	padding: 4px 16px;
	min-height: unset;
}

.course-panel-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	min-width: 0;
	gap: 8px;
}

.course-name {
	font-size: 16px;
	font-weight: 500;
	line-height: 1.5;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.course-ects {
	font-size: 12px;
	font-weight: 400;
	color: rgba(0, 0, 0, 0.45);
	margin-left: 8px;
}

.course-actions {
	display: flex;
	align-items: center;
	gap: 2px;
	flex-shrink: 0;
}

.course-actions :deep(.v-btn__content) {
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-courses {
	text-align: center;
	padding: 16px 20px;
	border: 1px dashed rgba(0, 0, 0, 0.12);
	border-radius: 12px;
	margin-bottom: 8px;
}
</style>
