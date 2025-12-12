<template>
  <div>
    <h2>{{ $t("courses.pageHeader") }}</h2>
    <br />
    <p class="box box-third-color preserve-whitespace text-center">
      {{ $t("courses.info") }}
    </p>
  </div>
  <br />

  <!-- Search Field -->
  <v-text-field v-model="courseSearch" :label="$t('courses.search')" prepend-inner-icon="mdi-magnify" variant="outlined"
    hide-details single-line density="compact" @blur="updateSearchQuery"
    style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
  <br />

  <!-- Data Table -->
  <div v-if="!isMobile">
    <v-data-table v-model:expanded="expanded" :headers="translatedHeaders" :items="courseList" item-value="id"
      show-expand class="main-table dense-table" id="main-table-width" :search="courseSearch"
      :custom-filter="rowSearchFilter" :items-per-page-text="this.$t('courses.pageText')">

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" id="coursesStyle">
            <div>
              <br />
              <v-data-table-virtual v-if="
                item.courses
              " :headers="translatedHeadersCourses" :items="item.courses" item-value="name" dense
                class="virtual-table">
                <template v-slot:item.comment="{ item }">
                  <v-icon v-if="item.comments && item.comments.trim() !== ''" small class="mr-2"
                    @click="showComments(item)">
                    mdi-comment
                  </v-icon>
                  <v-icon v-else small class="mr-2"> mdi-comment-off </v-icon>
                </template>
                <template v-slot:item.favorite="{ item }">
                  <v-icon v-if="!checkIfFavorite(item)" small class="mr-2" @click="toggleFavorite(item)">
                    mdi-heart-outline
                  </v-icon>
                  <v-icon v-else small class="mr-2" color="red" @click="toggleFavorite(item)">
                    mdi-heart
                  </v-icon>
                </template>
                <template v-slot:item.link="{ item }">
                  <v-icon small class="mr-2" @click="routeToExchange(item)">
                    mdi-airplane-search
                  </v-icon>
                </template>
              </v-data-table-virtual>
              <br />
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>

  <div v-else>
    <v-data-table :headers="translatedMobileHeaders" v-model:expanded="expanded" :items="courseList" item-value="id"
      show-expand class="main-table fixed-table" id="main-table-width" :fixed-header="false" :style="{ width: '100%' }"
      item-class="custom-item-class" header-class="custom-header-class" :search="courseSearch"
      :items-per-page-text="this.$t('courses.pageText')">
      <template v-slot:item.country="{ item }">
        <div style="display: flex; align-items: center">
          <img :src="getFlagUrl(item.country)" alt="Flag" width="20" height="15" style="margin-left: 8px" />
        </div>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="translatedMobileHeaders.length + 1">
            <div class="expanded-content">
              <div class="text-underline text-medium">
                {{ $t("courses.information") }}
              </div>

              <div v-for="(course, index) in item.courses" :key="index" class="course-block">

                <h3 class="text-bold" style="margin: 10px 0 5px 0">
                  {{ course.courseName }} ({{ course.courseCode }})
                </h3>

                <v-row no-gutters>
                  <v-col cols="8" style="margin-left: 5px; margin-right: 5vw;">
                    <v-row no-gutters>
                      <v-col cols="12">
                        <strong>{{ $t("database.university") }}:</strong> {{ course.university }}
                      </v-col>
                    </v-row>
                    <v-row no-gutters>
                      <v-col cols="6">
                        <strong>{{ $t("database.country") }}:</strong> {{ course.country }}
                      </v-col>
                      <v-col cols="6">
                        <strong>{{ $t("database.ECTSPoints") }}:</strong> {{ course.ECTSPoints }}
                      </v-col>
                    </v-row>
                  </v-col>

                  <v-col cols="1" style="margin: auto;">
                    <!-- <div style=" display: flex; flex-direction: column; align-items: center; gap: 8px"> -->
                    <v-icon v-if="course.comments && course.comments.trim() !== ''" small @click="showComments(course)">
                      mdi-comment
                    </v-icon>
                    <v-icon v-else small>mdi-comment-off</v-icon>
                    <!-- </div> -->
                  </v-col>
                  <v-col cols="1" style="margin: auto;">
                    <v-icon v-if="!checkIfFavorite(course)" small @click="toggleFavorite(course)">
                      mdi-heart-outline
                    </v-icon>
                    <v-icon v-else small color="red" @click="toggleFavorite(course)">
                      mdi-heart
                    </v-icon>
                  </v-col>
                  <v-col cols="1" style="margin: auto;">
                    <v-icon small class="mr-2" @click="routeToExchange(course)">
                      mdi-airplane-search
                    </v-icon>
                  </v-col>
                </v-row>

                <v-divider v-if="index < item.courses.length - 1" style="margin: 10px 0"></v-divider>

              </div>
            </div>
          </td>
        </tr>

      </template>
    </v-data-table>
  </div>

  <!-- Comment Dialog -->
  <v-dialog v-model="commentDialog" max-width="500px" class="dialog">
    <v-card>
      <v-card-title>
        {{ $t("exchanges.courseComments") }} {{ currentCourseName }}
      </v-card-title>
      <v-card-text>{{ currentComments }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn class="btn btn-secondary" text @click="closeCommentDialog">
          {{ $t("operations.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Information Dialog -->
  <v-dialog v-model="informationDialog" max-width="500px" class="dialog">
    <v-card>
      <v-card-title>
        {{ $t("exchanges.courseInformation") }}
      </v-card-title>
      <v-card-text>
        <v-row no-gutters>
          <v-col cols="12" class="text-bold">
            {{ $t("database.institute") }}:
          </v-col>
          <v-col cols="12">
            {{ currentCourse.institute }}
          </v-col>
        </v-row>
        <v-row no-gutters style="margin-top: 5px">
          <v-col cols="12" class="text-bold">
            {{ $t("database.replacedCourseName") }}:
          </v-col>
          <v-col cols="12">
            {{ currentCourse.replacedCourseName }}
          </v-col>
        </v-row>
        <v-row no-gutters style="margin-top: 5px">
          <v-col cols="12" class="text-bold">
            {{ $t("database.replacedCourseCode") }}:
          </v-col>
          <v-col cols="12">
            {{ currentCourse.replacedCourseCode }}
          </v-col>
        </v-row>
        <v-row no-gutters style="margin-top: 5px">
          <v-col cols="12" class="text-bold">
            {{ $t("database.courseType") }}:
          </v-col>
          <v-col cols="12">
            {{ currentCourse.courseType }}
          </v-col>
        </v-row>
        <v-row no-gutters style="margin-top: 5px">
          <v-col cols="12" class="text-bold">
            {{ $t("database.comments") }}:
          </v-col>
          <v-col cols="12" v-if="currentCourse.comments">
            {{ currentCourse.comments }}
          </v-col>
          <v-col cols="12" v-else>
            {{ $t("exchanges.noComments") }}
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn class="btn btn-secondary" text @click="toggleInformationDialog">
          {{ $t("operations.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { db, auth } from "../../js/firebaseConfig.js";
import { set, get, child, ref as dbRef } from "firebase/database";
import { useI18n } from "vue-i18n";
import { getCode } from "country-list";
import countriesInformation from "../../data/countriesInformation.json";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default {
  setup() {
    const user = auth.currentUser;
  },
  data() {
    return {
      countriesInfo: countriesInformation,
      showFilters: false,
      expanded: [],
      exchanges: {},
      courseList: [],
      commentDialog: false,
      currentComments: "",
      currentCourseName: "",
      screenWidth: window.innerWidth,
      informationDialog: false,
      currentCourse: null,
      favoriteCourses: [],
      courseSearch: "",
    };
  },
  created() {
    this.fetchExchangeData();
    this.loadFavoriteCourses();
  },
  mounted() {
    window.addEventListener("resize", this.updateScreenWidth);
    this.updateScreenWidth();
    this.checkRouterParams();
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateScreenWidth);
  },
  watch: {
    locale(newLocale, oldLocale) {
      this.fetchExchangeData();
    },
  },
  computed: {
    isMobile() {
      return this.screenWidth <= 768;
    },
    translatedHeaders() {
      return [
        {
          align: "center",
          key: "",
          width: "8%",
          sortable: false,
        },
        {
          title: this.$t("database.courseCode"),
          align: "start",
          key: "courseCode",
          width: "12%",
        },
        {
          title: this.$t("database.courseName"),
          align: "start",
          key: "courseName",
          width: "45%",
        },
        {
          title: this.$t("courses.availableCourses"),
          key: "count",
          align: "center",
          width: "15%",
        },
        {
          title: this.$t("courses.availableSemesters"),
          key: "semesters",
          align: "end",
          width: "40%",
        },
      ];
    },
    translatedHeadersCourses() {
      return [
        {
          title: this.$t("database.courseCode"),
          align: "start",
          key: "courseCode",
        },
        {
          title: this.$t("database.courseName"),
          align: "start",
          key: "courseName",
        },
        {
          title: this.$t("database.country"),
          align: "end",
          key: "country",
        },
        {
          title: this.$t("database.university"),
          align: "end",
          key: "university",
        },
        {
          title: this.$t("database.ECTSPoints"),
          align: "end",
          key: "ECTSPoints",
        },
        {
          title: this.$t("database.comments"),
          align: "end",
          key: "comment",
        },
        {
          title: "",
          align: "end",
          key: "favorite",
          sortable: false,
        },
        {
          title: "",
          align: "end",
          key: "link",
          sortable: false,
        }
      ];
    },
    translatedMobileHeaders() {
      return [
        {
          align: "center",
          key: "",
          sortable: false,
        },
        {
          title: this.$t("database.courseCode"),
          align: "start",
          key: "courseCode",
          length: 1,
        },
        {
          title: this.$t("database.courseName"),
          align: "end",
          key: "courseName",
        },
      ];
    },
    translatedMobileHeadersCourses() {
      return [
        {
          title: this.$t("database.courseCode"),
          align: "start",
          key: "courseCode",
        },
        {
          title: this.$t("database.courseName"),
          align: "start",
          key: "courseName",
        },
        {
          title: this.$t("database.country"),
          align: "end",
          key: "country",
        },
        {
          title: this.$t("database.university"),
          align: "end",
          key: "university",
        },
        {
          title: this.$t("database.ECTSPoints"),
          align: "end",
          key: "ECTSPoints",
        },
        {
          title: this.$t("database.comments"),
          align: "end",
          key: "comment",
        },
        {
          title: "",
          align: "end",
          key: "favorite",
          sortable: false,
        },
      ];
    },
  },
  methods: {
    updateScreenWidth() {
      this.screenWidth = window.innerWidth;
    },
    remove(item) {
      this.countryValues = this.countryValues.filter((i) => i !== item);
    },
    async fetchExchangeData() {
      try {
        const snapshot = await get(child(dbRef(db), "exchanges"));
        if (!snapshot.exists()) {
          console.error("No data available");
          return;
        }

        const exchanges = snapshot.val();
        this.exchanges = exchanges;

        // Temporary dictionary for grouping
        const grouped = {};

        const toArray = (obj) =>
          Array.isArray(obj) ? obj : Object.values(obj || {});

        for (const exchangeKey in exchanges) {
          const exchange = exchanges[exchangeKey];
          if (!exchange.courses) continue;

          // Convert Høst and Vår to arrays
          const host = toArray(exchange.courses.Høst);
          const vaar = toArray(exchange.courses.Vår);

          const allCourses = [...host, ...vaar];

          for (const course of allCourses) {
            if (!course) continue;
            if (!course.replacedCourseCode && !course.replacedCourseName) continue;

            const code = (course.replacedCourseCode || "").trim();
            const name = course.replacedCourseName || "";

            const semesters = [];
            if (host.includes(course)) {
              semesters.push(this.$t("courses.fall"));
            }
            if (vaar.includes(course)) {
              semesters.push(this.$t("courses.spring"));
            }

            if (!grouped[code.trim()]) {
              grouped[code] = {
                id: code,
                courseCode: code,
                courseName: name,
                courses: [],
              };
            }

            const countryTranslated = this.$t(`countries.${exchange.country}`);

            const courseWithMeta = {
              ...course,
              country: countryTranslated,
              university: exchange.university,
            };

            let skip_addition = false;
            for (const courseKey in grouped[code].courses) {
              const oldCourse = grouped[code].courses[courseKey];
              if (oldCourse.courseCode === courseWithMeta.courseCode &&
                oldCourse.university === courseWithMeta.university &&
                oldCourse.country === courseWithMeta.country) {
                skip_addition = true;
              }
            }

            if (skip_addition) {
              skip_addition = false;
              continue;
            }

            grouped[code].courses.push(courseWithMeta);

            grouped[code].count = grouped[code].courses.length;

            if (grouped[code].semesters) {
              const existingSemesters = new Set(
                grouped[code].semesters.split(", ")
              );
              semesters.forEach((sem) => existingSemesters.add(sem));
              grouped[code].semesters = Array.from(existingSemesters).join(", ");
            } else {
              grouped[code].semesters = semesters.join(", ");
            }
            // Sort semesters
            const semesterOrder = [this.$t("courses.fall"), this.$t("courses.spring")];
            grouped[code].semesters = grouped[code].semesters
              .split(", ")
              .sort((a, b) => semesterOrder.indexOf(a) - semesterOrder.indexOf(b))
              .join(", ");
          }
        }

        // Convert dict → array (Vuetify requires array)
        this.courseList = Object.values(grouped);

        // Sort by course code
        this.courseList.sort((a, b) => {
          if (a.courseCode < b.courseCode) return -1;
          if (a.courseCode > b.courseCode) return 1;
          return 0;
        });

      } catch (error) {
        console.error("Error fetching exchange data:", error);
      }
    },
    showComments(course) {
      this.currentCourseName = course.courseName;
      this.currentComments =
        course.comments || this.$t("exchanges.noComments");
      this.commentDialog = true;
    },
    closeCommentDialog() {
      this.commentDialog = false;
    },
    toggleInformationDialog(course) {
      this.informationDialog = !this.informationDialog;
      if (this.informationDialog) {
        this.currentCourse = course;
      }
    },
    closeInformationDialog() {
      this.informationDialog = false;
    },
    checkIfFavorite(course) {
      return this.favoriteCourses.some(favCourse =>
        Object.keys(course).every(key => course[key] === favCourse[key])
      );
    },
    toggleFavorite(course) {
      const user = auth.currentUser;

      if (!user) {
        toast.info(this.$t("exchanges.loginToFavorite"));
        return;
      }

      // Get country and university and add to course object
      const exchange = this.courseList.find(exchange =>
        (exchange.courses.Høst && exchange.courses.Høst.includes(course)) ||
        (exchange.courses.Vår && exchange.courses.Vår.includes(course))
      );

      if (exchange) {
        course.country = exchange.country;
        course.university = exchange.university;
      }

      // Add course to favorites if not already favorited, else remove it
      if (!this.checkIfFavorite(course)) {
        this.favoriteCourses.push(course);
      } else {
        this.favoriteCourses = this.favoriteCourses.filter(favCourse =>
          !Object.keys(course).every(key => course[key] === favCourse[key])
        );
      }

      this.saveFavoriteCourses().catch(error => {
        toast.error(this.$t("exchanges.errorSavingFavorites"));
        console.error("Error saving favorite courses:", error);
      });
    },
    async loadFavoriteCourses() {
      const user = auth.currentUser;
      if (!user) {
        this.favoriteCourses = [];
        return;
      }
      const snapshot = await get(dbRef(db, `users/${user.uid}/favoriteCourses`));
      const courses = snapshot.val();
      this.favoriteCourses = courses
        ? Object.keys(courses).map((key) => ({ id: key, ...courses[key] }))
        : [];
    },
    async saveFavoriteCourses() {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = dbRef(db, `users/${user.uid}/favoriteCourses`);
      const updates = {};

      this.favoriteCourses.forEach((course, index) => {
        updates[index] = course;
      });

      await set(userRef, updates);
    },
    checkRouterParams() {
      if (!this.$route || !this.$route.query) return;

      const search = this.$route.query.search;
      if (search) {
        this.courseSearch = search;
      }
    },
    updateSearchQuery() {
      this.$router.replace({ query: { search: this.courseSearch || undefined } });
    },
    rowSearchFilter(value, search, item) {
      if (!search) return true;

      const raw = item?.raw ?? item; // fallback in case it's already raw

      // Split the search input into separate words
      const words = search
        .toLowerCase()
        .trim()
        .split(/\s+/);

      // Pick only the fields you actually want to search in
      const fieldsToSearch = [
        "courseCode",
        "courseName",
        "count",
        "semesters",
      ];

      const rowText = fieldsToSearch
        .map((key) => (raw[key] != null ? String(raw[key]) : ""))
        .join(" ")
        .toLowerCase();

      // Every word in the search must appear somewhere in the row text
      return words.every((word) => rowText.includes(word));
    },
    routeToExchange(item) {
      const exchange = this.exchanges && Object.values(this.exchanges).find((exch) => {
        if (!exch.courses) return false;
        if (exch.id && item.exchangeID && exch.id === item.exchangeID) {
          return true;
        }
      });

      const translatedCountry = this.$t(`countries.${exchange.country}`);

      const searchString = translatedCountry + " " + exchange.university + " " + exchange.study + " " + exchange.specialization + " " + exchange.studyYear + " " + exchange.year;

      if (!exchange.id) {
        exchange.id = this.exchanges && Object.keys(this.exchanges).find(key => this.exchanges[key] === exchange);
      }
      const hiddenId = btoa(exchange.id);

      if (exchange) {
        this.$router.push({ name: "Exchanges", query: { search: searchString, r: hiddenId } });
      }
    }
  },

};
</script>

<style>
.v-data-table table tr th,
.v-data-table table tr td {
  padding: 0 8px !important;
}
</style>
