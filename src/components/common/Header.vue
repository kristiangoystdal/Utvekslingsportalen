<template>
	<header>
		<div class="header-container">
			<router-link to="/" class="logo">
				<img src="../../assets/images/logo.png" alt="Site Logo" />
				<span class="site-name">{{ $t("nav.siteName") }}</span>
			</router-link>
			<div class="nav-and-language">
				<nav :class="{ open: showMobileMenu }">
					<ul>
						<li v-if="checkAdminUser()">
							<router-link to="/admin">{{
								$t("nav.adminHeader")
							}}</router-link>
						</li>
						<li>
							<router-link to="/">{{ $t("nav.homeHeader") }}</router-link>
						</li>
						<li>
							<router-link to="/utvekslinger">{{
								$t("nav.programHeader")
							}}</router-link>
						</li>

						<li>
							<router-link to="/kurs">{{
								$t("nav.coursesHeader")
							}}</router-link>
						</li>
						<li>
							<router-link to="/min_utveksling">{{
								$t("nav.myexchangeHeader")
							}}</router-link>
						</li>
						<li ref="profileSwitcher">
							<router-link v-if="isAuthenticated" to="/profil">{{
								$t("nav.profileHeader")
							}}</router-link>
							<router-link v-else to="/logg_inn">{{
								$t("nav.loginHeader")
							}}</router-link>
						</li>
					</ul>
				</nav>

				<div ref="languageSwitcher" @click="toggleLanguageDropdown" class="language-switcher">
					<img :src="currentFlagUrl" width="20" height="14" alt="flag" />
					<span class="lang-code">{{ $i18n.locale === 'en' ? 'EN' : 'NO' }}</span>
					<v-icon size="small">mdi-chevron-down</v-icon>

					<transition name="dropdown-fade">
						<div v-if="showLanguageDropdown" class="language-dropdown">
							<a @click.stop="changeLanguage('en')" :class="{ selected: $i18n.locale === 'en' }">
								<img src="/flags/GB.svg" width="20" height="14" alt="English" />
								<span>English</span>
								<v-icon v-if="$i18n.locale === 'en'" size="small" class="check-icon">mdi-check</v-icon>
							</a>
							<a @click.stop="changeLanguage('no')" :class="{ selected: $i18n.locale === 'no' }">
								<img src="/flags/NO.svg" width="20" height="14" alt="Norsk" />
								<span>Norsk</span>
								<v-icon v-if="$i18n.locale === 'no'" size="small" class="check-icon">mdi-check</v-icon>
							</a>
						</div>
					</transition>
				</div>

			</div>
		</div>
	</header>
</template>

<script>
import { mapGetters } from "vuex";
import { VIcon } from "vuetify/components";
import { auth, provider } from "../../js/firebaseConfig";
import { signOut, signInWithPopup } from "firebase/auth";


export default {
	name: "Header",
	components: {
		VIcon,
	},
	data() {
		return {
			showLanguageDropdown: false,
			showMobileMenu: false,
		};
	},
	computed: {
		...mapGetters(["isAuthenticated", "user", "userData"]),
		authButtonText() {
			return this.isAuthenticated
				? this.$t("nav.profileHeader")
				: this.$t("nav.loginHeader");
		},
		currentFlagUrl() {
			return this.$i18n.locale === "en"
				? "/flags/GB.svg"
				: "/flags/NO.svg";
		}
	},
	methods: {
		toggleLanguageDropdown() {
			this.showLanguageDropdown = !this.showLanguageDropdown;
		},
		changeLanguage(lang) {
			this.$i18n.locale = lang;
			document.cookie = `locale=${encodeURIComponent(lang)}; Path=/; Max-Age=31536000; SameSite=Lax`;
			this.showLanguageDropdown = false;
		},
		handleClickOutside(event) {
			if (
				this.$refs.languageSwitcher &&
				!this.$refs.languageSwitcher.contains(event.target) &&
				this.$refs.profileSwitcher &&
				!this.$refs.profileSwitcher.contains(event.target)
			) {
				this.showLanguageDropdown = false;
			}
		},
		async signOut() {
			try {
				await signOut(auth);
				this.$router.go();
			} catch (error) {
				console.error("Error signing out: ", error);
			}
		},
		async loginWithGoogle() {
			try {
				await signInWithPopup(auth, provider);
				this.$router.go();
			} catch (error) {
				console.error("Error during sign-in:", error);
			}
		},
		checkAdminUser() {
			return this.user && this.user.uid === import.meta.env.VITE_ADMIN_USER_ID;
		},
	},
	mounted() {
		document.addEventListener("click", this.handleClickOutside);
	},
	beforeUnmount() {
		document.removeEventListener("click", this.handleClickOutside);
	},
};
</script>

