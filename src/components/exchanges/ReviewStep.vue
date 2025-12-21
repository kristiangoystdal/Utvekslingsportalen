<template>
  <div>
    <v-alert v-if="showSubmitButton" type="info" variant="tonal" class="mb-4">
      {{ $t("wizard.review.info") }}
    </v-alert>

    <!-- Basic information -->
    <v-card class="mb-4">
      <v-card-title>{{ $t("wizard.review.basic") }}</v-card-title>
      <v-card-text>
        <div><strong>{{ $t("database.study") }}:</strong> {{ userExchange.study }}</div>
        <div><strong>{{ $t("database.specialization") }}:</strong> {{ userExchange.specialization }}</div>
        <div><strong>{{ $t("database.university") }}:</strong> {{ userExchange.university }}</div>
        <div><strong>{{ $t("database.country") }}:</strong> {{ userExchange.country }}</div>
        <div><strong>{{ $t("database.year") }}:</strong> {{ userExchange.year }}</div>
      </v-card-text>
    </v-card>

    <!-- Courses -->
    <v-card v-for="semester in semesters" :key="semester" class="mb-4">
      <v-card-title>
        {{ $t(`wizard.review.${semester}`) }}
        – {{ totalECTS(semester) }} ECTS
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-list>
          <v-list-item v-for="(course, index) in coursesForSemester(semester)" :key="index">
            <v-list-item-title>
              {{ course.courseName }} {{ course.courseCode ? `(${course.courseCode})` : "" }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ course.ECTSPoints }} ECTS
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-alert v-if="coursesForSemester(semester).length === 0" type="warning" variant="tonal">
          {{ $t("wizard.review.noCourses") }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Submit -->
    <v-btn v-if="showSubmitButton" color="success" size="large" :disabled="!canSubmit" @click="$emit('submit')">
      {{ $t("wizard.review.submit") }}
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    userExchange: Object,
    semesters: Array,
    canSubmit: Boolean,
    showSubmitButton: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["submit"],
  methods: {
    coursesForSemester(semester) {
      return Object.values(this.userExchange.courses[semester] || {});
    },
    totalECTS(semester) {
      return this.coursesForSemester(semester)
        .map(c => Number(c.ECTSPoints) || 0)
        .reduce((a, b) => a + b, 0);
    },
  },
};
</script>
