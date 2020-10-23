
<template>
<div class="login">
    <v-container fill-height>
        <v-row justify="center">
            <v-card>
                <v-card-title>Login to Atlas</v-card-title>
                <v-card-actions>
                    <v-btn v-on:click="popUp()" color='#7289DA'>
                    <v-icon>mdi-discord</v-icon>Discord</v-btn>
                </v-card-actions>
            </v-card>
        </v-row>
    </v-container>
</div>
</template>

<script>
import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyButkqFXtrI90FUM-l7O-nWz-3TxIwd_0U",
    authDomain: "atlas-project-274801.firebaseapp.com",
    databaseURL: "https://atlas-project-274801.firebaseio.com",
    projectId: "atlas-project-274801",
    storageBucket: "atlas-project-274801.appspot.com",
    messagingSenderId: "807372296549",
    appId: "1:807372296549:web:b1e8fc3be8c2a27488918c",
    measurementId: "G-40XQC6G6E4"
}

firebase.initializeApp(firebaseConfig)
firebase.analytics()


export default {
name: "login",
methods: {
    popUp: function(){ 
        window.open('./auth/popup.html', 'name', 'height=585, width=400')
    }
  }
}
</script>

<style scoped>

</style>