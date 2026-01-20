<template>
  <v-expansion-panels v-model="panel">
    <!-- Basic Information -->
    <v-expansion-panel class="bg-light">
      <v-expansion-panel-title>
        <template v-slot:default="{ expanded }">
          <v-row no-gutters>
            <v-col class="d-flex justify-start" cols="6">
              {{ $t("myExchange.basisInformation.basisInformationTitle") }}
            </v-col>
            <v-col class="text-grey" cols="6">
              <v-fade-transition leave-absolute>
                <span v-if="expanded" key="0">
                  {{ $t("myExchange.basisInformation.fillExchangeInfo") }}
                </span>
                <span v-else-if="missingBasicDataBool">
                  {{ missingBasicDataString }}
                </span>
                <span v-else>
                  {{ $t("myExchange.basisInformation.allDataFilled") }}
                </span>
              </v-fade-transition>
            </v-col>
          </v-row>
          <v-icon :color="!expanded ? (!missingBasicDataBool ? 'teal' : 'red') : ''" :icon="expanded
            ? 'mdi-pencil'
            : !missingBasicDataBool
              ? 'mdi-thumb-up'
              : 'mdi-thumb-down'
            " />
        </template>
      </v-expansion-panel-title>

      <v-expansion-panel-text class="zero-padding">
        <v-container class="zero-padding">
          <!-- Universitet i norge -->
          <v-row no-gutters>
            <v-col cols="12" md="6">
              <v-autocomplete :items="homeUniversities" v-model="localExchange.homeUniversity"
                :label="$t('database.homeUniversity')" clearable persistent-hint autocomplete="off"
                :hint="$t('hints.homeUniversity')" />
            </v-col>
          </v-row>

          <!-- Study & specialization -->
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete :items="Object.keys(studies?.studies || {})" v-model="localExchange.study"
                :label="$t('database.study')" clearable persistent-hint :disabled="!localExchange.homeUniversity"
                :hint="!localExchange.homeUniversity ? $t('hints.selectHomeUniversityFirst') : $t('hints.study')"
                autocomplete="off" />
            </v-col>

            <v-col cols="12" md="6">
              <v-autocomplete :items="specializations" v-model="localExchange.specialization"
                :label="$t('database.specialization')" clearable persistent-hint :disabled="!localExchange.study"
                :hint="!localExchange.study ? $t('hints.selectStudyFirst') : $t('hints.specialization')"
                autocomplete="off" />
            </v-col>
          </v-row>

          <!-- Study year & calendar year -->
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="localExchange.studyYear" :items="['1.', '2.', '3.', '4.', '5.']"
                :label="$t('database.studyYear')" clearable persistent-hint autocomplete="off"
                :hint="$t('hints.studyYear')" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="localExchange.year" type="number" :label="$t('database.year')" clearable
                persistent-hint autocomplete="off" :hint="$t('hints.year')" />
            </v-col>
          </v-row>

          <v-divider class="my-6" />

          <!-- Country & university -->
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="localExchange.country" :items="countryNamesTranslated"
                :label="$t('database.country')" clearable persistent-hint autocomplete="off"
                :hint="$t('hints.country')" />
            </v-col>

            <v-col cols="12" md="6">
              <v-autocomplete v-model="localExchange.university" :items="universityNames"
                :label="$t('database.university')" :disabled="!localExchange.country"
                :hint="!localExchange.country ? $t('hints.selectCountryFirst') : $t('hints.university')" persistent-hint
                autocomplete="off" />

            </v-col>
          </v-row>

          <!-- Number of semesters -->
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete v-model="localExchange.numSemesters" :items="[1, 2]" :label="$t('database.numSemesters')"
                clearable persistent-hint autocomplete="off" :hint="$t('hints.numSemesters')" />
            </v-col>

            <v-col cols="12" md="6" v-if="localExchange.numSemesters === 1">
              <v-autocomplete v-model="localSemester" :items="['Høst', 'Vår']" :label="$t('database.semester')"
                clearable persistent-hint autocomplete="off" :hint="$t('hints.semester')" />
            </v-col>
          </v-row>

          <!-- Second university -->
          <div v-if="localExchange.numSemesters === 2">
            <v-checkbox v-model="localExchange.sameUniversity" :label="$t('myExchange.semestersLocation')" />

            <v-row v-if="!localExchange.sameUniversity">
              <v-col cols="12" md="6">
                <v-autocomplete v-model="localExchange.secondCountry" :items="countryNamesTranslated"
                  :label="$t('database.country')" clearable persistent-hint autocomplete="off"
                  :hint="$t('hints.secondCountry')" />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete v-model="localExchange.secondUniversity" :items="secondUniversityNames"
                  :label="$t('database.university')" persistent-hint autocomplete="off"
                  :hint="$t('hints.secondUniversity')" />
              </v-col>
            </v-row>
          </div>
        </v-container>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <!-- Course Catalog -->
    <v-expansion-panel v-if="semesters.length > 0" v-for="(semester, index) in semesters" :key="index" class="bg-light">
      <v-expansion-panel-title>
        <template v-slot:default="{ expanded }">
          <v-row no-gutters>
            <v-col class="d-flex justify-start" cols="6">
              {{ semester }} ({{ getCourses(semester).length }}
              {{ $t("myExchange.courseInformation.numCoursesText") }})
            </v-col>
          </v-row>
          <v-icon :icon="expanded ? 'mdi-pencil' : 'mdi-school-outline'" color="teal" />
        </template>
      </v-expansion-panel-title>

      <v-expansion-panel-text class="zero-padding">
        <v-btn class="btn btn-primary" @click="addCourse(semester)">
          {{ $t("myExchange.courseInformation.addCourse") }}
        </v-btn>

        <v-expansion-panels class="zero-padding">
          <v-expansion-panel v-for="(course, cIndex) in getCourses(semester)" :key="cIndex">
            <v-expansion-panel-title>
              <template v-slot:default="{ expanded }">
                <v-row no-gutters>
                  <v-col class="d-flex justify-start mb-1" cols="12">
                    {{ course.courseName || 'Nytt fag' }}
                  </v-col>
                </v-row>
                <v-icon icon="mdi-swap-horizontal" class="course-icons"
                  @click.stop="moveToOtherSemester(semester, cIndex)" />
                <v-icon icon="mdi-delete-outline" class="course-icons" @click.stop="removeCourse(semester, cIndex)" />
                <v-icon :icon="expanded ? 'mdi-pencil' : 'mdi-book-open-variant'" class="course-icons" color="teal" />
              </template>
            </v-expansion-panel-title>

            <v-expansion-panel-text class="zero-padding">
              <course-form :course="course" @submit-course="updateCourse(semester, cIndex, $event)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <!-- Buttons -->
    <v-row>
      <v-col xs="12" md="3">
        <v-btn class="btn-primary" :disabled="!unsavedChanges" @click="saveExchange">
          {{ $t("operations.save") }}
        </v-btn>
      </v-col>
      <v-col xs="12" md="3">
        <v-btn class="btn-red" @click="$emit('close')">
          {{ $t("operations.cancel") }}
        </v-btn>
      </v-col>
    </v-row>
  </v-expansion-panels>
