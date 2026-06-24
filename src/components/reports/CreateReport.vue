<template>
	<div>
		<h2>{{ $t("reports.writeReport") }}</h2>
		<p class="page-summary">{{ $t("reports.info") }}</p>
		<br />

		<v-stepper v-model="step" elevation="1">
			<v-stepper-header>
				<v-stepper-item :value="1" :complete="step > 1">
					{{ $t("wizard.basic.title") }}
				</v-stepper-item>

				<v-divider />

				<v-stepper-item :value="2" :complete="step > 2">
					{{ $t("reports.ratings") }}
				</v-stepper-item>

				<v-divider />

				<v-stepper-item :value="3" :complete="step > 3">
					{{ $t("reports.content") }}
				</v-stepper-item>

				<v-divider />

				<v-stepper-item :value="4">
					{{ $t("wizard.review.title") }}
				</v-stepper-item>
			</v-stepper-header>

			<v-stepper-window>
				<!-- Step 1: Basic Info -->
				<v-stepper-window-item :value="1">
					<v-text-field v-model="report.title" :label="$t('reports.title')"
						:error-messages="submitted && !report.title ? $t('reports.titleRequired') : ''" />

					<v-checkbox v-model="report.anonymous" :label="$t('reports.anonymous')" hide-details class="mb-2" />

					<v-row>
						<v-col cols="12" md="6">
							<v-autocomplete v-model="report.country" :items="countryNamesTranslated"
								item-title="name" item-value="key" :label="$t('database.country')" clearable />
						</v-col>
						<v-col cols="12" md="6">
							<v-autocomplete v-model="report.university" :items="universityNames"
								:label="$t('database.university')" :disabled="!report.country" clearable />
						</v-col>
					</v-row>

					<v-row>
						<v-col cols="12" md="4">
							<v-autocomplete v-model="report.study" :items="studyNames"
								:label="$t('database.study')" clearable />
						</v-col>
						<v-col cols="12" md="4">
							<v-text-field v-model="report.year" type="number"
								:label="$t('database.year')" />
						</v-col>
						<v-col cols="12" md="4">
							<v-select v-model="report.semester" :items="['Høst', 'Vår']"
								:label="$t('database.semester')" clearable />
						</v-col>
					</v-row>
				</v-stepper-window-item>

				<!-- Step 2: Ratings & Pros/Cons -->
				<v-stepper-window-item :value="2">
					<div v-for="key in ratingKeys" :key="key" class="rating-row">
						<span class="rating-label">{{ $t(`reports.${key}`) }}</span>
						<v-rating v-model="report.ratings[key]" color="amber" hover length="5" size="32" />
					</div>

					<v-divider class="my-4" />

					<!-- Pros -->
					<div class="field-title">{{ $t("reports.pros") }}</div>
					<div v-for="(pro, i) in report.pros" :key="'pro-' + i" class="d-flex align-center ga-2 mb-2">
						<v-text-field v-model="report.pros[i]" density="compact" hide-details />
						<v-btn icon size="small" variant="text" @click="report.pros.splice(i, 1)">
							<v-icon>mdi-close</v-icon>
						</v-btn>
					</div>
					<v-btn variant="text" size="small" @click="report.pros.push('')" prepend-icon="mdi-plus">
						{{ $t("reports.addPro") }}
					</v-btn>

					<v-divider class="my-4" />

					<!-- Cons -->
					<div class="field-title">{{ $t("reports.cons") }}</div>
					<div v-for="(con, i) in report.cons" :key="'con-' + i" class="d-flex align-center ga-2 mb-2">
						<v-text-field v-model="report.cons[i]" density="compact" hide-details />
						<v-btn icon size="small" variant="text" @click="report.cons.splice(i, 1)">
							<v-icon>mdi-close</v-icon>
						</v-btn>
					</div>
					<v-btn variant="text" size="small" @click="report.cons.push('')" prepend-icon="mdi-plus">
						{{ $t("reports.addCon") }}
					</v-btn>
				</v-stepper-window-item>

				<!-- Step 3: Content -->
				<v-stepper-window-item :value="3">
					<v-textarea v-model="report.content" :label="$t('reports.content')" rows="8"
						:error-messages="submitted && !report.content ? $t('reports.contentRequired') : ''" />

					<v-textarea v-model="report.tips" :label="$t('reports.tips')" rows="4" />
				</v-stepper-window-item>

				<!-- Step 4: Review -->
				<v-stepper-window-item :value="4">
					<v-card variant="tonal" rounded="xl" class="pa-5">
						<h3>{{ report.title || '—' }}</h3>

						<div class="text-caption text-medium-emphasis mt-1 mb-3">
							{{ report.university || '—' }}, {{ translatedCountry }}
							· {{ report.study || '—' }}
							· {{ report.year || '—' }} {{ report.semester || '' }}
							<span v-if="report.anonymous"> · {{ $t("reports.anonymousLabel") }}</span>
						</div>

						<div v-if="hasRatings" class="mb-3">
							<div v-for="key in ratingKeys" :key="'review-' + key">
								<span class="text-body-2 font-weight-medium">{{ $t(`reports.${key}`) }}:</span>
								<v-rating :model-value="report.ratings[key]" color="amber" readonly
									density="compact" size="18" class="d-inline-flex ml-1" />
							</div>
						</div>

						<div v-if="filteredPros.length" class="mb-2">
							<div class="field-title">{{ $t("reports.pros") }}</div>
							<ul>
								<li v-for="(pro, i) in filteredPros" :key="i">{{ pro }}</li>
							</ul>
						</div>

						<div v-if="filteredCons.length" class="mb-2">
							<div class="field-title">{{ $t("reports.cons") }}</div>
							<ul>
								<li v-for="(con, i) in filteredCons" :key="i">{{ con }}</li>
							</ul>
						</div>

						<div v-if="report.content" class="mb-2">
							<div class="field-title">{{ $t("reports.content") }}</div>
							<p class="text-body-2" style="white-space: pre-wrap;">{{ report.content }}</p>
						</div>

						<div v-if="report.tips">
							<div class="field-title">{{ $t("reports.tips") }}</div>
							<p class="text-body-2" style="white-space: pre-wrap;">{{ report.tips }}</p>
						</div>
					</v-card>

					<div v-if="!canSubmit" class="text-error text-caption mt-3">
						<div v-if="!report.title">{{ $t("reports.titleRequired") }}</div>
						<div v-if="!report.content">{{ $t("reports.contentRequired") }}</div>
						<div v-if="!report.ratings.overall">{{ $t("reports.ratingRequired") }}</div>
					</div>
				</v-stepper-window-item>
			</v-stepper-window>
		</v-stepper>

		<v-divider class="my-4" />

		<v-row class="px-4 pb-4" align="center" no-gutters>
			<v-col cols="12" sm="4" class="d-flex justify-center">
				<v-btn v-if="step > 1" class="btn btn-third" @click="step--">
					{{ $t("wizard.courses.previous") }}
				</v-btn>
			</v-col>

			<v-spacer />

			<v-col cols="12" sm="4" class="d-flex justify-center">
				<v-btn class="btn btn-danger" :to="{ name: 'EditExchange' }">
					{{ $t("actions.cancel") }}
				</v-btn>
			</v-col>

			<v-spacer />

			<v-col cols="12" sm="4" class="d-flex justify-center">
				<v-btn v-if="step < 4" class="btn btn-primary" @click="step++">
					{{ $t("wizard.basic.next") }}
				</v-btn>
				<v-btn v-else class="btn btn-primary" :disabled="!canSubmit" :loading="saving"
					@click="submitReport">
					{{ $t("reports.submit") }}
				</v-btn>
			</v-col>
		</v-row>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { auth } from "../../js/firebaseConfig";
