// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/home/Home.vue';
import Exchanges from '../components/exchanges/Exchanges.vue';
import EditExchange from '../components/exchanges/EditExchange.vue';
import Contact from '../components/windows/Contact.vue';
import Account from '../components/profile/Account.vue';
import Login from '../components/profile/Login.vue';
import FAQ from '../components/windows/FAQ.vue';
import Admin from '../components/admin/Admin.vue';
import NotFound from '../components/error/NotFound.vue';
import Upload from '../components/windows/Upload.vue';
import Courses from '../components/courses/Courses.vue';
import Legal from '../components/docs/Legal.vue'

import store from './store.js';

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
      description: "Les detaljerte utvekslingsrapporter, fagvalg, vurderinger og anbefalinger fra studenter som har reist ut gjennom NTNU."
    }
  },

  {
    path: '/min_utveksling',
    name: 'EditExchange',
    component: EditExchange,
    meta: {
      title: "Min utveksling",
      description: "Rediger din utvekslingsrapport og del verdifulle erfaringer for å hjelpe kommende studenter."
    }
  },

  {
    path: '/kontakt',
    name: 'Contact',
    component: Contact,
    meta: {
      title: "Kontakt oss",
      description: "Ta kontakt for spørsmål, tilbakemeldinger eller hjelp relatert til utvekslingsrapporter og portalen."
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
      description: "Logg inn for å administrere din profil, legge inn erfaringer eller redigere utvekslingsrapporter."
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
      description: "Finn svar på vanlige spørsmål om utveksling, fagvalg, innsendte rapporter og bruk av portalen."
    }
  },

  {
    path: '/last_opp',
    name: 'Upload',
    component: Upload,
    meta: {
      title: "Last opp rapport",
      description: "Last opp din utvekslingsrapport og hjelp andre NTNU-studenter med å finne riktig universitet."
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
    path: '/legal',
    name: 'Legal',
    component: Legal,
    meta: {
      title: "Legal Information",
      description: "Read the legal information and terms of use for the exchange portal."
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

    return { top: 0 };
  }
});

router.beforeEach((to, from, next) => {
  // Navigation guard for authentication and admin access
  const isAuthenticated = store.getters.isAuthenticated; // Check if user is authenticated
  const adminUserId = String(import.meta.env.VITE_ADMIN_USER_ID); // Ensure Admin user ID is a string
  const currentUserId = String(store.getters.user?.uid || ''); // Ensure current user ID is a string

  // Admin gate: Only allow access to Admin route if user is authenticated and is the admin
  if (to.name === 'Admin' && (!isAuthenticated || currentUserId !== adminUserId)) {
    return next({ name: 'Home' }); // Redirect unauthorized users to the home page
  }

  // Redirect authenticated users away from the login page
  if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Account' }); // Redirect to the Account page or Home page
  }

  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    return next({ name: 'Login' }); // Redirect unauthenticated users to the login page
  }



  next(); // Proceed to the route if all checks pass
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
