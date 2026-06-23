<template>
	<div>
		<h2>JSON Data</h2>
		<br />
		<br />

		<v-data-table v-model:expanded="expanded" :headers="headers" :items="tableData" item-value="country" show-expand
			class="elevation-1">
			<template v-slot:expanded-row="{ columns, item }">
				<tr>
					<td :colspan="columns.length" id="coursesStyle">
						<div>
							<br />
							<h3 v-if="item.universities && item.universities.length">
								Universities
							</h3>
							<v-data-table-virtual v-if="item.universities && item.universities.length" :headers="nestedHeaders"
								:items="item.universities" item-value="name" dense class="virtual-table" hide-default-footer>
								<template v-slot:[`item.name`]="{ item }">
									{{ item.name }}
								</template>
								<template v-slot:[`item.field`]="{ item }">
									{{ item.field || "N/A" }}
								</template>
								<template v-slot:[`item.bachelorCredits`]="{ item }">
									{{ item.bachelorCredits || "N/A" }}
								</template>
								<template v-slot:[`item.masterCredits`]="{ item }">
									{{ item.masterCredits || "N/A" }}
								</template>
								<template v-slot:[`item.comments`]="{ item }">
									<div>
										<v-icon small class="mr-2" @click="showComments(item)">
											mdi-comment
										</v-icon>
									</div>
								</template>
							</v-data-table-virtual>
							<br />
						</div>
					</td>
				</tr>
			</template>
		</v-data-table>

		<!-- Comment Dialog -->
		<v-dialog v-model="commentDialog" max-width="500px">
			<v-card>
				<v-card-title>{{ currentUniversityName }}</v-card-title>
				<v-card-text>{{ currentComments }}</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="primary" text @click="closeCommentDialog">
						{{ $t('actions.close') }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
// Import the JSON data
import jsonData from "../data/credits.json";

export default {
	data() {
		return {
			expanded: [],
			headers: [
				{ title: "Country", value: "country" },
				{ title: "University Count", value: "universityCount" },
			],
			nestedHeaders: [
				{ title: "University", value: "name" },
				{ title: "Field", value: "field" },
				{ title: "Bachelor Credits", value: "bachelorCredits" },
				{ title: "Master Credits", value: "masterCredits" },
				{ title: "Comments", value: "comments" },
			],
			tableData: this.formatData(jsonData),
			commentDialog: false,
			currentUniversityName: "",
			currentComments: "",
		};
	},
	methods: {
		formatData(data) {
			return Object.entries(data).map(([country, universities]) => ({
				country,
				universityCount: Object.keys(universities).length,
				universities: Object.entries(universities).flatMap(
					([university, details]) =>
						details.map((detail) => ({
							name: university,
							...detail,
						}))
				),
			}));
		},
		showComments(university) {
			this.currentUniversityName = university.name;
			this.currentComments = university.comments || "No comments available";
			this.commentDialog = true;
		},
		closeCommentDialog() {
			this.commentDialog = false;
		},
	},
};
</script>

<style scoped>
.virtual-table {
	max-height: 300px;
	overflow-y: auto;
}
</style>
