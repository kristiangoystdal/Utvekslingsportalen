<template>
	<v-container class="py-10">
		<div v-if="user && userData" class="profile-grid">

			<!-- ───── LEFT SIDEBAR ───── -->
			<div class="sidebar-card">
				<div class="sidebar-header">
					<!-- <div class="sidebar-avatar">{{ userInitials }}</div> -->
					<div class="sidebar-name">{{ userData.displayName }}</div>
					<div class="sidebar-email">{{ user.email }}</div>
					<div v-if="isVerified" class="sidebar-badge sidebar-badge--verified">
						<v-icon size="13">mdi-check-circle</v-icon>
						{{ $t("auth.emailVerified") }}
					</div>
					<div v-else class="sidebar-badge sidebar-badge--unverified" @click="sendVerificationEmail">
						<v-icon size="13">mdi-alert-circle</v-icon>
						{{ $t("auth.emailNotVerified") }}
					</div>
				</div>

				<div class="sidebar-body">
					<div>
						<div class="sidebar-label">{{ $t("database.study") }}</div>
						<div class="sidebar-value">{{ userData.study || '—' }}</div>
					</div>

					<v-divider />

					<div class="d-flex flex-column ga-2">
						<v-btn color="primary" variant="flat" block @click="editProfile">
							<v-icon start size="16">mdi-account-edit</v-icon>
							{{ $t("auth.editProfile") }}
						</v-btn>
						<v-btn color="error" variant="tonal" block @click="sendResetPasswordEmail">
							<v-icon start size="16">mdi-lock-reset</v-icon>
							{{ $t("actions.changePassword") }}
						</v-btn>
					</div>

					<v-divider />

					<div>
						<div class="sidebar-label">{{ $t("auth.myActivity") }}</div>
						<div class="d-flex flex-column ga-2 mt-2">
							<div class="activity-row">
								<div class="activity-label">
									<v-icon size="15" color="#3f72af">mdi-airplane</v-icon>
									{{ $t("nav.myexchangeHeader") }}
								</div>
								<span :class="hasExchange ? 'activity-chip activity-chip--green' : 'activity-chip activity-chip--warning'">
									{{ hasExchange ? $t("auth.exchangeRegistered") : $t("auth.exchangeNotRegistered") }}
								</span>
							</div>
							<div class="activity-row">
								<div class="activity-label">
									<v-icon size="15" color="#3f72af">mdi-file-document-outline</v-icon>
									{{ $t("experiences.myExperiences") }}
								</div>
								<span :class="myExperiencesList.length ? 'activity-chip activity-chip--green' : 'activity-chip activity-chip--warning'">
									{{ myExperiencesList.length ? $t("auth.exchangeRegistered") : $t("auth.exchangeNotRegistered") }}
								</span>
							</div>
							<div class="activity-row">
								<div class="activity-label">
									<v-icon size="15" color="#3f72af">mdi-star</v-icon>
									{{ $t("nav.favoritesTab") }}
								</div>
								<span class="activity-chip activity-chip--neutral">
									{{ favoritesCount }} {{ $t("auth.favoriteCoursesCount") }}
								</span>
							</div>
						</div>
					</div>

					<div class="sidebar-spacer" />

					<div>
						<v-divider class="mb-3" />
						<v-btn variant="text" color="error" block @click="signOut">
							<v-icon start size="16">mdi-logout</v-icon>
							{{ $t("actions.signOut") }}
						</v-btn>
					</div>
				</div>
			</div>

			<!-- ───── RIGHT: Three stacked cards ───── -->
			<div class="main-cards">

				<!-- Exchange card -->
				<v-card class="content-card" rounded="xl" elevation="2">
					<div class="card-header">
						<div class="card-header-left">
							<v-icon size="18" color="#3f72af">mdi-airplane-edit</v-icon>
							<span class="card-title">{{ $t("nav.myexchangeHeader") }}</span>
						</div>
						<div v-if="myExchange" class="card-actions">
							<v-btn variant="tonal" color="primary" @click="startExchangeEdit">
								<v-icon start size="16">mdi-pencil-outline</v-icon>
								{{ $t("actions.edit") }}
							</v-btn>
							<v-btn variant="tonal" color="error" class="px-3" @click="deleteExchangeDialog = true">
								<v-icon size="18">mdi-trash-can-outline</v-icon>
							</v-btn>
						</div>
						<div v-else-if="hasExchange === false" class="card-actions">
							<v-btn variant="tonal" color="primary" @click="openExchangeEdit">
								<v-icon start size="16">mdi-plus</v-icon>
								{{ $t("myExchange.writeMyExchange") }}
							</v-btn>
						</div>
					</div>

					<v-divider />

					<div v-if="hasExchange === null" class="text-center py-10">
						<v-progress-circular indeterminate color="primary" size="32" />
					</div>

					<div v-else-if="hasExchange === false" class="empty-state">
						<v-icon size="44" color="primary" class="mb-3">mdi-airplane-plus</v-icon>
						<div class="text-body-1 font-weight-medium mb-1">{{ $t("myExchange.missingExchangePrompt") }}</div>
						<div class="text-caption text-medium-emphasis">{{ $t("myExchange.clickToAdd") }}</div>
					</div>

					<div v-else-if="myExchange" class="pa-5">
						<div class="exchange-university mb-3">{{ myExchange.university || '—' }}</div>
						<div class="d-flex flex-wrap ga-2 mb-4">
							<span class="meta-chip">{{ $t(`countries.${myExchange.country}`) || myExchange.country }}</span>
							<span v-if="myExchange.year" class="meta-chip">{{ myExchange.year }}</span>
							<span v-if="myExchange.study" class="meta-chip">{{ myExchange.study }}</span>
							<span v-if="exchangeSemesters.length" class="meta-chip">{{ exchangeSemesters.join(" + ") }}</span>
						</div>
						<template v-if="exchangeCourseSummary.length">
							<v-divider class="mb-4" />
							<div class="exchange-courses-grid">
								<div v-for="(sem, i) in exchangeCourseSummary" :key="i">
									<div class="courses-sem-label">{{ sem.semester }}</div>
									<div v-for="(course, j) in sem.courses" :key="j" class="exchange-course-row text-body-2">
										<v-icon size="14" class="mr-1 text-medium-emphasis">mdi-book-outline</v-icon>
										{{ course.courseName || course.courseCode || '—' }}
										<span v-if="course.ECTSPoints" class="text-caption text-medium-emphasis ml-1">({{ course.ECTSPoints }} ECTS)</span>
									</div>
								</div>
							</div>
						</template>
					</div>
				</v-card>

				<!-- Experiences card (one experience per user) -->
				<v-card class="content-card" rounded="xl" elevation="2">
					<div class="card-header">
						<div class="card-header-left">
							<v-icon size="18" color="#3f72af">mdi-file-document-outline</v-icon>
							<span class="card-title">{{ $t("experiences.myExperiences") }}</span>
						</div>
						<div v-if="myExperiencesList.length === 0" class="card-actions">
							<v-btn variant="tonal" color="primary" @click="newExperience">
								<v-icon start size="16">mdi-plus</v-icon>
								{{ $t("experiences.writeExperience") }}
							</v-btn>
						</div>
						<div v-else class="card-actions">
							<v-btn variant="tonal" color="primary" @click="startEditExperience(myExperiencesList[0])">
								<v-icon start size="16">mdi-pencil-outline</v-icon>
								{{ $t("actions.edit") }}
							</v-btn>
							<v-btn variant="tonal" color="error" class="px-3" @click="deleteExperienceDialog = true">
								<v-icon size="18">mdi-trash-can-outline</v-icon>
							</v-btn>
						</div>
					</div>

					<v-divider />

					<div v-if="myExperiencesList.length === 0" class="empty-state">
						<v-icon size="44" color="primary" class="mb-3">mdi-file-document-plus-outline</v-icon>
						<div class="text-body-1 font-weight-medium mb-1">{{ $t("experiences.noOwnExperiences") }}</div>
					</div>

					<div v-else class="pa-5">
						<div class="d-flex align-start justify-space-between gap-3 mb-3">
							<div class="experience-title">{{ myExperiencesList[0].title || '—' }}</div>
							<v-chip
								size="x-small"
								:color="myExperiencesList[0].status === 'published' ? 'success' : myExperiencesList[0].status === 'pending' ? 'warning' : 'error'"
								variant="tonal"
								class="flex-shrink-0 mt-1"
							>
								{{ $t(`experiences.${myExperiencesList[0].status}`) }}
							</v-chip>
						</div>

						<div class="d-flex flex-wrap ga-2 mb-4">
							<span v-if="myExperiencesList[0].country" class="meta-chip">{{ $t(`countries.${myExperiencesList[0].country}`) }}</span>
							<span v-if="myExperiencesList[0].university" class="meta-chip">{{ myExperiencesList[0].university }}</span>
							<span v-if="myExperiencesList[0].year" class="meta-chip">{{ myExperiencesList[0].year }}</span>
							<span v-if="myExperiencesList[0].semester" class="meta-chip">{{ myExperiencesList[0].semester }}</span>
							<span v-if="myExperiencesList[0].study" class="meta-chip">{{ myExperiencesList[0].study }}</span>
						</div>

						<div v-if="myExperiencesList[0].ratings?.overall" class="d-flex align-center ga-1 mb-3">
							<v-rating :model-value="myExperiencesList[0].ratings.overall" color="amber" readonly density="compact" size="16" class="d-flex" />
							<span class="text-caption text-medium-emphasis">{{ $t("experiences.overall") }}</span>
						</div>

						<p v-if="myExperiencesList[0].content" class="experience-content">{{ myExperiencesList[0].content }}</p>

						<template v-if="filteredPros.length || filteredCons.length">
							<v-divider class="my-3" />
							<div class="d-flex ga-6 flex-wrap">
								<div v-if="filteredPros.length">
									<div class="courses-sem-label mb-1">{{ $t("experiences.pros") }}</div>
									<ul class="experience-list">
										<li v-for="(p, i) in filteredPros" :key="i">{{ p }}</li>
									</ul>
								</div>
								<div v-if="filteredCons.length">
									<div class="courses-sem-label mb-1">{{ $t("experiences.cons") }}</div>
									<ul class="experience-list">
										<li v-for="(c, i) in filteredCons" :key="i">{{ c }}</li>
									</ul>
								</div>
							</div>
						</template>

						<template v-if="myExperiencesList[0].tips">
							<v-divider class="my-3" />
							<div class="courses-sem-label mb-1">{{ $t("experiences.tips") }}</div>
							<p class="experience-content">{{ myExperiencesList[0].tips }}</p>
						</template>
					</div>
				</v-card>

				<!-- Favorites card -->
				<v-card class="content-card" rounded="xl" elevation="2">
					<div class="card-header">
						<div class="card-header-left">
							<v-icon size="18" color="#3f72af">mdi-star</v-icon>
							<span class="card-title">{{ $t("auth.favoriteCourses") }}</span>
							<span v-if="favoritesCount" class="card-count-badge">{{ favoritesCount }}</span>
						</div>
						<div class="card-actions">
							<v-btn variant="tonal" color="primary" @click="$refs.favComp.exportAsPDF()">
								<v-icon start size="16">mdi-file-pdf-box</v-icon>
								{{ $t("actions.exportAsPDF") }}
							</v-btn>
							<v-btn variant="tonal" color="primary" @click="$refs.favComp.exportAsCSV()">
								<v-icon start size="16">mdi-file-document-outline</v-icon>
								{{ $t("actions.exportAsCSV") }}
							</v-btn>
						</div>
					</div>

					<v-divider />

					<div class="pa-4">
						<FavoriteCourses ref="favComp" :embedded="true" @favorites-count="favoritesCount = $event" />
					</div>
				</v-card>

			</div>
		</div>

		<!-- Loading -->
		<div v-else-if="loading" class="text-center my-10">
			<v-progress-circular indeterminate color="primary" size="48" />
		</div>

		<!-- Not logged in -->
		<div v-else>
			<v-alert type="error">{{ $t("errors.notLoggedIn") }}</v-alert>
		</div>

		<!-- ───── MODALS ───── -->

		<!-- Experience Create / Edit Modal -->
		<v-dialog v-model="editExperienceDialog" max-width="860" scrollable persistent>
			<v-card rounded="xl">
				<div class="dialog-header">
					<span class="dialog-title">
						{{ editingExperienceId ? $t("experiences.editExperience") : $t("experiences.writeExperience") }}
					</span>
					<v-btn icon variant="text" size="small" @click="cancelEditExperience">
						<v-icon>mdi-close</v-icon>
					</v-btn>
				</div>
				<v-divider />
				<v-card-text class="pa-4">
					<CreateExperience
						v-if="editExperienceDialog"
						:prop-experience-id="editingExperienceId"
						:embedded="true"
						@saved="finishEditExperience"
						@cancelled="cancelEditExperience"
					/>
				</v-card-text>
			</v-card>
		</v-dialog>

		<!-- Delete Experience confirmation -->
		<v-dialog v-model="deleteExperienceDialog" max-width="420">
			<v-card rounded="xl">
				<v-card-title class="pa-5 pb-2">{{ $t("actions.confirmDelete") }}</v-card-title>
				<v-card-text class="pa-5 pt-1 text-medium-emphasis">
					{{ $t("actions.confirmExperienceDelete") }}
				</v-card-text>
				<v-card-actions class="pa-4 pt-0 ga-2">
					<v-spacer />
					<v-btn variant="text" @click="deleteExperienceDialog = false">{{ $t("actions.no") }}</v-btn>
					<v-btn color="error" variant="tonal" :loading="deletingExperience" @click="confirmDeleteExperience">
						{{ $t("actions.yes") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Exchange Detail Modal -->
		<v-dialog v-if="selectedExchange" :model-value="true" max-width="700" scrollable @update:model-value="selectedExchange = null">
			<v-card rounded="xl">
				<div class="dialog-header">
					<div class="min-width-0 flex-grow-1">
						<div class="dialog-title text-truncate">{{ selectedExchange.university || '—' }}</div>
						<div class="text-caption text-medium-emphasis mt-1">
							{{ $t(`countries.${selectedExchange.country}`) || selectedExchange.country }}
							<template v-if="selectedExchange.year">· {{ selectedExchange.year }}</template>
							<template v-if="selectedExchange.study">· {{ selectedExchange.study }}</template>
							<template v-if="exchangeSemesters.length">· {{ exchangeSemesters.join(" + ") }}</template>
						</div>
					</div>
					<v-btn icon variant="text" size="small" class="flex-shrink-0" @click="selectedExchange = null">
						<v-icon>mdi-close</v-icon>
					</v-btn>
				</div>
				<v-divider />
				<v-card-text class="pa-4 pa-sm-5">
					<v-row dense class="mb-2">
						<v-col cols="6" sm="4">
							<div class="exchange-stat-label">{{ $t("database.study") }}</div>
							<div class="exchange-stat-value">{{ selectedExchange.study || '—' }}</div>
						</v-col>
						<v-col cols="6" sm="4">
							<div class="exchange-stat-label">{{ $t("database.numSemesters") }}</div>
							<div class="exchange-stat-value">{{ selectedExchange.numSemesters || '—' }}</div>
						</v-col>
						<v-col v-if="exchangeSemesters.length" cols="6" sm="4">
							<div class="exchange-stat-label">{{ $t("database.semester") }}</div>
							<div class="exchange-stat-value">{{ exchangeSemesters.join(" + ") }}</div>
						</v-col>
						<v-col cols="6" sm="4">
							<div class="exchange-stat-label">{{ $t("database.year") }}</div>
							<div class="exchange-stat-value">{{ selectedExchange.year || '—' }}</div>
						</v-col>
						<v-col v-if="!selectedExchange.sameUniversity && selectedExchange.secondUniversity" cols="12" sm="8">
							<div class="exchange-stat-label">{{ $t("database.university") }} 2</div>
							<div class="exchange-stat-value">{{ selectedExchange.secondUniversity }}</div>
						</v-col>
					</v-row>
					<template v-if="exchangeCourseSummary.length">
						<v-divider class="my-3" />
						<div class="exchange-stat-label mb-3">{{ $t("wizard.courses.title") }}</div>
						<div v-for="(sem, i) in exchangeCourseSummary" :key="i" class="mb-3">
							<div class="text-body-2 font-weight-bold mb-2">{{ sem.semester }}</div>
							<div v-for="(course, j) in sem.courses" :key="j" class="exchange-course-row text-body-2 mb-1">
								<v-icon size="15" class="mr-2 text-medium-emphasis">mdi-book-outline</v-icon>
								<span>
									{{ course.courseName || course.courseCode || $t("database.course") }}
									<span v-if="course.replacedCourseName" class="text-medium-emphasis"> → {{ course.replacedCourseName }}</span>
									<span v-if="course.ECTSPoints" class="text-caption text-medium-emphasis ml-1">({{ course.ECTSPoints }} ECTS)</span>
								</span>
							</div>
						</div>
					</template>
				</v-card-text>
				<v-divider />
				<v-card-actions class="pa-4 pa-sm-5 ga-3">
					<v-btn variant="tonal" color="primary" @click="startExchangeEdit">
						<v-icon start>mdi-pencil-outline</v-icon>
						{{ $t("actions.edit") }}
					</v-btn>
					<v-btn variant="tonal" color="error" @click="deleteExchangeDialog = true">
						<v-icon start>mdi-trash-can-outline</v-icon>
						{{ $t("actions.deleteExchange") }}
					</v-btn>
					<v-spacer />
					<v-btn variant="text" @click="selectedExchange = null">{{ $t("actions.close") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Delete Exchange confirmation -->
		<v-dialog v-model="deleteExchangeDialog" max-width="420">
			<v-card rounded="xl">
				<v-card-title class="pa-5 pb-2">{{ $t("actions.confirmDelete") }}</v-card-title>
				<v-card-text class="pa-5 pt-1 text-medium-emphasis">{{ $t("actions.confirmExchangeDelete") }}</v-card-text>
				<v-card-actions class="pa-4 pt-0 ga-2">
					<v-spacer />
					<v-btn variant="text" @click="deleteExchangeDialog = false">{{ $t("actions.no") }}</v-btn>
					<v-btn color="error" variant="tonal" :loading="deletingExchange" @click="confirmDeleteExchange">
						{{ $t("actions.yes") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Exchange Edit Modal -->
		<v-dialog v-model="editExchangeDialog" max-width="900" scrollable persistent>
			<v-card rounded="xl">
				<div class="dialog-header">
					<span class="dialog-title">{{ $t("nav.myexchangeHeader") }}</span>
					<v-btn icon variant="text" size="small" @click="closeExchangeEdit">
						<v-icon>mdi-close</v-icon>
					</v-btn>
				</div>
				<v-divider />
				<v-card-text class="pa-4">
					<EditExchange v-if="editExchangeDialog" :compact="true" :embedded="true" @saved="finishExchangeEdit" @cancelled="closeExchangeEdit" />
				</v-card-text>
			</v-card>
		</v-dialog>

		<!-- Edit Profile Dialog -->
		<v-dialog v-model="dialog" persistent max-width="560px">
			<v-card rounded="xl">
				<div class="dialog-header">
					<span class="dialog-title">{{ $t("auth.editProfile") }}</span>
					<v-btn icon variant="text" size="small" @click="closeDialog">
						<v-icon>mdi-close</v-icon>
					</v-btn>
				</div>
				<v-divider />
				<v-card-text class="pa-4">
					<v-form ref="editForm">
						<v-text-field v-model="localEditData.displayName" :label="$t('auth.name')" required />
						<v-text-field v-model="localEditData.email" :label="$t('auth.email')" required readonly />
						<v-autocomplete v-model="localEditData.study" :items="studyNames" :label="$t('database.study')" required @update:modelValue="handleNewStudy" />
						<v-autocomplete v-model="localEditData.specialization" :items="specializations" :label="$t('database.specialization')" />
					</v-form>
				</v-card-text>
				<v-divider />
				<v-card-actions class="pa-4 ga-2">
					<v-spacer />
					<v-btn color="error" variant="tonal" @click="closeDialog">{{ $t("actions.cancel") }}</v-btn>
					<v-btn color="primary" variant="tonal" @click="saveProfile">{{ $t("actions.save") }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Verification Dialog -->
		<v-dialog v-model="verificationDialog" max-width="440">
			<v-card rounded="xl">
				<div class="dialog-header">
					<span class="dialog-title">{{ $t("auth.userNotVerified") }}</span>
					<v-btn icon variant="text" size="small" @click="toggleVerificationDialog">
						<v-icon>mdi-close</v-icon>
					</v-btn>
				</div>
				<v-divider />
				<v-card-actions class="pa-4 ga-2">
					<v-btn color="primary" variant="tonal" block @click="sendVerificationEmail()">
						{{ $t("auth.sendVerificationEmail") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script>
import { mapGetters } from "vuex";
import { auth, db } from "../../js/firebaseConfig";
import { signOut, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { ref as dbRef, update, set } from "firebase/database";
import studiesData from "../../data/studies.json";
import FavoriteCourses from "./FavoriteCourses.vue";
import EditExchange from "../exchanges/EditExchange.vue";
import CreateExperience from "../experiences/CreateExperience.vue";
import { toast } from "vue3-toastify";
import { getUserExperiences, deleteExperience } from "../../js/experiencesCache";
import { getExchangesData, clearCachedExchanges } from "../../js/exchangesCache";

export default {
	components: { FavoriteCourses, EditExchange, CreateExperience },
	data() {
		return {
			studies: {},
			loading: true,
			dialog: false,
			favoritesCount: 0,
			hasExchange: null,
			editExperienceDialog: false,
			editingExperienceId: null,
			deleteExperienceDialog: false,
			deletingExperience: false,
			editExchangeDialog: false,
			myExchange: null,
			selectedExchange: null,
			deleteExchangeDialog: false,
			deletingExchange: false,
			localEditData: { displayName: "", email: "", study: "", specialization: "" },
			verificationDialog: false,
			myExperiences: {},
		};
	},
	computed: {
		...mapGetters(["user", "userData"]),
		userInitials() {
			const name = this.userData?.displayName || "";
			return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
		},
		studyNames() {
			return Object.keys(this.studies);
		},
		specializations() {
			return this.localEditData.study ? this.studies[this.localEditData.study] : [];
		},
		isVerified() {
			return this.user && this.user.emailVerified;
		},
		myExperiencesList() {
			return Object.entries(this.myExperiences)
				.map(([id, r]) => ({ id, ...r }))
				.sort((a, b) => b.createdAt - a.createdAt);
		},
		filteredPros() {
			return (this.myExperiencesList[0]?.pros || []).filter(p => p?.trim());
		},
		filteredCons() {
			return (this.myExperiencesList[0]?.cons || []).filter(c => c?.trim());
		},
		exchangeSemesters() {
			if (!this.myExchange) return [];
			if (this.myExchange.numSemesters === 2) return ["Høst", "Vår"];
			if (this.myExchange.numSemesters === 1) {
				const hasFall = this.myExchange.courses?.Høst && Object.keys(this.myExchange.courses.Høst).length > 0;
				const hasSpring = this.myExchange.courses?.Vår && Object.keys(this.myExchange.courses.Vår).length > 0;
				if (hasFall) return ["Høst"];
				if (hasSpring) return ["Vår"];
			}
			return [];
		},
		exchangeCourseSummary() {
			if (!this.myExchange?.courses) return [];
			return this.exchangeSemesters.map(sem => ({
				semester: sem,
				courses: Object.values(this.myExchange.courses[sem] || {}),
			})).filter(s => s.courses.length > 0);
		},
	},
	methods: {
		loadData() {
			try { this.studies = studiesData.studies; } catch (e) { console.error(e); }
		},
		editProfile() {
			if (this.user && this.userData) {
				this.localEditData = { ...this.userData };
				this.dialog = true;
			}
		},
		closeDialog() { this.dialog = false; },
		newExperience() {
			this.editingExperienceId = null;
			this.editExperienceDialog = true;
		},
		startEditExperience(experience) {
			this.editingExperienceId = experience.id;
			this.editExperienceDialog = true;
		},
		async finishEditExperience() {
			this.editExperienceDialog = false;
			this.editingExperienceId = null;
			if (this.user) this.myExperiences = await getUserExperiences(this.user.uid);
		},
		cancelEditExperience() {
			this.editExperienceDialog = false;
			this.editingExperienceId = null;
		},
		async confirmDeleteExperience() {
			this.deletingExperience = true;
			try {
				await deleteExperience(this.myExperiencesList[0].id);
				this.myExperiences = {};
				this.deleteExperienceDialog = false;
				toast.success(this.$t("notifications.experienceDeleted"));
			} catch (e) {
				toast.error(this.$t("notifications.experienceError"));
			} finally {
				this.deletingExperience = false;
			}
		},
		openExchangeEdit() { this.editExchangeDialog = true; },
		startExchangeEdit() {
			this.selectedExchange = null;
			this.editExchangeDialog = true;
		},
		async closeExchangeEdit() {
			this.editExchangeDialog = false;
			if (this.user) {
				clearCachedExchanges();
				const exchanges = await getExchangesData();
				this.myExchange = exchanges?.[this.user.uid] ?? null;
				this.hasExchange = !!this.myExchange;
			}
		},
		async finishExchangeEdit() { await this.closeExchangeEdit(); },
		async confirmDeleteExchange() {
			this.deletingExchange = true;
			try {
				await set(dbRef(db, `exchanges/${this.user.uid}`), null);
				clearCachedExchanges();
				this.myExchange = null;
				this.hasExchange = false;
				this.deleteExchangeDialog = false;
				this.selectedExchange = null;
				toast.success(this.$t("notifications.exchangeDeleted"));
			} catch (e) {
				toast.error(this.$t("notifications.exchangeDeleteFailure"));
			} finally {
				this.deletingExchange = false;
			}
		},
		async saveProfile() {
			if (this.user) {
				try {
					const updatedData = {
						displayName: this.localEditData.displayName,
						email: this.localEditData.email,
						study: this.localEditData.study,
						specialization: this.localEditData.specialization,
					};
					await update(dbRef(db, `users/${this.user.uid}`), updatedData);
					this.$store.commit("setUserData", { ...this.localEditData });
					this.closeDialog();
					toast.success(this.$t("notifications.profileUpdateSuccess"));
				} catch (e) {
					toast.error(this.$t("notifications.profileUpdateFailure"));
				}
			}
		},
		async signOut() {
			try {
				await signOut(auth);
				this.$router.push("/logg_inn");
			} catch (e) { console.error(e); }
		},
		loadLocalData() {
			this.localEditData = this.userData ? { ...this.userData } : { displayName: "", email: "", study: "", specialization: "" };
		},
		handleNewStudy() { this.localEditData.specialization = ""; },
		toggleVerificationDialog() { this.verificationDialog = !this.verificationDialog; },
		sendVerificationEmail() {
			if (auth.currentUser) {
				sendEmailVerification(auth.currentUser)
					.then(() => toast.success(this.$t("notifications.verificationEmailSuccess")))
					.catch(() => toast.error(this.$t("notifications.verificationEmailFailure")));
			}
		},
		sendResetPasswordEmail() {
			if (this.user?.email) {
				sendPasswordResetEmail(auth, this.user.email)
					.then(() => toast.success(this.$t("notifications.passwordResetEmailSent")))
					.catch(() => toast.error(this.$t("notifications.passwordResetEmailFailure")));
			}
		},
	},
	watch: {
		userData: {
			handler(val) {
				if (val) this.loadLocalData();
				this.loading = false;
			},
			immediate: true,
		},
		user: {
			async handler(val) {
				if (val) {
					this.myExperiences = await getUserExperiences(val.uid);
					const exchanges = await getExchangesData();
					this.myExchange = exchanges?.[val.uid] ?? null;
					this.hasExchange = !!this.myExchange;
				}
			},
			immediate: true,
		},
	},
	mounted() {
		this.loadData();
		if (this.$route.query.newExperience) {
			this.newExperience();
		}
	},
};
</script>

<style scoped>
/* ─── Layout ─── */
.profile-grid {
	display: grid;
	grid-template-columns: 300px 1fr;
	gap: 20px;
	align-items: start;
}

@media (max-width: 960px) {
	.profile-grid { grid-template-columns: 1fr; }
}

/* ─── Sidebar ─── */
.sidebar-card {
	background: var(--fifth-color, #fff);
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.sidebar-header {
	background: var(--second-color, #112d4e);
	padding: 28px 24px 24px;
	text-align: center;
}

.sidebar-avatar {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background: var(--second-color, #3f72af);
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 28px;
	margin: 0 auto 12px;
	border: 3px solid rgba(255, 255, 255, 0.2);
}

.sidebar-name {
	font-size: 16px;
	font-weight: 700;
	color: #fff;
	margin-bottom: 2px;
}

.sidebar-email {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.843);
}

.sidebar-badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	margin-top: 10px;
	padding: 3px 10px;
	border-radius: 20px;
	font-size: 11px;
	font-weight: 600;
}

.sidebar-badge--verified {
	background: rgba(76, 175, 80, 0.15);
	border: 1px solid rgba(76, 175, 80, 0.4);
	color: #a5d6a7;
}

.sidebar-badge--unverified {
	background: rgba(229, 57, 53, 0.15);
	border: 1px solid rgba(229, 57, 53, 0.4);
	color: #ef9a9a;
	cursor: pointer;
}

.sidebar-body {
	padding: 20px 22px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	flex: 1;
}

.sidebar-spacer { flex: 1; }

.sidebar-label {
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(0, 0, 0, 0.38);
	margin-bottom: 3px;
}

.sidebar-value {
	font-size: 14px;
	font-weight: 500;
	color: var(--first-color, #112d4e);
}

/* ─── Activity stats ─── */
.activity-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 13px;
	gap: 8px;
}

.activity-label {
	display: flex;
	align-items: center;
	gap: 7px;
	color: rgba(0, 0, 0, 0.65);
	min-width: 0;
}

.activity-chip {
	font-size: 10px;
	font-weight: 700;
	border-radius: 10px;
	padding: 2px 8px;
	white-space: nowrap;
	flex-shrink: 0;
}

.activity-chip--green {
	background: var(--alert-success, #e6f4ea);
	color: var(--alert-success-text, #2e7d32);
}

.activity-chip--warning {
	background: var(--alert-warning, #ffecb3);
	color: var(--color-warning-text, #ff6f00);
}

.activity-chip--neutral {
	background: var(--third-color, #dbe2ef);
	color: var(--first-color, #112d4e);
}

/* ─── Right column ─── */
.main-cards {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.content-card { overflow: hidden; }

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	height: 52px;
	gap: 12px;
	background: var(--fourth-color, #f9f7f7);
}

.card-header-left {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.card-title {
	font-size: 15px;
	font-weight: 700;
	color: var(--first-color, #112d4e);
}

.card-count-badge {
	font-size: 11px;
	font-weight: 700;
	background: var(--third-color, #dbe2ef);
	color: var(--first-color, #112d4e);
	border-radius: 10px;
	padding: 1px 8px;
}

.card-actions {
	display: flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
}

/* ─── Empty states ─── */
.empty-state {
	text-align: center;
	padding: 48px 24px;
}

/* ─── Exchange body ─── */
.exchange-university {
	font-size: 17px;
	font-weight: 700;
	color: var(--first-color, #112d4e);
}

.meta-chip {
	font-size: 12px;
	background: var(--third-color, #dbe2ef);
	color: var(--first-color, #112d4e);
	border-radius: 20px;
	padding: 2px 10px;
	font-weight: 500;
}

.exchange-courses-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.courses-sem-label {
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: rgba(0, 0, 0, 0.38);
	margin-bottom: 6px;
}

.exchange-course-row {
	display: flex;
	align-items: center;
	padding: 3px 0;
	color: rgba(0, 0, 0, 0.75);
}

/* ─── Experience body ─── */
.experience-title {
	font-size: 16px;
	font-weight: 700;
	color: var(--first-color, #112d4e);
	line-height: 1.3;
}

.experience-subtitle {
	font-size: 12px;
	color: rgba(0, 0, 0, 0.5);
}

.experience-content {
	font-size: 14px;
	color: rgba(0, 0, 0, 0.7);
	line-height: 1.6;
	white-space: pre-wrap;
	word-break: break-word;
	margin: 0;
}

.experience-list {
	margin: 0;
	padding-left: 18px;
	font-size: 13px;
	color: rgba(0, 0, 0, 0.7);
	display: flex;
	flex-direction: column;
	gap: 2px;
}

/* ─── Exchange modal ─── */
.exchange-stat-label {
	font-size: 0.72rem;
	font-weight: 700;
	color: rgba(0, 0, 0, 0.45);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 2px;
}

.exchange-stat-value {
	font-size: 0.9rem;
	font-weight: 500;
}

.min-width-0 { min-width: 0; }

/* ─── Dialog headers ─── */
.dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	gap: 8px;
	min-height: 54px;
}

.dialog-title {
	flex: 1;
	font-size: 1.05rem;
	font-weight: 700;
	color: rgba(0, 0, 0, 0.87);
	line-height: 1.3;
}

</style>
