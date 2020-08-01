import Vue from 'vue';
import SmallObjects from '../src/components/objects/objects.small.vue';

export default {title: 'SmallObjects'};

export const publicData = () => ({
    components: { SmallObjects },
    template: '<small-objects></small-objects>'
})