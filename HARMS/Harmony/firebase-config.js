// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIBUjhkYDcSPMAiowao6NUCOdOb_V73m8",
  authDomain: "harmony9503.firebaseapp.com",
  projectId: "harmony9503",
  storageBucket: "harmony9503.firebasestorage.app",
  messagingSenderId: "244278361492",
  appId: "1:244278361492:web:a18a7a5a6351a26f9ea381",
  measurementId: "G-47T5G80056"
};

// We will use the CDN versions in the HTML files, 
// but this file can be imported to share the config.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
