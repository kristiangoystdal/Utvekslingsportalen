<template>
	<div>
		<h2>{{ $t("admin.pageHeader") }}:</h2>
	</div>
	<br />
	<v-container>
		<!--  Exchange List -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("admin.exchangeListTitle") }} ({{ exchanges.length }})</h3>
			<v-text-field v-model="exchangeSearch" :label="$t('admin.search')" prepend-inner-icon="mdi-magnify" variant="outlined"
				hide-details single-line density="compact"
				style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<!-- Exchange list content goes here -->
			<v-data-table :headers="exchangeHeaders" :items="exchanges" :items-per-page="5" :search="exchangeSearch"
				:custom-filter="makeRowFilter(exchangeHeaders)" density="compact">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="editExchange(item)">mdi-pencil</v-icon>
					<v-icon @click="deleteExchange(item)">mdi-delete</v-icon>
				</template>
			</v-data-table>
			<div style="display: inline-flex; gap: 10px; margin-top: 10px;">
				<v-btn class="btn-primary" @click="openExchangeDialog">{{ $t("admin.addExchangeTitle") }}</v-btn>
				<v-btn class="btn-third" @click="refreshExchangesData">{{ $t("admin.refreshExchangeData") }}</v-btn>
			</div>
		</v-card>

		<br>
		<!-- Course Search  -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("admin.courseListTitle") }} ({{ courseData.length }})</h3>
			<v-text-field v-model="courseSearch" :label="$t('admin.search')" prepend-inner-icon="mdi-magnify" variant="outlined"
				hide-details single-line density="compact"
				style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<!-- Course list content goes here -->
			<v-data-table :headers="courseHeaders" :items="courseData" :items-per-page="5" :search="courseSearch"
				:custom-filter="makeRowFilter(courseHeaders)" density="compact">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="editExchangeCourse(item.exchangeID)">mdi-pencil</v-icon>
				</template>
			</v-data-table>
			<div style="display: inline-flex; gap: 10px; margin-top: 10px;">
				<v-btn class="btn-third" @click="refreshExchangesData">{{ $t("admin.refreshCourseData") }}</v-btn>
			</div>
		</v-card>

		<br>

		<!-- User List -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("admin.userListTitle") }} ({{ users.length }})</h3>
			<v-text-field v-model="userSearch" :label="$t('admin.search')" prepend-inner-icon="mdi-magnify" variant="outlined" hide-details
				single-line density="compact" style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<v-data-table :headers="headers" :items="users" :items-per-page="5" :search="userSearch"
				:custom-filter="makeRowFilter(headers)" density="compact" item-key="uid">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="deleteUser(item)">mdi-delete</v-icon>
				</template>
			</v-data-table>
		</v-card>
		<br>

		<!-- FAQ List -->
		<v-card style="padding: 20px ;">
			<h3>{{ $t("admin.faqListTitle") }} ({{ faqs.length }})</h3>
			<v-text-field v-model="faqSearch" :label="$t('admin.search')" prepend-inner-icon="mdi-magnify" variant="outlined" hide-details
				single-line density="compact" style="width: 95%; margin: 10px auto; border-radius: 5px;"></v-text-field>
			<v-data-table :headers="faqHeaders" :items="faqs" :items-per-page="5" :search="faqSearch" density="compact"
				item-key="id">
				<template v-slot:item.actions="{ item }">
					<v-icon @click="editFaq(item)">mdi-pencil</v-icon>
					<v-icon @click="deleteFaq(item)">mdi-delete</v-icon>
				</template>
			</v-data-table>
			<v-btn class="btn-primary" @click="openFaqDialog">{{ $t("admin.addFAQTitle") }}</v-btn>
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
								<v-text-field v-model="localFaqData.question" :label="$t('admin.question')"></v-text-field>
							</v-col>
							<v-col cols="12">
								<v-text-field v-model="localFaqData.answer" :label="$t('admin.answer')"></v-text-field>
							</v-col>
						</v-row>
					</v-container>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn class="btn-red" text @click="closeFaqDialog">{{ $t("actions.cancel") }}</v-btn>
					<v-btn class="btn-primary" text @click="saveFaq">{{ $t("actions.save") }}</v-btn>
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
	<Confirmation ref="userConfirmationDialog" :value="userConfirmation" :title="$t('admin.deleteUserConfirmation')"
		:message="localEditData.displayName !== '' ? localEditData.displayName : $t('admin.undefined')" @yes="onUserConfirmYes"
		@no="onUserConfirmNo" />

	<Confirmation ref="faqConfirmationDialog" :value="faqConfirmation" :title="$t('admin.deleteFAQConfirmation')"
		:message="localFaqData.question != '' ? localFaqData.question : $t('admin.undefined')" @yes="onFaqConfirmYes"
		@no="onFaqConfirmNo" />

	<Confirmation ref="exchangeConfirmationDialog" :value="exchangeConfirmation"
		:title="$t('admin.deleteExchangeConfirmation')"
		:message="localExchangeData.id != '' ? localExchangeData.id + ': ' + localExchangeData.country + ' - ' + localExchangeData.university : $t('admin.undefined')"
		@yes="onExchangeConfirmYes" @no="onExchangeConfirmNo" />

