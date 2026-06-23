<template>
	<div v-if="modelValue" class="modal-overlay" @click.self="close">
		<div class="modal-card" role="dialog" aria-modal="true">
			<!-- Header -->
			<div class="modal-header">
				<div class="modal-title">
					<v-icon class="mr-2" size="22">mdi-upload</v-icon>
					{{ $t("upload.pageHeader") }}
				</div>

				<button class="modal-close" type="button" @click="close" aria-label="Close">
					<v-icon size="20">mdi-close</v-icon>
				</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				<p class="modal-info">{{ $t("upload.info") }}</p>

				<!-- Existing upload -->
				<div v-if="existingUpload" class="existing-upload mb-4">
					<div class="field-title">{{ $t("upload.currentUpload") }}</div>
					<div class="d-flex align-center ga-3 flex-wrap">
						<v-icon size="20">mdi-file-document-outline</v-icon>
						<a :href="existingUpload.url" target="_blank" rel="noopener noreferrer">
							{{ existingUpload.filename }}
						</a>
						<span class="text-caption text-medium-emphasis">
							{{ formatDate(existingUpload.uploadedAt) }}
						</span>
					</div>
					<p v-if="existingUpload.comment" class="mt-1 text-body-2 text-medium-emphasis">
						{{ existingUpload.comment }}
					</p>
					<v-btn variant="outlined" size="small" color="error" class="mt-2" :loading="isDeleting"
						:disabled="isDeleting || isSubmitting" @click="removeUpload">
						{{ $t("upload.remove") }}
					</v-btn>
				</div>

				<!-- Dropzone -->
				<div class="upload-dropzone" @click="triggerFilePicker" role="button" tabindex="0"
					@keydown.enter.prevent="triggerFilePicker" @keydown.space.prevent="triggerFilePicker">
					<div class="upload-icon">
						<v-icon size="52">mdi-file-upload-outline</v-icon>
					</div>

					<div class="upload-text">
						<div class="upload-file-title">
							{{ selectedFile ? selectedFile.name : $t('upload.clickToSelect') }}
						</div>
						<div class="upload-subtitle">
							{{ $t('upload.fileTypesAndMax') }}
						</div>
					</div>

					<input ref="fileInput" type="file" class="sr-only"
						accept=".pdf,.png,.jpg,.jpeg"
						@change="onFileChange" />
				</div>
				<div v-if="uploadError" class="text-error text-caption mt-1">{{ uploadError }}</div>

				<!-- Comment -->
				<div class="upload-section">
					<div class="field-title">{{ $t("upload.comment") }}</div>

					<v-textarea outlined rows="3" dense class="upload-input preserve" :label="$t('upload.commentLabel')"
						v-model="comment" />
				</div>
			</div>

			<!-- Footer -->
			<div class="modal-actions">
				<v-btn class="btn btn-danger" @click="close">
					{{ $t("actions.cancel") }}
				</v-btn>
				<v-btn class="btn-no" @click="upload" :loading="isSubmitting"
					:disabled="isSubmitting || !selectedFile">
					{{ existingUpload ? $t("upload.replace") : $t("upload.submit") }}
				</v-btn>
			</div>
		</div>
	</div>
</template>

