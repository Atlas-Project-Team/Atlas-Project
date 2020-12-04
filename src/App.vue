<template>
  <v-app :style="{background: $vuetify.theme.themes[theme].background}">
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900"
          rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css"
          rel="stylesheet">
    <div v-if="this.$store.state.user === undefined" class="layout-container">
      <v-container fill-height>
        <v-row justify="center">
          <v-card>
            <v-card-title v-if="firstImpression || !showMessage">Connecting to Auth Server
            </v-card-title>
            <v-card-title v-else>{{ message }}</v-card-title>
            <v-card-text>
              <v-progress-linear indeterminate></v-progress-linear>
            </v-card-text>
          </v-card>
        </v-row>
      </v-container>
    </div>
    <EmptySlot
        v-else
    ></EmptySlot>
  </v-app>
</template>

<script>
import EmptySlot from "./components/EmptySlot.vue";
import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';

// FirstImpression from https://github.com/robflaherty/firstImpression.js
// @formatter:off
const firstImpression=function(c,f){var a,b,d,e;a=function(j,k,i){var h,g,l;if(arguments.length>1&&String(k)!=="[object Object]"){i=i||{};if(k===null||k===undefined){i.expires=-1}if(typeof i.expires==="number"){h=i.expires;l=i.expires=new Date();l.setTime(l.getTime()+h*24*60*60*1000)}i.path="/";return(document.cookie=[encodeURIComponent(j),"=",encodeURIComponent(k),i.expires?"; expires="+i.expires.toUTCString():"",i.path?"; path="+i.path:"",i.domain?"; domain="+i.domain:"",i.secure?"; secure":""].join(""))}g=new RegExp("(?:^|; )"+encodeURIComponent(j)+"=([^;]*)").exec(document.cookie);return g?decodeURIComponent(g[1]):null};if(c===undefined){c="_firstImpression"}if(f===undefined){f=730}if(c===null){a("_firstImpression",null);return}if(f===null){a(c,null);return}b=function(){return a(c)};d=function(){a(c,true,{expires:f})};e=function(){var g=b();if(!g){d()}return !g};return e()};
// @formatter:on

export default {
  name: 'App',
  components: {
    EmptySlot
  },
  data() {
    return {
      firstImpression: true,
      showMessage: false,
      message: ""
    }
  },
  mounted() {
    window.firebase = firebase;
    this.firstImpression = firstImpression();
    if (Math.random() > 0.7) {
      this.showMessage = true;
    }
    const messages = [
      "Hacking into the Mainframe",
      "Finding Dr.Bolt's Secret Lab",
      "Piecing Bob back together",
      "Searching through disorganized YOLOL chips",
      "This map not brought to you by the Collective",
      "Re-welding shared modules",
      "Turning down main menu music",
      "Coming up with witty loading messages",
      "Loading time: Q1 2021?"
    ];
    this.message = messages[Math.floor(Math.random() * messages.length)];


    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        let token = await firebase.auth().currentUser.getIdToken(true);
        this.$store.commit('setUserToken', token);
      } else {
        this.$store.commit('setUserToken', null);
      }
      this.$store.commit('setUser', user);
      await this.$store.dispatch('refreshMapData');
    });
  },
  computed: {
    theme() {
      return (this.$vuetify.theme.dark) ? 'dark' : 'light'
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
}

.v-application, .v-application--wrap {
  height: 100%;
  width: 100%;
}

html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
