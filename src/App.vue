<template>
  <EmptySlot></EmptySlot>
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
html {
  margin: 0;
  padding: 0;
}
</style>
