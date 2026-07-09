<template>
	<div>
		<div class="review-section">
			<div class="review-section-label">{{ $t('wizard.review.basic') }}</div>
			<div class="review-grid">
				<div class="review-item">
					<div class="review-item-label">{{ $t('database.study') }}</div>
					<div class="review-item-value">{{ userExchange.study || '—' }}</div>
				</div>
				<div class="review-item">
					<div class="review-item-label">{{ $t('database.country') }}</div>
					<div class="review-item-value">{{ userExchange.country || '—' }}</div>
				</div>
				<div class="review-item">
					<div class="review-item-label">{{ $t('database.university') }}</div>
					<div class="review-item-value">{{ userExchange.university || '—' }}</div>
				</div>
				<div class="review-item">
					<div class="review-item-label">{{ $t('database.year') }}</div>
					<div class="review-item-value">{{ userExchange.year || '—' }}</div>
				</div>
			</div>
		</div>

		<div v-for="semester in semesters" :key="semester" class="review-section">
			<div class="review-section-label d-flex align-center justify-space-between">
				<span>
					{{ semester === 'Høst' ? $t('wizard.review.Høst') : $t('wizard.review.Vår') }}
				</span>
				<span class="ects-badge">{{ totalECTS(semester) }} ECTS</span>
			</div>

			<div v-if="coursesForSemester(semester).length === 0" class="text-medium-emphasis text-body-2 py-2">
				{{ $t('wizard.review.noCourses') }}
			</div>

			<div v-else class="course-list">
				<div v-for="(course, index) in coursesForSemester(semester)" :key="index" class="course-row">
					<v-icon size="14" color="primary" class="mt-1 flex-shrink-0">mdi-book-outline</v-icon>
					<div class="course-info">
						<span class="course-name">{{ course.courseName }}</span>
						<span v-if="course.courseCode" class="course-code">{{ course.courseCode }}</span>
					</div>
					<span class="course-ects">{{ course.ECTSPoints }} ECTS</span>
				</div>
			</div>
		</div>

		<v-btn
			v-if="showSubmitButton"
			color="primary"
			variant="tonal"
			size="large"
			:disabled="!canSubmit || saving"
			:loading="saving"
			block
			class="mt-4"
			@click="$emit('submit')"
		>
			{{ $t('wizard.review.submit') }}
		</v-btn>
	</div>
</template>

<script>
export default {
	props: {
		userExchange: Object,
		semesters: Array,
		canSubmit: Boolean,
		showSubmitButton: { type: Boolean, default: true },
		saving: { type: Boolean, default: false },
	},
	emits: ["submit"],
	methods: {
		coursesForSemester(semester) {
			return Object.values(this.userExchange.courses[semester] || {});
		},
		totalECTS(semester) {
			return this.coursesForSemester(semester)
				.map(c => Number(c.ECTSPoints) || 0)
				.reduce((a, b) => a + b, 0);
		},
	},
};
</script>

<style scoped>
.review-section {
	background: rgba(0, 0, 0, 0.03);
	border-radius: 10px;
	padding: 14px 16px;
	margin-bottom: 10px;
}

.review-section-label {
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.07em;
	color: rgba(0, 0, 0, 0.4);
	margin-bottom: 10px;
}

.review-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 10px;
}

.review-item-label {
	font-size: 11px;
	color: rgba(0, 0, 0, 0.4);
	margin-bottom: 2px;
}

.review-item-value {
	font-size: 14px;
	font-weight: 500;
	color: var(--first-color, #112d4e);
}

.ects-badge {
	font-size: 12px;
	font-weight: 600;
	color: var(--first-color, #112d4e);
	background: rgba(63, 114, 175, 0.1);
	padding: 2px 8px;
	border-radius: 10px;
}

.course-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.course-row {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.course-info {
	flex: 1;
	min-width: 0;
}

.course-name {
	font-size: 13px;
	font-weight: 500;
	color: rgba(0, 0, 0, 0.8);
}

.course-code {
	font-size: 11px;
	color: rgba(0, 0, 0, 0.45);
	margin-left: 6px;
}

.course-ects {
	font-size: 12px;
	color: rgba(0, 0, 0, 0.45);
	flex-shrink: 0;
}
</style>
