<template>
  <div>
    <h2>{{ $t("uploadPage.pageHeader") }}</h2>
    <br />
    <p class="page-summary">
      {{ $t("uploadPage.info") }}
    </p>

    <v-container style="padding: 20px; max-width: 80%; margin: 10px auto">
      <form @submit.prevent="submit">
        <v-file-input v-model="form.file" :error-messages="errors.file" :label="$t('uploadPage.file')"
          accept=".pdf,.png,.jpg,.jpeg" helper-text="Select a file to upload (PDF or image)." />

        <v-textarea v-model="form.comment" :counter="500" :error-messages="errors.comment"
          :label="$t('uploadPage.comment')" helper-text="Enter any comments you have (at least 10 characters)."
          rows="5" />

        <v-btn class="me-4" style="background-color: var(--second-color); color: white" :loading="isSubmitting"
          :disabled="isSubmitting" type="submit">
          {{ $t("uploadPage.submit") }}
        </v-btn>

        <v-btn @click="handleReset">{{ $t("uploadPage.clear") }}</v-btn>
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
        file: null,
        comment: "",
      },
      errors: {},
      isSubmitting: false,
    };
  },

  methods: {
    validateForm() {
      let valid = true;
      this.errors = {};

      if (!this.form.file) {
        this.errors.file = this.$t("errors.uploadFileRequired");
        valid = false;
      }

      return valid;
    },
    async submit() {
      this.isSubmitting = true;
      if (!this.validateForm()) {
        this.isSubmitting = false;
        return;
      }

      try {
        const file = this.form.file;
        const formData = new FormData();
        formData.append("file", file);

        // === Upload to tmpfiles.org ===
        const uploadResponse = await fetch("https://tmpfiles.org/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("File upload failed with status " + uploadResponse.status);
        }

        const result = await uploadResponse.json();
        if (!result.data || !result.data.url) throw new Error("Unexpected response format");

        // Extract clean link
        const fileLink = result.data.url.replace("/api/v1", "").trim();

        // === Send notification via EmailJS ===
        const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateID = import.meta.env.VITE_EMAILJS_FILE_TEMPLATE_ID;
        const userID = import.meta.env.VITE_EMAILJS_USER_ID;

        const templateParams = {
          comment: this.form.comment,
          filename: file.name,
          file_url: fileLink,
        };

        await emailjs.send(serviceID, templateID, templateParams, userID);
        toast.success(this.$t("notifications.fileSendSuccess"));
        this.handleReset();
      } catch (error) {
        console.error("Upload or email error:", error);
        toast.error(this.$t("notifications.fileSendFailure"));
      } finally {
        this.isSubmitting = false;
      }
    },
    handleReset() {
      this.form = { file: null, comment: "" };
      this.errors = {};
    },
  },
};
</script>

<style scoped>
.v-btn {
  margin-top: 10px;
}
</style>
