<template>
	<div class="form-root">
		<h2 v-if="!embedded" class="text-h5 font-weight-bold mb-1">
			{{ editMode ? $t("reports.editReport") : $t("reports.writeReport") }}
		</h2>
		<p v-if="!embedded" class="text-medium-emphasis mb-6">{{ $t("reports.info") }}</p>

		<!-- ── Creation: guided stepper ── -->
		<v-stepper v-if="!editMode" v-model="step" elevation="0" class="form-stepper">
			<v-stepper-header>
				<v-stepper-item :value="1" :complete="step > 1">{{ $t("wizard.basic.title") }}</v-stepper-item>
				<v-divider />
				<v-stepper-item :value="2" :complete="step > 2">{{ $t("reports.ratings") }}</v-stepper-item>
				<v-divider />
				<v-stepper-item :value="3" :complete="step > 3">{{ $t("reports.content") }}</v-stepper-item>
				<v-divider />
				<v-stepper-item :value="4">{{ $t("wizard.review.title") }}</v-stepper-item>
			</v-stepper-header>

			<v-stepper-window>
				<v-stepper-window-item :value="1">
					<ReportBasicStep
						:report="report"
						:countryNamesTranslated="countryNamesTranslated"
						:universityNames="universityNames"
						:submitted="submitted"
						@update="Object.assign(report, $event)"
					/>
				</v-stepper-window-item>

				<v-stepper-window-item :value="2">
					<ReportRatingsStep
						:ratings="report.ratings"
						:pros="report.pros"
						:cons="report.cons"
						@update:ratings="report.ratings = $event"
						@update:pros="report.pros = $event"
						@update:cons="report.cons = $event"
					/>
				</v-stepper-window-item>

				<v-stepper-window-item :value="3">
					<ReportContentStep
						:content="report.content"
						:tips="report.tips"
						:submitted="submitted"
						@update:content="report.content = $event"
						@update:tips="report.tips = $event"
					/>
				</v-stepper-window-item>

				<v-stepper-window-item :value="4">
					<ReportReviewStep
						:report="report"
						:translatedCountry="translatedCountry"
						:canSubmit="canSubmit"
					/>
				</v-stepper-window-item>
			</v-stepper-window>
		</v-stepper>

		<!-- ── Edit: flat scrollable form ── -->
		<div v-else class="flat-form">
			<ReportBasicStep
				:report="report"
				:countryNamesTranslated="countryNamesTranslated"
				:universityNames="universityNames"
				:submitted="submitted"
				@update="Object.assign(report, $event)"
			/>
			<ReportRatingsStep
				:ratings="report.ratings"
				:pros="report.pros"
				:cons="report.cons"
				@update:ratings="report.ratings = $event"
				@update:pros="report.pros = $event"
				@update:cons="report.cons = $event"
			/>
			<ReportContentStep
				:content="report.content"
				:tips="report.tips"
				:submitted="submitted"
				@update:content="report.content = $event"
				@update:tips="report.tips = $event"
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
						@click="submitReport"
					>{{ $t('reports.submit') }}</v-btn>
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
						@click="submitReport"
					>{{ $t('reports.save') }}</v-btn>
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
import { createReport, updateReport, getReportById } from "../../js/reportsCache";
import universitiesData from "../../data/universities.json";
import { toast } from "vue3-toastify";
import { decryptId } from "../../js/urlCipher";

import ReportBasicStep from "./steps/ReportBasicStep.vue";
import ReportRatingsStep from "./steps/ReportRatingsStep.vue";
import ReportContentStep from "./steps/ReportContentStep.vue";
import ReportReviewStep from "./steps/ReportReviewStep.vue";

