<template>
	<div v-if="visible" class="disclaimer-bar">
		<v-icon class="disclaimer-icon" size="20">mdi-information-outline</v-icon>
		<span class="disclaimer-text">{{ $t("homepage.disclaimer") }}</span>
		<button class="disclaimer-close" :aria-label="$t('actions.close')" @click="dismiss">
			<v-icon size="18">mdi-close</v-icon>
		</button>
	</div>
</template>

<script setup>
import { ref } from "vue";

// Bumped whenever the disclaimer text changes materially, so a dismissal
// against old wording doesn't hide a banner with new wording.
const DISMISS_KEY = "disclaimerDismissed_v1";

const visible = ref(!localStorage.getItem(DISMISS_KEY));

const dismiss = () => {
	visible.value = false;
	localStorage.setItem(DISMISS_KEY, "1");
};
</script>

<style scoped>
.disclaimer-bar {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px 16px;
	background-color: var(--alert-info);
	color: var(--alert-info-text);
	font-size: 0.85rem;
	line-height: 1.3;
}

.disclaimer-icon {
	flex-shrink: 0;
}

.disclaimer-text {
	flex: 1;
}

.disclaimer-close {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	cursor: pointer;
	color: inherit;
	opacity: 0.7;
	padding: 4px;
}

.disclaimer-close:hover {
	opacity: 1;
}
</style>
