<template>
  <v-app>
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">
    <EmptySlot></EmptySlot>
  </v-app>
</template>

<script>
import EmptySlot from "./components/EmptySlot.vue";

export default {
  name: 'App',
  components: {
    EmptySlot
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
  background: #343a40;
}

html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.theme--light > * > * > .v-list-item__title {
  color: #222;
}
</style>
