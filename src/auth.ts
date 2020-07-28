import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import './css/auth.css';
// @ts-ignore
import DiscordIcon from './img/Discord_Icon.png';
// @ts-ignore
import DiscordLogo from './img/Discord_Logo_Word.png';

(<HTMLImageElement>document.getElementById('discordIconImg')).src = DiscordIcon;
(<HTMLImageElement>document.getElementById('discordLogoImg')).src = DiscordLogo;

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

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        window.location.href = "./index.html";
    }
});

document.getElementById("discordButton").addEventListener("click", () => {
    window.open('/auth/popup.html', 'name', 'height=585,width=400');
});