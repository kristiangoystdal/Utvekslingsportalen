<template>
	<footer class="simple-footer">
		<div class="footer-content">
			<div class="footer-links">
				<span v-for="item in filteredLinks" :key="item.name" class="footer-link">
					<router-link :to="item.link">{{ item.name }}</router-link>
				</span>
			</div>
			<div class="footer-disclaimer">
				{{ $t("common.disclaimer") }}
			</div>

			<div class="footer-text">
				&copy; {{ currentYear }} —
				<strong>Utvekslingsportalen</strong>
			</div>
		</div>
	</footer>
</template>

<script>
import { mapGetters } from "vuex";

export default {
	data: () => ({
		links: [
			{ name: "navbar.homeHeader", link: "/" },
			{ name: "navbar.programHeader", link: "/utvekslinger" },
			{ name: "navbar.myexchangeHeader", link: "/min_utveksling" },
			{ name: "navbar.profileHeader", link: "/profil" },
			{ name: "navbar.loginHeader", link: "/logg_inn" },
			{ name: "navbar.contactHeader", link: "/kontakt" },
			{ name: "navbar.faqHeader", link: "/faq" },
			{ name: "navbar.legalHeader", link: "/terms_and_conditions" },
		],
	}),
	computed: {
		...mapGetters(["isAuthenticated"]),
		currentYear() {
			return new Date().getFullYear();
		},
		translatedLinks() {
			return this.links.map((link) => ({
				name: this.$t(link.name),
				link: link.link,
			}));
		},
		filteredLinks() {
			return this.translatedLinks.filter((link) => {
				// Show "Profile" only if the user is logged in
				if (link.name === this.$t("navbar.profileHeader")) {
					return this.isAuthenticated;
				}
				// Show "Login" only if the user is not logged in
				if (link.name === this.$t("navbar.loginHeader")) {
					return !this.isAuthenticated;
				}
				// Show all other links regardless of login status
				return true;
			});
		},
	},
};
</script>

<style scoped>
.simple-footer {
	background-color: var(--second-color);
	color: white;
	height: 100px;
	width: 100%;
	position: relative;
	/* Change to relative for better positioning control */
	bottom: 0;
	left: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
}

.footer-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.footer-links {
	margin-bottom: 8px;
}

.footer-link {
	margin: 0 10px;
	font-size: 0.9rem;
}

.footer-link a {
	color: white;
	text-decoration: none;
}

.footer-link a:hover {
	text-decoration: underline;
}

.footer-text {
	font-size: 0.8rem;
}

.footer-disclaimer {
	font-size: 0.7rem;
	opacity: 0.8;
	margin-bottom: 5px;
	max-width: 600px;
	line-height: 1.2;
}
</style>