<script>
import { db, auth, storage } from "../../js/firebaseConfig";
import { ref as dbRef, get, set, remove } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import emailjs from "emailjs-com";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export default {
	props: {
		modelValue: { type: Boolean, default: false },
	},
	emits: ["update:modelValue"],

	data() {
		return {
			selectedFile: null,
			comment: "",
			uploadError: "",
			isSubmitting: false,
			isDeleting: false,
			existingUpload: null,
		};
	},

	watch: {
		modelValue(open) {
			if (open) {
				this.selectedFile = null;
				this.comment = "";
				this.uploadError = "";
				this.loadExistingUpload();
			}
		},
	},

	methods: {
		close() {
			this.$emit("update:modelValue", false);
		},

		async loadExistingUpload() {
			if (!auth.currentUser) return;
			const snapshot = await get(dbRef(db, `uploads/${auth.currentUser.uid}`));
			this.existingUpload = snapshot.exists() ? snapshot.val() : null;
		},

		formatDate(timestamp) {
			return new Date(timestamp).toLocaleDateString();
		},

		triggerFilePicker() {
			this.$refs.fileInput?.click();
		},

		onFileChange(e) {
			const file = e.target.files?.[0] || null;
			this.uploadError = "";

			if (file) {
				if (file.size > MAX_FILE_SIZE) {
					this.uploadError = this.$t("errors.fileTooLarge");
					this.selectedFile = null;
					return;
				}
				if (!ALLOWED_TYPES.includes(file.type)) {
					this.uploadError = this.$t("errors.fileTypeNotAllowed");
					this.selectedFile = null;
					return;
				}
			}
			this.selectedFile = file;
		},

		async removeUpload() {
			if (!this.existingUpload || !auth.currentUser) return;
			this.isDeleting = true;
			try {
				const fileRef = storageRef(storage, this.existingUpload.storagePath);
				await deleteObject(fileRef).catch(() => {});
				await remove(dbRef(db, `uploads/${auth.currentUser.uid}`));
				this.existingUpload = null;
				toast.success(this.$t("notifications.fileRemoved"));
			} catch (error) {
				console.error("Remove error:", error);
				toast.error(this.$t("notifications.fileRemoveFailure"));
			} finally {
				this.isDeleting = false;
			}
		},

		async upload() {
			this.isSubmitting = true;
			if (!this.selectedFile || !auth.currentUser) {
				this.isSubmitting = false;
				return;
			}

			try {
				if (this.existingUpload) {
					const oldRef = storageRef(storage, this.existingUpload.storagePath);
					await deleteObject(oldRef).catch(() => {});
				}

				const file = this.selectedFile;
				const filePath = `uploads/${auth.currentUser.uid}/${file.name}`;
				const fileRef = storageRef(storage, filePath);
				await uploadBytes(fileRef, file);
				const fileLink = await getDownloadURL(fileRef);

				const uploadData = {
					filename: file.name,
					url: fileLink,
					storagePath: filePath,
					comment: this.comment || "",
					uploadedAt: Date.now(),
				};
				await set(dbRef(db, `uploads/${auth.currentUser.uid}`), uploadData);
				this.existingUpload = uploadData;

				const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
				const templateID = import.meta.env.VITE_EMAILJS_FILE_TEMPLATE_ID;
				const userID = import.meta.env.VITE_EMAILJS_USER_ID;

				if (serviceID && templateID && userID) {
					await emailjs.send(serviceID, templateID, {
						comment: this.comment || "No comment provided.",
						filename: file.name,
						file_url: fileLink,
					}, userID);
				}

				this.close();
				toast.success(this.$t("notifications.fileSendSuccess"));
			} catch (error) {
				console.error("Upload error:", error);
				toast.error(this.$t("notifications.fileSendFailure"));
			} finally {
				this.isSubmitting = false;
			}
		},
	},
};
</script>

<style scoped>
/* Overlay */
.modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 18px;
	z-index: 9999;
}

/* Card */
.modal-card {
	width: min(640px, 100%);
	background: var(--color-bg-card);
	border-radius: 18px;
	box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
	overflow: hidden;
}

/* Header */
.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-title {
	display: flex;
	align-items: center;
	font-weight: 800;
	font-size: 1.15rem;
	color: rgba(0, 0, 0, 0.86);
}

.modal-close {
	border: 0;
	background: transparent;
	cursor: pointer;
	padding: 8px;
	border-radius: 10px;
	display: grid;
	place-items: center;
	transition: background 0.15s ease;
}

.modal-close:hover {
	background: rgba(0, 0, 0, 0.06);
}

/* Body */
.modal-body {
	padding: 18px 20px 6px;
}

.modal-info {
	margin: 0 0 12px 0;
	color: rgba(0, 0, 0, 0.65);
	line-height: 1.45;
	font-size: 0.95rem;
}

/* Sections */
.upload-section {
	margin-top: 14px;
}

.field-title {
	font-size: 0.85rem;
	font-weight: 700;
	color: rgba(0, 0, 0, 0.72);
	margin-bottom: 6px;
}

/* Inputs */
.upload-input .v-field {
	border-radius: 12px;
}

.upload-input .v-field__input {
	padding-top: 10px;
	padding-bottom: 10px;
}

/* Footer */
.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 20px 18px;
	border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Existing upload */
.existing-upload {
	padding: 14px;
	border-radius: 12px;
	background: rgba(0, 0, 0, 0.03);
	border: 1px solid rgba(0, 0, 0, 0.08);
}

.existing-upload a {
	color: rgb(var(--v-theme-primary));
	font-weight: 600;
	text-decoration: none;
}

.existing-upload a:hover {
	text-decoration: underline;
}

/* Dropzone */
.upload-dropzone {
	width: 100%;
	min-height: 170px;
	border: 2px dashed rgba(0, 0, 0, 0.16);
	border-radius: 16px;
	background: rgba(0, 0, 0, 0.02);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	cursor: pointer;
	user-select: none;
	padding: 18px;
	text-align: center;
	transition: border-color 0.18s ease, background 0.18s ease, transform 0.06s ease;
}

.upload-dropzone:hover {
	border-color: rgba(0, 0, 0, 0.30);
	background: rgba(0, 0, 0, 0.03);
}

.upload-dropzone:active {
	transform: scale(0.995);
}

.upload-icon {
	opacity: 0.72;
}

.upload-file-title {
	font-weight: 800;
	font-size: 0.95rem;
	color: rgba(0, 0, 0, 0.82);
}

.upload-subtitle {
	margin-top: 2px;
	font-size: 0.82rem;
	opacity: 0.68;
}

/* SR only */
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

/* Small screens */
@media (max-width: 480px) {

	.modal-header,
	.modal-body,
	.modal-actions {
		padding-left: 14px;
		padding-right: 14px;
	}

	.modal-title {
		font-size: 1.05rem;
	}
}
</style>
