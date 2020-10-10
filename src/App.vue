<template>
  <v-app :style="{background: $vuetify.theme.themes[theme].background}">
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">
    <EmptySlot></EmptySlot>
  </v-app>
</template>

<script>
import EmptySlot from "./components/EmptySlot.vue";
import gql from 'graphql-tag';
import {computed} from '@vue/composition-api';


export default {
  name: 'App',
  components: {
    EmptySlot
  },
  provide() {
    return {
      mapDataProvider: computed(() => this.mapDataProvider)
    }
  },
  apollo: {
    mapDataProvider: gql`query {
      mapDataProvider: getMapData {
        name,
        objectId,
        pos {x,y,z},
        modelPath,
        objectInfo {
            parameter,
            value
        },
        scale,
        defaultZoom,
        owner,
      }
    }`,
  },
  data() {
    return {
      mapDataProvider: ''
    }
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
