<template>
  <div v-if="isInitialized">
    <v-alert type="info" variant="tonal" class="mb-4">
      {{ $t("wizard.basic.info") }}
    </v-alert>

    <v-container class="zero-padding">
      <!-- Universitet i norge -->
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete :items="homeUniversities" v-model="localExchange.homeUniversity"
            :label="$t('database.homeUniversity')" :rules="[rules.required]" clearable persistent-hint
            autocomplete="off" />
        </v-col>
      </v-row>

      <!-- Study & specialization -->
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete :items="Object.keys(studies?.studies || {})" v-model="localExchange.study"
            :label="$t('database.study')" :rules="[rules.required]" clearable persistent-hint
            :disabled="!localExchange.homeUniversity"
            :hint="!localExchange.homeUniversity ? $t('hints.selectHomeUniversityFirst') : ''" autocomplete="off" />
        </v-col>

        <v-col cols="12" md="6">
          <v-autocomplete :items="specializations" v-model="localExchange.specialization"
            :label="$t('database.specialization')" :rules="[rules.required]" persistent-hint
            :disabled="!localExchange.study" :hint="!localExchange.study ? $t('hints.selectStudyFirst') : ''"
            autocomplete="off" />
        </v-col>
      </v-row>

      <!-- Study year & calendar year -->
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete v-model="localExchange.studyYear" :items="['1.', '2.', '3.', '4.', '5.']"
            :label="$t('database.studyYear')" :rules="[rules.required]" clearable persistent-hint autocomplete="off" />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field v-model="localExchange.year" type="number" :label="$t('database.year')"
            :rules="[rules.required]" persistent-hint autocomplete="off" />
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- Country & university -->
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete v-model="localExchange.country" :items="countryNamesTranslated"
            :label="$t('database.country')" :rules="[rules.required]" clearable persistent-hint autocomplete="off" />
        </v-col>

        <v-col cols="12" md="6">
          <v-autocomplete v-model="localExchange.university" :items="universityNames" :label="$t('database.university')"
            :disabled="!localExchange.country" :hint="!localExchange.country ? $t('hints.selectCountryFirst') : ''"
            persistent-hint autocomplete="off" />

        </v-col>
      </v-row>

      <!-- Number of semesters -->
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete v-model="localExchange.numSemesters" :items="[1, 2]" :label="$t('database.numSemesters')"
            :rules="[rules.required]" clearable persistent-hint autocomplete="off" />
        </v-col>

        <v-col cols="12" md="6" v-if="localExchange.numSemesters === 1">
          <v-autocomplete v-model="localSemester" :items="['Høst', 'Vår']" :label="$t('database.semester')"
            :rules="[rules.required]" clearable autocomplete="off" />
        </v-col>
      </v-row>

      <!-- Second university -->
      <div v-if="localExchange.numSemesters === 2">
        <v-checkbox v-model="localExchange.sameUniversity" :label="$t('myExchange.semestersLocation')" />

        <v-row v-if="!localExchange.sameUniversity">
          <v-col cols="12" md="6">
            <v-autocomplete v-model="localExchange.secondCountry" :items="countryNamesTranslated"
              :label="$t('database.country')" :rules="[rules.required]" clearable autocomplete="off" />
          </v-col>

          <v-col cols="12" md="6">
            <v-autocomplete v-model="localExchange.secondUniversity" :items="secondUniversityNames"
              :label="$t('database.university')" :rules="[rules.required]" autocomplete="off" />
          </v-col>
        </v-row>
      </div>
    </v-container>
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
    userExchange: Object,
    countryNamesTranslated: Array,
    universityNames: Array,
    secondUniversityNames: Array,
    semesters: Array,
  },
  emits: ["update", "updateSemesters"],
  computed: {
    localSemester: {
      get() {
        return this.semesters[0] || null;
      },
      set(val) {
        this.$emit("updateSemesters", val ? [val] : []);
      },
    },
    specializations() {
      const study = this.localExchange?.study;
      if (!study) return [];

      return this.studies?.studies?.[study] ?? [];
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
  data() {
    return {
      rules: {
        required: v => !!v || this.$t("validation.required"),
      },
      localExchange: null,
      isInitialized: false,
    };
  },
  watch: {

    userExchange: {
      immediate: true,
      deep: true,
      handler(val) {
        if (!val) return;

        // ⛔️ Ignore empty shell objects
        const hasRealData =
          val.country ||
          val.study ||
          val.university ||
          val.numSemesters;

        if (!this.isInitialized && hasRealData) {
          this.localExchange = JSON.parse(JSON.stringify(val));

          this.$nextTick(() => {
            this.isInitialized = true;
          });
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
      if (newVal !== oldVal) {
        this.localExchange.study = null;
        this.localExchange.specialization = null;
      }
    },

    'localExchange.study'(newVal, oldVal) {
      if (!this.isInitialized) return;
      if (newVal !== oldVal) {
        this.localExchange.specialization = null;
      }
    },

    'localExchange.country'(newVal, oldVal) {
      if (!this.isInitialized) return;
      if (newVal !== oldVal) {
        this.localExchange.university = null;
      }
    },

    'localExchange.numSemesters'(newVal, oldVal) {
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
      if (newVal !== oldVal) {
        this.localExchange.secondUniversity = null;
      }
    },
  },

};
</script>
