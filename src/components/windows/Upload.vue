<template>
  <div>
    <h2>{{ $t("upload.pageHeader") }}</h2>
    <br />
    <p class="page-summary">
      {{ $t("upload.info") }}
    </p>

    <v-container style="padding: 20px; max-width: 80%; margin: 10px auto">
      <form @submit.prevent="submit">
        <v-file-input v-model="form.file" :error-messages="errors.file" :label="$t('upload.file')"
          accept=".pdf,.png,.jpg,.jpeg" helper-text="Select a file to upload (PDF or image)." />

        <v-textarea v-model="form.comment" :counter="500" :error-messages="errors.comment"
          :label="$t('upload.comment')" helper-text="Enter any comments you have (at least 10 characters)."
          rows="5" />

        <v-btn class="me-4" style="background-color: var(--second-color); color: white" :loading="isSubmitting"
          :disabled="isSubmitting" type="submit">
          {{ $t("upload.submit") }}
        </v-btn>

        <v-btn @click="handleReset">{{ $t("upload.clear") }}</v-btn>
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
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      const ALLOWED_TYPES = [
        "application/pdf",
        "image/png",
        "image/jpeg",
      ];

      let valid = true;
      this.errors = {};

      if (!this.form.file) {
        this.errors.file = this.$t("errors.uploadFileRequired");
        valid = false;
      } else if (this.form.file.size > MAX_FILE_SIZE) {
        this.errors.file = this.$t("errors.fileTooLarge");
        valid = false;
      } else if (!ALLOWED_TYPES.includes(this.form.file.type)) {
        this.errors.file = this.$t("errors.fileTypeNotAllowed");
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
        const emailjs_serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const emailjs_templateID = import.meta.env.VITE_EMAILJS_FILE_TEMPLATE_ID;
        const emailjs_userID = import.meta.env.VITE_EMAILJS_USER_ID;

        if (!emailjs_serviceID || !emailjs_templateID || !emailjs_userID) {
          console.error("Missing EmailJS configuration");
          toast.error(this.$t("errors.emailConfigMissing"));
          return;
        }

        const emailjs_templateParams = {
          comment: this.form.comment,
          filename: file.name,
          file_url: fileLink,
        };

        await emailjs.send(emailjs_serviceID, emailjs_templateID, emailjs_templateParams, emailjs_userID);
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
