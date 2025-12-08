<template>
	<div>
		<h2>{{ $t("userHandling.accountTitle") }}:</h2>
	</div>
	<br />
	<v-container>
		<v-row justify="center">
			<v-col cols="12" md="8">
				<v-card class="pa-5 account-card">
					<v-card-text>
						<v-alert v-if="loading" type="info" dense>
							{{ $t("userHandling.loadingUser") }}
						</v-alert>
						<template v-else-if="user && userData">
							<v-row>
								<v-col cols="12" md="4" class="text-center">
									<v-avatar class="mb-4 mx-auto user-avatar" size="120" v-if="user.photoURL">
										<img :src="user.photoURL" alt="User Photo" class="profile-img" />
									</v-avatar>
									<v-icon v-else size="120">mdi-account-circle</v-icon>
									<div>
										<div v-if="user.emailVerified" class="text-success">
											<v-icon left>mdi-check-circle</v-icon>
											{{ $t("userHandling.emailVerified") }}
										</div>
										<div v-else class="text-error">
											<v-icon left>mdi-alert-circle</v-icon>
											{{ $t("userHandling.emailNotVerified") }}
										</div>
									</div>
								</v-col>
								<v-col cols="12" md="8">
									<div class="account_info">
										<strong>{{ $t("userHandling.name") }}:</strong>
										<span> {{ userData.displayName }} </span> <br />
										<strong>{{ $t("userHandling.email") }}:</strong>
										<span>{{ user.email }}</span> <br />
										<strong v-if="userData.study">{{ $t("database.study") }}:</strong>
										<span v-if="userData.study">{{ userData.study }}</span> <br />
										<strong v-if="userData.specialization">{{ $t("database.specialization") }}:</strong>
										<span v-if="userData.specialization">{{ userData.specialization }}</span> <br />
									</div>
								</v-col>
							</v-row>
							<v-row justify="end">
								<v-col cols="12" class="text-right"> </v-col>
							</v-row>
						</template>
						<v-alert v-else type="error" dense>
							{{ $t("errors.notLoggedIn") }}
						</v-alert>

						<FavoriteCourses v-if="user && userData" />
					</v-card-text>
					<v-card-actions>
						<v-btn class="btn btn-primary" @click="editProfile">
							<v-icon left>mdi-account-edit</v-icon>
							{{ $t("userHandling.editProfile") }}
						</v-btn>
						<br />
						<v-btn class="btn btn-red" @click="signOut">
							<v-icon left>mdi-logout</v-icon>
							{{ $t("operations.signOut") }}
						</v-btn>
					</v-card-actions>
				</v-card>
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
	</v-container>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { auth, db } from "../../js/firebaseConfig";
import { onAuthStateChanged, signOut, sendEmailVerification } from "firebase/auth";
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
		verificationDialog() {
			if (this.user && !this.user.emailVerified) {
				return true;
			}
			return false;
		},
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
			this.localEditData = this.userData;
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
	background-color: #e53935;
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
		margin: auto;
		font-size: 14px !important;
		width: 50% !important;
	}
}
</style>
