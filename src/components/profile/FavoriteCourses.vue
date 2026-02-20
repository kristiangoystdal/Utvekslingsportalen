<template>
  <h2>{{ $t("userHandling.favoriteCourses") }}</h2>
  <div class="favorite-courses">
    <div class="d-flex flex-column flex-md-row align-start align-md-center mb-2">
      <!-- Left: label + hint -->
      <div class="mr-md-10 mb-2 mb-md-0">
        <strong>{{ $t("operations.exportFavorites") }}</strong>
        <div class="text-caption">
          {{ $t("hints.exportSelected") }}
        </div>
      </div>

      <!-- Right: format buttons -->
      <div class="d-flex flex-column flex-sm-row align-stretch align-sm-center ga-2 ga-md-10 w-100 w-md-auto">
        <v-btn color="primary" class="w-100 w-sm-auto" @click="exportAsPDF">
          <v-icon start>mdi-file-pdf-box</v-icon>
          {{ $t("operations.exportAsPDF") }}
        </v-btn>

        <v-btn color="secondary" class="w-100 w-sm-auto" @click="exportAsCSV">
          <v-icon start>mdi-file-document-outline</v-icon>
          {{ $t("operations.exportAsCSV") }}
        </v-btn>
      </div>
    </div>

    <!-- Sub-actions -->
    <div class="d-flex align-center ga-2">
      <v-chip size="small" prepend-icon="mdi-select-all" @click="selectAllUnis" class="cursor-pointer">
        {{ $t("operations.selectAll") }}
      </v-chip>

      <v-chip size="small" prepend-icon="mdi-close-circle-outline" @click="clearUniSelection" class="cursor-pointer">
        {{ $t("operations.clearSelection") }}
      </v-chip>
    </div>

    <br />

    <p v-if="!favoriteCourses.length">{{ $t("errors.noFavoriteCourses") }}</p>

    <div v-else>
      <v-text-field v-model="q" label="Search favorites" prepend-inner-icon="mdi-magnify" variant="outlined"
        density="compact" hide-details class="mb-3" clearable />

      <p v-if="q && totalMatches === 0" class="text-caption">
        {{ $t("errors.noMatchesFor") }} “{{ q }}”
      </p>

      <v-expansion-panels v-else multiple>
        <v-expansion-panel v-for="uni in visibleUniversityKeys" :key="uni">
          <v-expansion-panel-title>
            <div class="d-flex align-center justify-space-between w-100">
              <span>{{ uni }}</span>
              <div class="d-flex align-center">
                <v-checkbox-btn class="ml-2" density="compact" :model-value="isUniSelected(uni)" @click.stop
                  @update:model-value="toggleUniSelected(uni)" />

                <v-chip size="small" class="ml-3">
                  {{ filteredByUni(uni).length }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div v-for="course in filteredByUni(uni)" :key="course.courseKey"
              class="d-flex align-center justify-space-between py-2 px-2 border-b">
              <p class="mb-0">
                <strong>{{ course.courseName }}</strong>
                <span v-if="course.courseCode"> ({{ course.courseCode }})</span>
                <span v-if="course.ECTSPoints"> – {{ course.ECTSPoints }} ECTS</span>
              </p>

              <div class="d-flex align-center">
                <v-icon @click.stop="toggleFavorite(course)" :color="checkIfFavorite(course) ? 'red' : 'grey'"
                  class="mr-3" style="cursor:pointer">
                  mdi-heart
                </v-icon>

                <v-icon @click.stop="routeToExchange(course)" style="cursor:pointer">
                  mdi-airplane-search
                </v-icon>
              </div>
            </div>

          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script>
import { db, auth } from "../../js/firebaseConfig";
import { ref as dbRef, get, set, child } from "firebase/database";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default {
  name: "FavoriteCourses",
  data() {
    return {
      q: "",
      favoriteCourses: [],
      exchanges: {},
      selectedUnis: [],
    };
  },

  async created() {
    await this.loadFavoriteCourses();
    this.fetchExchangeData();
  },

  computed: {
    groupFavoriteCourses() {
      const grouped = {};
      for (const course of this.favoriteCourses) {
        const university = course.university || "Unknown University";
        if (!grouped[university]) grouped[university] = [];
        grouped[university].push(course);
      }
      return grouped;
    },
    groupedUniversityKeys() {
      return Object.keys(this.groupFavoriteCourses).sort((a, b) =>
        a.localeCompare(b)
      );
    },
    visibleUniversityKeys() {
      return this.groupedUniversityKeys.filter((uni) => this.filteredByUni(uni).length > 0);
    },
    totalMatches() {
      return this.visibleUniversityKeys.reduce(
        (sum, uni) => sum + this.filteredByUni(uni).length,
        0
      );
    },
  },
  methods: {
    makeCourseKey(course) {
      if (course.courseKey) return course.courseKey;
      if (course.id) return String(course.id);

      const code = course.courseCode || "NO_CODE";
      const exch = course.exchangeID || "NO_EXCHANGE";
      const inst = course.institute || "NO_INST";
      return `${exch}__${code}__${inst}`;
    },
    async fetchExchangeData() {
      try {
        const snapshot = await get(child(dbRef(db), "exchanges"));
        if (!snapshot.exists()) return;
        this.exchanges = snapshot.val() || {};
      } catch (error) {
        console.error("Error fetching exchange data:", error);
      }
    },
    async loadFavoriteCourses() {
      const user = auth.currentUser;
      if (!user) {
        this.favoriteCourses = [];
        return;
      }

      const snapshot = await get(dbRef(db, `users/${user.uid}/favoriteCourses`));
      const coursesObj = snapshot.val();

      if (!coursesObj) {
        this.favoriteCourses = [];
        return;
      }

      this.favoriteCourses = Object.keys(coursesObj).map((courseKey) => ({
        courseKey,
        ...coursesObj[courseKey],
      }));
    },
    async saveFavoriteCourses() {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = dbRef(db, `users/${user.uid}/favoriteCourses`);
      const updates = {};

      for (const course of this.favoriteCourses) {
        const courseKey = this.makeCourseKey(course);
        updates[courseKey] = { ...course, courseKey };
      }

      await set(userRef, updates);
    },
    checkIfFavorite(course) {
      const key = this.makeCourseKey(course);
      return this.favoriteCourses.some((c) => this.makeCourseKey(c) === key);
    },
    async toggleFavorite(course) {
      const user = auth.currentUser;
      if (!user) {
        toast.info(this.$t("exchanges.loginToFavorite"));
        return;
      }

      const key = this.makeCourseKey(course);

      if (!this.checkIfFavorite(course)) {
        this.favoriteCourses.push({ ...course, courseKey: key });
      } else {
        this.favoriteCourses = this.favoriteCourses.filter(
          (c) => this.makeCourseKey(c) !== key
        );
      }

      try {
        await this.saveFavoriteCourses();
      } catch (e) {
        toast.error(this.$t("exchanges.errorSavingFavorites"));
        console.error("Error saving favorite courses:", e);
      }
    },
    filteredByUni(uni) {
      const list = this.groupFavoriteCourses[uni] || [];
      const q = (this.q || "").trim().toLowerCase();
      if (!q) return list;

      return list.filter((c) =>
        (c.courseName || "").toLowerCase().includes(q) ||
        (c.courseCode || "").toLowerCase().includes(q) ||
        (c.institute || "").toLowerCase().includes(q)
      );
    },
    exportAsCSV() {
      if (!this.favoriteCourses.length) {
        toast.warning(this.$t("errors.noFavoriteCoursesToExport"));
        return;
      }

      if (this.selectedUnis.length === 0) {
        toast.warning(this.$t("errors.selectUniversityForPDF"));
        return;
      }

      for (const uni of this.selectedUnis) {
        let coursesToExport = this.filteredByUni(uni);

        const header = [
          "Course Name",
          "Course Code",
          "Replaced Course Name",
          "Replaced Course Code",
          "ECTS Points",
          "Year",
          "Comments",
          "University",
          "Country",
        ];

        const esc = (v) => {
          const s = (v ?? "").toString();
          if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
          return s;
        };

        const rows = coursesToExport.map((course) => [
          esc(course.courseName),
          esc(course.courseCode),
          esc(course.replacedCourseName),
          esc(course.replacedCourseCode),
          esc(course.ECTSPoints),
          esc(course.comments || ""),
          esc(course.university || ""),
          esc(course.country || ""),
        ]);

        const csv = [header.map(esc).join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = (coursesToExport[0].university || "favorite_courses") + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    },
    exportAsPDF() {
      if (!this.favoriteCourses.length) {
        toast.warning(this.$t("errors.noFavoriteCoursesToExport"));
        return;
      }

      if (this.selectedUnis.length === 0) {
        toast.warning(this.$t("errors.selectUniversityForPDF"));
        return;
      }

      for (const uni of this.selectedUnis) {
        let fileName = `${uni}_favorite_courses.pdf`;
        let coursesToExport = this.filteredByUni(uni);

        import("jspdf").then(({ jsPDF }) => {
          const doc = new jsPDF();
          let y = 12;

          const writeLine = (text) => {
            const lines = doc.splitTextToSize(text, 180);
            for (const line of lines) {
              if (y > 285) {
                doc.addPage();
                y = 12;
              }
              doc.text(line, 10, y);
              y += 7;
            }
          };

          // Write header info (using first course as reference)
          const firstCourse = coursesToExport[0];
          writeLine(`University: ${firstCourse.university || ""}`);
          writeLine(`Country: ${firstCourse.country || ""}`);
          y += 5;
          writeLine(`Total Courses: ${coursesToExport.length}`);
          y += 10;

          for (const course of coursesToExport) {
            writeLine(`Course Name: ${course.courseName || ""}`);
            writeLine(`Course Code: ${course.courseCode || ""}`);
            if (course.replacedCourseName && course.replacedCourseCode) {
              writeLine(`Replaced Course: ${(course.replacedCourseName || "")} – ${(course.replacedCourseCode || "")}`);
            }
            else if (course.replacedCourseName) {
              writeLine(`Replaced Course Name: ${course.replacedCourseName || ""}`);
            }
            else if (course.replacedCourseCode) {
              writeLine(`Replaced Course Code: ${course.replacedCourseCode || ""}`);
            }
            writeLine(`ECTS Points: ${course.ECTSPoints || ""}`);
            if (course.comments) {
              writeLine(`Comments: ${course.comments || "N/A"}`);
            }
            y += 6;

            if (y > 285) {
              doc.addPage();
              y = 12;
            }
          }

          fileName = firstCourse.university
            ? `${firstCourse.university}_favorite_courses.pdf`
            : "favorite_courses.pdf";
          doc.save(fileName);
        });
      }
    },
    routeToExchange(item) {
      if (!this.exchanges) return;

      const exchangeId = item.exchangeID;
      if (!exchangeId) {
        toast.info(this.$t("errors.noExchangeLinked"));
        return;
      }

      const exchange =
        this.exchanges[exchangeId] ||
        Object.values(this.exchanges).find((e) => e?.id === exchangeId);

      if (!exchange) {
        toast.warning(this.$t("profile.couldNotFindExchange"));
        return;
      }

      const translatedCountry = exchange.country
        ? this.$t(`countries.${exchange.country}`)
        : "";

      const searchString = [
        translatedCountry,
        exchange.university,
        exchange.study,
        exchange.specialization,
        exchange.studyYear,
        exchange.year,
      ]
        .filter(Boolean)
        .join(" ");

      const hiddenId = btoa(exchangeId);
      this.$router.push({ name: "Exchanges", query: { search: searchString, r: hiddenId } });
    },
    isUniSelected(uni) {
      return this.selectedUnis.includes(uni);
    },
    toggleUniSelected(uni) {
      if (this.isUniSelected(uni)) {
        this.selectedUnis = this.selectedUnis.filter((u) => u !== uni);
      } else {
        this.selectedUnis = [...this.selectedUnis, uni];
      }
    },
    selectAllUnis() {
      this.selectedUnis = [...this.groupedUniversityKeys];
    },
    clearUniSelection() {
      this.selectedUnis = [];
    },
  },
};
</script>

<style scoped>
.favorite-courses {
  margin-top: 20px;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  width: 100%;
}

/* Remove default padding inside expansion panel content */
:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}

/* Optional: also remove outer margin if present */
:deep(.v-expansion-panel-text) {
  margin: 0 !important;
}
</style>
