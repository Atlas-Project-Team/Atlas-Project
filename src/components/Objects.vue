<template>
  <v-container v-if="this.$store.state.mapData.length === 0" fill-height>
    <v-row justify="center">
      <v-card>
        <v-card-title>Fetching Map Data</v-card-title>
        <v-card-text>
          <v-progress-linear indeterminate></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-row>
  </v-container>
  <v-container v-else :id="(this._uid).toString()" fluid>
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
        <v-btn block height="40" outlined
               v-on:click="createFilter(currentFilter, currentFilterValue)">Apply
        </v-btn>
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
        <v-row style="margin-left:0"> <!-- html is fucking weird -->
          <v-dialog v-model="createDialog" max-width="1000px">
            <template v-slot:activator="{on, attrs}">
              <v-btn @click.stop="openCreateForm">Create Object</v-btn>
            </template>
            <v-card>
              <v-card-title v-if="this.user">Create Object</v-card-title>
              <v-card-title v-else>Don't Create Object?</v-card-title>

              <v-card-text v-if="this.user">
                <v-alert v-if="userCollections.length===0" text type="error">You need to create a
                  collection to place items in before you can create items. Go to the collections
                  panel to do this.
                </v-alert>
                <v-form v-else>
                  <v-select
                      v-model="newObject.collectionId"
                      :items="userCollections"
                      item-text="name"
                      item-value="id"
                      label="Select a Collection to use"
                      placeholder="Select a Collection"
                  ></v-select>
                  <v-text-field
                      v-model="newObject.name"
                      label="Location Name"
                  ></v-text-field>
                  <v-row>
                    <v-col>
                      <v-text-field
                          v-model.number="newObjectPos.x"
                          label="X-Pos"
                          type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col>
                      <v-text-field
                          v-model.number="newObjectPos.y"
                          label="Y-Pos"
                          type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col>
                      <v-text-field
                          v-model.number="newObjectPos.z"
                          label="Z-Pos"
                          type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-text-field
                      v-model.number="newObject.scale"
                      hint="Don't worry, you can change this later."
                      label="Size"
                      type="number"
                  ></v-text-field>
                  <v-expansion-panels flat>
                    <v-expansion-panel>
                      <v-expansion-panel-header>Optional Settings</v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <v-select
                            v-model="newObject.modelPath"
                            :items="models"
                            item-text="name"
                            item-value="path"
                            label="3D Model"
                        ></v-select>
                        <v-row>
                          <v-col>
                            <v-text-field
                                v-model.number="newObjectRot.x"
                                hint="Degrees"
                                label="X-Rot"
                                type="number"
                            ></v-text-field>
                          </v-col>
                          <v-col>
                            <v-text-field
                                v-model.number="newObjectRot.y"
                                hint="Degrees"
                                label="Y-Rot"
                                type="number"
                            ></v-text-field>
                          </v-col>
                          <v-col>
                            <v-text-field
                                v-model.number="newObjectRot.z"
                                hint="Degrees"
                                label="Z-Rot"
                                type="number"
                            ></v-text-field>
                          </v-col>
                        </v-row>
                        <v-text-field
                            v-model.number="newObject.defaultZoom"
                            hint="How many km should the camera be from the object when you look at it?"
                            label="Default Zoom Distance"
                            type="number"
                        ></v-text-field>
                        <v-select
                            v-model="newObject.children"
                            :items="mapData"
                            chips
                            deletable-chips
                            item-text="name"
                            item-value="objectId"
                            label="Children"
                            multiple
                            return-object
                        ></v-select>
                        <v-btn
                            dark
                            @click.stop="openCreateProperty"
                        >
                          Add New Property
                        </v-btn>
                        <v-dialog v-model="propertyDialog" max-width="500px">
                          <v-card>
                            <v-card-title>New Property</v-card-title>
                            <v-card-text>
                              <v-form>
                                <v-row>
                                  <v-col>
                                    <v-text-field
                                        v-model="newProperty.parameter"
                                        label="Parameter / Attribute"
                                    ></v-text-field>
                                  </v-col>
                                  <v-col>
                                    <v-text-field
                                        v-model="newProperty.value"
                                        label="Property Value"
                                    ></v-text-field>
                                  </v-col>
                                </v-row>
                              </v-form>
                            </v-card-text>
                            <v-card-actions>
                              <v-btn @click="saveProperty">Save</v-btn>
                              <v-btn text @click="propertyDialog = false;">Cancel</v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                        <v-row class="ma-2">
                          <v-chip
                              v-for="property in newObject.objectInfo"
                              :key="`${property.parameter}:${property.value}`"
                              close
                              @click:close="newObject.objectInfo.splice(newObject.objectInfo.findIndex(p=>p.parameter === property.parameter && p.value === property.value), 1)"
                          >
                            {{property.parameter}}: {{property.value}}
                          </v-chip>
                        </v-row>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-form>
              </v-card-text>
              <v-card-text v-else>
                You need to be signed in to create objects. Sign in using the login panel and come
                back.
              </v-card-text>

              <v-card-actions v-if="this.user && this.userCollections.length>0">
                <v-btn>Save</v-btn>
                <v-btn text @click="createDialog = false">Cancel</v-btn>
              </v-card-actions>
              <v-card-actions v-else>
                <v-btn @click="createDialog = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-row>
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
        <p v-if="currentItem===undefined">No map item currently selected. <br/>Select an item from
          the list to view its
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
                style="color: white">{{
                currentItem.ownerUsername === "" ? "N/A" : currentItem.ownerUsername
              }}</span>
            </v-subheader>
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
  data() {
    return {
      searchQuery: "",
      currentFilter: "Filter",
      currentFilterValue: "Value",
      currentFilters: [],
      currentlySelected: undefined,
      createDialog: false,
      newObject: {},
      models: [
        {name: "Origin Station", path: "OriginStation"}
      ],
      propertyDialog: false,
      newProperty: {}
    }
  },
  computed: {
    mapData: function () {
      return this.$store.state.mapData;
    },
    newObjectPos: function () {
      if (_.isEqual(this.newObject, {})) {
        return {x: 0, y: 0, z: 0}
      } else {
        return this.newObject.pos
      }
    },
    newObjectRot: function () {
      if (_.isEqual(this.newObject, {})) {
        return {x: 0, y: 0, z: 0}
      } else {
        return this.newObject.rot
      }
    },
    globalProperties: function () {

    },
    collections: function () {
      return this.$store.state.collections;
    },
    user: function () {
      return this.$store.state.user;
    },
    userCollections: function () {
      return this.collections.filter(collection => collection.owner === this.user.uid);
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
        if (!item.objectInfo.some(v => _.isEqual({
          parameter: v.parameter,
          value: v.value
        }, filter))) {
          return false
        }
      }
      return true
    },
    openCreateForm: function () {
      this.createDialog = true;
      this.newObject = {
        collectionId: "",
        name: "",
        objectInfo: [],
        pos: {
          x: 0,
          y: 0,
          z: 0
        },
        rot: {
          x: 0,
          y: 0,
          z: 0
        },
        modelPath: "",
        defaultZoom: 0,
        children: []
      }
    },
    openCreateProperty: function () {
      this.propertyDialog = true;
      this.newProperty = {
        parameter: "",
        value: ""
      }
    },
    saveProperty: function () {
      this.newObject.objectInfo.push(this.newProperty);
      this.propertyDialog = false;
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