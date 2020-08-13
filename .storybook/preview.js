import { addDecorator } from '@storybook/vue';
import vuetify from './vuetify_storybook';

addDecorator(() => ({
    vuetify,
    template: `
    <v-app>
        <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">
        <story/>
    </v-app>
    `
}));