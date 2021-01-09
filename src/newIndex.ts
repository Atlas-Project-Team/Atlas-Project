import './css/layout.css';
import Vue from 'vue';
import App from './App.vue';
// eslint-disable-next-line import/extensions
import vuetify from './plugins/vuetify';
// eslint-disable-next-line import/extensions
import store from './plugins/vuex';

new Vue({
  vuetify,
  store,
  render: (h) => h(App),
}).$mount('#root');
