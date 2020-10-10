<template>
  <div class="layout-container" v-if="state===''">
    <v-container fill-height>
      <v-row justify="center">
          <v-card>
            <v-card-title>
              Atlas Map App
            </v-card-title>
            <v-select v-model="selectedComponent" :items="Object.keys(availableComponents)" outlined style="padding: 10px" placeholder="Select a component">
            </v-select>
            <v-card-actions>
              <v-btn style="padding: 10px" :disabled="!selectedComponent" v-on:click="updateState('replace')">Select</v-btn>
              <v-btn v-on:click="updateState('splitH')">Split Horizontal</v-btn>
              <v-btn v-on:click="updateState('splitV')">Split Vertical</v-btn>
              <v-btn v-if="child" v-on:click="merge()">Merge</v-btn>
            </v-card-actions>
          </v-card>
      </v-row>
    </v-container>
  </div>
  <div class="layout-container" v-else-if="state==='splitH'">
    <div class="item horizontal" id="unbound-left">
      <empty-slot :child="true" @merge="split.destroy();state=''"></empty-slot>
    </div>
    <div class="item horizontal" id="unbound-right">
      <empty-slot :child="true" @merge="split.destroy();state=''"></empty-slot>
    </div>
  </div>
  <div class="layout-container" v-else-if="state==='splitV'">
    <div class="item vertical" id="unbound-top">
      <empty-slot :child="true" @merge="split.destroy();state=''"></empty-slot>
    </div>
    <div class="item vertical" id="unbound-bottom">
      <empty-slot :child="true" @merge="split.destroy();state=''"></empty-slot>
    </div>
  </div>
  <div v-else-if="state==='replace'">
    <v-toolbar dense flat>
      <v-toolbar-title>{{selectedComponent}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="state='';selectedComponent=''">
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>
    <component :is="selectedComponent"></component>
  </div>
</template>

<script>
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
  props: {
    child: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  data () {
    return {
      state: '',
      replacedObject: '',
      availableComponents: {
        "Objects": Objects
      },
      selectedComponent: null,
      split: undefined
    }
  },
  methods: {
    merge: function(){
      this.$emit('merge');
    },
    updateState: function(newState) {
      this.state=newState;
      this.$nextTick(()=>{
        if(newState === 'splitH') {
          let left = document.getElementById('unbound-left');
          let right = document.getElementById('unbound-right');
          left.removeAttribute('id');
          right.removeAttribute('id');
          this.split = Split([left, right], {
            direction: "horizontal",
            gutterSize: 5
          });
        } else if(newState === 'splitV') {
          let top = document.getElementById('unbound-top');
          let bottom = document.getElementById('unbound-bottom');
          top.removeAttribute('id');
          bottom.removeAttribute('id');
          this.split = Split([top, bottom], {
            direction: "vertical",
            gutterSize: 5
          });
        }
      })
    },
  },
}
</script>

<style scoped>

</style>