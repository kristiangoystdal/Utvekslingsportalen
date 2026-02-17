<template>
	<div>
		<h2>{{ $t("adminPage.pageHeader") }}:</h2>
	</div>
	<br />
	<v-container>
		<!-- User List -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("adminPage.userListTitle") }} ({{ users.length }})</h3>
			<v-text-field v-model="userSearch" label="Search" prepend-inner-icon="mdi-magnify" variant="outlined" hide-details
				single-line density="compact" style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<v-data-table :headers="headers" :items="users" :items-per-page="5" :search="userSearch" density="compact"
				item-key="uid">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="deleteUser(item)">mdi-delete</v-icon>
				</template>
			</v-data-table>
		</v-card>
		<br><br>
		<!-- FAQ List -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("adminPage.faqListTitle") }} ({{ faqs.length }})</h3>
			<v-text-field v-model="faqSearch" label="Search" prepend-inner-icon="mdi-magnify" variant="outlined" hide-details
				single-line density="compact" style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<v-data-table :headers="faqHeaders" :items="faqs" :items-per-page="5" :search="faqSearch" density="compact"
				item-key="id">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="editFaq(item)">mdi-pencil</v-icon>
					<v-icon @click="deleteFaq(item)">mdi-delete</v-icon>
				</template>
			</v-data-table>
			<v-btn class="btn-primary" @click="openFaqDialog">{{ $t("adminPage.addFAQTitle") }}</v-btn>
		</v-card>
		<br><br>
		<!--  Exchange List -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("adminPage.exchangeListTitle") }} ({{ exchanges.length }})</h3>
			<v-text-field v-model="exchangeSearch" label="Search" prepend-inner-icon="mdi-magnify" variant="outlined"
				hide-details single-line density="compact"
				style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<!-- Exchange list content goes here -->
			<v-data-table :headers="exchangeHeaders" :items="exchanges" :items-per-page="5" :search="exchangeSearch"
				density="compact">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="editExchange(item)">mdi-pencil</v-icon>
					<v-icon @click="deleteExchange(item)">mdi-delete</v-icon>
				</template>
			</v-data-table>
			<v-btn class="btn-primary" @click="openExchangeDialog">{{ $t("adminPage.addExchangeTitle") }}</v-btn>
		</v-card>

		<br><br>
		<!-- Course Search  -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("adminPage.courseListTitle") }} ({{ courseData.length }})</h3>
			<v-text-field v-model="courseSearch" label="Search" prepend-inner-icon="mdi-magnify" variant="outlined"
				hide-details single-line density="compact"
				style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<!-- Course list content goes here -->
			<v-data-table :headers="courseHeaders" :items="courseData" :items-per-page="5" :search="courseSearch"
				density="compact">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="editExchangeCourse(item.exchangeID)">mdi-pencil</v-icon>
				</template>
			</v-data-table>
		</v-card>


		<!-- Edit FAQ Dialog -->
		<v-dialog v-model="faqDialog" max-width="500px">
			<v-card class="mb-4">
				<v-card-title>
					<span class=" headline">{{ faqDialogTitle }}</span>
				</v-card-title>
				<v-card-text>
					<v-container>
						<v-row>
							<v-col cols="12">
								<v-text-field v-model="localFaqData.question" label="Question"></v-text-field>
							</v-col>
							<v-col cols="12">
								<v-text-field v-model="localFaqData.answer" label="Answer"></v-text-field>
							</v-col>
						</v-row>
					</v-container>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn class="btn-red" text @click="closeFaqDialog">Cancel</v-btn>
					<v-btn class="btn-primary" text @click="saveFaq">Save</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Edit Exchange Dialog -->
		<v-dialog v-model="exchangeDialog" max-width="80%">
			<v-card>
				<v-card-title>
					<span class=" headline">{{ exchangeDialogTitle }}</span>
				</v-card-title>
				<v-card-text>
					<EditExchange :exchangeToEdit="localUserExchange" :adminMode="true" @close="closeExchangeDialog"
						@save="saveExchange" />
				</v-card-text>
			</v-card>
		</v-dialog>
	</v-container>

	<!-- Confirmation Dialog -->
	<Confirmation ref="userConfirmationDialog" :value="userConfirmation" :title="$t('adminPage.deleteUserConfirmation')"
		:message="localEditData.displayName !== '' ? localEditData.displayName : 'Undefined'" @yes="onUserConfirmYes"
		@no="onUserConfirmNo" />

	<Confirmation ref="faqConfirmationDialog" :value="faqConfirmation" :title="$t('adminPage.deleteFAQConfirmation')"
		:message="localFaqData.question != '' ? localFaqData.question : 'Undefined'" @yes="onFaqConfirmYes"
		@no="onFaqConfirmNo" />

	<Confirmation ref="exchangeConfirmationDialog" :value="exchangeConfirmation"
		:title="$t('adminPage.deleteExchangeConfirmation')"
		:message="localExchangeData.id != '' ? localExchangeData.id + ': ' + localExchangeData.country + ' - ' + localExchangeData.university : 'Undefined'"
		@yes="onExchangeConfirmYes" @no="onExchangeConfirmNo" />

