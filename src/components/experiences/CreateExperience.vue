<template>
	<div class="form-root">
		<h2 v-if="!embedded" class="text-h5 font-weight-bold mb-1">
			{{ editMode ? $t("experiences.editExperience") : $t("experiences.writeExperience") }}
		</h2>
		<p v-if="!embedded" class="text-medium-emphasis mb-6">{{ $t("experiences.info") }}</p>

		<!-- ── Creation: guided stepper ── -->
		<v-stepper v-if="!editMode" v-model="step" elevation="0" class="form-stepper">
			<v-stepper-header>
				<v-stepper-item :value="1" :complete="step > 1">{{ $t("wizard.basic.title") }}</v-stepper-item>
				<v-divider />
				<v-stepper-item :value="2" :complete="step > 2">{{ $t("experiences.ratings") }}</v-stepper-item>
				<v-divider />
				<v-stepper-item :value="3" :complete="step > 3">{{ $t("experiences.content") }}</v-stepper-item>
				<v-divider />
				<v-stepper-item :value="4">{{ $t("wizard.review.title") }}</v-stepper-item>
			</v-stepper-header>

			<v-stepper-window>
				<v-stepper-window-item :value="1">
					<ExperienceBasicStep
						:experience="experience"
						:countryNamesTranslated="countryNamesTranslated"
						:universityNames="universityNames"
						:submitted="submitted"
						@update="Object.assign(experience, $event)"
					/>
				</v-stepper-window-item>

				<v-stepper-window-item :value="2">
					<ExperienceRatingsStep
						:ratings="experience.ratings"
						:pros="experience.pros"
						:cons="experience.cons"
						@update:ratings="experience.ratings = $event"
						@update:pros="experience.pros = $event"
						@update:cons="experience.cons = $event"
					/>
				</v-stepper-window-item>

				<v-stepper-window-item :value="3">
					<ExperienceContentStep
						:content="experience.content"
						:tips="experience.tips"
						:submitted="submitted"
						@update:content="experience.content = $event"
						@update:tips="experience.tips = $event"
					/>
				</v-stepper-window-item>

				<v-stepper-window-item :value="4">
					<ExperienceReviewStep
						:experience="experience"
						:translatedCountry="translatedCountry"
						:canSubmit="canSubmit"
					/>
				</v-stepper-window-item>
			</v-stepper-window>
		</v-stepper>

		<!-- ── Edit: flat scrollable form ── -->
		<div v-else class="flat-form">
			<ExperienceBasicStep
				:experience="experience"
				:countryNamesTranslated="countryNamesTranslated"
				:universityNames="universityNames"
				:submitted="submitted"
				@update="Object.assign(experience, $event)"
			/>
			<ExperienceRatingsStep
				:ratings="experience.ratings"
				:pros="experience.pros"
				:cons="experience.cons"
				@update:ratings="experience.ratings = $event"
				@update:pros="experience.pros = $event"
				@update:cons="experience.cons = $event"
			/>
			<ExperienceContentStep
				:content="experience.content"
				:tips="experience.tips"
				:submitted="submitted"
				@update:content="experience.content = $event"
				@update:tips="experience.tips = $event"
			/>
		</div>

		<!-- ── Navigation ── -->
		<v-divider />
		<div class="form-nav">
			<div class="nav-side">
				<v-btn v-if="!editMode && step > 1" variant="tonal" prepend-icon="mdi-chevron-left" @click="step--">
					{{ $t('wizard.courses.previous') }}
				</v-btn>
				<v-btn variant="tonal" color="error" @click="embedded ? $emit('cancelled') : $router.push({ name: 'Account' })">
					{{ $t('actions.cancel') }}
				</v-btn>
			</div>

			<div class="nav-side nav-side--right">
				<!-- Create mode: step navigation -->
				<template v-if="!editMode">
					<v-tooltip v-if="nextDisabled" location="top">
						<template #activator="{ props }">
							<v-icon v-bind="props" color="warning" size="18">mdi-alert-circle</v-icon>
						</template>
						{{ missingStepFieldsString }}
					</v-tooltip>
					<v-btn
						v-if="step < 4"
						variant="tonal"
						color="primary"
						append-icon="mdi-chevron-right"
						:disabled="nextDisabled"
						@click="step++"
					>{{ $t('wizard.basic.next') }}</v-btn>
					<v-btn
						v-else
						variant="tonal"
						color="primary"
						:disabled="!canSubmit"
						:loading="saving"
						@click="submitExperience"
					>{{ $t('experiences.submit') }}</v-btn>
				</template>
				<!-- Edit mode: save directly -->
				<template v-else>
					<v-tooltip v-if="!canSubmit" location="top">
						<template #activator="{ props }">
							<v-icon v-bind="props" color="warning" size="18">mdi-alert-circle</v-icon>
						</template>
						{{ missingStepFieldsString }}
					</v-tooltip>
					<v-btn
						variant="tonal"
						color="primary"
						:disabled="!canSubmit"
						:loading="saving"
						@click="submitExperience"
					>{{ $t('experiences.save') }}</v-btn>
				</template>
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { db, auth } from "../../js/firebaseConfig";
import { ref as dbRef, update } from "firebase/database";
import { getExchangesData } from "../../js/exchangesCache";
import { createExperience, updateExperience, getExperienceById } from "../../js/experiencesCache";
import universitiesData from "../../data/universities.json";
import { toast } from "vue3-toastify";
import { decryptId } from "../../js/urlCipher";

