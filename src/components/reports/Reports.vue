<template>
	<div>
		<h2>{{ $t("reports.pageHeader") }}</h2>
		<p class="page-summary">{{ $t("reports.info") }}</p>

		<br />

		<!-- Search Summary -->
		<div class="search-summary">
			{{ $t("reports.reportCount", { count: filteredReports.length }) }}
		</div>

		<!-- Search Field with Chips -->
		<div class="search-wrap">
			<div class="search-chip-container" :class="{ focused: searchFocused }" @click="$refs.searchInput?.focus()">
				<v-icon class="search-icon">mdi-magnify</v-icon>
				<v-chip v-for="(chip, index) in searchChips" :key="'chip-' + index" closable color="primary"
					variant="tonal" size="small" @click:close="removeChip(index)">{{ chip }}</v-chip>
				<div class="search-input-wrap">
					<input ref="searchInput" v-model="searchInput"
						:placeholder="searchChips.length === 0 ? $t('exchanges.search') : ''"
						class="chip-search-input"
						@keydown.enter.prevent="onSearchEnter"
						@keydown.down.prevent="onArrowDown"
						@keydown.up.prevent="onArrowUp"
						@keydown.delete="onBackspace"
						@focus="searchFocused = true"
						@blur="onSearchBlur" />
					<div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
						<div v-for="(suggestion, i) in filteredSuggestions" :key="i" class="suggestion-item"
							:class="{ highlighted: i === highlightedIndex }"
							@mousedown.prevent="selectSuggestion(suggestion)">
							<v-icon size="small" class="suggestion-icon">{{ suggestion.icon }}</v-icon>
							<span class="suggestion-text">{{ suggestion.label }}</span>
							<span class="suggestion-type">{{ suggestion.type }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<br />

		<!-- Sort -->
		<div class="d-flex justify-end mb-4">
			<v-select v-model="sortBy" :items="sortOptions" item-title="label" item-value="value"
				:label="$t('reports.sortBy')" density="compact" hide-details style="max-width: 200px" />
		</div>

		<!-- Loading -->
		<div v-if="loading" class="d-flex justify-center py-8">
			<v-progress-circular indeterminate color="primary" />
		</div>

		<!-- Empty state -->
		<div v-else-if="filteredReports.length === 0" class="text-center py-8">
			<v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
			<p class="text-medium-emphasis mt-2">
				{{ searchChips.length > 0
					? $t("reports.noReportsForFilter")
					: $t("reports.noReports") }}
			</p>
		</div>

		<!-- Report Cards -->
		<div v-else class="reports-grid">
			<v-card v-for="report in paginatedReports" :key="report.id" class="report-card"
				variant="outlined" rounded="lg" @click="goToReport(report.id)">
				<v-card-text>
					<div class="d-flex align-center ga-2 mb-2">
						<img v-if="report.country" :src="getFlagUrl(report.country)" alt="" width="24" height="18"
							class="flag-img" />
						<span class="text-caption text-medium-emphasis">
							{{ report.university || '—' }}
						</span>
					</div>

					<h3 class="report-title">{{ report.title }}</h3>

					<p class="report-excerpt">{{ getExcerpt(report.content) }}</p>

					<div class="d-flex align-center ga-2 mt-2">
						<v-rating :model-value="report.ratings?.overall || 0" color="amber" readonly
							density="compact" size="16" />
						<span class="text-caption text-medium-emphasis">
							{{ report.ratings?.overall || 0 }}/5
						</span>
					</div>

					<div class="d-flex align-center justify-space-between mt-3">
						<span class="text-caption text-medium-emphasis">
							{{ $t("reports.writtenBy") }} {{ report.anonymous ? $t("reports.anonymousLabel") : (report.authorName || '—') }}
						</span>
						<span class="text-caption text-medium-emphasis">
							{{ formatDate(report.createdAt) }}
						</span>
					</div>
				</v-card-text>
			</v-card>
		</div>

		<!-- Pagination -->
		<div v-if="totalPages > 1" class="d-flex justify-center mt-6">
			<v-pagination v-model="page" :length="totalPages" rounded="circle" />
		</div>

		<!-- FAB for creating a report -->
		<v-btn v-if="isAuthenticated" class="fab-btn" icon size="large" color="primary"
			:to="{ name: 'CreateReport' }">
			<v-icon>mdi-plus</v-icon>
		</v-btn>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import { getReportsData } from "../../js/reportsCache";
import universitiesData from "../../data/universities.json";
import countriesInformation from "../../data/countriesInformation.json";
import placeholderFlag from "../../assets/images/placeholder_flag.png";

const ITEMS_PER_PAGE = 12;

export default {
	data() {
		return {
			loading: true,
			reports: {},
			searchChips: [],
			searchInput: "",
			searchFocused: false,
			highlightedIndex: -1,
			sortBy: "newest",
			page: 1,
			universities: universitiesData.universities || {},
			countriesInfo: countriesInformation,
		};
	},

	computed: {
		...mapGetters(["user", "isAuthenticated"]),

		locale() {
			return this.$i18n.locale;
		},

		sortOptions() {
			return [
				{ label: this.$t("reports.newest"), value: "newest" },
				{ label: this.$t("reports.oldest"), value: "oldest" },
				{ label: this.$t("reports.highestRated"), value: "highestRated" },
			];
		},

		reportList() {
			return Object.entries(this.reports).map(([id, report]) => ({ id, ...report }));
		},

		allSuggestions() {
			const suggestions = [];
			const added = new Set();

			for (const report of this.reportList) {
				if (report.country && !added.has(report.country)) {
					added.add(report.country);
					const translated = this.$t(`countries.${report.country}`);
					suggestions.push({ label: translated, type: this.$t("database.country"), icon: "mdi-earth" });
				}
			}

			const universityNames = new Set();
			for (const report of this.reportList) {
				if (report.university) {
					const shortName = report.university.split('(')[0].trim();
					if (!universityNames.has(shortName)) {
						universityNames.add(shortName);
						suggestions.push({ label: shortName, type: this.$t("database.university"), icon: "mdi-school" });
					}
				}
			}

			const studies = new Set();
			for (const report of this.reportList) {
				if (report.study && !studies.has(report.study)) {
					studies.add(report.study);
					suggestions.push({ label: report.study, type: this.$t("database.study"), icon: "mdi-book-open-variant" });
				}
			}

			return suggestions;
		},

		filteredSuggestions() {
			const input = this.searchInput.trim().toLowerCase();
			if (!input) return [];
			return this.allSuggestions
				.filter(s => s.label.toLowerCase().includes(input) && !this.searchChips.includes(s.label))
				.slice(0, 8);
		},

		showSuggestions() {
			return this.searchFocused && this.searchInput.trim().length > 0;
		},

		filteredReports() {
			let list = this.reportList;

			if (this.searchChips.length > 0) {
				list = list.filter(report => {
					return this.searchChips.every(chip => {
						const chipLower = chip.toLowerCase();
						const fields = [
							report.title,
							report.content,
							report.university,
							report.country,
							this.$t(`countries.${report.country}`),
							report.study,
							report.authorName,
							report.year != null ? String(report.year) : "",
						];
						return fields.some(f => (f || "").toLowerCase().includes(chipLower));
					});
				});
			}

			if (this.sortBy === "newest") {
				list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
			} else if (this.sortBy === "oldest") {
				list = [...list].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
			} else if (this.sortBy === "highestRated") {
				list = [...list].sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0));
			}

			return list;
		},

		totalPages() {
			return Math.ceil(this.filteredReports.length / ITEMS_PER_PAGE);
		},

		paginatedReports() {
			const start = (this.page - 1) * ITEMS_PER_PAGE;
			return this.filteredReports.slice(start, start + ITEMS_PER_PAGE);
		},
	},

	watch: {
		searchInput() { this.highlightedIndex = -1; },
		searchChips() { this.page = 1; },
		sortBy() { this.page = 1; },
	},

	async mounted() {
		try {
			this.reports = await getReportsData();
		} catch (error) {
			console.error("Error loading reports:", error);
		} finally {
			this.loading = false;
		}
	},

	methods: {
		getExcerpt(content, maxLength = 150) {
			if (!content) return "";
			if (content.length <= maxLength) return content;
			return content.substring(0, maxLength).trimEnd() + "…";
		},

		formatDate(timestamp) {
			if (!timestamp) return "";
			return new Date(timestamp).toLocaleDateString();
		},

		getFlagUrl(country) {
			const flagBaseUrl = "https://flagcdn.com/128x96/";
			const countryCode = this.getCountryCode(country).toLowerCase();
			if (countryCode === "unknown") return placeholderFlag;
			return `${flagBaseUrl}${countryCode}.png`;
		},

		getCountryCode(country) {
			if (this.locale === "en") {
				return this.countriesInfo.countryCodes.en[country] || "unknown";
			}
			return this.countriesInfo.countryCodes.no[country] || "unknown";
		},

		goToReport(reportId) {
			this.$router.push({ name: "ReportDetail", params: { id: reportId } });
		},

		removeChip(index) {
			this.searchChips.splice(index, 1);
		},

		onSearchEnter() {
			if (this.highlightedIndex >= 0 && this.filteredSuggestions[this.highlightedIndex]) {
				this.selectSuggestion(this.filteredSuggestions[this.highlightedIndex]);
				return;
			}
			const input = this.searchInput.trim();
			if (input && !this.searchChips.includes(input)) {
				this.searchChips.push(input);
				this.searchInput = "";
				this.highlightedIndex = -1;
			}
		},

		selectSuggestion(suggestion) {
			if (!this.searchChips.includes(suggestion.label)) {
				this.searchChips.push(suggestion.label);
			}
			this.searchInput = "";
			this.highlightedIndex = -1;
			this.$nextTick(() => {
				this.$refs.searchInput?.focus();
			});
		},

		onArrowDown() {
			if (this.filteredSuggestions.length > 0) {
				this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredSuggestions.length - 1);
			}
		},

		onArrowUp() {
			if (this.highlightedIndex > 0) {
				this.highlightedIndex--;
			}
		},

		onBackspace() {
			if (this.searchInput === "" && this.searchChips.length > 0) {
				this.searchChips.pop();
			}
		},

		onSearchBlur() {
			setTimeout(() => {
				this.searchFocused = false;
			}, 150);
		},
	},
};
</script>

<style scoped>
.reports-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 16px;
}

.report-card {
	cursor: pointer;
	transition: box-shadow 0.15s ease, transform 0.1s ease;
}

.report-card:hover {
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	transform: translateY(-2px);
}

.report-title {
	font-size: 1.05rem;
	font-weight: 700;
	line-height: 1.3;
	margin-bottom: 6px;
}

.report-excerpt {
	font-size: 0.9rem;
	line-height: 1.5;
	color: rgba(0, 0, 0, 0.65);
	margin: 0;
}

.flag-img {
	border-radius: 2px;
	object-fit: cover;
}

.fab-btn {
	position: fixed;
	bottom: 24px;
	right: 24px;
	z-index: 100;
}

@media (max-width: 600px) {
	.reports-grid {
		grid-template-columns: 1fr;
	}

	.fab-btn {
		bottom: 80px;
		right: 16px;
	}
}
</style>
