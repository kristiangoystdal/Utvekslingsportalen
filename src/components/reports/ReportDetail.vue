<template>
	<v-dialog :model-value="true" max-width="800" scrollable @update:model-value="close">
		<v-card rounded="xl">
			<!-- Header -->
			<v-card-title class="d-flex align-center pa-4 pb-2">
				<div class="flex-grow-1">
					<div class="d-flex align-center ga-2 mb-1">
						<img v-if="report.country" :src="getFlagUrl(report.country)" alt="" width="28" height="21"
							class="flag-img" />
						<span class="text-body-2 text-medium-emphasis">
							{{ report.university || '—' }}
						</span>
					</div>
					<h2 class="detail-title">{{ report.title }}</h2>
					<div class="d-flex align-center flex-wrap ga-2 mt-1">
						<span class="text-caption text-medium-emphasis">
							{{ $t("reports.writtenBy") }}
							{{ report.anonymous ? $t("reports.anonymousLabel") : (report.authorName || '—') }}
						</span>
						<span class="text-caption text-medium-emphasis">·</span>
						<span class="text-caption text-medium-emphasis">{{ formatDate(report.createdAt) }}</span>
						<template v-if="report.study">
							<span class="text-caption text-medium-emphasis">·</span>
							<span class="text-caption text-medium-emphasis">{{ report.study }}</span>
						</template>
						<template v-if="report.semester || report.year">
							<span class="text-caption text-medium-emphasis">·</span>
							<span class="text-caption text-medium-emphasis">
								{{ report.semester }} {{ report.year }}
							</span>
						</template>
					</div>
				</div>
				<v-btn icon variant="text" size="small" @click="close">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</v-card-title>

			<v-divider />

			<!-- Body -->
			<v-card-text class="pa-4 detail-body">
				<!-- Ratings -->
				<div class="ratings-section mb-5">
					<h3 class="section-label mb-2">{{ $t("reports.ratings") }}</h3>
					<div class="ratings-grid">
						<div v-for="key in ratingKeys" :key="key" class="rating-row">
							<span class="rating-label text-body-2">{{ $t(`reports.${key}`) }}</span>
							<v-rating :model-value="report.ratings?.[key] || 0" color="amber" readonly
								density="compact" size="18" />
							<span class="text-caption text-medium-emphasis">
								{{ report.ratings?.[key] || 0 }}/5
							</span>
						</div>
					</div>
				</div>

				<!-- Content -->
				<div v-if="report.content" class="mb-5">
					<article class="markdown-body" v-html="renderedContent" />
				</div>

				<!-- Pros -->
				<div v-if="report.pros && report.pros.length > 0" class="mb-4">
					<h3 class="section-label mb-2">{{ $t("reports.pros") }}</h3>
					<ul class="pro-con-list">
						<li v-for="(pro, i) in report.pros" :key="'pro-' + i" class="pro-item">
							<v-icon size="18" color="success" class="mr-2">mdi-check-circle</v-icon>
							{{ pro }}
						</li>
					</ul>
				</div>

				<!-- Cons -->
				<div v-if="report.cons && report.cons.length > 0" class="mb-4">
					<h3 class="section-label mb-2">{{ $t("reports.cons") }}</h3>
					<ul class="pro-con-list">
						<li v-for="(con, i) in report.cons" :key="'con-' + i" class="con-item">
							<v-icon size="18" color="error" class="mr-2">mdi-close-circle</v-icon>
							{{ con }}
						</li>
					</ul>
				</div>

				<!-- Tips -->
				<div v-if="report.tips" class="tips-box mb-4">
					<h3 class="section-label mb-2">
						<v-icon size="20" class="mr-1">mdi-lightbulb-outline</v-icon>
						{{ $t("reports.tips") }}
					</h3>
					<p class="tips-text">{{ report.tips }}</p>
				</div>
			</v-card-text>

			<v-divider />

			<!-- Footer -->
			<v-card-actions class="pa-4 d-flex flex-wrap ga-2">
				<v-btn v-if="report.exchangeId" variant="tonal" color="primary" size="small"
					:to="exchangeLink">
					<v-icon start size="18">mdi-swap-horizontal</v-icon>
					{{ $t("reports.viewExchange") }}
				</v-btn>
				<v-spacer />
				<v-btn variant="text" size="small" @click="copyLink">
					<v-icon start size="18">mdi-share-variant</v-icon>
					{{ copied ? $t("reports.linkCopied") : $t("reports.share") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import countriesInformation from "../../data/countriesInformation.json";
import placeholderFlag from "../../assets/images/placeholder_flag.png";
import { encryptId } from "../../js/urlCipher";

const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
	breaks: true,
});

