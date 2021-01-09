<template>
  <div
    v-if="state===''"
    class="layout-container"
  >
    <v-container fill-height>
      <v-row justify="center">
        <v-card>
          <v-card-title>
            Atlas Map App
          </v-card-title>
          <v-select
            v-model="selectedComponent"
            :items="Object.keys(availableComponents)"
            outlined
            style="padding: 10px"
            placeholder="Select a component"
          />
          <v-card-actions>
            <v-btn
              style="padding: 10px"
              :disabled="!selectedComponent"
              @click="updateState('replace')"
            >
              Select
            </v-btn>
            <v-btn @click="updateState('splitH')">
              Split Horizontal
            </v-btn>
            <v-btn @click="updateState('splitV')">
              Split Vertical
            </v-btn>
            <v-btn
              v-if="child"
              @click="merge()"
            >
              Merge
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-row>
    </v-container>
  </div>
  <div
    v-else-if="state==='splitH'"
    class="layout-container"
  >
    <div
      id="unbound-left"
      class="item horizontal"
    >
      <empty-slot
        style="height: calc(100% - 48px);"
        :child="true"
        @merge="split.destroy();state=''"
      />
    </div>
    <div
      id="unbound-right"
      class="item horizontal"
    >
      <empty-slot
        style="height: calc(100% - 48px);"
        :child="true"
        @merge="split.destroy();state=''"
      />
    </div>
  </div>
  <div
    v-else-if="state==='splitV'"
    class="layout-container"
  >
    <div
      id="unbound-top"
      class="item vertical"
    >
      <empty-slot
        style="height: calc(100% - 48px);"
        :child="true"
        @merge="split.destroy();state=''"
      />
    </div>
    <div
      id="unbound-bottom"
      class="item vertical"
    >
      <empty-slot
        style="height: calc(100% - 48px);"
        :child="true"
        @merge="split.destroy();state=''"
      />
    </div>
  </div>
  <div v-else-if="state==='replace'">
    <v-toolbar
      dense
      flat
    >
      <v-toolbar-title>{{ selectedComponent }}</v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        @click="state='';selectedComponent=''"
      >
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>
    <component :is="selectedComponent" />
  </div>
</template>

<script>
import Split from 'split.js';
import Login from './Login.vue';
import Objects from './Objects.vue';
import Map from './Map.vue';
// eslint-disable-next-line import/no-self-import
import EmptySlot from './EmptySlot.vue';
import vuetify from '../plugins/vuetify.ts';

export default {
  name: 'EmptySlot',
  vuetify,
  components: {
    EmptySlot,
    Objects,
    Login,
    Map,
  },
  props: {
    child: {
      type: Boolean,
      required: false,
      default: () => false,
    },
  },
  data() {
    return {
      state: '',
      replacedObject: '',
      availableComponents: {
        Login,
        Objects,
        Map,
      },
      selectedComponent: null,
      split: undefined,
    };
  },
  methods: {
    merge() {
      this.$emit('merge');
    },
    updateState(newState) {
      this.state = newState;
      this.$nextTick(() => {
        if (newState === 'splitH') {
          const left = document.getElementById('unbound-left');
          const right = document.getElementById('unbound-right');
          left.removeAttribute('id');
          right.removeAttribute('id');
          this.split = Split([left, right], {
            direction: 'horizontal',
            gutterSize: 5,
          });
        } else if (newState === 'splitV') {
          const top = document.getElementById('unbound-top');
          const bottom = document.getElementById('unbound-bottom');
          top.removeAttribute('id');
          bottom.removeAttribute('id');
          this.split = Split([top, bottom], {
            direction: 'vertical',
            gutterSize: 5,
          });
        }
      });
    },
  },
};
</script>

<style scoped>
  .item {
    overflow: hidden;
  }

  .layout-container {
    height: 100% !important;
  }
</style>
