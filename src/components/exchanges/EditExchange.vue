<template>
	<!-- Title and infobox -->
	<div>
		<h2>{{ $t("myExchange.pageHeader") }}</h2>
		<br />
		<p class="box box-third-color preserve-whitespace text-center">
			{{ $t("myExchange.info") }}
		</p>
	</div>
	<br />
	<br />
	<div>
		<div v-if="this.user">
			<!-- Show current exchange data here -->
			<div v-if="!editExchange">
				<div class="mt-4">
					<ReviewStep :userExchange="userExchange" :semesters="semesters" :canSubmit="true" :showSubmitButton="false" />
				</div>

				<div class="box text-info text-center my-4 d-flex flex-wrap justify-center ga-8">
					<v-btn class="btn btn-primary" @click="editExchange = true">
						{{ $t("myExchange.editMyExchange") }}
					</v-btn>
					<v-btn class="btn btn-danger" @click="toggleExchangeDialog()">
						{{ $t("myExchange.deleteMyExchange") }}
					</v-btn>
				</div>
			</div>

			<!-- Stepper -->
			<v-stepper v-if="editExchange" v-model="step" elevation="1">
				<v-stepper-header>
					<v-stepper-item :value="1" :complete="!missingBasicDataBool">
						{{ $t("wizard.basic.title") }}
					</v-stepper-item>

					<v-divider />

					<v-stepper-item :value="2" :complete="!missingCoursesBool">
						{{ $t("wizard.courses.title") }}
					</v-stepper-item>

					<v-divider />

					<v-stepper-item :value="3">
						{{ $t("wizard.review.title") }}
					</v-stepper-item>
				</v-stepper-header>

				<v-stepper-window>
					<v-stepper-window-item :value="1">
						<BasicInfoStep :userExchange="userExchange" :studies="studies"
							:countryNamesTranslated="countryNamesTranslated" :universityNames="universityNames"
							:secondUniversityNames="secondUniversityNames" :semesters="semesters" @update="userExchange = $event"
							@updateSemesters="semesters = $event" />
					</v-stepper-window-item>

					<v-stepper-window-item :value="2">
						<CoursesStep :userExchange="userExchange" :semesters="semesters" @update="userExchange = $event" />
					</v-stepper-window-item>

					<v-stepper-window-item :value="3">
						<ReviewStep :userExchange="userExchange" :semesters="semesters" :canSubmit="canSaveExchange"
							@submit="updateExchange" />
					</v-stepper-window-item>
				</v-stepper-window>
			</v-stepper>

			<v-divider v-if="editExchange" class="my-4" />

			<v-row v-if="editExchange" class="px-4 pb-4" align="center" no-gutters>
				<!-- Left: Previous -->
				<v-col cols="12" sm="4" class="d-flex justify-center">
					<v-btn v-if="step > 1" class="btn btn-third" @click="prevStep">
						{{ step == 2 ? $t("wizard.courses.previous") : $t("wizard.review.previous") }}
					</v-btn>
				</v-col>

				<v-spacer />

				<v-col cols="12" sm="4" class="d-flex justify-center">
					<v-btn class="btn btn-danger" @click="toggleEditExchange">
						{{ $t("operations.cancel") }}
					</v-btn>
				</v-col>

				<v-spacer />

				<!-- Right: Warning icon + Next -->
				<v-col cols="12" sm="4" class="d-flex align-center">
					<v-tooltip>
						<template #activator="{ props }">
							<v-icon v-bind="props" color="warning" v-if="nextDisabled">
								mdi-alert-circle
							</v-icon>
						</template>

						<span v-if="step == 1 && missingBasicDataBool">{{ missingBasicDataString }}</span>
						<span v-else-if="step == 2 && missingCoursesBool">{{ $t("myExchange.coursesMissingData") }}</span>
					</v-tooltip>

					<v-btn v-if="step < 3" class="btn btn-primary" :disabled="nextDisabled" @click="nextStep">
						{{ step == 1 ? $t("wizard.basic.next") : $t("wizard.courses.next") }}
					</v-btn>
				</v-col>
			</v-row>
		</div>
		<div v-else>
			<div class="box box-alert text-alert text-center">
				<div>
					{{ $t("myExchange.loginToEdit") }}
				</div>
				<br />
				<v-btn class="btn-primary" :to="{ name: 'Login' }">
					{{ $t("operations.signIn") }}
				</v-btn>
			</div>
		</div>



		<!-- Delete exchange dialog -->
		<v-dialog v-model="deleteExchangeDialog" class="dialog">
			<v-card>
				<v-card-title class="headline">
					{{ $t("operations.confirmDelete") }}
				</v-card-title>
				<v-card-text>
					{{ $t("operations.confirmExchangeDelete") }}
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn id="noBtn" @click="toggleExchangeDialog()">
						{{ $t("operations.no") }}
					</v-btn>
					<v-btn id="yesBtn" @click="deleteExchange()">
						{{ $t("operations.yes") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
import { db, auth } from "../../js/firebaseConfig";
import { ref as dbRef, get, set, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import studiesData from "../../data/studies.json";
import universitiesData from "../../data/universities.json";
import { toast } from "vue3-toastify";

import BasicInfoStep from "./BasicInfoStep.vue";
import CoursesStep from "./CoursesStep.vue";
import ReviewStep from "./ReviewStep.vue";

import CourseForm from "./CourseForm.vue";

export default {
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
	},
	data() {
		return {
			user: null,
			userInformation: null,
			panel: null,
			coursePanel: null,
			numCoursesMissing: 0,
			studies: {},
			universities: {},
			semesters: [],
			remoteExchange: {
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

		};
	},
	watch: {
		unsavedChanges(newValue) {
			if (newValue) {
				this.showUnsavedChangesToast(); // Show the toast when unsavedChanges becomes true
			} else {
				this.dismissUnsavedChangesToast(); // Dismiss the toast when unsavedChanges becomes false
			}
		},
		'userExchange.numSemesters'(newVal, oldVal) {
			// don't run on initial load / programmatic assignment
			if (this.isInitializingExchange) return;

			// only react to user changes while editing
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
				// keep courses until user picks the semester in BasicInfoStep
				this.semesters = [];
				// IMPORTANT: do NOT wipe existing courses here
				// just wait for updateSemesters to tell you which one to keep
				return;
			}
		},
	},
	computed: {
		specializations() {
			if (this.userExchange.study) {
				return this.studies[this.userExchange.study];
			} else {
				return [];
			}
		},
		countryNames() {
			return Object.keys(this.universities);
		},
		countryNamesTranslated() {
			return Object.keys(this.universities).map((country) =>
				this.$t(`countries.${country}`)
			);
		},
		universityNames() {
			if (this.userExchange.country) {
				return this.universities[
					this.countryNames[this.getCountryIndex(this.userExchange.country)]
				];
			} else {
				return [];
			}
		},
		secondUniversityNames() {
			if (this.userExchange.secondCountry) {
				return this.universities[this.userExchange.secondCountry];
			} else {
				return [];
			}
		},
		universityToCountryMap() {
			const map = {};
			Object.keys(this.universities).forEach((country) => {
				this.universities[country].forEach((university) => {
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
				this.userExchange.specialization == null ||
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
			return JSON.stringify(this.remoteExchange) !==
				JSON.stringify(this.userExchange);
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
				this.studies = studiesData.studies;
				this.universities = universitiesData.universities;
			} catch (error) {
				console.error("There was an error loading the studies data:", error);
			}
		},
		async retriveUserExchange() {
			if (auth.currentUser) {
				// Get the user's exchange data from the database
				const currentUser = auth.currentUser;
				const userDocRef = dbRef(db, `exchanges/${currentUser.uid}`);
				const userDoc = await get(userDocRef);

				// If the user exists, set the userData object
				if (userDoc.exists()) {
					this.userData = userDoc.val();

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

			// Add the new course to the courses object
			this.userExchange.courses[semesterString] = {
				...courses,
				[newCourseIndex]: {
					exchangeID: auth.currentUser.uid, // Set the current user's ID
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
			const translatedCountries = this.countryNamesTranslated;
			return translatedCountries.findIndex(
				(translatedName) => translatedName === selectedCountry
			);
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
		async updateExchange() {
			if (auth.currentUser) {
				try {
					this.ensureSemesterCourses(this.semesters);

					const tempUserExchange = JSON.parse(
						JSON.stringify(this.userExchange)
					);

					this.userExchange.country =
						this.countryNames[
						this.getCountryIndex(this.userExchange.country)
						];

					if (this.userExchange.sameUniversity) {
						this.userExchange.secondUniversity = "null";
						this.userExchange.secondCountry = "null";
					} else {
						this.userExchange.secondCountry =
							this.countryNames[
							this.getCountryIndex(this.userExchange.secondCountry)
							];
					}

					await update(
						dbRef(db, `exchanges/${auth.currentUser.uid}`),
						this.userExchange
					);

					this.remoteExchange = JSON.parse(JSON.stringify(tempUserExchange));
					this.userExchange = tempUserExchange;

					toast.success(this.$t("notifications.exchangeUpdated"));
					this.toggleEditExchange();
					this.step = 1;
				} catch (error) {
					console.error("Error updating user exchange data: ", error);
					toast.error(this.$t("notifications.exchangeUpdateFailure"));
				}
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
			this.userExchange.country = country;
			if (country != this.universityToCountryMap[country]) {
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
		async loadUser() {
			if (this.user) {
				const userDocRef = dbRef(db, `users/${this.user.uid}`);
				const userDoc = await get(userDocRef);
				if (userDoc.exists()) {
					this.userInformation = userDoc.val();
				}
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
			if (this.unsavedChanges) {
				const confirmLeave = window.confirm(
					this.$t("operations.confirmLeavePage")
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
	},
	mounted() {
		window.addEventListener("beforeunload", this.handleBeforeUnload);

		onAuthStateChanged(auth, async (user) => {
			if (!user) {
				this.user = null;
				this.dataLoaded = true;
				return;
			}

			this.user = user;
			await this.loadUser();
			this.loadData(); // ✅ load universities FIRST

			await this.retriveUserExchange(); // ✅ NOW SAFE
		});
	},
	beforeUnmount() {
		window.removeEventListener("beforeunload", this.handleBeforeUnload)
	},


};
</script>

<style scoped>
.unsaved-changes {
	background-color: #ffecb3;
	/* Light yellow background */
	border: 1px solid #ffd54f;
	/* Darker yellow border */
	padding: 16px;
	border-radius: 8px;
	margin-bottom: 16px;
	font-weight: bold;
	color: #ff6f00;
	/* Dark orange text */
	width: fit-content;
	margin: 0 auto;
	text-align: center;
}

.update-btn {
	background-color: #00bd7e;
	/* Teal background */
	color: white;
	font-weight: bold;
}

.update-btn:disabled {
	background-color: #b2dfdb;
	/* Light teal background */
	color: #004d40;
	/* Dark teal text */
}

.course-icons {
	margin: 0 8px;
	/* Adjust the margin value as needed */
}

.step-btn {
	min-width: 120px !important;
	width: 80% !important;
}
</style>
