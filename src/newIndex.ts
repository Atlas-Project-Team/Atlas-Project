import './css/newIndex.css';
import Vue from 'vue'
import App from './App.vue'
import vuetify from "./plugins/vuetify";
import apolloProvider from "./plugins/apollo";
import "./plugins/vueCompositionApi";

new Vue({
    vuetify,
    apolloProvider,
    render: h => h(App),
}).$mount('#root')