import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';

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

document.getElementById('signInButton').addEventListener('click', () => {
    let email = (<HTMLInputElement>document.getElementById('emailInputField')).value;
    let password = (<HTMLInputElement>document.getElementById('passwordInputField')).value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(function (error: any) {
            // Handle Errors here.
            if (error.code === 'auth/invalid-email') {
                document.getElementById('errorText').innerText = "Email is invalid.";
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                document.getElementById('errorText').innerText = "Email or password is incorrect.";
            } else {
                document.getElementById('errorText').innerText = "An error occurred.";
            }
        })
        .then(res => {
            if (res !== undefined) {
                document.getElementById('errorText').innerText = "";
            }
        })
});

document.getElementById('signUpButton').addEventListener('click', () => {
    let email = (<HTMLInputElement>document.getElementById('emailInputField')).value;
    let password = (<HTMLInputElement>document.getElementById('passwordInputField')).value;
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(function (error) {
            // Handle Errors here.
            console.dir(error);
            if (error.code === 'auth/invalid-email') {
                document.getElementById('errorText').innerText = "Email is invalid.";
            } else if (error.code === 'auth/weak-password') {
                document.getElementById('errorText').innerText = error.message;
            } else if (error.code === 'auth/email-already-in-use') {
                document.getElementById('errorText').innerText = error.message;
            } else {
                document.getElementById('errorText').innerText = "An error occurred.";
            }
        })
        .then(res => {
            if (res !== undefined) {
                document.getElementById('errorText').innerText = "";
            }
        })
});

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        window.location.href = './index.html';
    } else {
        console.log("Signed out");
    }
});