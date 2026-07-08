<template>
	<v-dialog :model-value="true" max-width="800" scrollable @update:model-value="close">
		<v-card rounded="xl" class="detail-card">
			<!-- Header -->
			<v-card-title class="d-flex align-center pa-4 pa-sm-5 pb-2">
				<div class="flex-grow-1 min-width-0">
					<div class="d-flex align-center ga-2 mb-1">
						<img v-if="report.country" :src="getFlagUrl(report.country)" alt="" width="28" height="21"
							class="flag-img" />
						<span class="text-body-2 text-medium-emphasis text-truncate">
							{{ report.university || '—' }}
						</span>
					</div>
					<h2 class="detail-title">{{ report.title }}</h2>
					<div class="detail-meta mt-1">
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
				<v-btn icon variant="text" size="small" @click="close" class="ml-2 flex-shrink-0">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</v-card-title>

			<v-divider />

			<!-- Body -->
			<v-card-text class="pa-4 pa-sm-5 detail-body">
				<!-- Ratings -->
				<div class="ratings-section mb-5">
					<h3 class="section-label mb-2">{{ $t("reports.ratings") }}</h3>
					<table class="ratings-table ratings-table--desktop">
						<tr v-for="(_, i) in ratingKeysLeft" :key="i">
							<td class="rating-label text-body-2">{{ $t(`reports.${ratingKeysLeft[i]}`) }}</td>
							<td class="rating-stars-cell">
								<v-rating :model-value="report.ratings?.[ratingKeysLeft[i]] || 0" color="amber" readonly
									density="compact" size="16" class="d-flex" />
							</td>
							<template v-if="ratingKeysRight[i]">
								<td class="rating-gap"></td>
								<td class="rating-label text-body-2">{{ $t(`reports.${ratingKeysRight[i]}`) }}</td>
								<td class="rating-stars-cell">
									<v-rating :model-value="report.ratings?.[ratingKeysRight[i]] || 0" color="amber" readonly
										density="compact" size="16" class="d-flex" />
								</td>
							</template>
						</tr>
					</table>
					<table class="ratings-table ratings-table--mobile">
						<tr v-for="key in ratingKeys" :key="key">
							<td class="rating-label text-body-2">{{ $t(`reports.${key}`) }}</td>
							<td class="rating-stars-cell">
								<v-rating :model-value="report.ratings?.[key] || 0" color="amber" readonly density="compact" size="16"
									class="d-flex" />
							</td>
						</tr>
					</table>
				</div>

				<!-- Content -->
				<div v-if="report.content" class="mb-5">
					<article class="markdown-body" v-html="renderedContent" />
				</div>

				<!-- Pros -->
				<div v-if="report.pros && report.pros.length > 0" class="mb-4">
					<h3 class="section-label mb-2">{{ $t("reports.pros") }}</h3>
					<ul class="pro-con-list">
						<li v-for="(pro, i) in report.pros" :key="'pro-' + i">
							<v-icon size="18" color="success" class="pro-con-icon">mdi-check-circle</v-icon>
							<span>{{ pro }}</span>
						</li>
					</ul>
				</div>

				<!-- Cons -->
				<div v-if="report.cons && report.cons.length > 0" class="mb-4">
					<h3 class="section-label mb-2">{{ $t("reports.cons") }}</h3>
					<ul class="pro-con-list">
						<li v-for="(con, i) in report.cons" :key="'con-' + i">
							<v-icon size="18" color="error" class="pro-con-icon">mdi-close-circle</v-icon>
							<span>{{ con }}</span>
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
			<v-card-actions class="pa-4 pa-sm-5 d-flex flex-wrap ga-3">
				<v-btn v-if="report.exchangeId" variant="tonal" color="primary" :to="exchangeLink">
					<v-icon start>mdi-swap-horizontal</v-icon>
					{{ $t("reports.viewExchange") }}
				</v-btn>
				<template v-if="isAuthor">
					<v-btn variant="tonal" color="secondary" :to="editLink">
						<v-icon start>mdi-pencil-outline</v-icon>
						{{ $t("reports.edit") }}
					</v-btn>
					<v-btn variant="tonal" color="error" @click="deleteDialog = true">
						<v-icon start>mdi-trash-can-outline</v-icon>
						{{ $t("reports.delete") }}
					</v-btn>
				</template>
				<v-spacer />
				<v-btn variant="text" @click="copyLink">
					<v-icon start>mdi-share-variant</v-icon>
					{{ copied ? $t("reports.linkCopied") : $t("reports.share") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Delete confirmation dialog -->
	<v-dialog v-model="deleteDialog" max-width="420">
		<v-card rounded="xl">
			<v-card-title class="pa-5 pb-2">{{ $t("reports.confirmDelete") }}</v-card-title>
			<v-card-text class="pa-5 pt-1 text-medium-emphasis">
				{{ $t("reports.confirmDeleteBody") }}
			</v-card-text>
			<v-card-actions class="pa-4 pt-0 ga-2">
				<v-spacer />
				<v-btn variant="text" @click="deleteDialog = false">{{ $t("reports.cancel") }}</v-btn>
				<v-btn color="error" variant="tonal" :loading="deleting" @click="confirmDelete">
					{{ $t("reports.delete") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { mapGetters } from "vuex";
import countriesInformation from "../../data/countriesInformation.json";
import placeholderFlag from "../../assets/images/placeholder_flag.png";
import { encryptId } from "../../js/urlCipher";
import { deleteReport } from "../../js/reportsCache";
import { toast } from "vue3-toastify";

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
			deleteDialog: false,
			deleting: false,
			countriesInfo: countriesInformation,
			ratingKeys: ["overall", "academic", "social", "housing", "costOfLiving"],
			exchangeToken: null,
			editToken: null,
		};
	},

	computed: {
		...mapGetters(["user"]),

		locale() {
			return this.$i18n.locale;
		},

		isAuthor() {
			return this.user && this.report.authorId && this.user.uid === this.report.authorId;
		},

		editLink() {
			if (!this.editToken) return null;
			return { name: "EditReport", params: { id: this.editToken } };
		},

		ratingKeysLeft() {
			return this.ratingKeys.slice(0, Math.ceil(this.ratingKeys.length / 2));
		},

		ratingKeysRight() {
			return this.ratingKeys.slice(Math.ceil(this.ratingKeys.length / 2));
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

		"report.id": {
			immediate: true,
			async handler(reportId) {
				if (!reportId) {
					this.editToken = null;
					return;
				}
				this.editToken = await encryptId(reportId, "report");
			},
		},
	},

	methods: {
		close() {
			this.$emit("close");
		},

		async confirmDelete() {
			this.deleting = true;
			try {
				await deleteReport(this.report.id);
				toast.success(this.$t("notifications.reportDeleted"));
				this.deleteDialog = false;
				this.$emit("close");
			} catch (error) {
				console.error("Error deleting report:", error);
				toast.error(this.$t("notifications.reportError"));
			} finally {
				this.deleting = false;
			}
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
.detail-card {
	overflow: hidden;
}

.min-width-0 {
	min-width: 0;
}

.detail-title {
	font-size: 1.3rem;
	font-weight: 700;
	line-height: 1.3;
	word-wrap: break-word;
	overflow-wrap: break-word;
}

.detail-meta {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4px;
}

.flag-img {
	border-radius: 2px;
	object-fit: cover;
	flex-shrink: 0;
}

.section-label {
	font-size: 0.95rem;
	font-weight: 700;
}

/* Ratings */
.ratings-table {
	border-collapse: collapse;
}

.ratings-table td {
	padding: 4px 0;
	vertical-align: middle;
}

.ratings-table .rating-label {
	padding-right: 8px;
	white-space: nowrap;
}

.ratings-table .rating-stars-cell {
	white-space: nowrap;
}

.ratings-table .rating-gap {
	width: 24px;
}

.ratings-table--mobile {
	display: none;
}

.ratings-table :deep(.v-rating) {
	line-height: 1;
	position: relative;
	top: -11px;
}

.ratings-table :deep(.v-rating .v-btn) {
	height: 16px;
	width: 16px;
}

/* Pros / Cons */
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

.pro-con-icon {
	flex-shrink: 0;
	margin-right: 8px;
	margin-top: 2px;
}

/* Tips */
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
	word-wrap: break-word;
	overflow-wrap: break-word;
}

/* Markdown */
.markdown-body {
	color: rgba(0, 0, 0, 0.84);
	overflow-wrap: break-word;
	word-wrap: break-word;
}

.markdown-body :deep(h1) {
	display: none;
}

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

.markdown-body :deep(p:last-child) {
	margin-bottom: 0;
}

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

.markdown-body :deep(a:hover) {
	text-decoration: underline;
}

.markdown-body :deep(blockquote) {
	margin: 0.5rem 0 0.75rem;
	padding: 0.5rem 0.75rem;
	border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
	background: rgba(0, 0, 0, 0.03);
	border-radius: 6px;
}

.detail-body {
	max-height: 70vh;
	overflow-x: hidden;
}

/* Mobile */
@media (max-width: 600px) {
	.detail-title {
		font-size: 1.1rem;
	}

	.ratings-table--desktop {
		display: none;
	}

	.ratings-table--mobile {
		display: table;
	}

	.ratings-table .rating-label {
		font-size: 0.85rem;
	}

	.ratings-table :deep(.v-rating .v-btn) {
		height: 14px;
		width: 14px;
	}
}
</style>
