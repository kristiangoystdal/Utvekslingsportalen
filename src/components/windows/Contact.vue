<template>
	<div>
		<h2>{{ $t("contact.pageHeader") }}</h2>
		<p class="page-summary">
			{{ $t("contact.info") }}
		</p>

		<br />

		<v-card class="contact-card" rounded="lg">
			<v-card-text class="pa-6">
				<v-form @submit.prevent="submit">
					<v-text-field v-model="form.name" :counter="50" :error-messages="errors.name"
						:label="$t('contact.name')" :hint="$t('contact.nameHint')" persistent-hint
						prepend-inner-icon="mdi-account-outline" variant="outlined" density="comfortable" class="mb-3" />

					<v-text-field v-model="form.email" :error-messages="errors.email" :rules="emailRules"
						:label="$t('contact.email')" :hint="$t('contact.emailHint')" persistent-hint
						prepend-inner-icon="mdi-email-outline" variant="outlined" density="comfortable" class="mb-3" />

					<v-textarea v-model="form.message" :counter="500" :error-messages="errors.message"
						:label="$t('contact.message')" :hint="$t('contact.messageHint')" persistent-hint
						prepend-inner-icon="mdi-message-text-outline" variant="outlined" rows="5" class="mb-2" />

					<div class="contact-actions">
						<v-btn class="action-btn" color="primary" :loading="isSubmitting" :disabled="isSubmitting"
							type="submit" rounded="lg">
							{{ $t("contact.submit") }}
						</v-btn>

						<v-btn class="action-btn" variant="outlined" rounded="lg" :disabled="isSubmitting"
							@click="handleReset">
							{{ $t("contact.clear") }}
						</v-btn>
					</div>
				</v-form>
			</v-card-text>
		</v-card>
	</div>
</template>

<script>
import emailjs from "emailjs-com";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


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
			return EMAIL_REGEX.test(this.form.email);
		},
		validMessage() {
			return this.form.message.length > 10;
		},
		emailRules() {
			return [(v) => !v || EMAIL_REGEX.test(v) || this.$t("errors.contactEmail")];
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
			if (!EMAIL_REGEX.test(this.form.email)) {
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
					const emailjs_serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
					const emailjs_templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
					const emailjs_userID = import.meta.env.VITE_EMAILJS_USER_ID;

					if (!emailjs_serviceID || !emailjs_templateID || !emailjs_userID) {
						console.error("Missing EmailJS configuration");
						toast.error(this.$t("errors.emailConfigMissing"));
						return;
					}

					const emailjs_templateParams = {
						name: this.form.name,
						email: this.form.email,
						message: this.form.message,
					};

					await emailjs.send(emailjs_serviceID, emailjs_templateID, emailjs_templateParams, emailjs_userID);
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
.contact-card {
	background-color: var(--color-bg-card);
	border: 1px solid var(--third-color);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.contact-actions {
	display: flex;
	gap: 12px;
	margin-top: 8px;
}

.action-btn {
	text-transform: none;
	font-size: 16px;
}

@media (max-width: 600px) {
	.contact-actions {
		flex-direction: column;
	}

	.action-btn {
		width: 100%;
	}
}
</style>
