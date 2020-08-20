import { addDecorator } from '@storybook/vue';
import vuetify from './vuetify_storybook';
import '@storybook/addon-console';
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';

export const parameters = {
    viewport: {
        viewports: {
            ...MINIMAL_VIEWPORTS,
        },
    },
    backgrounds: {
        default: 'atlas-dark',
        values: [
            {
                name: 'atlas-dark',
                value: '#343a40'
            }
        ]
    }
};

addDecorator(() => ({
    vuetify,
    template: `
    <v-app style="background:none">
        <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">
        <story/>
    </v-app>
    `
}));