export default {
	name: "ReportDetail",

	props: {
		report: { type: Object, required: true },
	},

	emits: ["close"],

	data() {
		return {
			copied: false,
			countriesInfo: countriesInformation,
			ratingKeys: ["overall", "academic", "social", "housing", "costOfLiving"],
			exchangeToken: null,
		};
	},

	computed: {
		locale() {
			return this.$i18n.locale;
		},

		renderedContent() {
			if (!this.report.content) return "";
			return DOMPurify.sanitize(md.render(this.report.content));
		},

		exchangeLink() {
			if (!this.exchangeToken) return null;
			const search = this.report.university || "";
			return { path: "/utvekslinger", query: { search, r: this.exchangeToken } };
		},
	},

	watch: {
		"report.exchangeId": {
			immediate: true,
			async handler(exchangeId) {
				if (!exchangeId) {
					this.exchangeToken = null;
					return;
				}
				this.exchangeToken = await encryptId(exchangeId, "exchange");
			},
		},
	},

	methods: {
		close() {
			this.$emit("close");
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
			const translated = this.$t(`countries.${country}`);
			if (this.locale === "en") {
				return this.countriesInfo.countryCodes.en[translated] || this.countriesInfo.countryCodes.en[country] || "unknown";
			}
			return this.countriesInfo.countryCodes.no[translated] || this.countriesInfo.countryCodes.no[country] || "unknown";
		},

		async copyLink() {
			try {
				await navigator.clipboard.writeText(window.location.href);
				this.copied = true;
				setTimeout(() => { this.copied = false; }, 2000);
			} catch {
				// clipboard not available
			}
		},
	},
};
</script>

<style scoped>
.detail-title {
	font-size: 1.3rem;
	font-weight: 700;
	line-height: 1.3;
}

.flag-img {
	border-radius: 2px;
	object-fit: cover;
}

.section-label {
	font-size: 0.95rem;
	font-weight: 700;
}

.ratings-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 6px 24px;
}

.rating-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.rating-label {
	min-width: 100px;
}

.pro-con-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.pro-con-list li {
	display: flex;
	align-items: flex-start;
	padding: 4px 0;
	font-size: 0.95rem;
	line-height: 1.5;
}

.tips-box {
	background: rgba(var(--v-theme-primary), 0.06);
	border-left: 4px solid rgb(var(--v-theme-primary));
	border-radius: 8px;
	padding: 12px 16px;
}

.tips-text {
	margin: 0;
	font-size: 0.95rem;
	line-height: 1.6;
}

/* Markdown body styles */
.markdown-body {
	color: rgba(0, 0, 0, 0.84);
}

.markdown-body :deep(h1) { display: none; }

.markdown-body :deep(h2) {
	font-size: 1.15rem;
	font-weight: 700;
	margin: 1rem 0 0.4rem;
}

.markdown-body :deep(h3) {
	font-size: 1rem;
	font-weight: 700;
	margin: 0.8rem 0 0.3rem;
}

.markdown-body :deep(p) {
	margin: 0 0 0.65rem;
	font-size: 0.95rem;
	line-height: 1.65;
}

.markdown-body :deep(p:last-child) { margin-bottom: 0; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
	padding-left: 1.25rem;
	margin: 0.4rem 0 0.7rem;
}

.markdown-body :deep(li) {
	margin: 0.2rem 0;
	line-height: 1.6;
	font-size: 0.95rem;
}

.markdown-body :deep(a) {
	color: rgb(var(--v-theme-primary));
	font-weight: 600;
	text-decoration: none;
}

.markdown-body :deep(a:hover) { text-decoration: underline; }

.markdown-body :deep(blockquote) {
	margin: 0.5rem 0 0.75rem;
	padding: 0.5rem 0.75rem;
	border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
	background: rgba(0, 0, 0, 0.03);
	border-radius: 6px;
}

.detail-body {
	max-height: 70vh;
}

@media (max-width: 600px) {
	.ratings-grid {
		grid-template-columns: 1fr;
	}
}
</style>
