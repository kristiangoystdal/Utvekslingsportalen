<template>
	<div>
		<h2 v-if="login" class="sr-only">{{ $t("auth.loginTitle") }}:</h2>
		<h2 v-else class="sr-only">{{ $t("auth.registerTitle") }}:</h2>
		<br />
		<div class="login-container">
			<v-card class="auth-card" elevation="1">
				<div class="auth-tabs">
					<button class="auth-tab" :class="{ active: login }" @click="login = true">
						{{ $t("auth.loginTitle") }}
					</button>
					<button class="auth-tab" :class="{ active: !login }" @click="login = false">
						{{ $t("auth.registerTitle") }}
					</button>
				</div>

				<v-card-text>
					<v-form v-if="login" @submit.prevent="loginWithEmail">
						<v-text-field label="Email" v-model="email" type="email" required outlined hide-details></v-text-field>
						<br />
						<v-text-field :label="$t('auth.password')" v-model="password" type="password" required outlined
							hide-details></v-text-field>
						<div class="forgot-password-wrapper">
							<span @click.prevent="sendResetPasswordEmail" class="forgot-password-link">
								{{ $t("auth.forgotPassword") }}
							</span>
						</div>
						<br />
						<v-btn class="action-btn" color="primary" dark type="submit">
							{{ $t("actions.signIn") }}
						</v-btn>
					</v-form>

					<v-form v-else @submit.prevent="registerWithEmail">
						<v-text-field :label="$t('auth.name')" v-model="name" type="text" required outlined hide-details
							autocomplete="name" />
						<br />
						<v-text-field label="Email" v-model="email" type="email" required outlined hide-details
							autocomplete="username" />
						<br />
						<v-text-field :label="$t('auth.password')" v-model="password" type="password" required outlined hide-details
							autocomplete="new-password" />

						<v-checkbox v-model="acceptTerms" required>
							<template #label>
								<span>
									{{ $t("auth.acceptTermsLabel") }}
									<a href="/terms_and_conditions" target="_blank" rel="noopener noreferrer">
										{{ $t("auth.termsAndConditions") }}
									</a>
								</span>
							</template>
						</v-checkbox>

						<v-btn class="action-btn" color="primary" dark type="submit" :disabled="!isFormValid">
							{{ $t("actions.register") }}
						</v-btn>
					</v-form>

					<div class="or-divider">
						<v-divider></v-divider>
						<span class="or-text">{{ $t("auth.or") }}</span>
						<v-divider></v-divider>
					</div>

					<v-btn class="action-btn google-btn" variant="outlined" @click="loginWithGoogle">
						<v-icon left class="icon-spacing">mdi-google</v-icon>
						{{ $t("auth.continueWithGoogle") }}
					</v-btn>
				</v-card-text>
			</v-card>
		</div>
	</div>
</template>

<script>
import { auth, provider } from "../../js/firebaseConfig";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database"; // ✅ new imports for Realtime Database

