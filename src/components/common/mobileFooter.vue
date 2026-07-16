<template>
	<div>
		<div class="footer-icons">
			<router-link class="footer-icon" to="/" @click="removeDropdowns">
				<v-icon size="30px">mdi-home</v-icon>
			</router-link>
			<router-link class="footer-icon" to="/utvekslinger" @click="removeDropdowns">
				<v-icon size="30px">mdi-airplane-search</v-icon>
			</router-link>
			<a class="footer-icon" @click="toggleMenu">
				<v-icon size="30px">mdi-menu</v-icon>
			</a>
			<router-link class="footer-icon" to="/erfaringer" @click="removeDropdowns">
				<v-icon size="30px">mdi-file-document-outline</v-icon>
			</router-link>
			<router-link class="footer-icon" to="/profil" @click="removeDropdowns">
				<v-icon size="30px">mdi-account</v-icon>
			</router-link>
		</div>

		<!-- Menu Dropdown -->
		<div v-if="showMenuDropdown">
			<div class="menu-dropdown">
				<div class="profile-content">
					<router-link class="footer-icon" to="/kurs" @click="showMenuDropdown = false">
						<v-icon size="30px">mdi-book-education-outline</v-icon>
						<span>{{ $t("nav.coursesHeader") }}</span>
					</router-link>
					<router-link class="footer-icon" to="/faq" @click="showMenuDropdown = false">
						<v-icon size="30px">mdi-chat-question</v-icon>
						<span>{{ $t("nav.faqHeader") }}</span>
					</router-link>
					<router-link class="footer-icon" to="/kontakt" @click="showMenuDropdown = false">
						<v-icon size="30px">mdi-card-account-mail</v-icon>
						<span>{{ $t("nav.contactHeader") }}</span>
					</router-link>
					<router-link class="footer-icon" to="/terms_and_conditions" @click="showMenuDropdown = false">
						<v-icon size="30px">mdi-gavel</v-icon>
						<span>{{ $t("nav.legalHeader") }}</span>
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "MobileFooter",
	data() {
		return {
			showMenuDropdown: false,
		};
	},
	methods: {
		toggleMenu() {
			this.showMenuDropdown = !this.showMenuDropdown;
		},
		removeDropdowns() {
			this.showMenuDropdown = false;
		},
	},
};
</script>

<style scoped>
.footer-icons {
	display: flex;
	justify-content: space-around;
	align-items: center;
	background-color: var(--third-color);
	padding: 10px;
	position: fixed;
	bottom: 0;
	width: 100%;
	height: 10vh;
	z-index: 1000;
}

.footer-icon {
	display: flex;
	align-items: center;
	color: var(--second-color);
	height: 7vh;
	text-decoration: none;
}

.footer-icon v-icon {
	margin-bottom: 5px;
}

.footer-icon span {
	font-size: 20px;
	margin-left: 10px;
}

.profile-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.menu-dropdown {
	position: fixed;
	bottom: 11vh;
	left: 50%;
	transform: translateX(-50%);
	background-color: white;
	box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
	border-radius: 8px;
	z-index: 1001;
	padding: 10px;
	width: 60vw;
	max-width: 90%;
}
</style>
