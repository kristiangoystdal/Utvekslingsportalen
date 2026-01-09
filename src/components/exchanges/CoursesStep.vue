<template>
  <div>
    <v-alert type="info" variant="tonal" class="mb-4">
      {{ $t("wizard.courses.info") }}
    </v-alert>

    <div v-for="semester in semesters" :key="semester" class="mb-6">
      <h3 class="mb-2">

        {{ semester == "Høst" ? $t("myExchange.courseInformation.courseFallTitle") :
          $t("myExchange.courseInformation.courseSpringTitle") }}
        <span class="text-grey">
          ({{ courseCount(semester) }} {{ $t("wizard.courses.courses") }})
        </span>
      </h3>

      <v-btn class="mb-6" color="primary" @click="addCourse(semester)">
        {{ $t("wizard.courses.addCourse") }}
      </v-btn>

      <v-expansion-panels>
        <v-expansion-panel v-for="(course, index) in coursesForSemester(semester)" :key="index">
          <!-- HEADER -->
          <v-expansion-panel-title>
            <div class="d-flex justify-space-between align-center w-100">
              <div>
                <strong>
                  {{ course.courseName || $t("wizard.courses.newCourse") }}
                </strong>
                <span class="text-grey ml-2">
                  {{ course.ECTSPoints ? `${course.ECTSPoints} ECTS` : "" }}
                </span>
              </div>

              <div>
                <v-tooltip v-if="isCourseInvalid(course)">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" color="warning" class="ml-2">
                      mdi-alert-circle
                    </v-icon>
                  </template>

                  <span>
                    {{ $t("wizard.courses.missingFields") }}:
                    {{ missingFields(course).join(", ") }}
                  </span>
                </v-tooltip>

                <v-icon v-if="semesters.length == 2" @click.stop="moveToOtherSemester(semester, index)" class="ml-2">
                  mdi-swap-horizontal
                </v-icon>

                <v-icon color="error" @click.stop="toggleDialog(semester, index)" class="ml-2">
                  mdi-trash-can
                </v-icon>
              </div>
            </div>
          </v-expansion-panel-title>

          <!-- BODY -->
          <v-expansion-panel-text class="zero-padding">
            <CourseForm :course="course" :unsavedChanges="true"
              @submit-course="updateCourse(semester, index, $event)" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>

  <!-- Delete course dialog -->
  <v-dialog v-model="deleteCourseDialog" class="dialog">
    <v-card>
      <v-card-title class="headline">
        {{ $t("operations.confirmDelete") }}
      </v-card-title>
      <v-card-text>
        {{ $t("operations.confirmCourseDelete") }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn id="noBtn" @click="toggleDialog">
          {{ $t("operations.no") }}
        </v-btn>
        <v-btn id="yesBtn" @click="removeCourse(currentSemester, currentCourse)">
          {{ $t("operations.yes") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
      Object.values(courses).forEach((c, i) => {
        reindexed[i] = c;
      });

      this.userExchange.courses[semester] = reindexed;
      this.emitUpdate();
      this.deleteCourseDialog = false;
    },
    missingFields(course) {
      const missing = [];

      if (!course.courseName) {
        missing.push(this.$t("database.courseName"));
      }

      if (!course.ECTSPoints) {
        missing.push(this.$t("database.ECTSPoints"));
      }

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
      const otherSemester = this.semesters.find(
        (sem) => sem !== currentSemester
      );

      const courseToMove =
        this.userExchange.courses[currentSemester][courseIndex];

      // Remove from current semester
      this.removeCourse(currentSemester, courseIndex);

      // Add to other semester
      const coursesInOtherSemester =
        this.userExchange.courses[otherSemester] || {};
      const newIndex = Object.keys(coursesInOtherSemester).length;

      this.userExchange.courses[otherSemester][newIndex] = courseToMove;

      this.emitUpdate();
    },
  },
};

</script>
