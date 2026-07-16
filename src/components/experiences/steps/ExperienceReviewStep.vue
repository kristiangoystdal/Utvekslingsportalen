<template>
	<div class="step-body">
		<v-sheet rounded="lg" color="surface-variant" class="pa-5 mb-4">
			<div class="review-title">{{ experience.title || '—' }}</div>
			<div class="review-meta mt-1">
				{{ experience.university || '—' }}, {{ translatedCountry }}
				· {{ experience.study || '—' }}
				· {{ experience.year || '—' }} {{ experience.semester || '' }}
				<span v-if="experience.anonymous"> · {{ $t('experiences.anonymousLabel') }}</span>
			</div>

			<v-divider class="my-3" />

			<div v-if="hasRatings" class="mb-3">
				<div v-for="key in ratingKeys" :key="'r-' + key" class="d-flex align-center gap-2 mb-1">
					<span class="review-key">{{ $t(`experiences.${key}`) }}</span>
					<v-rating :model-value="experience.ratings[key]" color="amber" readonly density="compact" size="16" />
				</div>
			</div>

			<template v-if="filteredPros.length || filteredCons.length">
				<v-divider class="mb-3" />
				<div class="d-flex ga-8 flex-wrap">
					<div v-if="filteredPros.length">
						<div class="review-sub-label mb-1">{{ $t('experiences.pros') }}</div>
						<ul class="review-list">
							<li v-for="(p, i) in filteredPros" :key="i">{{ p }}</li>
						</ul>
					</div>
					<div v-if="filteredCons.length">
						<div class="review-sub-label mb-1">{{ $t('experiences.cons') }}</div>
						<ul class="review-list">
							<li v-for="(c, i) in filteredCons" :key="i">{{ c }}</li>
						</ul>
					</div>
				</div>
			</template>

			<template v-if="experience.content">
				<v-divider class="my-3" />
				<div class="review-sub-label mb-1">{{ $t('experiences.content') }}</div>
				<p class="review-text">{{ experience.content }}</p>
			</template>

			<template v-if="experience.tips">
				<div class="review-sub-label mt-3 mb-1">{{ $t('experiences.tips') }}</div>
				<p class="review-text">{{ experience.tips }}</p>
			</template>
		</v-sheet>

		<div v-if="!canSubmit" class="d-flex flex-column ga-1 text-error text-caption">
			<span v-if="!experience.title">· {{ $t('experiences.titleRequired') }}</span>
			<span v-if="!experience.ratings?.overall">· {{ $t('experiences.ratingRequired') }}</span>
			<span v-if="!experience.content">· {{ $t('experiences.contentRequired') }}</span>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		experience: { type: Object, required: true },
		translatedCountry: { type: String, default: "—" },
		canSubmit: { type: Boolean, default: false },
	},
	data() {
		return { ratingKeys: ["overall", "academic", "social", "housing", "costOfLiving"] };
	},
	computed: {
		hasRatings() {
			return this.ratingKeys.some(k => (this.experience.ratings?.[k] || 0) > 0);
		},
		filteredPros() {
			return (this.experience.pros || []).filter(p => p?.trim());
		},
		filteredCons() {
			return (this.experience.cons || []).filter(c => c?.trim());
		},
	},
};
</script>

<style scoped>
.step-body { padding: 12px 16px 8px; }

.review-title {
	font-size: 15px;
	font-weight: 700;
	color: var(--first-color, #112d4e);
}

.review-meta {
	font-size: 12px;
	color: rgba(0, 0, 0, 0.5);
}

.review-key {
	font-size: 13px;
	font-weight: 500;
	min-width: 130px;
	color: rgba(0, 0, 0, 0.75);
}

.review-sub-label {
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: rgba(0, 0, 0, 0.38);
}

.review-list {
	margin: 0;
	padding-left: 18px;
	font-size: 13px;
	color: rgba(0, 0, 0, 0.75);
}

.review-text {
	font-size: 13px;
	color: rgba(0, 0, 0, 0.7);
	white-space: pre-wrap;
	margin: 0;
	line-height: 1.6;
}
</style>
