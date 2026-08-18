<template>
	<div>
		<h2>{{ $t("faq.pageHeader") }}</h2>
		<p class="page-summary">{{ $t("faq.info") }}</p>

		<br />

		<div class="search-summary">
			{{ $t("faq.searchInfo", { n: filteredFaqs.length, word: questionWord }) }}
		</div>

		<div class="search-wrap">
			<div class="search-chip-container" :class="{ focused: searchFocused }" @click="$refs.searchInput?.focus()">
				<v-icon class="search-icon">mdi-magnify</v-icon>
				<div class="search-input-wrap">
					<input ref="searchInput" v-model="searchQuery" :placeholder="$t('faq.search')" class="chip-search-input"
						@focus="searchFocused = true" @blur="searchFocused = false" />
				</div>
				<v-icon v-if="searchQuery" class="search-clear" @click.stop="searchQuery = ''">mdi-close</v-icon>
			</div>
		</div>

		<!-- Loading state -->
		<div v-if="loading" class="text-center py-8">
			<v-progress-circular indeterminate color="primary" />
		</div>

		<!-- Empty state -->
		<div v-else-if="!filteredFaqs.length" class="text-center py-8">
			<v-icon size="64" color="grey">mdi-help-circle-outline</v-icon>
			<p class="search-summary mt-2">{{ $t("faq.noResults") }}</p>
		</div>

		<!-- FAQ Cards -->
		<div v-else class="faq-grid">
			<v-card v-for="faq in filteredFaqs" :key="faq.id" class="faq-card" rounded="lg"
				@click="toggleExpand(faq.id)">
				<v-card-text>
					<div class="d-flex align-center justify-space-between ga-2">
						<h3 class="faq-question">{{ faq.question }}</h3>
						<v-icon class="faq-chevron">
							{{ expanded.includes(faq.id) ? "mdi-chevron-up" : "mdi-chevron-down" }}
						</v-icon>
					</div>
					<v-expand-transition>
						<p v-show="expanded.includes(faq.id)" class="faq-answer">{{ faq.answer }}</p>
					</v-expand-transition>
				</v-card-text>
			</v-card>
		</div>
	</div>
</template>

<script>
import { db } from "../../js/firebaseConfig.js";
import { get, child, ref as dbRef } from "firebase/database";

export default {
	data() {
		return {
			searchQuery: "",
			searchFocused: false,
			expanded: [],
			faqs: [],
			loading: true,
		};
	},
	computed: {
		localizedFaqs() {
			const locale = this.$i18n.locale;
			return this.faqs.map((faq) => ({
				id: faq.id,
				question: (locale === "en" ? faq.questionEn : faq.questionNo) || faq.questionNo || faq.questionEn,
				answer: (locale === "en" ? faq.answerEn : faq.answerNo) || faq.answerNo || faq.answerEn,
			}));
		},
		filteredFaqs() {
			if (!this.searchQuery) return this.localizedFaqs;
			const query = this.searchQuery.toLowerCase();
			return this.localizedFaqs.filter(
				(faq) => faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
			);
		},
		questionWord() {
			return this.filteredFaqs.length === 1 ? this.$t("faq.question_one") : this.$t("faq.question_other");
		},
	},
	methods: {
		toggleExpand(faqId) {
			const index = this.expanded.indexOf(faqId);
			if (index >= 0) {
				this.expanded.splice(index, 1);
			} else {
				this.expanded.push(faqId);
			}
		},
		async fetchFaqs() {
			try {
				const dbRefInstance = dbRef(db);
				const snapshot = await get(child(dbRefInstance, "faq"));
				if (snapshot.exists()) {
					const data = snapshot.val();
					this.faqs = Object.keys(data).map((key) => ({
						id: key,
						questionNo: data[key].questionNo,
						questionEn: data[key].questionEn,
						answerNo: data[key].answerNo,
						answerEn: data[key].answerEn,
					}));
				} else {
					console.error("No FAQs available.");
				}
			} catch (error) {
				console.error("Error fetching FAQs:", error);
			} finally {
				this.loading = false;
			}
		},
	},
	mounted() {
		this.fetchFaqs();
	},
};
</script>

<style scoped>
.search-wrap {
	margin: 10px auto 18px;
}

.search-chip-container {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
	transition: box-shadow 180ms ease, background 180ms ease;
	cursor: text;
	min-height: 48px;
}

.search-chip-container:hover {
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
	background: rgba(255, 255, 255, 0.92);
}

.search-chip-container.focused {
	box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.18), 0 10px 24px rgba(0, 0, 0, 0.12);
}

.search-icon {
	color: #9ca3af;
	flex-shrink: 0;
}

.search-input-wrap {
	flex: 1;
	min-width: 120px;
	position: relative;
}

.chip-search-input {
	width: 100%;
	border: none;
	outline: none;
	background: transparent;
	font-size: 16px;
	padding: 4px 0;
	color: var(--first-color, #112d4e);
}

.chip-search-input::placeholder {
	color: #9ca3af;
}

.search-clear {
	color: #9ca3af;
	flex-shrink: 0;
	cursor: pointer;
}

.search-summary {
	font-size: 14px;
	color: #6b7280;
	margin-bottom: 8px;
}

.faq-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 16px;
}

.faq-card {
	cursor: pointer;
	background-color: var(--color-bg-card);
	border: 1px solid var(--third-color);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
	transition: box-shadow 0.15s ease, transform 0.1s ease;
}

.faq-card:hover {
	box-shadow: 0 6px 22px rgba(0, 0, 0, 0.14);
	transform: translateY(-2px);
}

.faq-question {
	font-size: 1.05rem;
	font-weight: 700;
	line-height: 1.3;
	margin: 0;
}

.faq-chevron {
	flex-shrink: 0;
	color: var(--second-color);
}

.faq-answer {
	font-size: 0.9rem;
	line-height: 1.5;
	color: rgba(0, 0, 0, 0.65);
	white-space: pre-line;
	margin: 10px 0 0;
	padding: 0;
}

@media (max-width: 600px) {
	.faq-grid {
		grid-template-columns: 1fr;
	}
}
</style>
