<template>
	<div class="step-body">
		<div class="section-divider"><span>{{ $t('reports.content') }}</span></div>
		<v-textarea
			:model-value="content"
			:label="$t('reports.content')"
			rows="6"
			variant="outlined"
			:error-messages="submitted && !content ? $t('reports.contentRequired') : ''"
			class="mb-2"
			@update:model-value="$emit('update:content', $event)"
		/>
		<div class="section-divider"><span>{{ $t('reports.tips') }}</span></div>
		<v-textarea
			:model-value="tips"
			:label="$t('reports.tips')"
			rows="3"
			variant="outlined"
			@update:model-value="$emit('update:tips', $event)"
		/>
	</div>
</template>

<script>
export default {
	props: {
		content: { type: String, default: "" },
		tips: { type: String, default: "" },
		submitted: { type: Boolean, default: false },
	},
	emits: ["update:content", "update:tips"],
};
</script>

<style scoped>
.step-body { padding: 12px 16px 8px; }

.section-divider {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(0, 0, 0, 0.38);
	margin: 10px 0 8px;
}
.section-divider::before,
.section-divider::after {
	content: '';
	flex: 1;
	height: 1px;
	background: rgba(0, 0, 0, 0.1);
}
</style>
