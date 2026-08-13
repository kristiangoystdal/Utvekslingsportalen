import i18n from "./i18n";

// Sets document.title and the meta description tag from the seo.json
// translation files, keyed by route name. Called on every navigation
// (router.afterEach) and whenever the locale changes without navigating
// (the language switcher in Header.vue), so both stay in sync with $i18n.locale.
export function updatePageMeta(routeName) {
  if (!routeName) return;

  const title = i18n.global.t(`seo.pageTitles.${routeName}`);
  if (title && title !== `seo.pageTitles.${routeName}`) {
    document.title = title;
  }

  const description = i18n.global.t(`seo.pageDescriptions.${routeName}`);
  if (description && description !== `seo.pageDescriptions.${routeName}`) {
    let desc = document.querySelector("meta[name='description']");
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", description);
  }
}