import { getExchangesData } from "../../js/exchangesCache";
import { createReport } from "../../js/reportsCache";
import universitiesData from "../../data/universities.json";
import { toast } from "vue3-toastify";

export default {
	data() {
		return {
			step: 1,
			submitted: false,
			saving: false,
			universities: {},
			report: {
				title: "",
				anonymous: false,
				university: null,
				country: null,
				study: null,
				year: null,
				semester: null,
				ratings: {
					overall: 0,
					academic: 0,
					social: 0,
					housing: 0,
					costOfLiving: 0,
				},
				pros: [""],
				cons: [""],
				content: "",
				tips: "",
			},
			ratingKeys: ["overall", "academic", "social", "housing", "costOfLiving"],
		};
	},

	computed: {
		...mapGetters(["user"]),

		countryNamesTranslated() {
			return Object.keys(this.universities || {}).map((country) => ({
				key: country,
				name: this.$t(`countries.${country}`),
			}));
		},

		universityNames() {
			if (!this.report.country) return [];
			return Object.keys(this.universities?.[this.report.country] || {});
		},

		studyNames() {
			return Object.keys(universitiesData.studies?.studies || {});
		},

		translatedCountry() {
			if (!this.report.country) return "—";
			return this.$t(`countries.${this.report.country}`);
		},

		filteredPros() {
			return this.report.pros.filter((p) => p.trim());
		},

		filteredCons() {
			return this.report.cons.filter((c) => c.trim());
		},

		hasRatings() {
			return this.ratingKeys.some((k) => this.report.ratings[k] > 0);
		},

		canSubmit() {
			return !!this.report.title && !!this.report.content && this.report.ratings.overall > 0;
		},

		hasUnsavedChanges() {
			return !!(this.report.title || this.report.content);
		},
	},

	watch: {
		"report.country"(newVal, oldVal) {
			if (oldVal && newVal !== oldVal) {
				this.report.university = null;
			}
		},
	},

	beforeRouteLeave(to, from, next) {
		if (!this.hasUnsavedChanges) {
			next();
			return;
		}
		const answer = window.confirm(this.$t("myExchange.leaveWithUnsavedChanges"));
		answer ? next() : next(false);
	},

	async mounted() {
		this.universities = universitiesData.universities || {};
		await this.prefillFromExchange();
	},

	methods: {
		async prefillFromExchange() {
			if (!auth.currentUser) return;

			const exchanges = await getExchangesData();
			const exchange = exchanges?.[auth.currentUser.uid];
			if (!exchange) return;

			this.report.university = exchange.university || null;
			this.report.country = exchange.country || null;
			this.report.study = exchange.study || null;
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
					authorName: this.report.anonymous ? "" : (this.user?.displayName || auth.currentUser.displayName || ""),
					anonymous: this.report.anonymous,
					exchangeId: auth.currentUser.uid,
					university: this.report.university,
					country: this.report.country,
					study: this.report.study,
					year: this.report.year ? Number(this.report.year) : null,
					semester: this.report.semester,
					title: this.report.title.trim(),
					content: this.report.content.trim(),
					ratings: { ...this.report.ratings },
					pros: this.filteredPros,
					cons: this.filteredCons,
					tips: this.report.tips.trim() || null,
				};

				await createReport(reportData);
				toast.success(this.$t("notifications.reportCreated"));
				this.$router.push({ name: "EditExchange" });
			} catch (error) {
				console.error("Error creating report:", error);
				toast.error(this.$t("notifications.reportError"));
			} finally {
				this.saving = false;
			}
		},
	},
};
</script>

<style scoped>
.rating-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 0;
}

.rating-label {
	font-weight: 600;
	font-size: 0.95rem;
	min-width: 140px;
}

.field-title {
	font-size: 0.85rem;
	font-weight: 700;
	color: rgba(0, 0, 0, 0.72);
	margin-bottom: 6px;
}

@media (max-width: 600px) {
	.rating-row {
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
	}

	.rating-label {
		min-width: unset;
		font-size: 0.88rem;
	}
}
</style>
