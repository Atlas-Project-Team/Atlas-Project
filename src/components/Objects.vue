<template>
  <v-container fluid>
    <v-text-field
        v-model="searchQuery"
        dense
        placeholder="Search"
    ></v-text-field>
    <v-row dense no-gutters>
      <v-col cols="5">
        <v-select
            v-model="currentFilter"
            :items="filters"
            dense
            label="Select a property to filter"
            outlined
        ></v-select>
      </v-col>
      <v-col cols="4" sm="5">
        <v-select
            v-model="currentFilterValue"
            :items="getFilters(currentFilter)"
            dense
            label="Select a value to filter"
            outlined
        ></v-select>
      </v-col>
      <v-col cols="2">
        <v-btn block height="40" outlined v-on:click="createFilter(currentFilter, currentFilterValue)">Apply</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="Object.keys(currentFilters).length>0" dense>
      <v-chip
          v-for="({parameter, value}) in currentFilters"
          :key="`${parameter}:${value}`"
          class="ml-2 mr-2"
          close
          @click:close="deleteFilter({parameter, value})"
      >{{ parameter }}: {{ value }}
      </v-chip>
    </v-row>
    <v-row style="color: white">
      <v-col cols="12" order="2" order-sm="1" sm="6">
        <v-list dense flat style="background-color: #343a40">
          <v-list-item-group
              v-model="currentlySelected"
              color="blue lighten-3">
            <v-list-item
                v-for="item in mapData"
                v-show="(searchResults.includes(item.objectId.toString()) || searchQuery.trim()==='') && checkFilter(item)"
                v-bind:key="item.objectId"
                :map-data="mapData"
                v-bind:item="item">
              <v-list-item-content>
                <v-list-item-title v-text="item.name"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
      <v-col cols="12" order="1" order-sm="2" sm="6">
        <p v-if="currentItem===undefined">No map item currently selected. <br/>Select an item from the list to view its
          details.</p>
        <v-card v-else>
          <v-card-title>{{ currentItem.name }}</v-card-title>
          <v-card-text>
            <v-list dense>
              <v-subheader>Position (ISAN)</v-subheader>
              <v-list-item
                  v-for="(value, parameter) in currentItem.pos"
                  v-show="['x','y','z'].includes(parameter)"
                  :key="`${parameter}:${value}`"
                  style="height: 20px; min-height: 20px;">
                <strong>{{ parameter }}</strong>: {{ value }}
              </v-list-item>
            </v-list>
            <v-list dense>
              <v-subheader>Object Details</v-subheader>
              <v-list-item
                  v-for="{value, parameter} in currentItem.objectInfo"
                  :key="`${parameter}:${value}`"
                  style="height: 20px; min-height: 20px;">
                <strong>{{ parameter }}</strong>: {{ value }}
              </v-list-item>
            </v-list>
            <v-subheader>Map-Item Creator:&nbsp;<span
                style="color: white">{{ currentItem.owner === "" ? "N/A" : currentItem.owner }}</span>
              <!--TODO RESOLVE OWNER ID TO USERNAME--></v-subheader>
          </v-card-text>
          <v-card-actions>
            <v-btn
                color="blue lighten-4"
                text
            >
              Look At
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Fuse from "fuse.js";
import Vue from "vue";
import _ from "lodash";
import vuetify from '../plugins/vuetify';

export default {
  name: "objects.small",
  vuetify,
  inject: ['mapDataProvider'],
  data() {
    return {
      searchQuery: "",
      currentFilter: "Filter",
      currentFilterValue: "Value",
      currentFilters: [],
      currentlySelected: undefined
    }
  },
  computed: {
    mapData: function () {
      return this.mapDataProvider.value
    },
    currentItem: function () {
      return this.mapData[this.currentlySelected];
    },
    searchResults: function () {
      return this.fuse.search(this.searchQuery).map((value) => {
        return value.item.objectId.toString()
      })
    },
    fuse: function () {
      return new Fuse(this.mapData, {
        keys: ['name']
      });
    },
    filters: function () {
      let filters = [];
      this.mapData.forEach((item) => {
        item.objectInfo.forEach(({parameter}) => {
          if (!filters.includes(parameter)) {
            filters.push(parameter)
          }
        })
      });
      return filters;
    }
  },
  methods: {
    getFilters: function (filter) {
      let filters = [];
      this.mapData.forEach((item) => {
        if (item.objectInfo.map(a => a.parameter).includes(filter)) {
          filters.push(item.objectInfo.find(item => item.parameter === filter).value.toString())
        }
      });
      return filters
    }
    ,
    createFilter: function (filter, value) {
      if (filter === "Filter" || value === "Value") {
        return
      }
      this.currentFilters.push({parameter: filter, value});
      this.currentFilter = "Filter";
      this.currentFilterValue = "Value";
    }
    ,
    deleteFilter: function (filter) {
      this.currentFilters.forEach(v => {
        if (_.isEqual({parameter: v.parameter, value: v.value}, filter)) {
          Vue.delete(this.currentFilters, this.currentFilters.findIndex(v => _.isEqual({
            parameter: v.parameter,
            value: v.value
          }, filter)))
        }
      })
    }
    ,
    checkFilter: function (item) {
      for (let filter of this.currentFilters) {
        if (!item.objectInfo.some(v => _.isEqual({parameter: v.parameter, value: v.value}, filter))) {
          return false
        }
      }
      return true
    }
  },
  watchers: {
    searchQuery: function () {
      $('.collapse').collapse('hide');
    }
  }
}
</script>

<style scoped>

</style>