</template>

<script>
import { db } from "../../js/firebaseConfig";
import { ref as dbRef, get, set, update } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from "vue3-toastify";
import Confirmation from "../common/Confirmation.vue";
import EditExchange from "../exchanges/EditExchange.vue";


export default {
	components: { Confirmation, EditExchange },
	data() {
		return {
			headers: [
				{ title: 'User Id', value: 'uid', width: '20%' },
				{ title: 'Name', value: 'displayName', width: '30%' },
				{ title: 'Email', value: 'email', width: '20%' },
				{ title: '', value: 'actions', sortable: false, width: '5%', align: 'end' },
			],
			users: [],
			faqs: [],
			userSearch: '',
			userData: null,
			localEditData: {
				uid: '',
				displayName: '',
				email: '',
			},
			loading: true,
			dialog: false,
			faqDialog: false,
			faqDialogTitle: '',
			localFaqData: {
				question: '',
				answer: '',
			},
			faqHeaders: [
				{ title: this.$t("adminPage.question"), value: 'question', width: '35%' },
				{ title: this.$t("adminPage.answer"), value: 'answer', width: '55%' },
				{ title: "", value: 'actions', sortable: false, width: '10%', align: 'end' },
			],
			faqSearch: '',
			exchanges: [],
			exchangeHeaders: [
				{ title: "ID", value: 'id', width: '5%' },
				{ title: this.$t("database.country"), value: 'country', width: '12%' },
				{ title: this.$t("database.university"), value: 'university', width: '33%' },
				{ title: this.$t("database.study"), value: 'study', width: '25%' },
				{ title: this.$t("database.numSemesters"), value: 'numSemesters', width: '10%', align: 'center' },
				{ title: this.$t("database.year"), value: 'year', width: '5%', align: 'center' },
				{ title: "", value: 'actions', sortable: false, width: '10%', align: 'end' },
			],
			exchangeDialog: false,
			exchangeDialogTitle: '',
			localUserExchange: {
				university: null,
				country: null,
				studyYear: null,
				study: null,
				specialization: null,
				numSemesters: null,
				semesters: [],
				courses: {
					Høst: {},
					Vår: {},
				},
				sameUniversity: true,
				secondUniversity: "null",
				secondCountry: "null",
			},
			localExchangeData: {},
			userConfirmation: false,
			faqConfirmation: false,
			exchangeConfirmation: false,
			exchangeSearch: '',
			courseSearch: '',
			courseHeaders: [
				{ title: 'ID', value: 'exchangeID', width: '10%' },
				{ title: this.$t("database.courseCode"), value: 'code', width: '5%' },
				{ title: this.$t("database.courseName"), value: 'name', width: '10%' },
				{ title: this.$t("database.replacedCourseCode"), value: 'replacedCourseCode', width: '10%', align: 'center' },
				{ title: this.$t("database.replacedCourseName"), value: 'replacedCourseName', width: '20%', align: 'center' },
				{ title: this.$t("database.university"), value: 'university', width: '15%', align: 'center' },
				{ title: this.$t("database.semester"), value: 'semester', width: '10%', align: 'center' },
				{ title: this.$t("database.year"), value: 'year', width: '5%', align: 'center' },
				{ title: this.$t("database.ECTSPoints"), value: 'ECTSPoints', width: '5%', align: 'center' },
				{ title: "", value: 'actions', sortable: false, width: '5%', align: 'end' },
			],
			courseData: [],
		};
	},
	methods: {
		onAuthStateChanged() {
			const auth = getAuth();
			onAuthStateChanged(auth, (user) => {
				if (user) {
					this.userData = user;
					this.loadUserData();
					this.loadFAQData();
					this.loadExchangeData();
					this.fetchCourseData();
				} else {
					this.userData = null;
					this.users = [];
					try {
						this.$router.push("/");
					} catch (error) {
						console.error("Navigation error: ", error);
					}
				}
			});
		},
		openUserConfirmationDialog() {
			this.$refs.userConfirmationDialog.dialog = true;
		},
		async loadUserData() {
			const userRef = dbRef(db, "users");
			const userSnapshot = await get(userRef);
			if (userSnapshot.exists()) {
				const usersData = userSnapshot.val();
				this.users = Object.keys(usersData).map(uid => ({ uid, ...usersData[uid] }));
			}
		},
		async deleteUser(user) {
			this.localEditData = { ...user };
			this.openUserConfirmationDialog();
		},
		async onUserConfirmYes() {
			try {
				await set(dbRef(db, `users/${this.localEditData.uid}`), null);
				this.loadUserData();
				toast.success(this.$t("notifications.userDeleted"));
			} catch (error) {
				toast.error(this.$t("notifications.userDeleteFailure"));
				console.error("Error deleting user: ", error);
			}
		},
		async onUserConfirmNo() {
			this.localEditData = {};
		},
		async loadFAQData() {
			try {
				const faqRef = dbRef(db, "faq");
				const faqSnapshot = await get(faqRef);
				if (faqSnapshot.exists()) {
					const faqData = faqSnapshot.val();
					// Map data into an array of FAQs with id, question, and answer
					this.faqs = Object.entries(faqData).map(([id, faq]) => ({
						id,
						question: faq.question,
						answer: faq.answer,
					}));
				} else {
					this.faqs = []; // If no data exists, set an empty array
				}
			} catch (error) {
				console.error("Error loading FAQ data:", error);
			}
		},
		async deleteFaq(faq) {
			this.localFaqData = { ...faq };
			this.openFaqConfirmationDialog();
		},
		async onFaqConfirmYes() {
			try {
				const faqRef = dbRef(db, `faq/${this.localFaqData.id}`);
				await set(faqRef, null); // Delete the FAQ
				this.loadFAQData(); // Reload FAQs after deletion
				toast.success(this.$t("notifications.faqDeleted"));
			} catch (error) {
				toast.error(this.$t("notifications.faqDeleteFailure"));
				console.error("Error deleting FAQ:", error);
			}
		},
		openFaqConfirmationDialog() {
			this.$refs.faqConfirmationDialog.dialog = true;
		},
		async onFaqConfirmNo() {
			this.localFaqData = {};
		},
		editFaq(faq) {
			this.localFaqData = { ...faq }; // Copy FAQ data into localFaqData
			this.faqDialogTitle = this.$t("adminPage.editFAQTitle");
			this.faqDialog = true; // Open the dialog
		},
		async saveFaq() {
			try {
				const faqRef = dbRef(db, `faq/${this.localFaqData.id || Date.now()}`); // Use id if exists, otherwise generate one
				await set(faqRef, {
					question: this.localFaqData.question,
					answer: this.localFaqData.answer,
				});
				this.loadFAQData(); // Reload FAQ data after saving
				this.closeFaqDialog(); // Close the dialog
				toast.success(this.$t("notifications.faqSaved"));
			} catch (error) {
				console.error("Error saving FAQ:", error);
				toast.error(this.$t("notifications.faqSaveFailure"));
			}
		},
		openFaqDialog() {
			this.localFaqData = { question: '', answer: '' }; // Reset to empty data
			this.faqDialogTitle = this.$t("adminPage.addFAQTitle");
			this.faqDialog = true;
		},
		closeFaqDialog() {
			this.faqDialog = false;
		},
		async loadExchangeData() {
			try {
				const exchangeRef = dbRef(db, "exchanges");
				const exchangeSnapshot = await get(exchangeRef);
				if (exchangeSnapshot.exists()) {
					const exchangesData = exchangeSnapshot.val();
					this.exchanges = Object.keys(exchangesData).map(id => ({ id, ...exchangesData[id] }));
				}
			} catch (error) {
				console.error("Error loading exchange data:", error);
				toast.error(this.$t("notifications.exchangeLoadFailure"));
			}
		},
		async addExchange() {
			// Implement exchange adding logic here
			this.localUserExchange = {
				university: null,
				country: null,
				studyYear: null,
				study: null,
				numSemesters: null,
				semesters: [],
				courses: {
					Høst: {},
					Vår: {},
				},
				sameUniversity: true,
				secondUniversity: "null",
				secondCountry: "null",
			};
			this.exchangeDialogTitle = this.$t("adminPage.addExchangeTitle");
			this.exchangeDialog = true;
		},
		editExchange(exchange) {
			// Implement exchange editing logic here
			this.localUserExchange = { ...exchange };
			this.exchangeDialogTitle = this.$t("adminPage.editExchangeTitle");
			this.exchangeDialog = true;
		},
		editExchangeCourse(exchangeID) {
			const exchange = this.exchanges.find(ex => ex.id === exchangeID);

			// Implement exchange editing logic here
			this.localUserExchange = { ...exchange };
			this.exchangeDialogTitle = this.$t("adminPage.editExchangeTitle");
			this.exchangeDialog = true;
		},
		async saveExchange(exchangeData) {
			// Implement exchange saving logic here
			try {
				if (!exchangeData.id) {
					// New exchange, generate an ID
					exchangeData.id = Date.now().toString();
				}
				const exchangeRef = dbRef(db, `exchanges/${exchangeData.id}`);
				await update(exchangeRef, exchangeData);
				await this.loadExchangeData(); // Reload exchange data after saving
				await this.fetchCourseData(); // Refresh course data
				this.closeExchangeDialog(); // Close the dialog
				toast.success(this.$t("notifications.exchangeUpdated"));
			} catch (error) {
				console.error("Error saving exchange:", error);
				toast.error(this.$t("notifications.exchangeUpdateFailure"));
			}
		},
		async deleteExchange(exchange) {
			// Implement exchange deletion logic here
			this.localExchangeData = { ...exchange };
			this.openExchangeConfirmationDialog();
		},
		openExchangeConfirmationDialog() {
			this.$refs.exchangeConfirmationDialog.dialog = true;
		},
		async onExchangeConfirmYes() {
			// Implement exchange deletion confirmation logic here
			try {
				const exchangeRef = dbRef(db, `exchanges/${this.localExchangeData.id}`);
				await set(exchangeRef, null); // Delete the exchange
				await this.loadExchangeData(); // Reload exchanges after deletion
				toast.success(this.$t("notifications.exchangeDeleted"));
			} catch (error) {
				toast.error(this.$t("notifications.exchangeDeleteFailure"));
				console.error("Error deleting exchange:", error);
			}
			this.$refs.exchangeConfirmationDialog.dialog = false;
		},
		onExchangeConfirmNo() {
			this.localExchangeData = {};
			this.$refs.exchangeConfirmationDialog.dialog = false;
		},
		openExchangeDialog() {
			this.localExchangeData = { country: '', university: '', study: '', numSemesters: 1 }; // Reset to empty data
			this.exchangeDialogTitle = this.$t("adminPage.addExchangeTitle");
			this.exchangeDialog = true;
		},
		closeExchangeDialog() {
			this.exchangeDialog = false;
			this.localUserExchange = {
				university: null,
				country: null,
				studyYear: null,
				study: null,
				numSemesters: null,
				semesters: [],
				courses: {
					Høst: {},
					Vår: {},
				},
				sameUniversity: true,
				secondUniversity: "null",
				secondCountry: "null",
			};
		},
		async fetchCourseData() {
			try {
				const snapshot = await get(dbRef(db, "exchanges"));
				if (!snapshot.exists()) {
					console.error("No exchange data available");
					return;
				}

				const exchanges = snapshot.val();
				const courseList = [];

				const toArray = (obj) =>
					Array.isArray(obj) ? obj : Object.values(obj || {});

				for (const exchangeID in exchanges) {
					const exchange = exchanges[exchangeID];

					if (!exchange.courses) continue;

					// Convert Høst and Vår to arrays AND FILTER OUT INVALID ITEMS
					const host = toArray(exchange.courses.Høst).filter(
						c => c && typeof c === "object"
					);

					const vaar = toArray(exchange.courses.Vår).filter(
						c => c && typeof c === "object"
					);

					const sommer = toArray(exchange.courses.Sommer).filter(
						c => c && typeof c === "object"
					);

					// Combine them
					const all = [...host, ...vaar, ...sommer];

					for (const course of all) {
						let semester = "";

						// Check if course is inside Høst
						if (exchange.courses.Høst) {
							const hostList = toArray(exchange.courses.Høst);
							if (hostList.some(c => JSON.stringify(c) === JSON.stringify(course))) {
								semester = "Høst";
							}

						}

						// Check if course is inside Vår
						if (!semester && exchange.courses.Vår) {
							const vaarList = toArray(exchange.courses.Vår);
							if (vaarList.some(c => JSON.stringify(c) === JSON.stringify(course))) {
								semester = "Vår";
							}
						}

						// Check if semester is inside Sommer
						if (!semester && exchange.courses.Sommer) {
							const sommerList = toArray(exchange.courses.Sommer);
							if (sommerList.some(c => JSON.stringify(c) === JSON.stringify(course))) {
								semester = "Sommer";
							}
						}

						courseList.push({
							exchangeID: exchangeID,
							code: course.courseCode ?? "",
							name: course.courseName ?? "",
							replacedCourseCode: course.replacedCourseCode ?? "",
							replacedCourseName: course.replacedCourseName ?? "",
							university: exchange.university ?? "",
							semester,
							year: course.year ?? "",
							ECTSPoints: course.ECTSPoints ?? "",
						});
					}
				}

				// Sort alphabetically
				courseList.sort((a, b) => a.code.localeCompare(b.code));

				// Assign final data to table
				this.courseData = courseList;

			} catch (error) {
				console.error("Error fetching course data:", error);
			}
		}
	},
	mounted() {
		this.onAuthStateChanged();
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
	color: var(--fifth-color);
}

#closeBtn:hover {
	background-color: #d32f2f;
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
		white-space: pre;
	}

	.account_info strong {
		font-size: 4.2vw;
	}

	.account_info strong::after {
		content: "\A";
		white-space: pre;
	}

	#closeBtn,
	#saveBtn {
		margin: auto;
		width: 40% !important;
	}

	.v-btn {
		margin: auto;
		font-size: 14px !important;
		width: 50% !important;
	}
}
</style>