<template>
	<div>
		<h2>{{ $t("exchanges.pageHeader") }}</h2>
		<p class="page-summary">
			{{ $t("exchanges.info") }}
		</p>
	</div>

	<br />

	<!-- Search Summary -->
	<div class="search-summary">
		{{ $t("exchanges.searchInfo", {
			groups: totalSearchExchanges,
			groupWord,
			location: totalSearchCountries,
			locationWord
		}) }}
	</div>



	<!-- Search Field -->
	<div class="search-wrap">
		<v-text-field v-model="exchangeSearch" :label="$t('exchanges.search')" prepend-inner-icon="mdi-magnify" clearable
			variant="solo" density="comfortable" rounded="xl" hide-details single-line @blur="updateSearchQuery"
			class="search-field" />
	</div>

	<br />

	<!-- Data Table -->
	<div v-if="!isMobile">
		<v-data-table v-model:expanded="expanded" :headers="translatedHeaders" :items="exchangeList" item-value="id"
			show-expand class="main-table" id="main-table-width" :search="exchangeSearch" :custom-filter="rowSearchFilter"
			:items-per-page="exchangesPerPage" v-model:page="currentPage"
			:items-per-page-text="this.$t('exchanges.pageText')">

			<template v-slot:item.country="{ item }">
				<v-tooltip>
					<template #activator="{ props }">
						<div v-bind="props" style="display: flex; align-items: center">
							<img :src="getFlagUrl(item.country)" alt="Flag" width="20" height="15" style="margin-left: 4px" />
						</div>
					</template>

					<span>
						{{ item.country }}
					</span>
				</v-tooltip>
			</template>

			<template v-slot:item.homeUniversity="{ item }">
				<v-tooltip>
					<template #activator="{ props }">
						<span v-bind="props">
							{{ item.homeUniversity ? (item.homeUniversity.match(/\(([^)]+)\)/) || [])[1] : '' }}
						</span>
					</template>

					<span>
						{{ item.homeUniversity ? item.homeUniversity.replace(/\s*\([^)]*\)\s*/g, '') : '' }}
					</span>
				</v-tooltip>

			</template>

			<template v-slot:expanded-row="{ columns, item }">
				<tr>
					<td :colspan="columns.length" id="coursesStyle">
						<div>
							<br />
							<h3 v-if="
								item.courses && item.courses.Høst && item.courses.Høst.length
							">
								{{ $t("exchanges.coursesFallHeader") }} ({{ $t("database.totalECTS") }}:
								{{item.courses.Høst
									.reduce((sum, course) => sum + parseFloat(course.ECTSPoints || 0), 0)
									.toFixed(1)
								}}
								)
							</h3>
							<v-data-table-virtual v-if="
								item.courses && item.courses.Høst && item.courses.Høst.length
							" :headers="translatedHeadersCourses" :items="item.courses.Høst" item-value="name" dense class="virtual-table">
								<template v-slot:item.comment="{ item }">
									<v-icon v-if="item.comments && item.comments.trim() !== ''" small class="mr-2"
										@click="showComments(item)">
										mdi-comment
									</v-icon>
									<v-icon v-else small class="mr-2"> mdi-comment-off </v-icon>
								</template>
								<template v-slot:item.favorite="{ item }">
									<v-icon v-if="!checkIfFavorite(item)" small class="mr-2" @click="toggleFavorite(item)">
										mdi-heart-outline
									</v-icon>
									<v-icon v-else small class="mr-2" color="red" @click="toggleFavorite(item)">
										mdi-heart
									</v-icon>
								</template>
							</v-data-table-virtual>
							<br />
							<h3 v-if="
								item.courses && item.courses.Vår && item.courses.Vår.length
							">
								{{ $t("exchanges.coursesSpringHeader") }}
								({{ $t("database.totalECTS") }}:
								{{
									item.courses.Vår
										.reduce((sum, course) => sum + parseFloat(course.ECTSPoints || 0), 0)
										.toFixed(1)
								}}
								)
							</h3>
							<v-data-table-virtual v-if="
								item.courses && item.courses.Vår && item.courses.Vår.length
							" :headers="translatedHeadersCourses" :items="item.courses.Vår" item-value="name" dense class="virtual-table">
								<template v-slot:item.comment="{ item }">
									<v-icon v-if="item.comments && item.comments.trim() !== ''" small class="mr-2"
										@click="showComments(item)">
										mdi-comment
									</v-icon>
									<v-icon v-else small class="mr-2"> mdi-comment-off </v-icon>
								</template>
								<template v-slot:item.favorite="{ item }">
									<v-icon v-if="!checkIfFavorite(item)" small class="mr-2" @click="toggleFavorite(item)">
										mdi-heart-outline
									</v-icon>
									<v-icon v-else small class="mr-2" color="red" @click="toggleFavorite(item)">
										mdi-heart
									</v-icon>
								</template>
							</v-data-table-virtual>
							<br />
						</div>
					</td>
				</tr>
			</template>
		</v-data-table>
	</div>

	<div v-else>
		<v-data-table :headers="translatedMobileHeaders" v-model:expanded="expanded" :items="exchangeList" item-value="id"
			show-expand class="main-table fixed-table" id="main-table-width" :fixed-header="false" :style="{ width: '100%' }"
			item-class="custom-item-class" header-class="custom-header-class" :search="exchangeSearch"
			:custom-filter="rowSearchFilter" :items-per-page="exchangesPerPage" v-model:page="currentPage"
			:items-per-page-text="this.$t('exchanges.pageText')">
			<template v-slot:item.country="{ item }">
				<div style="display: flex; align-items: center">
					<img :src="getFlagUrl(item.country)" alt="Flag" width="20" height="15" style="margin-left: 8px" />
				</div>
			</template>

			<template v-slot:expanded-row="{ columns, item }">
				<tr>
					<td :colspan="translatedMobileHeaders.length + 1">
						<div class="expanded-content">
							<div>
								<div class="text-underline text-medium">
									{{ $t("exchanges.courseInformation") }}
								</div>
								<v-container>
									<v-row no-gutters>
										<v-col cols="6" class="text-bold">
											{{ $t("database.country") }}:
										</v-col>
										<v-col cols="6">
											{{ item.country }}
										</v-col>
									</v-row>
									<v-row no-gutters>
										<v-col cols="6" class="text-bold">
											{{ $t("database.homeUniversity") }}:
										</v-col>
										<v-col cols="6">
											{{ item.homeUniversity }}
										</v-col>
									</v-row>
									<v-row no-gutters>
										<v-col cols="6" class="text-bold">
											{{ $t("database.numSemesters") }}:
										</v-col>
										<v-col cols="6">
											{{ item.numSemesters }}
										</v-col>
									</v-row>
									<v-row no-gutters>
										<v-col cols="6" class="text-bold">
											{{ $t("database.studyYear") }}:
										</v-col>
										<v-col cols="6">
											{{ item.studyYear }}
										</v-col>
									</v-row>
									<br />
									<div v-if="item.courses.Høst && item.courses.Høst.length > 0">
										<v-row no-gutters class="text-bold" style="font-size: 15px; text-decoration: underline">
											{{ $t("exchanges.coursesFallHeader") }} ({{ $t("database.totalECTS") }}:
											{{
												item.courses.Høst
													.reduce((sum, course) => sum + parseFloat(course.ECTSPoints || 0), 0)
													.toFixed(1)
											}}
											)
										</v-row>
										<v-row no-gutters style="margin-bottom: 5px">
											<v-col cols="5" class="text-bold" style="padding-right: 10px">
												{{ $t("database.courseName") }}
											</v-col>
											<v-col cols="3" class="text-bold" style="padding-right: 10px">
												{{ $t("database.courseCode") }}
											</v-col>
											<v-col cols="2" class="text-bold" style="padding-right: 10px">
												{{ $t("database.ECTSPoints") }}
											</v-col>
										</v-row>
										<v-row v-for="(course, index) in item.courses.Høst" :key="index" class="mb-3" no-gutters>
											<v-col cols="5" style="padding-right: 10px">
												{{ course.courseName }}
											</v-col>
											<v-col cols="3" style="padding-right: 10px">
												{{ course.courseCode }}
											</v-col>
											<v-col cols="2" style="padding-right: 10px">
												{{ course.ECTSPoints }}
											</v-col>
											<v-col cols="1">
												<v-icon v-if="!checkIfFavorite(course)" small class="mr-2" @click="toggleFavorite(course)">
													mdi-heart-outline
												</v-icon>
												<v-icon v-else small class="mr-2" color="red" @click="toggleFavorite(course)">
													mdi-heart
												</v-icon>
											</v-col>
											<v-col cols="1">
												<v-icon small class="mr-2" @click="toggleInformationDialog(course)">
													mdi-dots-horizontal
												</v-icon>
											</v-col>
										</v-row>
									</div>
									<div v-if="item.courses.Vår && item.courses.Vår.length > 0">
										<v-row no-gutters class="text-bold" style="font-size: 15px; text-decoration: underline">
											{{ $t("exchanges.coursesSpringHeader") }} ({{ $t("database.totalECTS") }}:
											{{
												item.courses.Vår
													.reduce((sum, course) => sum + parseFloat(course.ECTSPoints || 0), 0)
													.toFixed(1)
											}}
											)
										</v-row>
										<v-row no-gutters style="margin-bottom: 5px">
											<v-col cols="5" class="text-bold" style="padding-right: 10px">
												{{ $t("database.courseName") }}
											</v-col>
											<v-col cols="3" class="text-bold" style="padding-right: 10px">
												{{ $t("database.courseCode") }}
											</v-col>
											<v-col cols="2" class="text-bold" style="padding-right: 10px">
												{{ $t("database.ECTSPoints") }}
											</v-col>
										</v-row>
										<v-row v-for="(course, index) in item.courses.Vår" :key="index" class="mb-3" no-gutters>
											<v-col cols="5" style="padding-right: 10px">
												{{ course.courseName }}
											</v-col>
											<v-col cols="3" style="padding-right: 10px">
												{{ course.courseCode }}
											</v-col>
											<v-col cols="2" style="padding-right: 10px">
												{{ course.ECTSPoints }}
											</v-col>
											<v-col cols="1">
												<v-icon v-if="!checkIfFavorite(course)" small class="mr-2" @click="toggleFavorite(course)">
													mdi-heart-outline
												</v-icon>
												<v-icon v-else small class="mr-2" color="red" @click="toggleFavorite(course)">
													mdi-heart
												</v-icon>
											</v-col>
											<v-col cols="1">
												<v-icon small class="mr-2" @click="toggleInformationDialog(course)">
													mdi-dots-horizontal
												</v-icon>
											</v-col>
										</v-row>
									</div>
								</v-container>
							</div>
						</div>
					</td>
				</tr>
			</template>
		</v-data-table>
	</div>

	<!-- Comment Dialog -->
	<v-dialog v-model="commentDialog" max-width="500px" class="dialog">
		<v-card>
			<v-card-title>
				{{ $t("exchanges.courseComments") }} {{ currentCourseName }}
			</v-card-title>
			<v-card-text>{{ currentComments }}</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn class="btn btn-secondary" text @click="closeCommentDialog">
					{{ $t("operations.close") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Information Dialog -->
	<v-dialog v-model="informationDialog" max-width="500px" class="dialog">
		<v-card>
			<v-card-title>
				{{ $t("exchanges.courseInformation") }}
			</v-card-title>
			<v-card-text>
				<v-row no-gutters style="margin-top: 5px" v-if="currentCourse.institute">
					<v-col cols="12" class="text-bold">
						{{ $t("database.institute") }}:
					</v-col>
					<v-col cols="12">
						{{ currentCourse.institute }}
					</v-col>
				</v-row>
				<v-row no-gutters style="margin-top: 5px" v-if="currentCourse.replacedCourseName">
					<v-col cols="12" class="text-bold">
						{{ $t("database.replacedCourseName") }}:
					</v-col>
					<v-col cols="12">
						{{ currentCourse.replacedCourseName }}
					</v-col>
				</v-row>
				<v-row no-gutters style="margin-top: 5px" v-if="currentCourse.replacedCourseCode">
					<v-col cols="12" class="text-bold">
						{{ $t("database.replacedCourseCode") }}:
					</v-col>
					<v-col cols="12">
						{{ currentCourse.replacedCourseCode }}
					</v-col>
				</v-row>
				<v-row no-gutters style="margin-top: 5px" v-if="currentCourse.courseType">
					<v-col cols="12" class="text-bold">
						{{ $t("database.courseType") }}:
					</v-col>
					<v-col cols="12">
						{{ currentCourse.courseType }}
					</v-col>
				</v-row>
				<v-row no-gutters style="margin-top: 5px">
					<v-col cols="12" class="text-bold">
						{{ $t("database.comments") }}:
					</v-col>
					<v-col cols="12" v-if="currentCourse.comments">
						{{ currentCourse.comments }}
					</v-col>
					<v-col cols="12" v-else>
						{{ $t("exchanges.noComments") }}
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn class="btn btn-secondary" text @click="toggleInformationDialog">
					{{ $t("operations.close") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
import { db, auth } from "../../js/firebaseConfig.js";
import { set, get, child, ref as dbRef, update } from "firebase/database";
import countriesInformation from "../../data/countriesInformation.json";
import { toast } from "vue3-toastify";
import countriesNameEn from "../../languages/en/countries.json";
import countriesNameNo from "../../languages/no/countries.json";


export default {
	setup() {
		const user = auth.currentUser;
		return { user };
	},
	data() {
		return {
			countriesInfo: countriesInformation,
			showFilters: false,
			expanded: [],
			exchangeList: [],
			countryList: [],
			countryValues: [],
			countrySearch: "",
			universityList: [],
			universityValues: [],
			universitySearch: "",
			studyList: [],
			studyValues: [],
			studySearch: "",
			numSemestersList: [1, 2],
			numSemestersValues: [],
			numSemestersSearch: "",
			commentDialog: false,
			currentComments: "",
			currentCourseName: "",
			screenWidth: window.innerWidth,
			informationDialog: false,
			currentCourse: null,
			favoriteCourses: [],
			exchangeSearch: "",
			exchangesPerPage: 10,
			currentPage: 1,
		};
	},
	created() {
		this.fetchExchangeData();
		this.loadFavoriteCourses();
	},
	mounted() {
		this.getValuesFromDatabase();
		window.addEventListener("resize", this.updateScreenWidth);
		this.updateScreenWidth();
	},
	beforeUnmount() {
		window.removeEventListener("resize", this.updateScreenWidth);
	},
	watch: {
		locale(newLocale, oldLocale) {
			this.fetchExchangeData();
			this.getValuesFromDatabase();
		},
		expanded(newVal, oldVal) {
			if (newVal != null && newVal.length != oldVal.length && newVal.length > 0) {
				let exchangesString = "";
				for (const exchangeId of newVal) {
					exchangesString += btoa(exchangeId) + ",";
				}
				this.$router.replace({ query: { ...this.$route.query, r: exchangesString } });
			} else {
				const query = { ...this.$route.query };
				delete query.r;
				this.$router.replace({ query });
			}
		},
	},
	computed: {
		isMobile() {
			return this.screenWidth <= 768;
		},
		translatedHeaders() {
			return [
				{
					align: "center",
					key: "country",
				},
				{
					title: this.$t("database.university"),
					align: "start",
					key: "university",
					length: 2,
					width: "15vw",
				},
				{
					title: this.$t("database.homeUniversity"),
					align: "start",
					key: "homeUniversity",
				},
				{
					title: this.$t("database.study"),
					align: "start",
					key: "study",
				},
				{
					title: this.$t("database.studyYear"),
					align: "center",
					key: "studyYear",
				},

				{
					title: this.$t("database.year"),
					align: "center",
					key: "year",
				},
				{
					title: this.$t("database.numSemesters"),
					align: "center",
					key: "numSemesters",
				},
			];
		},
		translatedHeadersCourses() {
			return [
				{
					title: this.$t("database.courseName"),
					align: "start",
					key: "courseName",
				},
				{
					title: this.$t("database.courseCode"),
					align: "end",
					key: "courseCode",
				},
				{
					title: this.$t("database.replacedCourseName"),
					align: "end",
					key: "replacedCourseName",
				},
				{
					title: this.$t("database.replacedCourseCode"),
					align: "end",
					key: "replacedCourseCode",
				},
				// {
				// 	title: this.$t("database.courseType"),
				// 	align: "end",
				// 	key: "courseType",
				// },
				// {
				// 	title: this.$t("database.institute"),
				// 	align: "end",
				// 	key: "institute",
				// },
				{
					title: this.$t("database.ECTSPoints"),
					align: "end",
					key: "ECTSPoints",
				},
				{
					title: this.$t("database.comments"),
					align: "end",
					key: "comment",
				},
				{
					title: "",
					align: "end",
					key: "favorite",
				},
			];
		},
		translatedMobileHeaders() {
			return [
				{
					align: "start",
					key: "country",
				},
				{
					title: this.$t("database.university"),
					align: "start",
					key: "university",
				},
				{
					title: this.$t("database.study"),
					align: "end",
					key: "study",
				},
			];
		},
		translatedMobileHeadersCourses() {
			return [
				{
					title: this.$t("database.courseName"),
					align: "start",
					key: "courseName",
				},
				{
					title: this.$t("database.courseCode"),
					align: "end",
					key: "courseCode",
				},
				{
					title: this.$t("database.replacedCourseName"),
					align: "end",
					key: "replacedCourseName",
				},
				{
					title: this.$t("database.replacedCourseCode"),
					align: "end",
					key: "replacedCourseCode",
				},
				{
					title: this.$t("database.courseType"),
					align: "end",
					key: "courseType",
				},
				{
					title: this.$t("database.institute"),
					align: "end",
					key: "institute",
				},
				{
					title: this.$t("database.ECTSPoints"),
					align: "end",
					key: "ECTSPoints",
				},
				{
					title: this.$t("database.comments"),
					align: "end",
					key: "comment",
				},
			];
		},
		locale() {
			return this.$i18n.locale;
		},
		totalSearchExchanges() {
			const search = (this.exchangeSearch || "").trim();

			// Ingen søk: return total lengde
			if (!search) {
				return this.exchangeList.length;
			}

			// Søk: bruk samme filter-logikk som v-data-table bruker (rowSearchFilter)
			return this.exchangeList.filter(group => {
				return this.rowSearchFilter(null, search, { raw: group });
			}).length;
		},
		groupWord() {
			return this.totalSearchExchanges === 1 ? this.$t("exchanges.exchange_one") : this.$t("exchanges.exchange_other");
		},
		totalSearchCountries() {
			const countries = new Set();

			const search = (this.exchangeSearch || "").trim().toLowerCase();

			this.exchangeList.forEach(group => {
				// Ingen søk: legg til alle land
				if (!search) {
					countries.add(group.country);
				} else {
					// Søk: bruk samme filter-logikk som v-data-table bruker (rowSearchFilter)
					if (this.rowSearchFilter(null, search, { raw: group })) {
						countries.add(group.country);
					}
				}
			});

			return countries.size;
		},
		locationWord() {
			return this.totalSearchCountries === 1 ? this.$t("exchanges.country_one") : this.$t("exchanges.country_other");
		},
	},
	methods: {
		updateScreenWidth() {
			this.screenWidth = window.innerWidth;
		},
		toggleFilters() {
			this.showFilters = !this.showFilters;
		},
		async getValuesFromDatabase() {
			try {
				const exchangesSnapshot = await get(child(dbRef(db), "exchanges"));
				if (exchangesSnapshot.exists()) {
					let exchanges = exchangesSnapshot.val();
					const countriesSet = new Set();
					const universitiesSet = new Set();
					const studiesSet = new Set();

					for (const exchangeKey in exchanges) {
						const exchange = exchanges[exchangeKey];

						// Check if either 'Høst' or 'Vår' courses exist and have at least one course
						const hasAutumnCourses =
							exchange.courses &&
							exchange.courses.Høst &&
							exchange.courses.Høst.length > 0;
						const hasSpringCourses =
							exchange.courses &&
							exchange.courses.Vår &&
							exchange.courses.Vår.length > 0;

						if (hasAutumnCourses || hasSpringCourses) {
							if (exchange.country) {
								countriesSet.add(this.$t(`countries.${exchange.country}`));
							}
							if (exchange.university) {
								universitiesSet.add(exchange.university);
							}
							if (exchange.study) {
								studiesSet.add(exchange.study);
							}
						}
					}

					this.countryList = Array.from(countriesSet);
					this.universityList = Array.from(universitiesSet);
					this.studyList = Array.from(studiesSet);
				} else {
					console.error("No data available");
				}
			} catch (error) {
				console.error("Error fetching values from database:", error);
			}
		},
		remove(item) {
			this.countryValues = this.countryValues.filter((i) => i !== item);
		},
		async fetchExchangeData() {
			try {
				const snapshot = await get(child(dbRef(db), "exchanges"));
				if (snapshot.exists()) {
					let exchanges = snapshot.val();

					exchanges = Object.keys(exchanges)
						.map((key) => ({
							id: key,
							...exchanges[key],
							country: this.$t(`countries.${exchanges[key].country}`),
							secondCountry: exchanges[key].secondCountry !== "null"
								? this.$t(`countries.${exchanges[key].secondCountry}`)
								: null,
						}))
						.filter(
							(exchange) =>
								exchange.courses && Object.keys(exchange.courses).length > 0
						);

					// Reformat exchanges
					let reformattedExchanges = this.reformatExchanges(exchanges);

					// Apply filters
					reformattedExchanges = this.applyFilters(reformattedExchanges);

					// Update the exchange list
					this.exchangeList = reformattedExchanges;

					this.exchangeList.sort((a, b) => {
						if (a.country < b.country) {
							return -1;
						}
						if (a.country > b.country) {
							return 1;
						}
						return 0;
					});

					this.$nextTick(() => {
						this.checkRouterParams();
					});
				} else {
					console.error("No data available");
				}
			} catch (error) {
				console.error("Error fetching exchange data:", error);
			}
		},
		applyFilters(exchanges) {
			if (this.countryValues.length > 0) {
				exchanges = exchanges.filter((exchange) =>
					this.countryValues.includes(exchange.country)
				);
			}
			if (this.universityValues.length > 0) {
				exchanges = exchanges.filter((exchange) =>
					this.universityValues.includes(exchange.university)
				);
			}
			if (this.studyValues.length > 0) {
				exchanges = exchanges.filter((exchange) =>
					this.studyValues.includes(exchange.study)
				);
			}
			if (this.numSemestersValues.length > 0) {
				exchanges = exchanges.filter((exchange) =>
					this.numSemestersValues.includes(exchange.numSemesters)
				);
			}
			return exchanges;
		},
		reformatExchanges(exchanges) {
			return exchanges.reduce((result, exchange) => {

				// Normalize the lists so they **always** become arrays
				exchange.courses.Høst = this.normalizeCourseList(exchange.courses.Høst);
				exchange.courses.Vår = this.normalizeCourseList(exchange.courses.Vår);

				if (!exchange.sameUniversity && exchange.courses.Vår) {
					const firstExchange = this.createExchange(exchange, {
						Høst: exchange.courses.Høst,
						Vår: [],
					});

					const newExchange = this.createExchange(
						{
							...exchange,
							id: exchange.id + "new",
							university: exchange.secondUniversity,
							country: exchange.secondCountry,
						},
						{
							Høst: [],
							Vår: exchange.courses.Vår,
						}
					);
					result.push(firstExchange);
					result.push(newExchange);
				} else {
					if (!!exchange.courses.Høst !== !!exchange.courses.Vår) {
						exchange.numSemesters = 1;
					}
					result.push(exchange);
				}
				return result;
			}, []);
		},
		createExchange(baseExchange, courses) {
			return {
				...baseExchange,
				courses: courses,
				numSemesters: 1,
			};
		},
		showComments(course) {
			this.currentCourseName = course.courseName;
			this.currentComments =
				course.comments || this.$t("exchanges.noComments");
			this.commentDialog = true;
		},
		closeCommentDialog() {
			this.commentDialog = false;
		},
		toggleInformationDialog(course) {
			this.informationDialog = !this.informationDialog;
			if (this.informationDialog) {
				this.currentCourse = course;
			}
		},
		closeInformationDialog() {
			this.informationDialog = false;
		},
		getFlagUrl(country) {
			const flagBaseUrl = "https://flagcdn.com/128x96/";
			const countryCode = this.getCountryCode(country).toLowerCase();
			return `${flagBaseUrl}${countryCode}.png`;
		},
		getCountryCode(country) {
			if (this.locale === "en") {
				return this.countriesInfo.countryCodes.en[country] || "unknown";
			} else {
				return this.countriesInfo.countryCodes.no[country] || "unknown";
			}
		},
		normalizeCourseList(list) {
			if (Array.isArray(list)) return list;      // OK
			if (!list) return [];                      // null/undefined
			return Object.values(list);                // Firebase object → array
		},
		checkIfFavorite(course) {
			return this.favoriteCourses.some(favCourse =>
				Object.keys(course).every(key => course[key] === favCourse[key])
			);
		},
		toggleFavorite(course) {
			const user = auth.currentUser;

			if (!user) {
				toast.warning(this.$t("exchanges.loginToFavorite"));
				return;
			}

			// Get country and university and add to course object
			const exchange = this.exchangeList.find(exchange =>
				(exchange.courses.Høst &&
					exchange.courses.Høst.some(c =>
						c.courseCode === course.courseCode &&
						c.courseName === course.courseName
					)
				) ||
				(exchange.courses.Vår &&
					exchange.courses.Vår.some(c =>
						c.courseCode === course.courseCode &&
						c.courseName === course.courseName
					)
				)
			);


			if (exchange) {
				course.country = exchange.country;
				course.university = exchange.university;
			}

			// Add course to favorites if not already favorited, else remove it
			if (!this.checkIfFavorite(course)) {
				this.favoriteCourses.push(course);
			} else {
				this.favoriteCourses = this.favoriteCourses.filter(favCourse =>
					!Object.keys(course).every(key => course[key] === favCourse[key])
				);
			}

			this.saveFavoriteCourses().catch(error => {
				toast.error(this.$t("exchanges.errorSavingFavorites"));
				console.error("Error saving favorite courses:", error);
			});
		},
		async loadFavoriteCourses() {
			const user = auth.currentUser;
			if (!user) {
				this.favoriteCourses = [];
				return;
			}
			const snapshot = await get(dbRef(db, `users/${user.uid}/favoriteCourses`));
			const courses = snapshot.val();
			this.favoriteCourses = courses
				? Object.keys(courses).map((key) => ({ id: key, ...courses[key] }))
				: [];
		},
		async saveFavoriteCourses() {
			const user = auth.currentUser;
			if (!user) return;

			const userRef = dbRef(db, `users/${user.uid}/favoriteCourses`);
			const updates = {};

			this.favoriteCourses.forEach((course, index) => {
				updates[index] = course;
			});

			await set(userRef, updates);
		},
		getCountryKeyFromUserInput(word) {
			const lowerWord = word.toLowerCase();

			const countryKeysEn = Object.keys(countriesNameEn);

			for (const key of countryKeysEn) {
				if (this.locale === "en") {
					const countryNameEn = countriesNameNo[key].toLowerCase();
					if (countryNameEn === lowerWord) {
						return key;
					}
				} else {
					const countryNameEn = countriesNameEn[key].toLowerCase();
					if (countryNameEn === lowerWord) {
						return key;
					}
				}
			}

			return null;
		},
		checkRouterParams() {
			if (!this.$route || !this.$route.query) return;

			const search = this.$route.query.search;
			if (search) {
				const words = search.trim().split(/\s+/);
				for (const [index, word] of words.entries()) {
					const canonicalKey = this.getCountryKeyFromUserInput(words[index]);

					if (canonicalKey) {
						const translated = this.$t(`countries.${canonicalKey}`);
						words[index] = translated;
						this.exchangeSearch = words.join(" ");
						break;
					} else {
						this.exchangeSearch = search; // fallback
					}
				}
				this.updateSearchQuery();
			}

			const exchangeId = this.$route.query.r;
			if (exchangeId) {
				const exchangeIds = exchangeId.split(",");
				for (const encodedId of exchangeIds) {
					if (!encodedId) continue;
					const decodedId = atob(encodedId);
					if (this.expanded.includes(decodedId)) continue;
					this.expanded.push(decodedId);
				}

				// Scroll to the first expanded row
				this.$nextTick(() => {
					const firstId = atob(exchangeIds[0]);

					const searchList = this.exchangeList.filter(exchange =>
						this.rowSearchFilter(null, this.exchangeSearch, exchange)
					);

					const index = searchList.findIndex(exchange => exchange.id === firstId);

					if (index !== -1) {
						this.scrollWhenReady(index);
					}
				});
			}
		},
		updateSearchQuery() {
			if (!this.$route || !this.$route.query) return;
			const r = this.$route.query.r;
			if (r && r.length > 0) {
				this.$router.replace({ query: { ...this.$route.query, search: this.exchangeSearch, r: r } });
			} else {
				this.$router.replace({ query: { ...this.$route.query, search: this.exchangeSearch } });
			}
		},
		rowSearchFilter(value, search, item) {
			if (!search) return true;

			const raw = item?.raw ?? item; // fallback in case it's already raw

			// Split the search input into separate words
			const words = search
				.toLowerCase()
				.trim()
				.split(/\s+/);

			// Pick only the fields you actually want to search in
			const fieldsToSearch = [
				"country",
				"secondCountry",
				"university",
				"study",
				"studyYear",
				"year",
				"homeUniversity",
			];

			const rowText = fieldsToSearch
				.map((key) => (raw[key] != null ? String(raw[key]) : ""))
				.join(" ")
				.toLowerCase();

			// Every word in the search must appear somewhere in the row text
			return words.every((word) => rowText.includes(word));
		},
		scrollWhenReady(index) {
			const attemptScroll = () => {
				// SELECT THE REAL ROWS
				const rows = document.querySelectorAll(
					"#main-table-width .v-table__wrapper > table > tbody > tr.v-data-table__tr"
				);

				if (rows.length < index + 1) {
					const targetPage = Math.floor(index / this.exchangesPerPage) + 1;
					if (this.currentPage !== targetPage) {
						this.currentPage = targetPage;
						index = index % this.exchangesPerPage;
					}
				}

				const row = rows[index];

				if (!row) return false;

				if (!this.isMobile) {
					row.scrollIntoView({ behavior: "smooth", block: "center" });
				} else {
					row.scrollIntoView({ behavior: "smooth", block: "start" });
				}
				return true;
			};

			// Try immediately
			if (attemptScroll()) return;

			// Watch DOM until rows appear
			const container = document.querySelector("#main-table-width");

			const observer = new MutationObserver(() => {
				if (attemptScroll()) {
					observer.disconnect();
				}
			});

			observer.observe(container, {
				childList: true,
				subtree: true,
			});
		}
	},
};
</script>

<style>
html,
body {
	scroll-behavior: auto !important;
}

.v-data-table table tr th,
.v-data-table table tr td {
	padding: 0 8px !important;
}

.search-wrap {
	margin: 10px auto 18px;
}

/* Base */
.search-field .v-field {
	border-radius: 999px;
	/* pill */
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
	transition: box-shadow 180ms ease, transform 180ms ease, background 180ms ease;
}

/* Hover */
.search-field .v-field:hover {
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
	transform: translateY(-1px);
	background: rgba(255, 255, 255, 0.92);
}

/* Focus ring (Vuetify adds .v-field--focused) */
.search-field .v-field.v-field--focused {
	box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.18), 0 10px 24px rgba(0, 0, 0, 0.12);
}

/* Tighten vertical spacing a bit */
.search-field .v-field__input {
	padding-top: 10px;
	padding-bottom: 10px;
}

/* Optional: icon styling */
.search-field .v-field__prepend-inner .v-icon {
	opacity: 0.75;
}

.page-wrap {
	width: min(1100px, 95%);
	margin: 0 auto;
}

/* Card surface */
.hero-card {
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.72);
	border: 1px solid rgba(0, 0, 0, 0.06);
	backdrop-filter: blur(10px);
}

/* Layout inside card */
.hero-inner {
	padding: 22px 22px 18px;
	display: grid;
	gap: 14px;
}

.hero-title {
	margin: 0;
	font-size: 28px;
	line-height: 1.15;
}

.hero-sub {
	margin: 8px 0 0;
	max-width: 70ch;
	opacity: 0.85;
	line-height: 1.45;
}

/* Search styling */
.hero-search .v-field {
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
	transition: box-shadow 180ms ease, transform 180ms ease, background 180ms ease;
}

.hero-search .v-field:hover {
	transform: translateY(-1px);
	box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
	background: rgba(255, 255, 255, 0.95);
}

.hero-search .v-field.v-field--focused {
	box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.18), 0 14px 30px rgba(0, 0, 0, 0.12);
}

.hero-search .v-field__input {
	padding-top: 10px;
	padding-bottom: 10px;
}

/* Desktop layout: title/info left, search right */
@media (min-width: 900px) {
	.hero-inner {
		grid-template-columns: 1fr 420px;
		align-items: end;
		gap: 18px;
	}

	.hero-search {
		margin-top: 0;
	}
}

/* Mobile: tighter */
@media (max-width: 600px) {
	.hero-inner {
		padding: 18px 16px 14px;
	}

	.hero-title {
		font-size: 22px;
	}
}
</style>
