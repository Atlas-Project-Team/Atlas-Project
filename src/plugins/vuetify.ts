import Vue from 'vue';
import Vuetify from 'vuetify/lib';
// @ts-ignore
import VuetifyConfirm from './confirm/index';
import 'vuetify/dist/vuetify.min.css';

const vuetify = new Vuetify({
  theme: {
    dark: true,
    themes: {
      light: {

      },
      dark: {
        background: '#343a40',
      },
    },
  },
});

Vue.use(Vuetify);
Vue.use(VuetifyConfirm, { vuetify });

export default vuetify;
