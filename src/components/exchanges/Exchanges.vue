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



	<!-- Search Field with Chips -->
	<div class="search-wrap">
		<div class="search-chip-container" :class="{ focused: searchFocused }" @click="$refs.searchInput?.focus()">
			<v-icon class="search-icon">mdi-magnify</v-icon>
			<v-chip
				v-for="(chip, index) in searchChips"
				:key="'chip-' + index"
				closable
				color="primary"
				variant="tonal"
				size="small"
				@click:close="removeChip(index)"
			>{{ chip }}</v-chip>
			<div class="search-input-wrap">
				<input
					ref="searchInput"
					v-model="searchInput"
					:placeholder="searchChips.length === 0 ? $t('exchanges.search') : ''"
					class="chip-search-input"
					@keydown.enter.prevent="onSearchEnter"
					@keydown.down.prevent="onArrowDown"
					@keydown.up.prevent="onArrowUp"
					@keydown.delete="onBackspace"
					@focus="searchFocused = true"
					@blur="onSearchBlur"
				/>
				<div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
					<div
						v-for="(suggestion, i) in filteredSuggestions"
						:key="i"
						class="suggestion-item"
						:class="{ highlighted: i === highlightedIndex }"
						@mousedown.prevent="selectSuggestion(suggestion)"
					>
						<v-icon size="small" class="suggestion-icon">{{ suggestion.icon }}</v-icon>
						<span class="suggestion-text">{{ suggestion.label }}</span>
						<span class="suggestion-type">{{ suggestion.type }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<br />

	<!-- Data Table -->
	<div v-if="!isMobile">
		<v-data-table v-model:expanded="expanded" :headers="translatedHeaders" :items="filteredExchangeList" item-value="id"
			show-expand class="main-table" id="main-table-width"
			:items-per-page="exchangesPerPage" v-model:page="currentPage" :items-per-page-text="this.$t('exchanges.pageText')"
			:loading="datatableLoading">

			<template v-slot:loading>
				<v-skeleton-loader type="table-row@10"></v-skeleton-loader>
			</template>

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

			<template v-slot:item.university="{ item }">
				<v-tooltip>
					<template #activator="{ props }">
						<span v-bind="props">
							{{ item.university ? item.university.split('(')[0].trim() : '' }}
						</span>
					</template>

					<span>
						{{ item.university ? (item.university.split("-")[1]) : '' }}
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
							<!-- Høst -->
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
							<br v-if="item.courses && item.courses.Høst && item.courses.Høst.length" />
							<!-- Vår -->
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
							<br v-if="item.courses && item.courses.Vår && item.courses.Vår.length" />
							<!-- Sommer -->
							<h3 v-if="
								item.courses && item.courses.Sommer && item.courses.Sommer.length
							">
								{{ $t("exchanges.coursesSummerHeader") }}
								({{ $t("database.totalECTS") }}:
								{{
									item.courses.Sommer
										.reduce((sum, course) => sum + parseFloat(course.ECTSPoints || 0), 0)
										.toFixed(1)
								}}
								)
							</h3>
							<v-data-table-virtual v-if="
								item.courses && item.courses.Sommer && item.courses.Sommer.length
							" :headers="translatedHeadersCourses" :items="item.courses.Sommer" item-value="name" dense
								class="virtual-table">
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
							<br v-if="item.courses && item.courses.Sommer && item.courses.Sommer.length" />
						</div>
					</td>
				</tr>
			</template>
		</v-data-table>
	</div>

	<div v-else>
		<v-data-table :headers="translatedMobileHeaders" v-model:expanded="expanded" :items="filteredExchangeList" item-value="id"
			show-expand class="main-table fixed-table" id="main-table-width" :fixed-header="false" :style="{ width: '100%' }"
			item-class="custom-item-class" header-class="custom-header-class"
			:items-per-page="exchangesPerPage" v-model:page="currentPage"
			:items-per-page-text="this.$t('exchanges.pageText')" :loading="datatableLoading">

			<template v-slot:item.university="{ item }">
				<v-tooltip>
					<template #activator="{ props }">
						<span v-bind="props">
							{{ item.university ? item.university.split('(')[0].trim() : '' }}
						</span>
					</template>

					<span>
						{{ item.university ? (item.university.split("-")[1]) : '' }}
					</span>
				</v-tooltip>

			</template>

			<template v-slot:loading>
				<v-skeleton-loader type="table-row@10"></v-skeleton-loader>
			</template>

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
					{{ $t("actions.close") }}
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
					{{ $t("actions.close") }}
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
import universitiesInformation from "../../data/universities.json";

import { getExchangesData } from "../../js/exchangesCache";
import placeholderFlag from "../../assets/images/placeholder_flag.png";

export default {
	setup() {
		const user = auth.currentUser;
		return { user };
	},
	data() {
		return {
			exchanges: {},
			countriesInfo: countriesInformation,
			universitiesInfo: universitiesInformation,
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
			searchChips: [],
			searchInput: "",
			searchFocused: false,
			highlightedIndex: -1,
			exchangesPerPage: 10,
			currentPage: 1,
			datatableLoading: false,
		};
	},
	async created() {
		await this.loadExchangeData();
		await Promise.all([
			this.fetchExchangeData(),
			this.getValuesFromDatabase(),
			this.loadFavoriteCourses(),
		]);
	},
	mounted() {
		window.addEventListener("resize", this.updateScreenWidth);
		this.updateScreenWidth();
	},
	beforeUnmount() {
		window.removeEventListener("resize", this.updateScreenWidth);
	},
	watch: {
		searchInput() {
			this.highlightedIndex = -1;
		},
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
			return this.filteredExchangeList.length;
		},
		groupWord() {
			return this.totalSearchExchanges === 1 ? this.$t("exchanges.exchange_one") : this.$t("exchanges.exchange_other");
		},
		totalSearchCountries() {
			const countries = new Set();
			this.filteredExchangeList.forEach(group => {
				countries.add(group.country);
			});
			return countries.size;
		},
		locationWord() {
			return this.totalSearchCountries === 1 ? this.$t("exchanges.country_one") : this.$t("exchanges.country_other");
		},
		hasActiveFilters() {
			return this.searchChips.length > 0;
		},
		filteredExchangeList() {
			if (this.searchChips.length === 0) return this.exchangeList;
			return this.exchangeList.filter(item => {
				return this.searchChips.every(chip => {
					const chipLower = chip.toLowerCase();
					const fieldsToSearch = [
						"country", "secondCountry", "university",
						"study", "studyYear", "year", "homeUniversity",
					];
					const rowText = fieldsToSearch
						.map(key => (item[key] != null ? String(item[key]) : ""))
						.join(" ")
						.toLowerCase();
					return rowText.includes(chipLower);
				});
			});
		},
		allSuggestions() {
			const suggestions = [];
			const added = new Set();

			for (const country of this.countryList) {
				if (!added.has(country)) {
					added.add(country);
					suggestions.push({ label: country, type: this.$t("database.country"), icon: "mdi-earth" });
				}
			}

			const universityNames = new Set();
			for (const exchange of this.exchangeList) {
				if (exchange.university) {
					const shortName = exchange.university.split('(')[0].trim();
					if (!universityNames.has(shortName)) {
						universityNames.add(shortName);
						suggestions.push({ label: shortName, type: this.$t("database.university"), icon: "mdi-school" });
					}
				}
			}

			for (const study of this.studyList) {
				if (!added.has(study)) {
					added.add(study);
					suggestions.push({ label: study, type: this.$t("database.study"), icon: "mdi-book-open-variant" });
				}
			}

			return suggestions;
		},
		filteredSuggestions() {
			const input = this.searchInput.trim().toLowerCase();
			if (!input) return [];
			return this.allSuggestions
				.filter(s => s.label.toLowerCase().includes(input) && !this.searchChips.includes(s.label))
				.slice(0, 8);
		},
		showSuggestions() {
			return this.searchFocused && this.searchInput.trim().length > 0;
		},
	},
	methods: {
		async loadExchangeData() {
			this.exchanges = await getExchangesData();
		},
		updateScreenWidth() {
			this.screenWidth = window.innerWidth;
		},
		toggleFilters() {
			this.showFilters = !this.showFilters;
		},
		async getValuesFromDatabase() {
			try {
				if (this.exchanges && Object.keys(this.exchanges).length > 0) {
					const countriesSet = new Set();
					const universitiesSet = new Set();
					const studiesSet = new Set();

					for (const exchangeKey in this.exchanges) {
						const exchange = this.exchanges[exchangeKey];

						const autumnCourses = this.normalizeCourseList(exchange.courses?.Høst);
						const springCourses = this.normalizeCourseList(exchange.courses?.Vår);
						const summerCourses = this.normalizeCourseList(exchange.courses?.Sommer);

						const hasCourses =
							autumnCourses.length > 0 ||
							springCourses.length > 0 ||
							summerCourses.length > 0;

						if (hasCourses) {
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
		removeChip(index) {
			this.searchChips.splice(index, 1);
			this.updateSearchQuery();
		},
		onSearchEnter() {
			if (this.highlightedIndex >= 0 && this.filteredSuggestions[this.highlightedIndex]) {
				this.selectSuggestion(this.filteredSuggestions[this.highlightedIndex]);
				return;
			}
			const input = this.searchInput.trim();
			if (input && !this.searchChips.includes(input)) {
				this.searchChips.push(input);
				this.searchInput = "";
				this.highlightedIndex = -1;
				this.updateSearchQuery();
			}
		},
		selectSuggestion(suggestion) {
			if (!this.searchChips.includes(suggestion.label)) {
				this.searchChips.push(suggestion.label);
			}
			this.searchInput = "";
			this.highlightedIndex = -1;
			this.updateSearchQuery();
			this.$nextTick(() => {
				this.$refs.searchInput?.focus();
			});
		},
		onArrowDown() {
			if (this.filteredSuggestions.length > 0) {
				this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredSuggestions.length - 1);
			}
		},
		onArrowUp() {
			if (this.highlightedIndex > 0) {
				this.highlightedIndex--;
			}
		},
		onBackspace() {
			if (this.searchInput === "" && this.searchChips.length > 0) {
				this.searchChips.pop();
				this.updateSearchQuery();
			}
		},
		onSearchBlur() {
			setTimeout(() => {
				this.searchFocused = false;
				this.highlightedIndex = -1;
			}, 150);
		},
		clearSearch() {
			this.searchChips = [];
			this.searchInput = "";
			this.exchangeSearch = "";
			this.updateSearchQuery();
		},
		async fetchExchangeData() {
			this.datatableLoading = true;
			try {
				if (this.exchanges && Object.keys(this.exchanges).length > 0) {
					const mappedExchanges = Object.keys(this.exchanges)
						.map((key) => ({
							id: key,
							...this.exchanges[key],
							country: this.$t(`countries.${this.exchanges[key].country}`),
							secondCountry: this.exchanges[key].secondCountry !== "null" && this.exchanges[key].secondCountry
								? this.$t(`countries.${this.exchanges[key].secondCountry}`)
								: null,
						}))
						.filter(
							(exchange) =>
								exchange.courses && Object.keys(exchange.courses).length > 0
						);

					// Reformat exchanges
					let reformattedExchanges = this.reformatExchanges(mappedExchanges);

					// 

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
			} finally {
				this.datatableLoading = false;
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
		}, formatUniversityName(country, university) {
			const countryKey = this.getCountryKeyFromUserInput(country);
			const universityData = this.universitiesInfo.universities[countryKey]?.[university];

			if (!universityData) {
				console.warn(`No university data found for ${university} in ${countryKey}`);
				return university;
			}

			return `${universityData.english_name} (${universityData.original_name} ${universityData.original_city} ${universityData.abbreviation}) - ${universityData.english_city}`;
		},
		reformatExchanges(exchanges) {
			return exchanges.reduce((result, exchange) => {
				exchange.courses.Høst = this.normalizeCourseList(exchange.courses?.Høst);
				exchange.courses.Vår = this.normalizeCourseList(exchange.courses?.Vår);
				exchange.courses.Sommer = this.normalizeCourseList(exchange.courses?.Sommer);

				const formattedMainUniversity = this.formatUniversityName(
					exchange.country,
					exchange.university
				);

				if (!exchange.sameUniversity && exchange.courses.Vår.length > 0) {
					const formattedSecondUniversity = this.formatUniversityName(
						exchange.secondCountry,
						exchange.secondUniversity
					);

					const firstExchange = this.createExchange(
						{
							...exchange,
							university: formattedMainUniversity,
						},
						{
							Høst: exchange.courses.Høst,
							Vår: [],
							Sommer: [],
						}
					);

					const newExchange = this.createExchange(
						{
							...exchange,
							id: exchange.id + "new",
							university: formattedSecondUniversity,
							country: exchange.secondCountry,
						},
						{
							Høst: [],
							Vår: exchange.courses.Vår,
							Sommer: [],
						}
					);

					result.push(firstExchange);
					result.push(newExchange);
				} else {
					const hasAutumn = exchange.courses.Høst.length > 0;
					const hasSpring = exchange.courses.Vår.length > 0;
					const hasSummer = exchange.courses.Sommer.length > 0;

					if ([hasAutumn, hasSpring, hasSummer].filter(Boolean).length === 1) {
						exchange.numSemesters = 1;
					}

					result.push({
						...exchange,
						university: formattedMainUniversity,
					});
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

			if (countryCode === "unknown") {
				return placeholderFlag;
			}

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
				) ||
				(exchange.courses.Sommer &&
					exchange.courses.Sommer.some(c =>
						c.courseCode === course.courseCode &&
						c.courseName === course.courseName
					)
				)
			);

			const enrichedCourse = {
				...course,
				country: exchange?.country ?? null,
				university: exchange?.university ?? null,
			};

			if (!this.checkIfFavorite(enrichedCourse)) {
				this.favoriteCourses.push(enrichedCourse);
			} else {
				this.favoriteCourses = this.favoriteCourses.filter(
					favCourse => !Object.keys(enrichedCourse).every(
						key => enrichedCourse[key] === favCourse[key]
					)
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

			const countryKeys = Object.keys(countriesNameEn);

			for (const key of countryKeys) {
				const nameEn = countriesNameEn[key]?.toLowerCase();
				const nameNo = countriesNameNo[key]?.toLowerCase();

				if (nameEn === lowerWord || nameNo === lowerWord) {
					return key;
				}
			}

			return null;
		},
		normalizeCountrySearchWord(words, index) {
			const current = words[index]?.toLowerCase();
			const next1 = words[index + 1]?.toLowerCase();
			const next2 = words[index + 2]?.toLowerCase();

			// English / Norwegian multi-word aliases
			if (current === "south" && next1 === "korea") {
				words.splice(index + 1, 1);
				return this.locale === "no" ? "Sør-Korea" : "South Korea";
			}

			if (current === "south" && next1 === "africa") {
				words.splice(index + 1, 1);
				return this.locale === "no" ? "Sør-Afrika" : "South Africa";
			}

			if (current === "north" && next1 === "macedonia") {
				words.splice(index + 1, 1);
				return this.locale === "no" ? "Nord-Makedonia" : "North Macedonia";
			}

			if (current === "czech" && next1 === "republic") {
				words.splice(index + 1, 1);
				return this.locale === "no" ? "Tsjekkia" : "Czech Republic";
			}

			if (current === "faroe" && next1 === "islands") {
				words.splice(index + 1, 1);
				return this.locale === "no" ? "Færøyene" : "Faroe Islands";
			}

			if (current === "bosnia" && next1 === "and" && next2 === "herzegovina") {
				words.splice(index + 1, 2);
				return this.locale === "no" ? "Bosnia-Hercegovina" : "Bosnia and Herzegovina";
			}

			// Norwegian forms already combined
			if (current === "sør-korea") {
				return this.locale === "no" ? "Sør-Korea" : "South Korea";
			}

			if (current === "sør-afrika") {
				return this.locale === "no" ? "Sør-Afrika" : "South Africa";
			}

			if (current === "nord-makedonia") {
				return this.locale === "no" ? "Nord-Makedonia" : "North Macedonia";
			}

			if (current === "bosnia-hercegovina") {
				return this.locale === "no" ? "Bosnia-Hercegovina" : "Bosnia and Herzegovina";
			}

			if (current === "færøyene") {
				return this.locale === "no" ? "Færøyene" : "Faroe Islands";
			}

			// Normal translations
			if (current === "afrika") {
				return this.locale === "no" ? "Afrika" : "Africa";
			}
			if (current === "africa") {
				return this.locale === "no" ? "Afrika" : "Africa";
			}
			if (current === "makedonia") {
				return this.locale === "no" ? "Makedonia" : "Macedonia";
			}
			if (current === "macedonia") {
				return this.locale === "no" ? "Makedonia" : "Macedonia";
			}

			// Fallback: leave word unchanged
			return words[index];
		},
		checkRouterParams() {
			if (!this.$route || !this.$route.query) return;

			const search = this.$route.query.search;
			if (search) {
				const chips = search.split(',').map(s => s.trim()).filter(Boolean);
				for (const chip of chips) {
					const words = chip.split(/\s+/);
					let resolved = chip;
					for (const [index, word] of words.entries()) {
						if (!isNaN(word) || word.length <= 3) continue;
						let current_word = this.normalizeCountrySearchWord(words, index);
						const canonicalKey = this.getCountryKeyFromUserInput(current_word);
						if (canonicalKey) {
							resolved = this.$t(`countries.${canonicalKey}`);
							break;
						}
					}
					if (!this.searchChips.includes(resolved)) {
						this.searchChips.push(resolved);
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

				this.$nextTick(() => {
					const firstId = atob(exchangeIds[0]);
					const index = this.filteredExchangeList.findIndex(exchange => exchange.id === firstId);
					if (index !== -1) {
						this.scrollWhenReady(index);
					}
				});
			}
		},
		updateSearchQuery() {
			if (!this.$route || !this.$route.query) return;
			const r = this.$route.query.r;
			const searchParam = this.searchChips.length > 0 ? this.searchChips.join(',') : undefined;
			const query = { ...this.$route.query };
			if (searchParam) {
				query.search = searchParam;
			} else {
				delete query.search;
			}
			if (r && r.length > 0) {
				query.r = r;
			}
			this.$router.replace({ query });
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
.search-chip-container {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.85);
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
	transition: box-shadow 180ms ease, background 180ms ease;
	cursor: text;
	min-height: 48px;
}

.search-icon {
	color: #9ca3af;
	flex-shrink: 0;
}

.search-chip-container:hover {
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
	background: rgba(255, 255, 255, 0.92);
}

.search-chip-container.focused {
	box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.18), 0 10px 24px rgba(0, 0, 0, 0.12);
}

.search-input-wrap {
	flex: 1;
	min-width: 120px;
	position: relative;
}

.chip-search-input {
	width: 100%;
	border: none;
	outline: none;
	background: transparent;
	font-size: 16px;
	padding: 4px 0;
	color: var(--first-color, #112d4e);
}

.chip-search-input::placeholder {
	color: #9ca3af;
}

.suggestions-dropdown {
	position: absolute;
	top: calc(100% + 12px);
	left: -16px;
	right: -16px;
	min-width: 300px;
	background: white;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
	border: 1px solid var(--third-color, #dbe2ef);
	overflow: hidden;
	z-index: 1000;
}

.suggestion-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	cursor: pointer;
	transition: background-color 0.1s;
	font-size: 14px;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
	background-color: var(--fourth-color, #f9f7f7);
}

.suggestion-icon {
	color: var(--second-color, #3f72af);
	opacity: 0.7;
}

.suggestion-text {
	flex: 1;
	color: var(--first-color, #112d4e);
}

.suggestion-type {
	font-size: 12px;
	color: #9ca3af;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

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
