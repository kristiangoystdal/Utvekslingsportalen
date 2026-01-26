<template>
	<h2>{{ $t("faqPage.pageHeader") }}</h2>
	<p class="page-summary">
		{{ $t("faqPage.info") }}
	</p>

	<v-container style="padding: 20px; max-width: 80%; margin: 10px auto">
		<v-text-field v-model="searchQuery" :label="$t('faqPage.search')" append-icon="mdi-magnify"
			class="mb-2"></v-text-field>

		<v-row>
			<v-col cols="12" v-for="faq in filteredFaqs" :key="faq.id">
				<v-card class="mb-4">
					<v-card-title @click="toggleExpand(faq.id)">
						<div class="d-flex justify-space-between align-center">
							<span class="faq-title-text">
								{{ faq.question }}
							</span>
							<v-icon>
								{{
									expanded.includes(faq.id)
										? "mdi-chevron-up"
										: "mdi-chevron-down"
								}}
							</v-icon>
						</div>
					</v-card-title>
					<v-card-text v-show="expanded.includes(faq.id)">
						<p>{{ faq.answer }}</p>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script>
import { db } from "../../js/firebaseConfig.js";
import { get, child, ref as dbRef } from "firebase/database";

export default {
	data() {
		return {
			searchQuery: "",
			expanded: [],
			faqs: [],
		};
	},
	computed: {
		filteredFaqs() {
			if (!this.searchQuery) return this.faqs;
			return this.faqs.filter((faq) =>
				faq.question.toLowerCase().includes(this.searchQuery.toLowerCase())
			);
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
						...data[key],
					}));
				} else {
					console.error("No FAQs available.");
				}
			} catch (error) {
				console.error("Error fetching FAQs:", error);
			}
		},
	},
	mounted() {
		this.fetchFaqs();
	},
};
</script>

<style scoped>
h2 {
	color: #333;
}

p {
	margin-bottom: 1rem;
}

.v-card-title {
	cursor: pointer;
	padding: 16px 20px !important;
}

.v-card-text {
	padding: 0 20px 16px 20px !important;
	line-height: 1.5;
	font-size: 0.95rem;
}

.v-card-text {
	transition: all 0.2s ease;
}

.faq-title-text {
	flex: 1 1 auto;
	min-width: 0;

	display: block;
	white-space: normal !important;
	word-break: keep-all;
	overflow-wrap: normal;
}

.v-card-title>.d-flex {
	width: 100%;
}


/* -----------------------------------------
   MOBILE OPTIMIZATIONS
------------------------------------------ */
@media (max-width: 600px) {
	.v-container {
		padding: 12px !important;
		max-width: 100% !important;
		margin-top: 0;
	}

	.v-text-field {
		font-size: 1rem !important;
	}

	.v-card {
		border-radius: 10px;
		margin-bottom: 14px;
	}

	.v-card-title {
		font-size: 1rem !important;
		padding: 14px 16px !important;
		line-height: 1.3;
	}

	.v-card-text {
		font-size: 0.85rem !important;
		padding: 0 16px 14px 16px !important;
	}

	.v-icon {
		font-size: 20px !important;
	}

	.v-card-title>div {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
	}
}
</style>
