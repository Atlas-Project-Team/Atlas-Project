import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import * as firebaseui from 'firebaseui';

// noinspection SpellCheckingInspection
const firebaseConfig = {
    apiKey: "AIzaSyButkqFXtrI90FUM-l7O-nWz-3TxIwd_0U",
    authDomain: "atlas-project-274801.firebaseapp.com",
    databaseURL: "https://atlas-project-274801.firebaseio.com",
    projectId: "atlas-project-274801",
    storageBucket: "atlas-project-274801.appspot.com",
    messagingSenderId: "807372296549",
    appId: "1:807372296549:web:b1e8fc3be8c2a27488918c",
    measurementId: "G-40XQC6G6E4"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();
let ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start('#login-box', {
    signInSuccessUrl: './index.html',
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
        },
        {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID
        }
    ],
    credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO
});