// src/i18n.js
import { createI18n } from 'vue-i18n';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(";").shift());
  }
  return null;
}

const savedLocale =
  getCookie("locale") ||
  localStorage.getItem("language") ||
  "no";


const modules = import.meta.glob("../languages/no/*.json", { eager: true });
const modulesEn = import.meta.glob("../languages/en/*.json", { eager: true });

const messagesNo = {};
const messagesEn = {};

for (const path in modules) {
  const name = path.split("/").pop().replace(".json", "");
  messagesNo[name] = modules[path].default;
}

for (const path in modulesEn) {
  const name = path.split("/").pop().replace(".json", "");
  messagesEn[name] = modulesEn[path].default;
}

const i18n = createI18n({
  legacy: true,           // REQUIRED for $t()
  globalInjection: true,  // makes $t() + $i18n available everywhere
  locale: savedLocale,
  fallbackLocale: "no",
  messages: {
    no: messagesNo,
    en: messagesEn
  }
});



// Export the global i18n instance
export default i18n;

// Export a global translation function
export const translate = (key) => {
  return i18n.global.t(key);
};