export default {
	components: { ReportBasicStep, ReportRatingsStep, ReportContentStep, ReportReviewStep },

	props: {
		propReportId: { type: String, default: null },
		embedded: { type: Boolean, default: false },
	},

	emits: ["saved", "cancelled"],

	data() {
		return {
			step: 1,
			submitted: false,
			saving: false,
			editReportId: null,
			universities: {},
			report: {
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

		editMode() { return !!this.editReportId; },

		countryNamesTranslated() {
			return Object.keys(this.universities || {}).map(country => ({
				key: country,
				name: this.$t(`countries.${country}`),
			}));
		},

		universityNames() {
			if (!this.report.country) return [];
			return Object.keys(this.universities?.[this.report.country] || {});
		},

		translatedCountry() {
			return this.report.country ? this.$t(`countries.${this.report.country}`) : "—";
		},

		filteredPros() { return this.report.pros.filter(p => p.trim()); },
		filteredCons() { return this.report.cons.filter(c => c.trim()); },

		canSubmit() {
			return !!this.report.title && !!this.report.content && this.report.ratings.overall > 0;
		},

		nextDisabled() {
			if (this.step === 1) return !this.report.title;
			if (this.step === 2) return !this.report.ratings.overall;
			if (this.step === 3) return !this.report.content;
			return false;
		},

		missingStepFieldsString() {
			const prefix = this.$t("myExchange.missingData") + " ";
			if (this.editMode) {
				const missing = [];
				if (!this.report.title) missing.push(this.$t("reports.title").toLowerCase());
				if (!this.report.ratings.overall) missing.push(this.$t("reports.overall").toLowerCase());
				if (!this.report.content) missing.push(this.$t("reports.content").toLowerCase());
				return missing.length ? prefix + missing.join(", ") : "";
			}
			if (this.step === 1 && !this.report.title) return prefix + this.$t("reports.title").toLowerCase();
			if (this.step === 2 && !this.report.ratings.overall) return prefix + this.$t("reports.overall").toLowerCase();
			if (this.step === 3 && !this.report.content) return prefix + this.$t("reports.content").toLowerCase();
			return "";
		},

		hasUnsavedChanges() { return !!(this.report.title || this.report.content); },
	},

	watch: {
		propReportId: {
			immediate: true,
			async handler(id) { if (id) await this.loadExistingReport(id); },
		},
	},

	beforeRouteLeave(to, from, next) {
		if (this.embedded || !this.hasUnsavedChanges) { next(); return; }
		window.confirm(this.$t("myExchange.leaveWithUnsavedChanges")) ? next() : next(false);
	},

	async mounted() {
		this.universities = universitiesData.universities || {};

		if (!this.propReportId) {
			const token = this.$route?.params?.id;
			if (token) {
				try {
					const reportId = await decryptId(token);
					await this.loadExistingReport(reportId);
				} catch {
					this.$router.replace({ name: "Reports" });
				}
			} else {
				await this.prefillFromExchange();
			}
		}
	},

	methods: {
		async loadExistingReport(reportId) {
			try {
				const existing = await getReportById(reportId);
				if (!existing || existing.authorId !== auth.currentUser?.uid) {
					if (!this.embedded) this.$router.replace({ name: "Reports" });
					return;
				}
				this.editReportId = reportId;
				this.report.title = existing.title || "";
				this.report.anonymous = existing.anonymous || false;
				this.report.country = existing.country || null;
				this.report.university = existing.university || null;
				this.report.semester = existing.semester || null;
				this.report.content = existing.content || "";
				this.report.tips = existing.tips || "";
				this.report.ratings = { ...{ overall: 0, academic: 0, social: 0, housing: 0, costOfLiving: 0 }, ...existing.ratings };
				this.report.pros = existing.pros?.length ? [...existing.pros] : [""];
				this.report.cons = existing.cons?.length ? [...existing.cons] : [""];

				// For shared fields, use the report value if set, otherwise fall back to exchange
				const exchanges = await getExchangesData();
				const exchange = exchanges?.[auth.currentUser?.uid] || {};
				this.report.homeUniversity = existing.homeUniversity || exchange.homeUniversity || null;
				this.report.study = existing.study || exchange.study || null;
				this.report.studyYear = existing.studyYear || exchange.studyYear || null;
				this.report.numSemesters = existing.numSemesters ?? exchange.numSemesters ?? null;
				this.report.year = existing.year || exchange.year || null;
				if (!this.report.semester && exchange.numSemesters === 1) {
					const hasFall = exchange.courses?.["Høst"] && Object.keys(exchange.courses["Høst"]).length > 0;
					this.report.semester = hasFall ? "Høst" : "Vår";
				}
			} catch {
				if (!this.embedded) this.$router.replace({ name: "Reports" });
			}
		},

		async prefillFromExchange() {
			if (!auth.currentUser) return;
			const exchanges = await getExchangesData();
			const exchange = exchanges?.[auth.currentUser.uid];
			if (!exchange) return;
			this.report.homeUniversity = exchange.homeUniversity || null;
			this.report.study = exchange.study || null;
			this.report.studyYear = exchange.studyYear || null;
			this.report.university = exchange.university || null;
			this.report.country = exchange.country || null;
			this.report.numSemesters = exchange.numSemesters || null;
			this.report.year = exchange.year || null;
			if (exchange.numSemesters === 1) {
				const hasFall = exchange.courses?.["Høst"] && Object.keys(exchange.courses["Høst"]).length > 0;
				this.report.semester = hasFall ? "Høst" : "Vår";
			}
		},

		async submitReport() {
			this.submitted = true;
			if (!this.canSubmit) return;
			this.saving = true;
			try {
				const reportData = {
					authorId: auth.currentUser.uid,
					authorName: this.report.anonymous ? "" : (this.userData?.displayName || auth.currentUser?.displayName || ""),
					anonymous: this.report.anonymous,
					exchangeId: auth.currentUser.uid,
					homeUniversity: this.report.homeUniversity,
					study: this.report.study,
					studyYear: this.report.studyYear,
					university: this.report.university,
					country: this.report.country,
					numSemesters: this.report.numSemesters,
					year: this.report.year ? Number(this.report.year) : null,
					semester: this.report.semester,
					title: this.report.title.trim(),
					content: this.report.content.trim(),
					ratings: { ...this.report.ratings },
					pros: this.filteredPros,
					cons: this.filteredCons,
					tips: this.report.tips.trim() || null,
				};

				if (this.editMode) {
					await updateReport(this.editReportId, reportData);
					toast.success(this.$t("notifications.reportUpdated"));
				} else {
					await createReport(reportData);
					toast.success(this.$t("notifications.reportCreated"));
				}

				await update(dbRef(db, `exchanges/${auth.currentUser.uid}`), {
					homeUniversity: this.report.homeUniversity ?? null,
					study: this.report.study ?? null,
					studyYear: this.report.studyYear ?? null,
					year: this.report.year ?? null,
					numSemesters: this.report.numSemesters ?? null,
				}).catch(() => {});

				if (this.embedded) this.$emit("saved");
				else this.$router.push({ name: "Account", query: { tab: "reports" } });
			} catch (error) {
				console.error("Error saving report:", error);
				toast.error(this.$t("notifications.reportError"));
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
