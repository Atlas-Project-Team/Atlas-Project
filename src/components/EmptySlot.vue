<template>
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
</template>

<script>
const sampleData=[{objectId:0,pos:{x:0,y:0,z:0},modelPath:"Assets/models/Neptune/",objectInfo:[{parameter:"Object",value:"Planet"},{parameter:"Type",value:"Gas Giant"}],scale:10,name:"Eos",defaultZoom:2e4,owner:""},{scale:1,name:"Eos 222",objectId:1,pos:{x:15,y:0,z:0},modelPath:"Assets/models/Station/",objectInfo:[{parameter:"Object",value:"Station"},{parameter:"Type",value:"Neutral"}],defaultZoom:500,owner:""}];
import Vue from "vue";
import Split from "split.js";
import Objects from "./Objects.vue";
import EmptySlot from "./EmptySlot.vue";

export default {
  name: "EmptySlot",
  components: {
    EmptySlot,
    Objects
  },
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
      let splitConstructor = Vue.extend(EmptySlot);
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
      let splitConstructor = Vue.extend(EmptySlot);
      Split([top, bottom], {
        direction: "vertical",
        gutterSize: 10
      });

      new splitConstructor().$mount('split-buttons');
      new splitConstructor().$mount('split-buttons');
    },
    replaceWithComponent: function() {
      let newEl = document.createElement('objects');

      let componentConstructor = Vue.extend(Objects);
      let instance = new componentConstructor({
        propsData: {
          mapData: sampleData
        }
      });

      instance.$mount();

      this.$el.replaceWith(instance.$el);
    }
  }
}
</script>

<style scoped>

</style>