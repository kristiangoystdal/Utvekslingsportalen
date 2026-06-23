// src/js/store.js
import { createStore } from 'vuex';
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, get, set } from 'firebase/database';

let unsubscribeAuth = null;

export default createStore({
  state: {
    user: null,
    userData: null,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setUserData(state, userData) {
      state.userData = userData;
    },
  },
  actions: {
    fetchUser({ commit }) {
      if (unsubscribeAuth) return;
      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
          commit('setUser', { uid: user.uid, email: user.email, displayName: user.displayName });
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
      });
    },
  },
  getters: {
    user: state => state.user,
    userData: state => state.userData,
    isAuthenticated: state => !!state.user,
  }
});