<style scoped>
header {
	background-color: var(--fourth-color) !important;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
	width: 100% !important;
	top: 0 !important;
	left: 0;
	border-radius: 0 0 10px 10px;
}

.header-container {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 0 1rem;
}

.logo {
	display: flex;
	align-items: center;
	text-decoration: none;
	color: var(--second-color);
}

.logo img {
	height: 50px;
	width: 50px;
}

.site-name {
	margin-left: 0.5rem;
	font-size: 1.5rem;
	font-weight: bold;
}

.nav-and-language {
	display: flex;
	align-items: center;
}

nav ul {
	list-style-type: none;
	display: flex;
	gap: 1rem;
	padding: 0;
	margin: 0;
}

nav li {
	display: inline;
}

nav a {
	text-decoration: none;
	color: #6b7280;
	font-weight: normal;
	transition: color 0.2s, border-color 0.2s;
	padding: 0.5rem;
	cursor: pointer;
	border-bottom: 2.5px solid transparent;
}

nav a.router-link-exact-active {
	color: var(--second-color);
	border-bottom-color: var(--second-color);
	font-weight: 600;
}

@media (hover: hover) {
	nav a:hover {
		color: var(--second-color);
		cursor: pointer;
	}

	.language-switcher:hover {
		background-color: var(--third-color);
	}
}

.language-switcher {
	position: relative;
	display: flex;
	align-items: center;
	gap: 4px;
	margin-left: 0.75rem;
	cursor: pointer;
	padding: 6px 10px;
	border-radius: 20px;
	border: 1px solid var(--third-color, #dbe2ef);
	transition: background-color 0.2s;
}

.lang-code {
	font-size: 13px;
	font-weight: 600;
	color: var(--first-color);
}

.language-switcher .v-icon {
	font-size: 16px;
	color: #6b7280;
}

.language-dropdown {
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	background-color: white;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	border-radius: 10px;
	overflow: hidden;
	min-width: 160px;
	z-index: 1000;
	border: 1px solid var(--third-color, #dbe2ef);
}

.language-dropdown a {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	text-decoration: none;
	color: var(--first-color);
	font-size: 14px;
	transition: background-color 0.15s;
	cursor: pointer;
}

.language-dropdown a:hover {
	background-color: var(--fourth-color, #f9f7f7);
}

.language-dropdown a.selected {
	color: var(--second-color);
	font-weight: 600;
}

.language-dropdown a span {
	flex: 1;
}

.check-icon {
	color: var(--second-color);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
	transition: opacity 0.15s, transform 0.15s;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

.fi {
	font-size: 1rem;
	margin-right: 0.5rem;
}

.hamburger-menu {
	display: none;
	cursor: pointer;
}

@media (max-width: 768px) {
	.logo {
		margin-left: 0;
		width: 50vw;
		left: 0;
		padding: 0%;
	}

	.logo img {
		height: 40px;
		width: 40px;
		margin: 10px 0;
	}

	.logo .site-name {
		font-size: 1.1rem;
	}

	.hamburger-menu {
		display: flex;
		align-items: center;
	}

	nav {
		display: none;
	}

	nav.open {
		display: block;
	}

	nav ul {
		flex-direction: column;
		padding: 1rem 0;
	}

	nav li {
		display: block;
		text-align: center;
	}

	nav a {
		display: block;
		width: 100%;
	}

	.language-dropdown {
		top: calc(100% + 8px);
		right: 0;
		z-index: 10000;
	}
}

.profile-dropdown {
	position: absolute;
	top: 60px;
	right: 50px;
	background-color: var(--color-bg-card);
	box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
	border-radius: 10px;
	padding: 1rem;
	width: 200px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	z-index: 1000;
}

.profile-content {
	display: flex;
	flex-direction: column;
	width: 100%;
	border-radius: 10px;
}

.profile-content .username {
	margin-bottom: 1rem;
	font-weight: bold;
	color: var(--first-color);
	font-size: 1rem;
	text-align: left;
	white-space: pre-wrap;
	word-wrap: break-word;
}

.language-switcher img,
.language-dropdown img {
	width: 22px !important;
	height: auto !important;
	object-fit: cover;
	border-radius: 2px;
}
</style>
