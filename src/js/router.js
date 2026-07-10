// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/home/Home.vue';

const Exchanges = () => import('../components/exchanges/Exchanges.vue');
const Contact = () => import('../components/windows/Contact.vue');
const Account = () => import('../components/profile/Account.vue');
const Login = () => import('../components/profile/Login.vue');
const FAQ = () => import('../components/windows/FAQ.vue');
const Admin = () => import('../components/admin/Admin.vue');
const NotFound = () => import('../components/error/NotFound.vue');
const Courses = () => import('../components/courses/Courses.vue');
const Legal = () => import('../components/docs/Legal.vue');
const Reports = () => import('../components/reports/Reports.vue');
const CreateReport = () => import('../components/reports/CreateReport.vue');
const EditReport = () => import('../components/reports/CreateReport.vue');

import store, { authReadyPromise } from './store.js';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: "Utvekslingsportalen",
      description: "Finn ekte erfaringer fra NTNU-studenter som har vært på utveksling. Søk etter land, universitet, fag og studieprogram."
    }
  },

  {
    path: '/utvekslinger',
    name: 'Exchanges',
    component: Exchanges,
    meta: {
      title: "Utvekslinger",
      description: "Les detaljerte utvekslingserfaringer, fagvalg, vurderinger og anbefalinger fra studenter som har reist ut gjennom NTNU."
    }
  },

  {
    path: '/min_utveksling',
    redirect: { path: '/profil', query: { tab: 'exchange' } },
  },

  {
    path: '/kontakt',
    name: 'Contact',
    component: Contact,
    meta: {
      title: "Kontakt oss",
      description: "Ta kontakt for spørsmål, tilbakemeldinger eller hjelp relatert til utvekslingserfaringer og portalen."
    }
  },

  {
    path: '/profil',
    name: 'Account',
    component: Account,
    meta: {
      requiresAuth: true,
      title: "Min profil",
      description: "Se og administrer kontoinformasjon, innstillinger og dine utvekslingsdata."
    }
  },

  {
    path: '/logg_inn',
    name: 'Login',
    component: Login,
    meta: {
      title: "Logg inn",
      description: "Logg inn for å administrere din profil, legge inn eller redigere dine utvekslingserfaringer."
    }
  },

  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      title: "Adminpanel",
      description: "Administrer utvekslingsdata, brukere og innhold. Kun tilgjengelig for administratorer."
    }
  },

  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ,
    meta: {
      title: "FAQ",
      description: "Finn svar på vanlige spørsmål om utveksling, fagvalg, innsendte erfaringer og bruk av portalen."
    }
  },

  {
    path: '/erfaringer',
    name: 'Reports',
    component: Reports,
    meta: {
      title: "Erfaringer",
      description: "Les utvekslingserfaringer fra studenter som har vært på utveksling gjennom NTNU."
    }
  },

  {
    path: '/erfaringer/:id',
    name: 'ReportDetail',
    component: Reports,
    meta: {
      title: "Erfaring",
      description: "Les en utvekslingserfaring fra en student som har vært på utveksling gjennom NTNU."
    }
  },

  {
    path: '/erfaringer/ny',
    redirect: '/profil',
  },

  {
    path: '/erfaringer/:id/rediger',
    name: 'EditReport',
    component: EditReport,
    meta: {
      requiresAuth: true,
      title: "Rediger erfaring",
      description: "Rediger din utvekslingserfaring."
    }
  },

  {
    path: '/kurs',
    name: 'Courses',
    component: Courses,
    meta: {
      title: "Kurs",
      description: "Utforsk fag NTNU-studenter har tatt på utveksling, og se hvilke emner som kan godkjennes."
    }
  },
  {
    path: '/terms_and_conditions',
    name: 'Terms and Conditions',
    component: Legal,
    meta: {
      title: "Juridisk informasjon",
      description: "Les juridisk informasjon og bruksvilkår for Utvekslingsportalen."
    }
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: "404 - Siden finnes ikke",
      description: "Siden du prøver å åpne eksisterer ikke. Gå tilbake til forsiden."
    }
  }
];


const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) {
      return false;
    }

    const isReportNav = to.path.startsWith('/erfaringer') && from.path.startsWith('/erfaringer');
    if (isReportNav) return false;

    return { top: 0 };
  }
});

router.beforeEach(async (to, from, next) => {
  await authReadyPromise;

  const isAuthenticated = store.getters.isAuthenticated;
  const adminUserId = import.meta.env.VITE_ADMIN_USER_ID;
  const currentUserId = store.getters.user?.uid;

  if (to.name === 'Admin' && (!adminUserId || !isAuthenticated || String(currentUserId) !== String(adminUserId))) {
    return next({ name: 'Home' });
  }

  const isReportsRoute = to.matched.some(record => ['Reports', 'ReportDetail', 'EditReport'].includes(record.name));
  if (isReportsRoute && (!adminUserId || !isAuthenticated || String(currentUserId) !== String(adminUserId))) {
    return next({ name: 'Home' });
  }

  if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Account' });
  }

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  next();
});

router.afterEach((to) => {
  // ---- Google Analytics ----
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: to.fullPath,
      page_title: to.meta?.title || document.title,
    });
  }

  // ---- Title ----
  if (to.meta?.title) {
    document.title = to.meta.title;
  }

  // ---- Description ----
  if (to.meta?.description) {
    let desc = document.querySelector("meta[name='description']");
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", to.meta.description);
  }
});



export default router;
