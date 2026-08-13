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
const Experiences = () => import('../components/experiences/Experiences.vue');
const CreateExperience = () => import('../components/experiences/CreateExperience.vue');
const EditExperience = () => import('../components/experiences/CreateExperience.vue');

import store, { authReadyPromise } from './store.js';
import { updatePageMeta } from './pageMeta.js';

// Page title/description text lives in seo.json (no/en), keyed by route
// name, and is applied locale-aware in router.afterEach — see pageMeta.js.
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },

  {
    path: '/utvekslinger',
    name: 'Exchanges',
    component: Exchanges,
  },

  {
    path: '/min_utveksling',
    redirect: { path: '/profil', query: { tab: 'exchange' } },
  },

  {
    path: '/kontakt',
    name: 'Contact',
    component: Contact,
  },

  {
    path: '/profil',
    name: 'Account',
    component: Account,
    meta: {
      requiresAuth: true,
    }
  },

  {
    path: '/logg_inn',
    name: 'Login',
    component: Login,
  },

  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: {
      requiresAuth: true,
    }
  },

  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ,
  },

  {
    path: '/erfaringer',
    name: 'Experiences',
    component: Experiences,
  },

  {
    path: '/erfaringer/:id',
    name: 'ExperienceDetail',
    component: Experiences,
  },

  {
    path: '/erfaringer/ny',
    redirect: '/profil',
  },

  {
    path: '/erfaringer/:id/rediger',
    name: 'EditExperience',
    component: EditExperience,
    meta: {
      requiresAuth: true,
    }
  },

  {
    path: '/kurs',
    name: 'Courses',
    component: Courses,
  },
  {
    path: '/terms_and_conditions',
    name: 'Terms and Conditions',
    component: Legal,
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  }
];


const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) {
      return false;
    }

    const isExperienceNav = to.path.startsWith('/erfaringer') && from.path.startsWith('/erfaringer');
    if (isExperienceNav) return false;

    return { top: 0 };
  }
});

router.beforeEach(async (to, from, next) => {
  const needsAuthState = to.name === 'Admin' || to.name === 'Login' || to.matched.some(record => record.meta.requiresAuth);

  // Public routes (e.g. Home) don't need to wait on Firebase auth to resolve
  // before rendering — only routes whose navigation outcome depends on auth
  // state (protected routes, Admin, Login) do.
  if (!needsAuthState) {
    return next();
  }

  await authReadyPromise;

  const isAuthenticated = store.getters.isAuthenticated;
  const adminUserId = import.meta.env.VITE_ADMIN_USER_ID;
  const currentUserId = store.getters.user?.uid;

  if (to.name === 'Admin' && (!adminUserId || !isAuthenticated || String(currentUserId) !== String(adminUserId))) {
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
  updatePageMeta(to.name);

  // ---- Google Analytics ----
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: to.fullPath,
      page_title: document.title,
    });
  }
});



export default router;
