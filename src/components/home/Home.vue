<template>
	<div>
		<h2 class="preserve-whitespace">{{ $t("homepage.welcome") }}</h2>
		<p class="page-summary">
			{{ $t("homepage.siteDescription") }}
		</p>

		<div class="box">
			<v-row>
				<v-col cols="12" md="6">
					<v-btn class="btn btn-primary" @click="goToRoute('/utvekslinger')">{{ $t("actions.viewExchanges")
					}}</v-btn>
				</v-col>
				<v-col cols="12" md="6">
					<v-btn class="btn btn-third" @click="goToRoute('/profil?tab=exchange')">{{ $t("actions.createExchange")
					}}</v-btn>
				</v-col>
			</v-row>
		</div>

		<!-- Key numbers -->
		<ul v-if="stats" class="stats">
			<li v-for="stat in statItems" :key="stat.label" class="stat">
				<span class="stat-value">{{ stat.value.toLocaleString(locale) }}</span>
				<span class="stat-label">{{ stat.label }}</span>
			</li>
		</ul>

		<div class="box box-countries">
			<WorldMap :countries="countriesToHighlight" />
		</div>

		<div class="top-lists">
			<div class="top-countries-and-top-study-programs">
				<h3>{{ $t("homepage.topCountries") }}</h3>
				<BarChart :items="topCountriesTranslated" />
			</div>

			<div class="top-countries-and-top-study-programs">
				<h3>{{ $t("homepage.topStudyPrograms") }}</h3>
				<BarChart :items="topStudyPrograms" />
			</div>
		</div>
	</div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import countriesInformation from "../../data/countriesInformation.json";
import { db, auth } from "../../js/firebaseConfig.js";
import { getFlagUrl } from '../../js/i18nHelpers';

import { getExchangesData } from "../../js/exchangesCache";

// Destination universities of an exchange (two when the semesters were split).
function destinationUniversities(exchange) {
	const unis = [];
	if (exchange.university) unis.push(exchange.university);
	if (exchange.sameUniversity === false && exchange.secondUniversity && exchange.secondUniversity !== "null") {
		unis.push(exchange.secondUniversity);
	}
	return unis;
}

function topN(counts, n) {
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([name, count]) => ({ name, count }));
}

const WorldMap = defineAsyncComponent(() => import("./WorldMap.vue"));
const BarChart = defineAsyncComponent(() => import("./BarChart.vue"));

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
			stats: null,
			topCountries: [],
			topStudyPrograms: [],
			countriesInfo: countriesInformation,
		};
	},
	mounted() {
		this.getValuesFromDatabase();
	},
	computed: {
		locale() {
			return this.$i18n.locale === "en" ? "en-GB" : "nb-NO";
		},
		statItems() {
			return [
				{ value: this.stats.exchanges, label: this.$t("homepage.statExchanges") },
				{ value: this.stats.countries, label: this.$t("homepage.statCountries") },
				{ value: this.stats.universities, label: this.$t("homepage.statUniversities") },
				{ value: this.stats.studyPrograms, label: this.$t("homepage.statStudyPrograms") },
			];
		},
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
				const exchanges = await getExchangesData();

				if (!exchanges || Object.keys(exchanges).length === 0) {
					console.error("No data available");
					return;
				}

				const countriesSet = new Set();
				const countriesCount = {};
				const studyProgramsCount = {};
				const allCountries = new Set();
				const allUniversities = new Set();

				const exchangesList = Object.values(exchanges);

				for (const exchange of exchangesList) {
					if (exchange.country) allCountries.add(exchange.country);
					if (exchange.secondCountry && exchange.secondCountry !== "null") allCountries.add(exchange.secondCountry);
					destinationUniversities(exchange).forEach((uni) => allUniversities.add(uni));

					const semesters = exchange.semesters || [];
					const hasAutumnCourses = semesters.includes("Høst");
					const hasSpringCourses = semesters.includes("Vår");
					const hasSummerCourses = semesters.includes("Sommer");

					const hasMultipleSemesters =
						[hasAutumnCourses, hasSpringCourses, hasSummerCourses].filter(Boolean).length >= 2;

					const hasAnyCourses =
						hasAutumnCourses || hasSpringCourses || hasSummerCourses;

					if (hasMultipleSemesters) {
						if (!exchange.sameUniversity && exchange.secondCountry && exchange.secondCountry !== "null") {
							countriesSet.add(exchange.secondCountry);
							countriesCount[exchange.secondCountry] = (countriesCount[exchange.secondCountry] || 0) + 1;
						}

						if (exchange.country) {
							countriesSet.add(exchange.country);
							countriesCount[exchange.country] = (countriesCount[exchange.country] || 0) + 1;
						}
					} else if (hasAnyCourses) {
						if (exchange.country) {
							countriesSet.add(exchange.country);
							countriesCount[exchange.country] = (countriesCount[exchange.country] || 0) + 1;
						}
					}

					if (exchange.study) {
						studyProgramsCount[exchange.study] = (studyProgramsCount[exchange.study] || 0) + 1;
					}
				}

				this.stats = {
					exchanges: exchangesList.length,
					countries: allCountries.size,
					universities: allUniversities.size,
					studyPrograms: Object.keys(studyProgramsCount).length,
				};

				this.topCountries = topN(countriesCount, 10);
				this.topStudyPrograms = topN(studyProgramsCount, 10);

				this.countriesToHighlight = Array.from(countriesSet).map((countryName) => ({
					name: countryName,
					count: countriesCount[countryName],
				}));
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
	/* Matches WorldMap's own aspect-ratio so this reserves its final height
	   immediately, before the async WorldMap chunk loads and mounts —
	   otherwise the box collapses to 0 height and reflows everything below
	   it once the map appears. */
	aspect-ratio: 16 / 9;
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

	/* Reserves space for the async BarChart (400px chart + heading) so
	   the page doesn't reflow once that chunk loads and mounts. */
	min-height: 460px;
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

/* Key numbers */
.stats {
	list-style: none;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
	max-width: 900px;
	margin: 10px auto 24px;
	padding: 0;
}

.stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 14px 8px;
	border-radius: 12px;
	background: rgba(var(--third-color-rgb), 0.6);
}

.stat-value {
	font-size: 1.8rem;
	font-weight: 700;
	line-height: 1.1;
	color: var(--first-color);
	font-variant-numeric: tabular-nums;
}

.stat-label {
	font-size: 0.9rem;
	color: var(--second-color);
}

/* Top lists side by side on wide screens */
.top-lists {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24px;
	max-width: 1200px;
	margin: 0 auto;
}

@media (max-width: 960px) {
	.top-lists {
		grid-template-columns: 1fr;
		gap: 0;
	}
}

@media (max-width: 600px) {
	.stats {
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.stat-value {
		font-size: 1.4rem;
	}
}
</style>