</template>

<script>
import { mapGetters } from "vuex";
import { db } from "../../js/firebaseConfig";
import { ref as dbRef, get, set, update } from "firebase/database";
import { toast } from "vue3-toastify";
import Confirmation from "../common/Confirmation.vue";
import EditExchange from "../exchanges/EditExchange.vue";

import { getExchangesData, refreshExchangesData } from "../../js/exchangesCache";

export default {
	components: { Confirmation, EditExchange },
	data() {
		return {
			headers: [
				{ title: this.$t("admin.userId"), value: 'uid', width: '20%' },
				{ title: this.$t("admin.name"), value: 'displayName', width: '30%' },
				{ title: this.$t("admin.email"), value: 'email', width: '20%' },
				{ title: '', value: 'actions', sortable: false, width: '5%', align: 'end' },
			],
			users: [],
			faqs: [],
			userSearch: '',
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
				{ title: this.$t("admin.question"), value: 'question', width: '35%' },
				{ title: this.$t("admin.answer"), value: 'answer', width: '55%' },
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
	computed: {
		...mapGetters(["user"]),
		isAdmin() {
			const adminUserId = import.meta.env.VITE_ADMIN_USER_ID;
			return !!adminUserId && !!this.user && this.user.uid === String(adminUserId);
		},
	},
	watch: {
		user: {
			handler(newUser) {
				if (newUser && this.isAdmin) {
					this.loadUserData();
					this.loadFAQData();
					this.loadExchangeData();
					this.fetchCourseData();
				} else {
					this.users = [];
					try {
						this.$router.push("/");
					} catch (error) {
						console.error("Navigation error: ", error);
					}
				}
			},
			immediate: true,
		},
	},
	methods: {
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
			this.faqDialogTitle = this.$t("admin.editFAQTitle");
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
			this.faqDialogTitle = this.$t("admin.addFAQTitle");
			this.faqDialog = true;
		},
		closeFaqDialog() {
			this.faqDialog = false;
		},
		async refreshExchangesData() {
			try {
				await refreshExchangesData();
				await this.loadExchangeData();
			} catch (error) {
				console.error("Error refreshing exchange data:", error);
			}
		},
		async loadExchangeData() {
			try {
				const exchanges = await getExchangesData();
				if (exchanges) {
					this.exchanges = exchanges ? Object.keys(exchanges).map(id => ({ id, ...exchanges[id] })) : [];
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
			this.exchangeDialogTitle = this.$t("admin.addExchangeTitle");
			this.exchangeDialog = true;
		},
		editExchange(exchange) {
			// Implement exchange editing logic here
			this.localUserExchange = { ...exchange };
			this.exchangeDialogTitle = this.$t("admin.editExchangeTitle");
			this.exchangeDialog = true;
		},
		editExchangeCourse(exchangeID) {
			const exchange = this.exchanges.find(ex => ex.id === exchangeID);

			// Implement exchange editing logic here
			this.localUserExchange = { ...exchange };
			this.exchangeDialogTitle = this.$t("admin.editExchangeTitle");
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
			this.exchangeDialogTitle = this.$t("admin.addExchangeTitle");
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
				const exchanges = await getExchangesData();
				if (!exchanges) {
					console.error("No exchange data available");
					return;
				}

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
		},
		// Turns any value into searchable text
		toSearchText(v) {
			if (v == null) return "";
			if (Array.isArray(v)) return v.map(this.toSearchText).join(" ");
			if (typeof v === "object") return Object.values(v).map(this.toSearchText).join(" ");
			return String(v);
		},
		// Factory that returns a Vuetify custom-filter which searches the whole row,
		// using the provided headers' "value" keys.
		makeRowFilter(headers) {
			// Capture keys once
			const keys = (headers || [])
				.map(h => h?.value)
				.filter(v => typeof v === "string" && v.length > 0 && v !== "actions");

			return (value, search, item) => {
				const q = String(search || "").toLowerCase().trim();
				if (!q) return true;

				const words = q.split(/\s+/).filter(Boolean);
				const raw = item?.raw ?? item ?? {};

				const rowText = keys
					.map(k => this.toSearchText(raw[k]))
					.join(" ")
					.toLowerCase();

				return words.every(w => rowText.includes(w));
			};
		},
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
	background-color: var(--color-danger);
	color: var(--fifth-color);
}

#closeBtn:hover {
	background-color: var(--color-danger-hover);
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