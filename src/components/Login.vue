<template>
  <div class="login">
    <v-container fill-height>
      <v-row justify="center">
        <v-card>
          <v-card-title>Login to Atlas</v-card-title>
          <v-card-actions>
            <v-btn
              color="#7289DA"
              @click="popUp()"
            >
              <v-icon>mdi-discord</v-icon>Discord
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'Login',
  methods: {
    popUp() {
      window.open('./auth/popup.html', 'name', 'height=585, width=400');
    },
  },
};
</script>

<style scoped>

</style>
