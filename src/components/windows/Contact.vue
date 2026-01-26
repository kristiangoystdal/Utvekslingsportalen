<template>
	<div>
		<h2>{{ $t("contactPage.pageHeader") }}</h2>
		<p class="page-summary">
			{{ $t("contactPage.info") }}
		</p>
		<v-container style="padding: 20px; max-width: 80%; margin: 10px auto">
			<form @submit.prevent="submit">
				<v-text-field v-model="form.name" :counter="50" :error-messages="errors.name" :label="$t('contactPage.name')"
					helper-text="Enter your full name (at least 2 characters)."></v-text-field>

				<v-text-field v-model="form.email" :error-messages="errors.email" :label="$t('contactPage.email')"
					helper-text="Enter a valid email address."></v-text-field>

				<v-textarea v-model="form.message" :counter="500" :error-messages="errors.message"
					:label="$t('contactPage.message')" helper-text="Enter the issue you want help with (at least 10 characters)."
					rows="5"></v-textarea>

				<v-btn class="me-4" style="background-color: var(--second-color); color: white" :loading="isSubmitting"
					:disabled="isSubmitting" type="submit">
					{{ $t("contactPage.submit") }}
				</v-btn>

				<v-btn @click="handleReset">{{ $t("contactPage.clear") }}</v-btn>
			</form>
		</v-container>
	</div>
</template>

<script>
import emailjs from "emailjs-com";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default {
	data() {
		return {
			form: {
				name: "",
				email: "",
				message: "",
			},
			errors: {},
			isSubmitting: false,
		};
	},
	computed: {
		validName() {
			return this.form.name.length > 2;
		},
		validEmail() {
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return emailPattern.test(this.form.email);
		},
		validMessage() {
			return this.form.message.length > 10;
		},
	},
	methods: {
		validateForm() {
			let valid = true;
			this.errors = {};

			// Name validation
			if (this.form.name.length < 2) {
				this.errors.name = this.$t("errors.contactName");
				valid = false;
			}

			// Email validation
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailPattern.test(this.form.email)) {
				this.errors.email = this.$t("errors.contactEmail");
				valid = false;
			}

			// Message validation
			if (this.form.message.length < 10) {
				this.errors.message = this.$t("errors.contactMessage");
				valid = false;
			}

			return valid;
		},
		async submit() {
			this.isSubmitting = true;
			const isValid = this.validateForm();
			if (isValid) {
				try {
					const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
					const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
					const userID = import.meta.env.VITE_EMAILJS_USER_ID;

					const templateParams = {
						name: this.form.name,
						email: this.form.email,
						message: this.form.message,
					};

					await emailjs.send(serviceID, templateID, templateParams, userID);
					this.handleReset();
					toast.success(this.$t("notifications.emailSendSuccess"));
				} catch (error) {
					toast.error(this.$t("notifications.emailSendFailure"));
					console.error("Error:", error);
				}
			}
			this.isSubmitting = false;
		},
		handleReset() {
			this.form = {
				name: "",
				email: "",
				message: "",
			};
			this.errors = {};
		},
	},
};
</script>

<style scoped>
/* Add any specific styles for the form */
</style>
