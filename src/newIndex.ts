import './css/newIndex.css';
import Split from 'split.js';
import Vue from 'vue';
import ObjectsComponent from './components/objects.vue';

const splitButtons = {
    template: `
        <div class="container" style="display: flex; flex-direction: column;">
            <div style="flex-grow: 4; display: flex; justify-content: center">
                <div style="display: flex; flex-direction: column; justify-content: center">
                    <select style="padding: 10px">
                        <option>Test</option>
                    </select>
                    <button style="padding: 10px" v-on:click="replaceWithComponent()">Select</button>
                </div>
            </div>
            <div style="display: flex; flex-basis: 100px; align-items: stretch">
                <button style="flex-grow: 1" v-on:click="splitH()">Split Horizontal</button>
                <button style="flex-grow: 1" v-on:click="splitV()">Split Vertical</button>
            </div>
        </div>
    `,
    methods: {
        splitH: function () {
            let newEl = document.createElement('div');
            newEl.classList.add('container');

            let left = document.createElement('div');
            left.classList.add('item');
            left.classList.add('horizontal');
            let leftItem = document.createElement('split-buttons');
            left.appendChild(leftItem);

            let right = document.createElement('div');
            right.classList.add('item');
            right.classList.add('horizontal');
            let rightItem = document.createElement('split-buttons');
            right.appendChild(rightItem);

            newEl.appendChild(left);
            newEl.appendChild(right);

            this.$el.replaceWith(newEl);
            let splitConstructor = Vue.extend(splitButtons);
            Split([left, right], {
                direction: "horizontal",
                gutterSize: 10
            });

            new splitConstructor().$mount('split-buttons');
            new splitConstructor().$mount('split-buttons');
        },
        splitV: function () {
            let newEl = document.createElement('div');
            newEl.classList.add('container');

            let top = document.createElement('div');
            top.classList.add('item');
            top.classList.add('vertical');
            let topItem = document.createElement('split-buttons');
            top.appendChild(topItem);

            let bottom = document.createElement('div');
            bottom.classList.add('item');
            bottom.classList.add('vertical');
            let bottomItem = document.createElement('split-buttons');
            bottom.appendChild(bottomItem);

            newEl.appendChild(top);
            newEl.appendChild(bottom);

            this.$el.replaceWith(newEl);
            let splitConstructor = Vue.extend(splitButtons);
            Split([top, bottom], {
                direction: "vertical",
                gutterSize: 10
            });

            new splitConstructor().$mount('split-buttons');
            new splitConstructor().$mount('split-buttons');
        },
        replaceWithComponent: function() {
            let newEl = document.createElement('objects');

            let componentConstructor = Vue.extend(ObjectsComponent);

            new componentConstructor().$mount('objects');
        }
    }
};

Vue.component('split-buttons', splitButtons);

const atlas = new Vue({
    el: '#root'
});