</template>

<script>
import homeUniversityJson from "../../data/homeUniversities.json";

import ntnu_studies from "../../data/studies/ntnu.json";
import uio_studies from "../../data/studies/uio.json";
import uib_studies from "../../data/studies/uib.json";
import uit_studies from "../../data/studies/uit.json";
import uis_studies from "../../data/studies/uis.json";
import universitiesData from "../../data/universities.json";
import CourseForm from "../exchanges/CourseForm.vue";

export default {
  name: "EditExchange",
  components: { CourseForm },
  props: {
    exchangeData: { type: Object, required: true },
  },
  data() {
    return {
      panel: null,
      semesters: [],
      localExchange: {},
      universities: {},
      selectedSemester: null,
    };
  },
  computed: {
    specializations() {
      return this.localExchange.study
        ? this.studies[this.localExchange.study] || []
        : [];
    },
    countryNames() {
      return Object.keys(this.universities);
    },
    universityNames() {
      return this.localExchange.country
        ? this.universities[this.localExchange.country] || []
        : [];
    },
    missingBasicDataBool() {
      const e = this.localExchange;
      return (
        !e.country ||
        !e.university ||
        !e.study ||
        !e.specialization ||
        !e.studyYear ||
        !e.numSemesters ||
        (e.numSemesters === 1 && (!this.semesters || this.semesters.length === 0))
      );
    },
    missingBasicDataString() {
      const missing = [];
      const e = this.localExchange;
      if (!e.country) missing.push(this.$t("database.country"));
      if (!e.university) missing.push(this.$t("database.university"));
      if (!e.study) missing.push(this.$t("database.study"));
      if (!e.specialization)
        missing.push(this.$t("database.specialization"));
      if (!e.studyYear) missing.push(this.$t("database.studyYear"));
      if (!e.numSemesters)
        missing.push(this.$t("database.numSemesters"));
      return this.$t("myExchange.missingData") + " " + missing.join(", ");
    },
    unsavedChanges() {
      return (
        JSON.stringify(this.localExchange) !==
        JSON.stringify(this.exchangeData)
      );
    },
    homeUniversities() {
      return Object.values(homeUniversityJson);
    },
    studies() {
      if (!this.localExchange.homeUniversity) {
        return {};
      }

      if (this.localExchange.homeUniversity === homeUniversityJson["NTNU"]) {
        return ntnu_studies;
      }
      if (this.localExchange.homeUniversity === homeUniversityJson["UiO"]) {
        return uio_studies;
      }
      if (this.localExchange.homeUniversity === homeUniversityJson["UiB"]) {
        return uib_studies;
      }
      if (this.localExchange.homeUniversity === homeUniversityJson["UiT"]) {
        return uit_studies;
      }
      if (this.localExchange.homeUniversity === homeUniversityJson["UiS"]) {
        return uis_studies;
      }

      return {};
    }
  },
  watch: {
    exchangeData: {
      deep: true,
      handler(newVal) {
        this.localExchange = JSON.parse(JSON.stringify(newVal));
      },
    },
  },
  methods: {
    addCourse(semester) {
      if (!this.localExchange.courses)
        this.localExchange.courses = {};
      if (!this.localExchange.courses[semester])
        this.localExchange.courses[semester] = {};
      const idx = Object.keys(this.localExchange.courses[semester]).length;
      this.localExchange.courses[semester][idx] = {
        courseName: "",
        ECTSPoints: "",
        replacedCourseName: "",
      };
    },
    removeCourse(semester, index) {
      if (
        this.localExchange.courses[semester] &&
        this.localExchange.courses[semester][index]
      ) {
        delete this.localExchange.courses[semester][index];
      }
    },
    getCourses(semester) {
      if (!this.localExchange.courses || !this.localExchange.courses[semester]) return {};
      else return Object.values(this.localExchange.courses[semester] || {});
    },
    updateCourse(semester, index, updated) {
      this.localExchange.courses[semester][index] = updated;
    },
    handleSemesterChange(newSemester) {
      this.selectedSemester = newSemester;
      this.semesters = newSemester ? [newSemester] : [];
      this.localExchange.semesters = this.semesters;
    },
    handleNumSemestersChange(newNum) {
      this.semesters = newNum === 2 ? ["Høst", "Vår"] : [];
    },
    saveExchange() {
      this.$emit("save", this.localExchange);
    },
    moveToOtherSemester(semester, index) {
      if (this.localExchange.numSemesters !== 2) return;

      const otherSemester = semester === "Høst" ? "Vår" : "Høst";

      // Ensure structure exists
      if (!this.localExchange.courses) this.localExchange.courses = {};
      if (!this.localExchange.courses[semester]) this.localExchange.courses[semester] = {};
      if (!this.localExchange.courses[otherSemester]) this.localExchange.courses[otherSemester] = {};

      const fromObj = this.localExchange.courses[semester];
      const toObj = this.localExchange.courses[otherSemester];

      // Map Object.values() index -> real key
      const keys = Object.keys(fromObj)
        .sort((a, b) => Number(a) - Number(b));

      const realKey = keys[index];
      if (realKey === undefined) return;

      const courseToMove = fromObj[realKey];
      if (!courseToMove) return;

      // Add to other semester
      const toKeys = Object.keys(toObj)
        .map(Number)
        .filter(n => !Number.isNaN(n));

      const newKey = toKeys.length ? Math.max(...toKeys) + 1 : 0;
      toObj[String(newKey)] = courseToMove;

      // Remove from original semester
      delete fromObj[realKey];

      // Renumber helper (0..N-1)
      const renumber = (obj) => {
        const ordered = Object.keys(obj)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => obj[k])
          .filter(Boolean);

        Object.keys(obj).forEach(k => delete obj[k]);
        ordered.forEach((c, i) => {
          obj[String(i)] = c;
        });
      };

      renumber(fromObj);
      renumber(toObj);
    }

  },
  mounted() {
    this.localExchange = JSON.parse(JSON.stringify(this.exchangeData));
    this.universities = universitiesData.universities;
    const n = this.localExchange.numSemesters;
    if (n === 1) {
      this.semesters = this.localExchange.semesters
        ? [...this.localExchange.semesters]
        : [];
      this.selectedSemester = this.semesters.length > 0 ? this.semesters[0] : null;
    } else if (n === 2) this.semesters = ["Høst", "Vår"];
  },
};
</script>

<style scoped>
.course-icons {
  margin: 0 8px;
}

.btn {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-red {
  background-color: #e53935;
  color: white;
}
</style>
