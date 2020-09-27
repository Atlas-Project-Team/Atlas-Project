<template>
  <div class="layout-container">
    <v-container fill-height>
      <v-row justify="center">
          <v-card dark>
            <v-card-title>
              Atlas Map App
            </v-card-title>
            <v-select v-model="selectedComponent" :items="Object.keys(availableComponents)" outlined style="padding: 10px" placeholder="Select a component">
            </v-select>
            <v-card-actions>
              <v-btn style="padding: 10px" :disabled="!selectedComponent" v-on:click="replaceWithComponent()">Select</v-btn>
              <v-btn v-on:click="splitH()">Split Horizontal</v-btn>
              <v-btn v-on:click="splitV()">Split Vertical</v-btn>
            </v-card-actions>
          </v-card>
      </v-row>
    </v-container>
  </div>
</template>

<script>
const sampleData=[{objectId:0,pos:{x:0,y:0,z:0},modelPath:"Assets/models/Neptune/",objectInfo:[{parameter:"Object",value:"Planet"},{parameter:"Type",value:"Gas Giant"}],scale:10,name:"Eos",defaultZoom:2e4,owner:""},{scale:1,name:"Eos 222",objectId:1,pos:{x:15,y:0,z:0},modelPath:"Assets/models/Station/",objectInfo:[{parameter:"Object",value:"Station"},{parameter:"Type",value:"Neutral"}],defaultZoom:500,owner:""}];
import Vue from "vue";
import Split from "split.js";
import Objects from "./Objects.vue";
import EmptySlot from "./EmptySlot.vue";
import vuetify from '../plugins/vuetify';

export default {
  name: "EmptySlot",
  vuetify,
  components: {
    EmptySlot,
    Objects
  },
  data () {
    return {
      availableComponents: {
        Objects
      },
      selectedComponent: null
    }
  },
  methods: {
    splitH: function () {
      let newEl = document.createElement('div');
      newEl.classList.add('layout-container');

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
        gutterSize: 5
      });

      new splitConstructor().$mount('split-buttons');
      new splitConstructor().$mount('split-buttons');
    },
    splitV: function () {
      let newEl = document.createElement('div');
      newEl.classList.add('layout-container');

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
        gutterSize: 5
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