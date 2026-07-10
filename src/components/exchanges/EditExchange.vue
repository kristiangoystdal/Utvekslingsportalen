<template>
	<div class="form-root">
		<!-- ── Standalone header (non-embedded, non-admin) ── -->
		<template v-if="!adminMode && !compact && !embedded">
			<h2 class="text-h5 font-weight-bold mb-1">{{ $t("myExchange.pageHeader") }}</h2>
			<p class="text-medium-emphasis mb-4">{{ $t("myExchange.info") }}</p>
			<v-btn variant="tonal" class="mb-4" @click="toggleUploadModal">
				{{ $t("myExchange.uploadLearningAgreement") }}
			</v-btn>
		</template>

		<div v-if="user || adminMode">
			<!-- ── Standalone view mode (not editing) ── -->
			<div v-if="!adminMode && !editExchange && !embedded">
				<ReviewStep :userExchange="userExchange" :semesters="semesters" :canSubmit="true" :showSubmitButton="false" />
				<div class="d-flex flex-wrap justify-center ga-3 mt-5">
					<v-btn variant="tonal" color="primary" @click="editExchange = true">
						{{ $t("myExchange.editMyExchange") }}
					</v-btn>
					<v-btn variant="tonal" color="error" @click="toggleExchangeDialog()">
						{{ $t("myExchange.deleteMyExchange") }}
					</v-btn>
				</div>
			</div>

			<!-- ── Loading ── -->
			<div v-if="(editExchange || embedded) && !dataLoaded" class="text-center py-10">
				<v-progress-circular indeterminate color="primary" size="36" />
			</div>

			<!-- ── Flat edit form ── -->
			<div v-if="(editExchange || embedded) && dataLoaded" class="flat-form">
				<div class="step-body">
					<BasicInfoStep :userExchange="userExchange" :countryNamesTranslated="countryNamesTranslated"
						:universityNames="universityNames" :secondUniversityNames="secondUniversityNames" :semesters="semesters"
						@update="userExchange = $event" @updateSemesters="semesters = $event" />
				</div>
				<div class="flat-courses-header"><span>{{ $t('wizard.courses.title') }}</span></div>
				<div class="step-body">
					<CoursesStep :userExchange="userExchange" :semesters="semesters" @update="userExchange = $event" />
				</div>
			</div>

			<!-- ── Navigation ── -->
			<template v-if="(editExchange || embedded) && dataLoaded">
				<v-divider />
				<div class="form-nav">
					<div class="nav-side">
						<v-btn variant="tonal" color="error" @click="embedded ? $emit('cancelled') : toggleEditExchange()">
							{{ $t("actions.cancel") }}
						</v-btn>
					</div>

					<div class="nav-side nav-side--right">
						<v-tooltip v-if="!canSaveExchange" location="top">
							<template #activator="{ props }">
								<v-icon v-bind="props" color="warning" size="18">mdi-alert-circle</v-icon>
							</template>
							{{ missingBasicDataString || $t("myExchange.coursesMissingData") }}
						</v-tooltip>
						<v-btn variant="tonal" color="primary" :disabled="!canSaveExchange" :loading="saving"
							@click="updateExchange">{{
								$t("wizard.review.submit") }}</v-btn>
					</div>
				</div>
			</template>
		</div>

		<!-- ── Not logged in ── -->
		<div v-else class="text-center py-8">
			<p class="text-medium-emphasis mb-4">{{ $t("myExchange.loginToEdit") }}</p>
			<v-btn variant="tonal" color="primary" :to="{ name: 'Login' }">
				{{ $t("actions.signIn") }}
			</v-btn>
		</div>

		<!-- ── Delete dialog (standalone mode) ── -->
		<v-dialog v-if="!adminMode" v-model="deleteExchangeDialog" max-width="420">
			<v-card rounded="xl">
				<v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
					<span class="text-h6 font-weight-bold">{{ $t("actions.confirmDelete") }}</span>
					<v-btn icon variant="text" size="small" @click="toggleExchangeDialog()">
						<v-icon>mdi-close</v-icon>
					</v-btn>
				</v-card-title>
				<v-card-text class="pa-4 pt-1 text-medium-emphasis">
					{{ $t("actions.confirmExchangeDelete") }}
				</v-card-text>
				<v-card-actions class="pa-4 pt-0 ga-2">
					<v-spacer />
					<v-btn variant="text" @click="toggleExchangeDialog()">{{ $t("actions.no") }}</v-btn>
					<v-btn color="error" variant="tonal" @click="deleteExchange()">{{ $t("actions.yes") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<Upload v-model="uploadModalActive" />
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { db, auth } from "../../js/firebaseConfig";
import { ref as dbRef, set } from "firebase/database";
import universitiesData from "../../data/universities.json";
import { toast } from "vue3-toastify";

import { refreshExchangesData, getExchangesData } from "../../js/exchangesCache";
import { syncHomeInfoToUserReports } from "../../js/reportsCache";

import BasicInfoStep from "./BasicInfoStep.vue";
import CoursesStep from "./CoursesStep.vue";
import ReviewStep from "./ReviewStep.vue";

import CourseForm from "./CourseForm.vue";
import Upload from "../windows/Upload.vue";

export default {

	props: {
		// brukes både av admin og user-visning
		exchangeToEdit: {
			type: Object,
			default: null,
		},
		// hvis true: ikke bruk auth/currentUser path, bare emit save/close
		adminMode: {
			type: Boolean,
			default: false,
		},
		// hvis true: skjul sidetittel og infotekst (nyttig ved innbygging i profil)
		compact: {
			type: Boolean,
			default: false,
		},
		// hvis true: vis alltid redigeringsmodusen, emit 'saved'/'cancelled' i stedet for navigering
		embedded: {
			type: Boolean,
			default: false,
		},
	},
	emits: ["save", "close", "saved", "cancelled"],
	beforeRouteLeave(to, from, next) {
		if (!this.unsavedChanges) {
			next()
			return
		}

		const answer = window.confirm(
			this.$t("myExchange.leaveWithUnsavedChanges")
		)

		if (answer) {
			next()
		} else {
			next(false)
		}
	},
	components: {
		CourseForm,
		BasicInfoStep,
		CoursesStep,
		ReviewStep,
		Upload,
	},
	data() {
		return {
			panel: null,
			coursePanel: null,
			numCoursesMissing: 0,
			studies: {},
			universities: {},
			semesters: [],
			remoteExchange: {
				id: null,
				university: null,
				country: null,
				studyYear: null,
				year: null,
				study: null,
				specialization: null,
				numSemesters: null,
				courses: {
					Høst: {},
					Vår: {},
				},
				sameUniversity: true,
				secondUniversity: "null",
				secondCountry: "null",
			},
			userExchange: {
				id: null,
				homeUniversity: null,
				university: null,
				country: null,
				studyYear: null,
				year: null,
				study: null,
				specialization: null,
				numSemesters: null,
				courses: {
					Høst: {},
					Vår: {},
				},
				sameUniversity: true,
				secondUniversity: "null",
				secondCountry: "null",
			},
			warningsFallCourses: [],
			warningsSpringCourses: [],
			deleteCourseDialog: false,
			deleteExchangeDialog: false,
			currentCourse: null,
			currentSemester: null,
			isToastVisible: false,
			toastId: null,
			step: 1,
			editExchange: false,
			dataLoaded: false,
			isInitializingExchange: false,
			uploadModalActive: false,
			saving: false
		};
	},
	watch: {
		async user(newUser) {
			if (newUser && !this.adminMode) {
				this.loadData();
				await this.retriveUserExchange();
			} else if (!newUser) {
				this.dataLoaded = true;
			}
		},
		unsavedChanges(newValue) {
			if (newValue) {
				this.showUnsavedChangesToast(); // Show the toast when unsavedChanges becomes true
			} else {
				this.dismissUnsavedChangesToast(); // Dismiss the toast when unsavedChanges becomes false
			}
		},
		'userExchange.numSemesters'(newVal) {
			if (this.isInitializingExchange) return;
			if (!this.editExchange) return;

			if (!newVal) {
				this.semesters = [];
				return;
			}

			if (newVal === 2) {
				this.semesters = ["Høst", "Vår"];
				this.ensureSemesterCourses(["Høst", "Vår"]);
				return;
			}

			if (newVal === 1) {
				// ✅ IKKE slett hvis vi allerede har et semester (typisk admin-load)
				if (this.semesters && this.semesters.length > 0) {
					this.ensureSemesterCourses(this.semesters);
					return;
				}

				// ellers: user har nettopp valgt "1", og vi venter på semester-valg i BasicInfoStep
				this.semesters = [];
				return;
			}
		},
		exchangeToEdit: {
			immediate: true,
			deep: true,
			handler(val) {
				if (!this.adminMode) return;
				if (!val) return;

				this.isInitializingExchange = true;

				const incoming = JSON.parse(JSON.stringify(val));

				// sørg for at courses alltid er object, ikke array
				const semesters = ["Høst", "Vår", "Sommer"];
				incoming.courses = incoming.courses || {};
				semesters.forEach((s) => {
					if (Array.isArray(incoming.courses[s])) {
						const obj = {};
						incoming.courses[s].forEach((c, i) => (obj[i] = c));
						incoming.courses[s] = obj;
					} else {
						incoming.courses[s] = incoming.courses[s] || {};
					}
				});

				this.remoteExchange = JSON.parse(JSON.stringify(incoming));
				this.userExchange = JSON.parse(JSON.stringify(incoming));

				// semesters-array for UI
				if (this.userExchange.numSemesters === 2) {
					this.semesters = ["Høst", "Vår"];
				} else if (this.userExchange.numSemesters === 1) {
					const hasFall =
						this.userExchange.courses?.Høst &&
						Object.keys(this.userExchange.courses.Høst).length > 0;

					const hasSpring =
						this.userExchange.courses?.Vår &&
						Object.keys(this.userExchange.courses.Vår).length > 0;

					if (hasFall && !hasSpring) this.semesters = ['Høst'];
					else if (!hasFall && hasSpring) this.semesters = ['Vår'];
					else if (this.userExchange.semesters?.length) this.semesters = [...this.userExchange.semesters];
					else this.semesters = []; // fallback
				} else {
					this.semesters = [];
				}

				this.editExchange = true;
				this.step = 1;
				this.dataLoaded = true;

				this.isInitializingExchange = false;
			},
		},
	},
	computed: {
		...mapGetters(["user"]),
		countryNames() {
			return Object.keys(this.universities || {});
		},
		countryNamesTranslated() {
			return Object.keys(this.universities || {}).map((country) => ({
				key: country,
				name: this.$t(`countries.${country}`)
			}));
		},
		universityNames() {
			if (!this.userExchange.country) return [];

			const countryKey = this.getCountryKey(this.userExchange.country);
			return Object.keys(this.universities?.[countryKey] || {});
		},
		secondUniversityNames() {
			if (!this.userExchange.secondCountry || this.userExchange.sameUniversity) return [];

			const countryKey = this.getCountryKey(this.userExchange.secondCountry);
			return Object.keys(this.universities?.[countryKey] || {});
		},
		universityToCountryMap() {
			const map = {};

			Object.keys(this.universities || {}).forEach((country) => {
				Object.keys(this.universities[country] || {}).forEach((university) => {
					map[university] = country;
				});
			});

			return map;
		},
		missingBasicDataString() {
			const string = this.$t("myExchange.missingData") + " ";
			const missingFields = [];

			if (this.userExchange.country == null) {
				missingFields.push(this.$t("database.country").toLowerCase());
			}
			if (this.userExchange.university == null) {
				missingFields.push(this.$t("database.university").toLowerCase());
			}
			if (this.userExchange.study == null) {
				missingFields.push(this.$t("database.study").toLowerCase());
			}
			if (this.userExchange.specialization == null) {
				missingFields.push(this.$t("database.specialization").toLowerCase());
			}
			if (this.userExchange.studyYear == null) {
				missingFields.push(this.$t("database.studyYear").toLowerCase());
			}
			if (this.userExchange.numSemesters == null) {
				missingFields.push(this.$t("database.numSemesters").toLowerCase());
			}
			if (this.userExchange.numSemesters == 1 && this.semesters.length == 0) {
				missingFields.push(this.$t("database.semester").toLowerCase());
			}
			if (this.userExchange.year == null) {
				missingFields.push(this.$t("database.year").toLowerCase());
			}

			if (missingFields.length > 0) {
				return string + missingFields.join(", ");
			}
		},
		missingBasicDataBool() {
			return (
				this.userExchange.country == null ||
				this.userExchange.university == null ||
				this.userExchange.study == null ||
				this.userExchange.studyYear == null ||
				this.userExchange.numSemesters == null ||
				this.userExchange.year == null ||
				(this.userExchange.numSemesters == 1 && this.semesters.length == 0)
			);
		},
		missingCourseDataString() {
			return (semester, cIndex) => {
				const string = this.$t("myExchange.missingData") + " ";
				const missingFields = [];
				const course = this.userExchange.courses[semester][cIndex] || {};

				if (!course.courseName) {
					missingFields.push(this.$t("database.courseName").toLowerCase());
				}
				if (!course.ECTSPoints) {
					missingFields.push(this.$t("database.ECTSPoints"));
				}

				if (missingFields.length > 0) {
					return string + missingFields.join(" og ");
				}
			};
		},
		missingFallCourseDataBool() {
			return (semester, cIndex) => {
				const course = this.userExchange.courses[semester][cIndex] || {};
				return !course.courseName || !course.ECTSPoints;
			};
		},
		missingSpringCourseDataBool() {
			return (semester, cIndex) => {
				const course = this.userExchange.courses[semester][cIndex] || {};
				return !course.courseName || !course.ECTSPoints;
			};
		},
		missingCoursesBool() {
			return (
				this.missingFallCoursesDataTotalBool ||
				this.missingSpringCoursesDataTotalBool
			);
		},
		missingFallCoursesDataTotalBool() {
			const fallSemester = "Høst";
			if (this.semesters.includes(fallSemester)) {
				const courses = this.userExchange.courses[fallSemester];
				if (!courses) {
					return false; // No courses for this semester
				}
				return Object.keys(courses).some((cIndex) =>
					this.missingFallCourseDataBool(fallSemester, cIndex)
				);
			}
			return false; // Fall semester not selected
		},
		missingSpringCoursesDataTotalBool() {
			const springSemester = "Vår";
			if (this.semesters.includes(springSemester)) {
				const courses = this.userExchange.courses[springSemester];
				if (!courses) {
					return false; // No courses for this semester
				}
				return Object.keys(courses).some((cIndex) =>
					this.missingSpringCourseDataBool(springSemester, cIndex)
				);
			}
			return false; // Spring semester not selected
		},
		numFallCourses() {
			return Object.keys(this.userExchange.courses["Høst"] || {}).length;
		},
		numSpringCourses() {
			return Object.keys(this.userExchange.courses["Vår"] || {}).length;
		},
		unsavedChanges() {
			if (!this.dataLoaded || !this.editExchange) return false;
			return JSON.stringify(this.normalizeExchange(this.remoteExchange)) !==
				JSON.stringify(this.normalizeExchange(this.userExchange));
		},
		canSaveExchange() {
			return (
				!this.missingBasicDataBool &&
				!this.missingFallCoursesDataTotalBool &&
				!this.missingSpringCoursesDataTotalBool
			);
		},
		nextDisabled() {
			switch (this.step) {
				case 1:
					// Basic info step
					return this.missingBasicDataBool;

				case 2:
					// Courses step
					return this.missingCoursesBool;

				case 3:
					// Review step (nothing to validate)
					return false;

				default:
					return true;
			}
		},
	},
	methods: {
		loadData() {
			// Load the studies data from the JSON file
			try {
				this.universities = universitiesData.universities;
			} catch (error) {
				console.error("There was an error loading the studies data:", error);
			}
		},
		async retriveUserExchange() {
			if (auth.currentUser) {

				const exchanges = await getExchangesData();
				if (!exchanges || Object.keys(exchanges).length === 0) {
					console.error("No data available");
					return;
				}

				// Get the user's exchange data 
				const userExchange = exchanges[auth.currentUser.uid];

				// If the user exists, set the userData object
				if (userExchange && typeof userExchange === "object") {
					this.userData = userExchange;

					// Function to transform courses arrays to objects with numerical keys
					const transformCourses = (exchange) => {
						if (exchange.courses) {
							const semesters = ["Høst", "Vår"];
							semesters.forEach((semester) => {
								if (Array.isArray(exchange.courses[semester])) {
									const coursesArray = exchange.courses[semester];
									const coursesObject = {};
									coursesArray.forEach((course, index) => {
										coursesObject[index] = course;
									});
									exchange.courses[semester] = coursesObject;
								}
							});
						}
					};

					this.isInitializingExchange = true;

					this.remoteExchange = JSON.parse(JSON.stringify(this.userData));
					transformCourses(this.remoteExchange);
					this.userExchange = JSON.parse(JSON.stringify(this.remoteExchange));

					// set semesters based on stored courses keys
					this.semesters = [];
					if (this.userExchange.numSemesters === 2) {
						this.semesters = ["Høst", "Vår"];
					} else if (this.userExchange.numSemesters === 1) {
						// pick the one that actually exists in db
						const hasFall = this.userExchange.courses && ("Høst" in this.userExchange.courses);
						const hasSpring = this.userExchange.courses && ("Vår" in this.userExchange.courses);

						if (hasFall && !hasSpring) this.semesters = ["Høst"];
						else if (!hasFall && hasSpring) this.semesters = ["Vår"];
						else {
							// fallback if db contains both keys
							this.semesters = ["Høst"]; // or choose based on a saved field if you add one later
						}
					}

					this.isInitializingExchange = false;
					this.dataLoaded = true;
				} else {
					console.warn("User does not exist in database");

					const emptyExchange = {
						university: null,
						country: null,
						studyYear: null,
						year: null,
						study: null,
						specialization: null,
						numSemesters: null,
						courses: {
							Høst: {},
							Vår: {},
						},
						sameUniversity: true,
						secondUniversity: null,
						secondCountry: null,
					};

					this.userExchange = JSON.parse(JSON.stringify(emptyExchange));
					this.remoteExchange = JSON.parse(JSON.stringify(emptyExchange));

					this.semesters = [];
					this.editExchange = true;
					this.dataLoaded = true;

				}
			} else {
				console.error("No user is signed in");
			}
		},
		addCourse(semesterString) {
			// Get the courses for the specified semester
			var courses = this.userExchange.courses[semesterString];

			// Find the index for the new course
			var newCourseIndex = null;
			if (!courses) {
				this.userExchange.courses[semesterString] = {};
				newCourseIndex = 0;
			} else {
				newCourseIndex = Object.keys(courses).length;
			}

			const exchangeId =
				this.adminMode
					? (this.userExchange.id ?? this.exchangeToEdit?.id ?? null)
					: auth.currentUser?.uid;

			// Add the new course to the courses object
			this.userExchange.courses[semesterString] = {
				...courses,
				[newCourseIndex]: {
					exchangeID: exchangeId, // Set the exchange ID
					year: "",
					courseCode: "",
					courseName: "",
					replacedCourseCode: "",
					replacedCourseName: "",
					institute: "",
					ECTSPoints: "",
					comments: "",
				},
			};
		},
		getCourses(semesterName) {
			// Get the courses for the specified semester
			const semesterKey = semesterName.includes("Høst") ? "Høst" : "Vår";
			const courses = this.userExchange.courses[semesterKey] || {};
			return Object.values(courses);
		},
		removeCourse(semesterName, courseIndex) {
			// Close the delete dialog
			this.deleteCourseDialog = false;

			// Get the courses for the specified semester
			const semesterKey = semesterName.includes("Høst") ? "Høst" : "Vår";
			const courses = { ...this.userExchange.courses[semesterKey] };

			// Delete the course at the specified index
			delete courses[courseIndex];

			// Reindex the courses to ensure they have the lowest possible indices
			const reindexedCourses = {};
			let newIndex = 0;
			for (const key in courses) {
				if (courses.hasOwnProperty(key)) {
					reindexedCourses[newIndex] = courses[key];
					newIndex++;
				}
			}

			// Update the userExchange.courses object directly
			this.userExchange.courses = {
				...this.userExchange.courses,
				[semesterKey]: reindexedCourses,
			};

			// Close the expanded panel
			this.coursePanel = null;
		},
		updateCourse(semester, courseIndex, updatedCourse) {
			this.userExchange.courses[semester] = {
				...this.userExchange.courses[semester],
				[courseIndex]: { ...updatedCourse },
			};
		},
		handleCourseUpdate(updatedCourse) {
			const { semester, courseIndex, course } = updatedCourse;
			this.userExchange.courses[semester][courseIndex] = course;
		},
		handleYearChange(newYear) {
			if (newYear == "") {
				newYear = null;
			}
			this.userExchange.year = newYear;
		},
		getCountryIndex(selectedCountry) {
			const countryKey = this.getCountryKey(selectedCountry);
			return this.countryNames.findIndex((country) => country === countryKey);
		},
		getCountryName(main) {
			if (main) {
				const countryKey = this.userExchange.country;
				const translatedCountryName = this.$t(`countries.${countryKey}`);
				return translatedCountryName;
			}
			else {
				if (this.userExchange.sameUniversity) {
					return null;
				}
				const countryKey = this.userExchange.secondCountry;
				const translatedCountryName = this.$t(`countries.${countryKey}`);
				return translatedCountryName;
			}
		},
		getCountryKey(selectedCountry) {
			if (!selectedCountry) return null;

			const match = this.countryNamesTranslated.find(
				(country) =>
					country.key === selectedCountry || country.name === selectedCountry
			);

			return match ? match.key : selectedCountry;
		},
		buildCleanExchangeForUpload() {
			const payload = JSON.parse(JSON.stringify(this.userExchange));

			// Normalize country values before cleaning
			payload.country = this.getCountryKey(payload.country);

			if (payload.sameUniversity) {
				payload.secondUniversity = null;
				payload.secondCountry = null;
			} else {
				payload.secondCountry = this.getCountryKey(payload.secondCountry);
			}

			payload.id = this.adminMode
				? (payload.id ?? this.exchangeToEdit?.id ?? null)
				: auth.currentUser?.uid ?? null;

			// Keep only selected semesters
			const validSemesters = this.semesters || [];
			const cleanedCourses = {};

			for (const semester of validSemesters) {
				const semesterCourses = payload.courses?.[semester] || {};
				const cleanedSemesterCourses = {};

				Object.entries(semesterCourses).forEach(([key, course]) => {
					if (!course || typeof course !== "object") return;

					const cleanedCourse = {};

					for (const [courseKey, value] of Object.entries(course)) {
						if (typeof value === "string") {
							const trimmed = value.trim();
							if (trimmed !== "" && trimmed !== "null") {
								cleanedCourse[courseKey] = trimmed;
							}
						} else if (value !== null && value !== undefined) {
							cleanedCourse[courseKey] = value;
						}
					}

					// Skip completely empty course objects
					if (Object.keys(cleanedCourse).length > 0) {
						cleanedSemesterCourses[key] = cleanedCourse;
					}
				});

				// Only include semester if it has courses
				if (Object.keys(cleanedSemesterCourses).length > 0) {
					cleanedCourses[semester] = cleanedSemesterCourses;
				}
			}

			payload.courses = cleanedCourses;

			// Recursive cleanup for the rest of the object
			const cleanObject = (obj) => {
				if (obj === null || obj === undefined) return undefined;

				if (typeof obj === "string") {
					const trimmed = obj.trim();
					return trimmed === "" || trimmed === "null" ? undefined : trimmed;
				}

				if (Array.isArray(obj)) {
					const cleanedArray = obj
						.map(cleanObject)
						.filter((item) => item !== undefined);

					return cleanedArray.length > 0 ? cleanedArray : undefined;
				}

				if (typeof obj === "object") {
					const cleanedObj = {};

					for (const [key, value] of Object.entries(obj)) {
						const cleanedValue = cleanObject(value);
						if (cleanedValue !== undefined) {
							cleanedObj[key] = cleanedValue;
						}
					}

					return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
				}

				return obj;
			};

			return cleanObject(payload);
		},
		async updateExchange() {
			this.saving = true;

			this.ensureSemesterCourses(this.semesters);

			if (this.adminMode) {
				const payload = JSON.parse(JSON.stringify(this.userExchange));
				this.$emit("save", payload);
				return;
			}

			if (auth.currentUser) {
				try {
					this.ensureSemesterCourses(this.semesters);

					// Capture sync values before any reassignment
					const homeInfoSnapshot = {
						homeUniversity: this.userExchange.homeUniversity ?? null,
						study: this.userExchange.study ?? null,
						studyYear: this.userExchange.studyYear ?? null,
						year: this.userExchange.year ?? null,
						numSemesters: this.userExchange.numSemesters ?? null,
					};

					const cleanPayload = this.buildCleanExchangeForUpload();

					await set(
						dbRef(db, `exchanges/${auth.currentUser.uid}`),
						cleanPayload
					);

					this.remoteExchange = JSON.parse(JSON.stringify(cleanPayload));
					this.userExchange = JSON.parse(JSON.stringify(cleanPayload));

					toast.success(this.$t("notifications.exchangeUpdated"));
					try {
						await syncHomeInfoToUserReports(auth.currentUser.uid, homeInfoSnapshot);
					} catch (syncError) {
						console.error("Failed to sync home info to reports:", syncError);
					}
					if (this.embedded) {
						this.$emit("saved");
					} else {
						this.toggleEditExchange();
						this.step = 1;
					}
				} catch (error) {
					console.error("Error updating user exchange data: ", error);
					toast.error(this.$t("notifications.exchangeUpdateFailure"));
				} finally {
					this.saving = false;
					refreshExchangesData();
				}
			} else {
				console.error("No user is signed in");
			}
		},
		handleSemesterChange(newSemester) {
			if (newSemester === null || newSemester === "") {
				this.semesters = [];
			} else {
				this.semesters = [newSemester];
			}
		},
		handleNumSemestersChange(newNumber) {
			this.userExchange.numSemesters = newNumber;
			this.semesters = newNumber == 2 ? ["Høst", "Vår"] : [];
		},
		setUniversity(university) {
			this.userExchange.university = university;
		},
		setCountry(country) {
			const countryKey = this.getCountryKey(country);
			this.userExchange.country = countryKey;

			if (
				this.userExchange.university &&
				this.universityToCountryMap[this.userExchange.university] !== countryKey
			) {
				this.userExchange.university = null;
			}
		},
		toggleDialog(semester, courseIndex) {
			this.coursePanel = null;
			if (!this.deleteCourseDialog) {
				this.deleteCourseDialog = !this.deleteCourseDialog;
				this.currentSemester = semester;
				this.currentCourse = courseIndex;
			} else {
				this.deleteCourseDialog = false;
				this.currentSemester = null;
				this.currentCourse = null;
			}
		},
		showUnsavedChangesToast() {
			if (!this.isToastVisible) {
				this.toastId = toast.warning(this.$t("myExchange.unsavedChanges"), {
					autoClose: false, // Make sure the toast stays visible
					closeOnClick: true,
					pauseOnHover: true,
					position: "bottom-right",
					hideProgressBar: false,
					onClose: () => {
						this.isToastVisible = false;
					},
				});
				this.isToastVisible = true;
			}
		},
		dismissUnsavedChangesToast() {
			if (this.toastId !== null) {
				toast.remove(this.toastId); // Dismiss the specific toast using its ID
				this.isToastVisible = false;
				this.toastId = null;
			}
		},
		toggleExchangeDialog() {
			this.deleteExchangeDialog = !this.deleteExchangeDialog;
		},
		async deleteExchange() {
			this.toggleExchangeDialog();
			if (auth.currentUser) {
				try {
					await set(dbRef(db, `exchanges/${auth.currentUser.uid}`), null);
					this.userExchange = {
						university: null,
						country: null,
						studyYear: null,
						study: null,
						specialization: null,
						numSemesters: null,
						courses: {
							Høst: {},
							Vår: {},
						},
						sameUniversity: true,
						secondUniversity: "null",
						secondCountry: "null",
					};
					this.remoteExchange = JSON.parse(
						JSON.stringify(this.userExchange)
					);
					this.semesters = [];
					this.panel = null;
					this.coursePanel = null;
					toast.success(this.$t("notifications.exchangeDeleted"));
				} catch (error) {
					console.error("Error deleting user exchange data: ", error);
					toast.error(this.$t("notifications.exchangeDeleteFailure"));
				}
			}
		},
		nextStep() {
			if (this.step < 4) {
				this.step++;
			}
		},
		prevStep() {
			if (this.step > 1) {
				this.step--;
			}
		},
		handleBeforeUnload(event) {
			if (!this.unsavedChanges) return
			event.preventDefault()
			event.returnValue = "" // Required for Chrome
		},
		toggleEditExchange() {
			if (this.adminMode) {
				if (this.unsavedChanges) {
					const ok = window.confirm(this.$t("actions.confirmLeavePage"));
					if (!ok) return;
				}
				this.$emit("close");
				return;
			}

			if (this.unsavedChanges) {
				const confirmLeave = window.confirm(
					this.$t("actions.confirmLeavePage")
				)
				if (!confirmLeave) {
					return
				}
				// revert changes
				this.userExchange = JSON.parse(JSON.stringify(this.remoteExchange))
			}
			this.editExchange = !this.editExchange
			this.step = 1
		},
		ensureSemesterCourses(validSemesters) {
			const newCourses = {};

			validSemesters.forEach((semester) => {
				newCourses[semester] =
					this.userExchange.courses?.[semester] ?? {};
			});

			this.userExchange.courses = newCourses;
		},
		toggleUploadModal() {
			this.uploadModalActive = !this.uploadModalActive;
		},
		normalizeExchange(ex) {
			const x = JSON.parse(JSON.stringify(ex || {}));

			// stabiliser null/"null"
			["secondUniversity", "secondCountry"].forEach(k => {
				if (x[k] === "null") x[k] = null;
			});

			// numSemesters til number
			if (x.numSemesters != null) x.numSemesters = Number(x.numSemesters);

			// sørg for at courses alltid har samme keys
			x.courses = x.courses || {};
			["Høst", "Vår", "Sommer"].forEach(s => {
				x.courses[s] = x.courses[s] || {};
			});

			return x;
		}
	},
	async mounted() {
		window.addEventListener("beforeunload", this.handleBeforeUnload);

		this.loadData();


		if (this.adminMode) {
			return;
		}

		if (this.user) {
			this.loadData();
			await this.retriveUserExchange();
		}
	},
	beforeUnmount() {
		window.removeEventListener("beforeunload", this.handleBeforeUnload)
	},
};
</script>

<style scoped>
.form-root {
	display: flex;
	flex-direction: column;
}

.flat-form {
	display: flex;
	flex-direction: column;
}

.step-body {
	padding: 12px 16px 8px;
}

.flat-courses-header {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(0, 0, 0, 0.38);
	margin: 4px 16px 0;
}

.flat-courses-header::before,
.flat-courses-header::after {
	content: '';
	flex: 1;
	height: 1px;
	background: rgba(0, 0, 0, 0.1);
}

.form-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 12px 10px;
}

.nav-side {
	flex: 1;
	display: flex;
	align-items: center;
}

.nav-side--right {
	justify-content: flex-end;
	gap: 6px;
}
</style>
