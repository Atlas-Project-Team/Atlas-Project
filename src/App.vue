<template>
  <v-app :style="{background: $vuetify.theme.themes[theme].background}">
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">
    <div class="layout-container" v-if="this.$store.state.user === undefined">
      <v-container fill-height>
        <v-row justify="center">
          <v-card>
            <v-card-title>Connecting to Auth Server</v-card-title>
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
import gql from 'graphql-tag';
import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';

export default {
  name: 'App',
  components: {
    EmptySlot
  },
  mounted() {
    window.firebase = firebase;

    firebase.auth().onAuthStateChanged(async (user)=>{
      if(user) {
        let token = await firebase.auth().currentUser.getIdToken(true);
        this.$store.commit('setUserToken', token);
      }else{
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
