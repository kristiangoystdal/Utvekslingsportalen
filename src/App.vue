<template>
	<div class="background-container">
		<div class="background-image"></div>
		<div class="content-container">
			<header>
				<Header></Header>
			</header>
			<div id="app">
				<router-view></router-view>
			</div>
			<div v-if="!isDesktop">
				<div class="mobile-disclaimer">
					{{ $t("common.disclaimer") }}
				</div>
				<br><br>
				<MobileFooter></MobileFooter>
			</div>
		</div>
		<div v-if="isDesktop" class="footer-container">
			<Footer></Footer>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Header from "./components/common/Header.vue";
import MobileFooter from "./components/common/mobileFooter.vue";
import Footer from "./components/common/Footer.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isDesktop = ref(window.innerWidth >= 769);

const handleResize = () => {
	isDesktop.value = window.innerWidth >= 769;
};

onMounted(() => {
	window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.background-container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	position: relative;
	width: 100%;
	overflow: hidden;
}

.background-image {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-image: url("@/assets/images/bg.png");
	/* Ensure the correct path */
	background-size: cover;
	/* Covers the full width */
	background-repeat: repeat-y;
	/* Repeats the image vertically */
	opacity: 0.3;
	/* Make the image 50% transparent */
	z-index: -1;
	/* Ensure the background image is behind other content */
}

.content-container {
	flex: 1;
	/* Ensures that this container takes up available space */
	position: relative;
	z-index: 1;
	/* Ensure content is above the background image */
	padding-bottom: 50px;
	/* Add padding to avoid overlap with footer */
}

.footer-container {
	width: 100%;
	flex-shrink: 0;
	/* Prevents the footer from shrinking */
}

#app {
	margin: 5vw auto;
	padding: 0 1rem;
	max-width: 1200px;
	width: 90%;
}

header {
	line-height: 1.5;
}

.logo {
	display: block;
	margin: 0 auto 2rem;
}

@media (min-width: 769px) {
	header {
		display: flex;
		align-items: center;
		padding-right: calc(var(--section-gap) / 2);
	}

	.logo {
		margin: 0 2rem 0 0;
	}

	header .wrapper {
		display: flex;
		align-items: flex-start;
		flex-wrap: wrap;
	}
}

.mobile-warning {
	display: none;
	text-align: center;
	background-color: #ffcc00;
	color: #000;
	padding: 1rem;
	font-size: 1.2rem;
	position: fixed;
	width: 100%;
	bottom: 0;
	left: 0;
	z-index: 1000;
}

@media (max-width: 768px) {
	.mobile-warning {
		display: block;
	}

	#app {
		margin-bottom: 10vh;
		padding: 0;
	}


	.mobile-disclaimer {
		text-align: center;
		font-size: 0.65rem;
		opacity: 0.75;
		padding: 6px 10px;
		margin-top: 4px;
		color: var(--second-color);
	}
}
</style>