import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
	data() {
		return {
			name: "",
			email: "",
			password: "",
			login: true,
			acceptTerms: false,
		};
	},
	computed: {
		isFormValid() {
			const isPasswordValid = this.password.length >= 6 && this.password.length <= 50;
			const isEmailValid = EMAIL_REGEX.test(this.email);
			const isNameValid = this.name.length <= 50 && this.name.length > 0;
			return isPasswordValid && isEmailValid && isNameValid && this.acceptTerms;
		},
	},
	methods: {
		async loginWithGoogle() {
			try {
				const result = await signInWithPopup(auth, provider);
				const user = result.user;

				this.$router.push("/profil");
			} catch (error) {
				console.error("Error during sign-in:", error);
				toast.error(this.$t("notifications.loginFailure"));
			}
		},
		async loginWithEmail() {
			try {
				const email = this.email;
				const password = this.password;

				await signInWithEmailAndPassword(auth, email, password);
				this.$router.push("/profil");
			} catch (error) {
				console.error("Error during email sign-in:", error);
				toast.error(this.$t("notifications.loginFailure"));
			}
		},
		async registerWithEmail() {
			try {
				if (!this.name) {
					toast.error(this.$t("notifications.registerNameRequired"));
					return;
				} else if (this.password.length < 6) {
					toast.error(this.$t("notifications.registerPasswordLength"));
					return;
				} else if (!EMAIL_REGEX.test(this.email)) {
					toast.error(this.$t("notifications.registerEmailInvalid"));
					return;
				}

				const { email, password } = this;

				// 1️⃣ Create the user and get the user object immediately
				const userCredential = await createUserWithEmailAndPassword(auth, email, password);
				const user = userCredential.user;

				// 2️⃣ Wait for Firebase to confirm that the session is ready
				await new Promise((resolve) => {
					const unsubscribe = auth.onAuthStateChanged((currentUser) => {
						if (currentUser) {
							unsubscribe();
							resolve(currentUser);
						}
					});
				});

				// 3️⃣ Safely create the user profile after the user is ready
				await this.createUserProfile(user);

				toast.success(this.$t("notifications.registerSuccess"));
				this.$router.push("/profil");
			} catch (error) {
				console.error("Error during email registration:", error);
				toast.error(this.$t("errors.registerFailure"));
			}
		},
		async createUserProfile(user) {
			try {
				const displayName = this.name;
				await updateProfile(user, { displayName });

				const db = getDatabase();
				await set(ref(db, "users/" + user.uid), {
					displayName: displayName,
					email: user.email,
				});
			} catch (error) {
				console.error("Error creating user profile:", error);
			}
		},
		async sendResetPasswordEmail() {
			if (this.email) {
				sendPasswordResetEmail(auth, this.email)
					.then(() => {
						toast.success(this.$t("notifications.passwordResetEmailSent"));
					})
					.catch((error) => {
						console.error("Error sending password reset email: ", error);
						toast.error(this.$t("notifications.passwordResetEmailFailure"));
					});
			} else {
				toast.error(this.$t("notifications.enterEmailForPasswordReset"));
			}
		},
	},
};
</script>

<style scoped>
.login-container {
	display: flex;
	justify-content: center;
	align-items: center;
}

.auth-card {
	width: 420px;
	border-radius: 12px;
	overflow: hidden;
}

.auth-tabs {
	display: flex;
	border-bottom: 2px solid var(--third-color, #dbe2ef);
}

.auth-tab {
	flex: 1;
	padding: 16px 0;
	border: none;
	background: transparent;
	cursor: pointer;
	font-size: 16px;
	font-weight: 500;
	color: var(--text-color, #999);
	transition: color 0.2s, border-color 0.2s;
	border-bottom: 3px solid transparent;
	margin-bottom: -2px;
}

.auth-tab.active {
	color: var(--second-color, #3f72af);
	border-bottom-color: var(--second-color, #3f72af);
	font-weight: 600;
}

.auth-tab:hover:not(.active) {
	color: var(--second-color, #3f72af);
	opacity: 0.7;
}

.action-btn {
	width: 100%;
	font-size: 16px;
	margin: 10px auto;
	text-transform: none;
}

.icon-spacing {
	margin-right: 8px;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	border: 0;
}

.forgot-password-wrapper {
	text-align: right;
	margin-top: 10px;
}

.forgot-password-link {
	color: var(--second-color);
	text-decoration: none;
	cursor: pointer;
	font-size: 13px;
}

.forgot-password-link:hover {
	text-decoration: underline;
}

.or-divider {
	display: flex;
	align-items: center;
	gap: 12px;
	margin: 20px 0;
}

.or-text {
	color: var(--text-color, #999);
	font-size: 14px;
	white-space: nowrap;
}

.google-btn {
	border-color: var(--third-color, #dbe2ef);
	color: var(--text-color, #333);
	text-transform: none;
	font-weight: 500;
}

/* --- MOBILE RESPONSIVE --- */
@media (max-width: 768px) {
	.auth-card {
		width: 90%;
	}

	.action-btn {
		font-size: auto;
		width: 100%;
		margin: 0px auto;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.icon-spacing {
		margin-right: 4px;
	}
}

.v-checkbox a {
	color: rgb(var(--v-theme-primary));
	font-weight: 600;
	text-decoration: underline;
}
</style>
