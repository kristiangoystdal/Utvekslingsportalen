<template>
  <div v-if="isInitialized">
    <v-alert type="info" variant="tonal" class="mb-4">
      {{ $t("wizard.basic.info") }}
    </v-alert>

    <v-container class="zero-padding">
      <!-- Hjemuniversitet & Studie -->
      <v-row>
        <v-col cols="12" md="6">
          <v-autocomplete :items="homeUniversities" v-model="localExchange.homeUniversity"
            :label="$t('database.homeUniversity')" clearable persistent-hint autocomplete="off"
            :hint="$t('hints.homeUniversity')" />
        </v-col>

        <v-col cols="12" md="6">
          <v-autocomplete :items="Object.keys(studies?.studies || {})" v-model="localExchange.study"
            :label="$t('database.study')" clearable persistent-hint :disabled="!localExchange.homeUniversity"
            :hint="!localExchange.homeUniversity ? $t('hints.selectHomeUniversityFirst') : $t('hints.study')"
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
            :label="$t('database.country')" clearable persistent-hint autocomplete="off" :hint="$t('hints.country')" />
        </v-col>

        <v-col cols="12" md="6">
          <v-autocomplete v-model="localExchange.university" :items="universityNames" :label="$t('database.university')"
            :disabled="!localExchange.country"
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
          <v-autocomplete v-model="localSemester" :items="['Høst', 'Vår']" :label="$t('database.semester')" clearable
            persistent-hint autocomplete="off" :hint="$t('hints.semester')" />
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
    userExchange: { Object, default: () => ({}) },
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
      rules: { required: v => !!v || this.$t("rules.required") },
      localExchange: {
        homeUniversity: null,
        study: null,
        studyYear: null,
        year: null,
        country: null,
        university: null,
        numSemesters: null,
        sameUniversity: true,
        secondCountry: null,
        secondUniversity: null,
      },
      isInitialized: false,
    };
  },
  watch: {

    userExchange: {
      immediate: true,
      deep: true,
      handler(val) {
        if (!val) return;

        // init ONCE, even if everything is null
        if (!this.isInitialized) {
          this.localExchange = JSON.parse(JSON.stringify(val));
          this.isInitialized = true;
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
