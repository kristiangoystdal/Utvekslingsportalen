<template>
	<div class="box box-fourth-color not-found-container center">
		<h1>{{ $t("errors.missingPageTitle") }}</h1>
		<p class="preserve-whitespace">
			{{ $t("errors.missingPageText") }}
		</p>
		<img src="../../assets/images/airport.gif" alt="Page Not Found GIF" class="not-found-gif" />
		<v-btn to="/" class="btn btn-primary hover">
			{{ $t("errors.missingPageButton") }}
		</v-btn>
	</div>
</template>

<script>
export default {
	name: "NotFound",
};
</script>

<style scoped>
.not-found-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 20vw;
	width: fit-content;
	margin: auto;
	background-color: var(--fourth-color);
	text-align: center;
	padding: 10px 50px;
	box-sizing: border-box;
	font-family: Arial, sans-serif;
}

h1 {
	color: var(--first-color);
	font-size: 2rem;
	margin-bottom: 20px;
}

p {
	color: var(--first-color);
	font-size: 1rem;
	margin-bottom: 20px;
}

.not-found-gif {
	width: 100%;
	max-width: 40%;
	height: auto;
	margin-bottom: 20px;
	border: 2px solid var(--second-color);
	border-radius: 10px;
}

.hover:hover {
	background-color: var(--third-color);
	color: var(--first-color);
}

.center {
	margin: auto;
	text-align: center;
}

@media (max-width: 768px) {
	.not-found-gif {
		max-width: 60vw;
	}

	.not-found-container {
		padding: 10px;
		margin-top: 50px;
	}

	h1 {
		font-size: 1.5rem;
	}
}
</style>
