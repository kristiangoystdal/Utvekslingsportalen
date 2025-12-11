<template>
	<div>
		<h2 class="preserve-whitespace">{{ $t("homepage.welcome") }}</h2>
		<br />
		<p class="box box-third-color preserve-whitespace text-center">
			{{ $t("homepage.siteDescription") }}
		</p>

		<div class="box">
			<v-row>
				<v-col cols="12" md="6">
					<v-btn class="btn btn-primary" @click="goToRoute('/min_utveksling')">{{ $t("operations.createExchange")
					}}</v-btn>
				</v-col>
				<v-col cols="12" md="6">
					<v-btn class="btn btn-primary" @click="goToRoute('/last_opp')">{{ $t("operations.uploadExchange") }}</v-btn>
				</v-col>
			</v-row>
		</div>

		<p class="box box-warning preserve-whitespace text-center">
			{{ $t("homepage.newFeature") }}
		</p>


		<div class="box box-countries">
			<WorldMap :countries="countriesToHighlight" />
		</div>

		<br />
		<v-divider />
		<br />

		<div class="top-countries-and-top-study-programs">
			<h3>{{ $t("homepage.topCountries") }}</h3>
			<BarChart :items="topCountriesTranslated" />
		</div>

		<div class="top-countries-and-top-study-programs">
			<h3>{{ $t("homepage.topStudyPrograms") }}</h3>
			<BarChart :items="topStudyPrograms" />
		</div>


	</div>
</template>

<script>
import WorldMap from "./WorldMap.vue";
import BarChart from "./BarChart.vue";
import { getDatabase, ref as dbRef, child, get } from "firebase/database";
import countriesInformation from "../../data/countriesInformation.json";
import { db, auth } from "../../js/firebaseConfig.js";
import { getFlagUrl } from '../../js/i18nHelpers';


export default {
	name: "App",
	components: {
		WorldMap,
		BarChart,
	},
	setup() {
		const user = auth.currentUser;
		return { user };
	},
	data() {
		return {
			countriesToHighlight: [],
			topCountries: [],
			topStudyPrograms: [],
			countriesInfo: countriesInformation,
		};
	},
	mounted() {
		this.getValuesFromDatabase();
	},
	computed: {
		topCountriesTranslated() {
			return this.topCountries.map((country) => {
				return {
					name: this.$t(`countries.${country.name}`),
					count: country.count,
				};
			});
		}
	},
	methods: {
		async getValuesFromDatabase() {
			try {
				const db = getDatabase();
				const exchangesSnapshot = await get(child(dbRef(db), "exchanges"));
				if (exchangesSnapshot.exists()) {
					let exchanges = exchangesSnapshot.val();
					const countriesSet = new Set();
					const countriesCount = {};
					const studyProgramsSet = new Set();
					const studyProgramsCount = {};


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

						// Extract country information based on course availability
						if (hasAutumnCourses && hasSpringCourses) {
							if (!exchange.sameUniversity) {
								if (exchange.secondCountry) {
									countriesSet.add(exchange.secondCountry);
									if (countriesCount[exchange.secondCountry]) {
										countriesCount[exchange.secondCountry]++;
									} else {
										countriesCount[exchange.secondCountry] = 1;
									}
								}
							}
							if (exchange.country) {
								countriesSet.add(exchange.country);
								if (countriesCount[exchange.country]) {
									countriesCount[exchange.country]++;
								} else {
									countriesCount[exchange.country] = 1;
								}
							}
						}
						else if (hasAutumnCourses || hasSpringCourses) {
							if (exchange.country) {
								countriesSet.add(exchange.country);
								if (countriesCount[exchange.country]) {
									countriesCount[exchange.country]++;
								} else {
									countriesCount[exchange.country] = 1;
								}
							}
						}

						// Extract country and study program information
						if (exchange.study) {
							studyProgramsSet.add(exchange.study);
							if (studyProgramsCount[exchange.study]) {
								studyProgramsCount[exchange.study]++;
							} else {
								studyProgramsCount[exchange.study] = 1;
							}
						}
					}

					// Sort the top 10 countries and study programs
					this.topCountries = Object.entries(countriesCount)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map((entry) => ({ name: entry[0], count: entry[1] }));
					this.topStudyPrograms = Object.entries(studyProgramsCount)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 10)
						.map((entry) => ({ name: entry[0], count: entry[1] }));

					// Prepare countries to highlight
					const fetchedCountries = Array.from(countriesSet).map(
						(countryName) => ({ name: countryName })
					);

					// Merge with existing countries to highlight
					this.countriesToHighlight = [
						...this.countriesToHighlight,
						...fetchedCountries,
					];

				} else {
					console.error("No data available");
				}
			} catch (error) {
				console.error("Error fetching values from database:", error);
			}
		},
		goToRoute(route) {
			this.$router.push(route);
		},
		getFlagUrl
	},
};
</script>

<style scoped>
/* Box Styles */
.box {
	border-radius: 10px;
	padding: 15px;
	margin: 15px auto;
	font-size: 16px;
	width: fit-content;
	max-width: 90%;
}

.box-countries {
	width: 100%;
	height: 100%;
	/* Ensure this has height */
}

.top-countries-and-top-study-programs {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;

	width: 100%;
	max-width: 1000px;
	margin: 25px auto;
	/* mindre luft */
	padding: 10px 0 20px 0;
	/* minimal padding */

}


@media screen and (max-width: 600px) {
	.btn {
		width: 100% !important;
	}

	.top-countries-and-top-study-programs {
		margin: 10px auto;
		padding: 0;
		position: relative;
		z-index: 10;
		pointer-events: auto;
	}


	.top-countries-and-top-study-programs h3 {
		font-size: 1.3rem;
	}
}
</style>
