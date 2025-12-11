import { createApp } from "vue";
import App from "./App.vue";
import store from "./js/store";
import { auth } from "./js/firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import vuetify from "./plugins/vuetify";
import router from "./js/router.js";
import Vue3Toastify from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import i18n from "./js/i18n.js";
import { i18nMixin } from "./mixins/i18nMixin";

import "./assets/css/main.css";
import "./assets/css/bg.css";
import "./assets/css/btn.css";
import "./assets/css/card.css";
import "./assets/css/dialog.css";
import "./assets/css/footer.css";
import "./assets/css/form.css";
import "./assets/css/navbar.css";
import "./assets/css/txt.css";
import "./assets/css/boxes.css";
import "./assets/css/datatable.css";
import "./assets/css/expansion-panel.css";
import "./assets/css/profile-card.css";
import "./assets/css/custom-toastify.css";

let app;

onAuthStateChanged(auth, () => {
	if (!app) {
		app = createApp(App)
			.use(store)
			.use(vuetify) // Use Vuetify
			.use(router) // Use Vue Router
			.use(i18n) // Use vue-i18n
			.mixin(i18nMixin) // Register the mixin globally
			.use(Vue3Toastify, {
				closeOnClick: true,
				pauseOnHover: true,
				position: "bottom-right",
				hideProgressBar: false,
			})
			.mount("#app");

	}
	store.dispatch("fetchUser");
});
