<template>
	<div>
		<h2>{{ $t("userHandling.accountTitle") }}:</h2>
	</div>

	<v-container class="py-10">
		<v-row justify="center">
			<v-col cols="12" md="8">
				<v-card v-if="user && userData" class="pa-8 profile-card" elevation="4">
					<!-- Header -->
					<div class="text-center mb-6">
						<v-avatar size="120" class="mb-4">
							<img v-if="user && user.photoURL" :src="user.photoURL" />
							<v-icon v-else size="120">mdi-account-circle</v-icon>
						</v-avatar>


						<div v-if="isVerified" class="verified-badge">
							<v-icon color="green">mdi-check-circle</v-icon>
							<span>{{ $t("userHandling.emailVerified") }}</span>
						</div>

						<div v-else class="unverified-badge" @click="toggleVerificationDialog">
							<v-icon color="red">mdi-alert-circle</v-icon>
							<span>{{ $t("userHandling.emailNotVerified") }}</span>
						</div>
					</div>

					<!-- User info -->
					<v-row>
						<v-col cols="12" md="6">
							<div class="info-block" v-if="user">
								<strong>{{ $t("userHandling.name") }}:</strong>
								<p>{{ userData.displayName }}</p>

								<strong>{{ $t("userHandling.email") }}:</strong>
								<p>{{ user.email }}</p>
							</div>
						</v-col>

						<v-col cols="12" md="6">
							<div class="info-block" v-if="user">
								<strong>{{ $t("database.study") }}:</strong>
								<p>{{ userData.study || "-" }}</p>

								<strong>{{ $t("database.specialization") }}:</strong>
								<p>{{ userData.specialization || "-" }}</p>
							</div>
						</v-col>
					</v-row>
					<br />
					<!-- Buttons -->
					<div class="button-row">
						<v-btn color="primary" class="mr-3" @click="editProfile">
							<v-icon left>mdi-account-edit</v-icon>
							<p style="margin-left: 10px;">{{ $t("operations.edit") }}</p>
						</v-btn>

						<v-btn color="secondary" class="mr-3" @click="togglePasswordResetDialog">
							<v-icon left>mdi-lock-reset</v-icon>
							<p style="margin-left: 10px;">{{ $t("operations.changePassword") }}</p>
						</v-btn>

						<v-btn color="red" @click="signOut">
							<v-icon left>mdi-logout</v-icon>
							<p style="margin-left: 10px;">{{ $t("operations.signOut") }}</p>
						</v-btn>
					</div>

					<!-- Favorite courses -->
					<div class="mt-4">
						<FavoriteCourses />
					</div>
				</v-card>

				<!-- Loading state -->
				<div v-else-if="loading" class="text-center my-10">
					<v-progress-circular indeterminate color="primary" size="48" />
				</div>

				<!-- Not logged in -->
				<div v-else>
					<v-alert type="error">
						{{ $t("errors.notLoggedIn") }}
					</v-alert>
				</div>
			</v-col>
		</v-row>


		<!-- Edit Profile Dialog -->
		<v-dialog v-model="dialog" persistent max-width="600px" class="dialog">
			<v-card>
				<v-card-title>
					<span class="headline">{{ $t("userHandling.editProfile") }}</span>
				</v-card-title>
				<v-card-text>
					<v-form ref="editForm">
						<v-text-field v-model="localEditData.displayName" :label="this.$t('userHandling.name')"
							required></v-text-field>
						<v-text-field v-model="localEditData.email" :label="this.$t('userHandling.email')" required
							readonly></v-text-field>
						<v-autocomplete v-model="localEditData.study" :items="studyNames" :label="this.$t('database.study')"
							required @update:modelValue="handleNewStudy"></v-autocomplete>
						<v-autocomplete v-model="localEditData.specialization" :items="specializations"
							:label="this.$t('database.specialization')"></v-autocomplete>
					</v-form>
				</v-card-text>
				<v-card-actions>
					<v-btn id="closeBtn" @click="closeDialog">
						{{ $t("operations.cancel") }}
					</v-btn>
					<v-btn id="saveBtn" @click="saveProfile">
						{{ $t("operations.save") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Verification Dialog -->
		<v-dialog v-model="verificationDialog" max-width="500" class="dialog">
			<v-card>
				<v-card-title>{{ $t("userHandling.userNotVerified") }}</v-card-title>
				<v-card-text>
					<v-btn class="btn btn-primary" @click="sendVerificationEmail()">
						{{ $t("userHandling.sendVerificationEmail") }}
					</v-btn>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn class="btn-accent" text @click="toggleVerificationDialog">
						{{ $t("operations.close") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Password Reset Dialog -->
		<v-dialog v-model="passwordResetDialog" max-width="500" class="dialog">
			<v-card>
				<v-card-title>{{ $t("userHandling.changePassword") }}</v-card-title>
				<v-card-text>
					<p>{{ $t("userHandling.passwordResetInstructions") }}</p>
					<v-btn class="btn btn-primary" @click="sendPasswordResetEmail()">
						{{ $t("userHandling.sendPasswordResetEmail") }}
					</v-btn>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn class="btn-accent" text @click="togglePasswordResetDialog">
						{{ $t("operations.close") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { auth, db } from "../../js/firebaseConfig";
import { onAuthStateChanged, signOut, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { ref as dbRef, get, set, update } from "firebase/database";
import studiesData from "../../data/studies.json";
import FavoriteCourses from "./FavoriteCourses.vue";
import { toast } from "vue3-toastify";

export default {
	components: { FavoriteCourses },
	data() {
		return {
			studies: {},
			user: null,
			userData: null,
			loading: true,
			dialog: false,
			editData: {
				displayName: "",
				email: "",
				study: "",
				specialization: "",
			},
			localEditData: {
				displayName: "",
				email: "",
				study: "",
				specialization: "",
			},
			verificationDialog: false,
			passwordResetDialog: false,
		};
	},
	computed: {
		studyNames() {
			return Object.keys(this.studies);
		},
		specializations() {
			return this.localEditData.study
				? this.studies[this.localEditData.study]
				: [];
		},
		isVerified() {
			return this.user && this.user.emailVerified;
		}
	},
	methods: {
		loadData() {
			try {
				this.studies = studiesData.studies;
			} catch (error) {
				console.error("There was an error loading the studies data:", error);
			}
		},
		editProfile() {
			if (this.user && this.userData) {
				this.localEditData = { ...this.userData };
				this.dialog = true;
			}
		},
		closeDialog() {
			this.dialog = false;
		},
		async saveProfile() {
			if (this.user) {
				if (this.localEditData.email !== this.user.email) {
					try {
						await this.user.updateEmail(this.localEditData.email);
					} catch (error) {
						console.error("Error updating email: ", error);
						toast.error(this.$t("error.emailUpdateFailed"));
						return;
					}
				}
				try {
					await update(dbRef(db, `users/${this.user.uid}`), {
						displayName: this.localEditData.displayName,
						email: this.localEditData.email,
						study: this.localEditData.study,
						specialization: this.localEditData.specialization,
					});
					this.userData = { ...this.localEditData };
					this.closeDialog();
				} catch (error) {
					console.error("Error updating profile: ", error);
				}
			}
		},
		async signOut() {
			try {
				await signOut(auth);
				this.user = null;
				this.userData = null;

				this.$router.push("/logg_inn");
			} catch (error) {
				console.error("Error signing out: ", error);
			}
		},
		loadLocalData() {
			if (!this.userData) {
				this.localEditData = {
					displayName: "",
					email: "",
					study: "",
					specialization: ""
				};
				return;
			}

			this.localEditData = { ...this.userData };
		},
		handleNewStudy() {
			this.localEditData.specialization = "";
		},
		toggleVerificationDialog() {
			this.verificationDialog = !this.verificationDialog;
		},
		sendVerificationEmail() {
			if (this.user) {
				sendEmailVerification(this.user)
					.then(() => {
						toast.success(this.$t("userHandling.verificationEmailSent"));
					})
					.catch((error) => {
						console.error("Error sending verification email: ", error);
						toast.error(this.$t("error.verificationEmailFailed"));
					});
			}
		},
		togglePasswordResetDialog() {
			this.passwordResetDialog = !this.passwordResetDialog;
		},
		sendPasswordResetEmail() {
			if (this.user) {
				auth.sendPasswordResetEmail(this.user.email)
					.then(() => {
						toast.success(this.$t("userHandling.passwordResetEmailSent"));
					})
					.catch((error) => {
						console.error("Error sending password reset email: ", error);
						toast.error(this.$t("error.passwordResetEmailFailed"));
					});
			}
		},
	},
	mounted() {
		// Fetch studies file
		this.loadData();

		// Handle user authentication state
		onAuthStateChanged(auth, async (currentUser) => {
			if (currentUser) {
				this.user = currentUser;
				const userDocRef = dbRef(db, `users/${currentUser.uid}`);
				const userDoc = await get(userDocRef);
				if (userDoc.exists()) {
					this.userData = userDoc.val();
				} else {
					// If user does not exist, show edit dialog
					this.localEditData = {
						displayName: currentUser.displayName || "",
						email: currentUser.email || "",
						study: "",
						specialization: "",
					};

					// Create a new user record with initial values
					await set(userDocRef, {
						displayName: currentUser.displayName || "",
						email: currentUser.email,
						study: "",
						specialization: "",
					});
				}

				this.loadLocalData();
			} else {
				this.user = null;
				this.userData = null;
			}
			this.loading = false;
		});
	},
};
</script>

<style scoped>
.profile-card {
	background-color: var(--third-color);
	border-radius: 10px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	border: 1px solid var(--first-color);
}

#saveBtn {
	padding: 10px 20px;
	border-radius: 5px;
	cursor: pointer;
	border: none;
	font-size: 14px !important;
	margin: 10px;
	background-color: var(--second-color);
	color: var(--fifth-color);
}

#closeBtn {
	padding: 10px 20px;
	border-radius: 5px;
	cursor: pointer;
	border: none;
	font-size: 14px !important;
	margin: 10px;
	background-color: var(--alert-error);
	/* Soft Red */
	color: var(--fifth-color);
}

#closeBtn:hover {
	background-color: #d32f2f;
	/* Darker Soft Red */
	color: var(--fifth-color);
}

.account-card {
	margin-bottom: 20px;
}

.user-avatar {
	margin-bottom: 20px;
}

.account_info strong {
	font-size: 16px;
}

.account_info span {
	margin-left: 5px;
	font-size: 16px;
}

@media (max-width: 768px) {
	.account-card {
		padding: 10px;
	}

	.user-avatar {
		margin: 0 auto 20px;
	}

	.account_info span {
		font-size: 4vw;
		margin-left: 0;
	}

	.account_info span::after {
		content: "\A";
		/* Adds a double line break */
		white-space: pre;
		/* Preserves the line breaks */
	}

	.account_info strong {
		font-size: 4.2vw;
	}

	.account_info strong::after {
		content: "\A";
		/* Adds a line break */
		white-space: pre;
		/* Preserves the line break */
	}

	#closeBtn,
	#saveBtn {
		margin: auto;
		font-size: 14px !important;
		width: 40% !important;
	}

	.v-btn {
		/* margin: auto; */
		font-size: 14px !important;
		/* width: 60% !important; */
	}
}
</style>
