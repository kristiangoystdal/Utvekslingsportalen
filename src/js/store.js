// src/js/store.js
import { createStore } from 'vuex';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, get, set } from 'firebase/database';

let unsubscribeAuth = null;
let authReadyResolve = null;
const authReadyPromise = new Promise((resolve) => { authReadyResolve = resolve; });

const store = createStore({
  state: {
    user: null,
    userData: null,
    authReady: false,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setUserData(state, userData) {
      state.userData = userData;
    },
    setAuthReady(state) {
      state.authReady = true;
    },
  },
  actions: {
    fetchUser({ commit, state }) {
      if (unsubscribeAuth) return authReadyPromise;
      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          commit('setUser', { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, emailVerified: user.emailVerified });
          const userDocRef = dbRef(db, `users/${user.uid}`);
          const userDoc = await get(userDocRef);
          if (userDoc.exists()) {
            commit('setUserData', userDoc.val());
          } else {
            const newUserData = {
              displayName: user.displayName || '',
              email: user.email,
            };
            await set(userDocRef, newUserData);
            commit('setUserData', newUserData);
          }
        } else {
          commit('setUser', null);
          commit('setUserData', null);
        }
        if (!state.authReady) {
          commit('setAuthReady');
          authReadyResolve();
        }
      });
      return authReadyPromise;
    },
  },
  getters: {
    user: state => state.user,
    userData: state => state.userData,
    isAuthenticated: state => !!state.user,
    authReady: state => state.authReady,
  }
});

export { authReadyPromise };
export default store;
