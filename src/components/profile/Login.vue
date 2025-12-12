<template>
	<div>
		<h2 v-if="login" class="sr-only">{{ $t("userHandling.loginTitle") }}:</h2>
		<h2 v-else class="sr-only">{{ $t("userHandling.registerTitle") }}:</h2>
		<br />
		<div class="login-container">
			<v-card v-if="login" class="login-card box box-third-color">
				<v-card-text>
					<h3 class="title">{{ $t("userHandling.loginWithEmailTitle") }}</h3>
					<v-form @submit.prevent="loginWithEmail">
						<v-text-field label="Email" v-model="email" type="email" required outlined hide-details></v-text-field>
						<br />
						<v-text-field label="Password" v-model="password" type="password" required outlined
							hide-details></v-text-field>
						<br />
						<v-btn class="login-btn" color="primary" dark type="submit">
							<v-icon left class="icon-spacing">mdi-login</v-icon>
							{{ $t("operations.signIn") }}
						</v-btn>
						<br /><br />
						<v-btn class="login-btn" color="secondary" dark @click="switchLoginRegister">
							<v-icon left class="icon-spacing">mdi-account-plus</v-icon>
							{{ $t("userHandling.makeNewAccount") }}
						</v-btn>
						<div class="text-center" style="margin-top: 15px;">
							<span @click.prevent="sendResetPasswordEmail" class="forgot-password-link">
								{{ $t("userHandling.forgotPassword") }}
							</span>
						</div>
						<br />
						<v-divider></v-divider>
						<br />

						<h3 class="text-center">
							{{ $t("userHandling.loginWithGoogleTitle") }}
						</h3>

						<v-btn class="login-btn btn-secondary" dark @click="loginWithGoogle">
							<v-icon left class="icon-spacing">mdi-google</v-icon>
							{{ $t("userHandling.loginWithGoogle") }}
						</v-btn>
					</v-form>
				</v-card-text>
			</v-card>

			<v-card v-if="!login" class="register-card box box-third-color">
				<v-card-text>
					<h3 class="title">{{ $t("userHandling.registerWithEmailTitle") }}</h3>
					<v-form @submit.prevent="registerWithEmail">
						<v-text-field label="Name" v-model="name" type="text" required outlined hide-details autocomplete="name" />
						<br />

						<v-text-field label="Email" v-model="email" type="email" required outlined hide-details
							autocomplete="username" />
						<br />

						<v-text-field label="Password" v-model="password" type="password" required outlined hide-details
							autocomplete="new-password" />
						<br />

						<v-btn class="register-btn" color="primary" dark type="submit" :disabled="!isFormValid">
							<v-icon left class="icon-spacing">mdi-account-plus</v-icon>
							{{ $t("operations.register") }}
						</v-btn>
						<br /><br />

						<v-btn class="switch-btn" color="secondary" dark @click="switchLoginRegister">
							<v-icon left class="icon-spacing">mdi-login</v-icon>
							{{ $t("userHandling.haveAccount") }}
						</v-btn>

						<br /> <br />
						<v-divider></v-divider>
						<br />

						<h3 class="text-center">
							{{ $t("userHandling.loginWithGoogleTitle") }}
						</h3>

						<v-btn class="login-btn btn-secondary" dark @click="loginWithGoogle">
							<v-icon left class="icon-spacing">mdi-google</v-icon>
							{{ $t("userHandling.loginWithGoogle") }}
						</v-btn>
					</v-form>
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

export default {
	data() {
		return {
			name: "",
			email: "",
			password: "",
			login: true,
		};
	},
	computed: {
		isFormValid() {
			const isPasswordValid = this.password.length >= 6 && this.password.length <= 50;
			const isEmailValid = this.email.includes("@") && this.email.length <= 100;
			const isNameValid = this.name.length <= 50 && this.name.length > 0;
			return isPasswordValid && isEmailValid && isNameValid;
		},
	},
	methods: {
		switchLoginRegister() {
			this.login = !this.login;
		},
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
				} else if (!this.email.includes("@")) {
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

				toast.success("Account created successfully!");
				this.$router.push("/profil");
			} catch (error) {
				console.error("Error during email registration:", error);
				toast.error("Registration failed");
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

/* --- CARD STYLES --- */
.login-card,
.register-card {
	width: 400px;
	padding: 20px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	border-radius: 8px;
}

/* --- TITLES --- */
.title {
	font-size: 24px;
	text-align: center;
	margin-bottom: 20px;
}

/* --- BUTTONS --- */
.login-btn,
.register-btn,
.switch-btn {
	width: 100%;
	font-size: 16px;
	margin: 10px auto;
	text-transform: none;
	/* keep text as defined */
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

.forgot-password-link {
	color: #1976d2;
	/* Vuetify primary color */
	text-decoration: none;
	cursor: pointer;
	font-size: 1vw;
}


/* --- MOBILE RESPONSIVE --- */
@media (max-width: 768px) {

	.login-card,
	.register-card {
		width: 90%;
		align-items: center;
	}

	.login-btn,
	.register-btn,
	.switch-btn {
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
</style>