import ExperienceBasicStep from "./steps/ExperienceBasicStep.vue";
import ExperienceRatingsStep from "./steps/ExperienceRatingsStep.vue";
import ExperienceContentStep from "./steps/ExperienceContentStep.vue";
import ExperienceReviewStep from "./steps/ExperienceReviewStep.vue";

export default {
	components: { ExperienceBasicStep, ExperienceRatingsStep, ExperienceContentStep, ExperienceReviewStep },

	props: {
		propExperienceId: { type: String, default: null },
		embedded: { type: Boolean, default: false },
	},

	emits: ["saved", "cancelled"],

	data() {
		return {
			step: 1,
			submitted: false,
			saving: false,
			editExperienceId: null,
			universities: {},
			experience: {
				title: "",
				anonymous: false,
				homeUniversity: null,
				study: null,
				studyYear: null,
				university: null,
				country: null,
				numSemesters: null,
				year: null,
				semester: null,
				ratings: { overall: 0, academic: 0, social: 0, housing: 0, costOfLiving: 0 },
				pros: [""],
				cons: [""],
				content: "",
				tips: "",
			},
		};
	},

	computed: {
		...mapGetters(["user", "userData"]),

		editMode() { return !!this.editExperienceId; },

		countryNamesTranslated() {
			return Object.keys(this.universities || {}).map(country => ({
				key: country,
				name: this.$t(`countries.${country}`),
			}));
		},

		universityNames() {
			if (!this.experience.country) return [];
			return Object.keys(this.universities?.[this.experience.country] || {});
		},

		translatedCountry() {
			return this.experience.country ? this.$t(`countries.${this.experience.country}`) : "—";
		},

		filteredPros() { return this.experience.pros.filter(p => p.trim()); },
		filteredCons() { return this.experience.cons.filter(c => c.trim()); },

		canSubmit() {
			return !!this.experience.title && !!this.experience.content && this.experience.ratings.overall > 0;
		},

		nextDisabled() {
			if (this.step === 1) return !this.experience.title;
			if (this.step === 2) return !this.experience.ratings.overall;
			if (this.step === 3) return !this.experience.content;
			return false;
		},

		missingStepFieldsString() {
			const prefix = this.$t("myExchange.missingData") + " ";
			if (this.editMode) {
				const missing = [];
				if (!this.experience.title) missing.push(this.$t("experiences.title").toLowerCase());
				if (!this.experience.ratings.overall) missing.push(this.$t("experiences.overall").toLowerCase());
				if (!this.experience.content) missing.push(this.$t("experiences.content").toLowerCase());
				return missing.length ? prefix + missing.join(", ") : "";
			}
			if (this.step === 1 && !this.experience.title) return prefix + this.$t("experiences.title").toLowerCase();
			if (this.step === 2 && !this.experience.ratings.overall) return prefix + this.$t("experiences.overall").toLowerCase();
			if (this.step === 3 && !this.experience.content) return prefix + this.$t("experiences.content").toLowerCase();
			return "";
		},

		hasUnsavedChanges() { return !!(this.experience.title || this.experience.content); },
	},

	watch: {
		propExperienceId: {
			immediate: true,
			async handler(id) { if (id) await this.loadExistingExperience(id); },
		},
	},

	beforeRouteLeave(to, from, next) {
		if (this.embedded || !this.hasUnsavedChanges) { next(); return; }
		window.confirm(this.$t("myExchange.leaveWithUnsavedChanges")) ? next() : next(false);
	},

	async mounted() {
		this.universities = universitiesData.universities || {};

		if (!this.propExperienceId) {
			const token = this.$route?.params?.id;
			if (token) {
				try {
					const experienceId = await decryptId(token);
					await this.loadExistingExperience(experienceId);
				} catch {
					this.$router.replace({ name: "Experiences" });
				}
			} else {
				await this.prefillFromExchange();
			}
		}
	},

	methods: {
		async loadExistingExperience(experienceId) {
			try {
				const existing = await getExperienceById(experienceId);
				if (!existing || existing.authorId !== auth.currentUser?.uid) {
					if (!this.embedded) this.$router.replace({ name: "Experiences" });
					return;
				}
				this.editExperienceId = experienceId;
				this.experience.title = existing.title || "";
				this.experience.anonymous = existing.anonymous || false;
				this.experience.country = existing.country || null;
				this.experience.university = existing.university || null;
				this.experience.semester = existing.semester || null;
				this.experience.content = existing.content || "";
				this.experience.tips = existing.tips || "";
				this.experience.ratings = { ...{ overall: 0, academic: 0, social: 0, housing: 0, costOfLiving: 0 }, ...existing.ratings };
				this.experience.pros = existing.pros?.length ? [...existing.pros] : [""];
				this.experience.cons = existing.cons?.length ? [...existing.cons] : [""];

				// For shared fields, use the experience value if set, otherwise fall back to exchange
				const exchanges = await getExchangesData();
				const exchange = exchanges?.[auth.currentUser?.uid] || {};
				this.experience.homeUniversity = existing.homeUniversity || exchange.homeUniversity || null;
				this.experience.study = existing.study || exchange.study || null;
				this.experience.studyYear = existing.studyYear || exchange.studyYear || null;
				this.experience.numSemesters = existing.numSemesters ?? exchange.numSemesters ?? null;
				this.experience.year = existing.year || exchange.year || null;
				if (!this.experience.semester && exchange.numSemesters === 1) {
					const hasFall = exchange.courses?.["Høst"] && Object.keys(exchange.courses["Høst"]).length > 0;
					this.experience.semester = hasFall ? "Høst" : "Vår";
				}
			} catch {
				if (!this.embedded) this.$router.replace({ name: "Experiences" });
			}
		},

		async prefillFromExchange() {
			if (!auth.currentUser) return;
			const exchanges = await getExchangesData();
			const exchange = exchanges?.[auth.currentUser.uid];
			if (!exchange) return;
			this.experience.homeUniversity = exchange.homeUniversity || null;
			this.experience.study = exchange.study || null;
			this.experience.studyYear = exchange.studyYear || null;
			this.experience.university = exchange.university || null;
			this.experience.country = exchange.country || null;
			this.experience.numSemesters = exchange.numSemesters || null;
			this.experience.year = exchange.year || null;
			if (exchange.numSemesters === 1) {
				const hasFall = exchange.courses?.["Høst"] && Object.keys(exchange.courses["Høst"]).length > 0;
				this.experience.semester = hasFall ? "Høst" : "Vår";
			}
		},

		async submitExperience() {
			this.submitted = true;
			if (!this.canSubmit) return;
			this.saving = true;
			try {
				const experienceData = {
					authorId: auth.currentUser.uid,
					authorName: this.experience.anonymous ? "" : (this.userData?.displayName || auth.currentUser?.displayName || ""),
					anonymous: this.experience.anonymous,
					exchangeId: auth.currentUser.uid,
					homeUniversity: this.experience.homeUniversity,
					study: this.experience.study,
					studyYear: this.experience.studyYear,
					university: this.experience.university,
					country: this.experience.country,
					numSemesters: this.experience.numSemesters,
					year: this.experience.year ? Number(this.experience.year) : null,
					semester: this.experience.semester,
					title: this.experience.title.trim(),
					content: this.experience.content.trim(),
					ratings: { ...this.experience.ratings },
					pros: this.filteredPros,
					cons: this.filteredCons,
					tips: this.experience.tips.trim() || null,
				};

				if (this.editMode) {
					await updateExperience(this.editExperienceId, experienceData);
					toast.success(this.$t("notifications.experienceUpdated"));
				} else {
					await createExperience(experienceData);
					toast.success(this.$t("notifications.experienceCreated"));
				}

				await update(dbRef(db, `exchanges/${auth.currentUser.uid}`), {
					homeUniversity: this.experience.homeUniversity ?? null,
					study: this.experience.study ?? null,
					studyYear: this.experience.studyYear ?? null,
					year: this.experience.year ?? null,
					numSemesters: this.experience.numSemesters ?? null,
				}).catch(() => {});

				if (this.embedded) this.$emit("saved");
				else this.$router.push({ name: "Account", query: { tab: "experiences" } });
			} catch (error) {
				console.error("Error saving experience:", error);
				toast.error(this.$t("notifications.experienceError"));
			} finally {
				this.saving = false;
			}
		},
	},
};
</script>

<style scoped>
.form-root {
	display: flex;
	flex-direction: column;
}

.form-stepper :deep(.v-stepper__header) {
	box-shadow: none;
}

.form-stepper :deep(.v-stepper-window-item) {
	padding: 0;
}

.flat-form {
	display: flex;
	flex-direction: column;
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
