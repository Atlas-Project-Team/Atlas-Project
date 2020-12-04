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
              <v-card-title v-if="this.user">
                {{ this.createMode.charAt(0).toUpperCase() + this.createMode.slice(1) }} Object
              </v-card-title>
              <v-card-title v-else>Don't Create Object?</v-card-title>

              <v-card-text v-if="this.user">
                <v-alert v-if="userCollections.length===0" text type="error">You need to create a
                  collection to place items in before you can create items. Go to the collections
                  panel to do this.
                </v-alert>
                <v-form
                    v-else
                    ref="newObjectForm"
                    v-model="newObjectValid"
                >
                  <v-select
                      v-model="newObject.collectionId"
                      :items="userCollections"
                      :rules="[c=> (c?c:'').trim() !==''||'You must select a collection to place the location in.']"
                      :disabled="this.createMode === 'edit'"
                      item-text="name"
                      item-value="id"
                      label="Select a Collection to use"
                      placeholder="Select a Collection"
                  ></v-select>
                  <v-text-field
                      v-model="newObject.name"
                      :rules="[n=> (n?n:'').trim() !== '' || 'You must give your location a name.']"
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
                      :rules="[c=>c>0||'The object must be larger than &quot;literally non-existent&quot;.']"
                      hint="Don't worry, you can change this later."
                      label="Size"
                      type="number"
                  ></v-text-field>
                  <v-select
                      v-model="newObject.modelPath"
                      :items="models"
                      :rules="[m=> !!m || 'You must select a model to represent this location.']"
                      item-text="name"
                      item-value="path"
                      label="3D Model"
                  ></v-select>
                  <v-expansion-panels flat>
                    <v-expansion-panel>
                      <v-expansion-panel-header>Optional Settings</v-expansion-panel-header>
                      <v-expansion-panel-content>
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
                            :rules="[c=>c>0||'The default zoom must be further than &quot;inside the location&quot; away.']"
                            hint="How many km should the camera be from the object when you look at it?"
                            label="Default Zoom Distance"
                            type="number"
                        ></v-text-field>
                        <v-select
                            v-model="newObject.children"
                            :items="mapData.filter(item=>item.objectId !== newObject.objectId)"
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
                              <v-form ref="newPropertyForm">
                                <v-row>
                                  <v-col>
                                    <v-combobox
                                        v-model="newProperty.parameter"
                                        :items="existingParameters"
                                        :rules="[n=> (n?n:'').trim()!==''||'You must give your property a parameter.', ()=>!this.newObject.objectInfo.some(p=>p.parameter === this.newProperty.parameter && p.value === this.newProperty.value) || 'The property must not already exist.']"
                                        label="Parameter / Attribute"
                                    ></v-combobox>
                                  </v-col>
                                  <v-col>
                                    <v-combobox
                                        v-model="newProperty.value"
                                        :items="existingValues"
                                        :rules="[n=> (n?n:'').trim()!==''||'You must give your property a value.', ()=>!this.newObject.objectInfo.some(p=>p.parameter === this.newProperty.parameter && p.value === this.newProperty.value) || 'The property must not already exist.']"
                                        label="Property Value"
                                    ></v-combobox>
                                  </v-col>
                                </v-row>
                              </v-form>
                            </v-card-text>
                            <v-card-actions>
                              <v-btn
                                  @click="saveProperty()"
                              >
                                Save
                              </v-btn>
                              <v-btn
                                  text
                                  @click="$refs.newPropertyForm.resetValidation();propertyDialog = false;"
                              >
                                Cancel
                              </v-btn>
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
                            {{ property.parameter }}: {{ property.value }}
                          </v-chip>
                        </v-row>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-form>
              </v-card-text>
              <v-card-text v-else>
                <v-alert text type="error">
                  You need to be signed in to create objects. Sign in using the login panel and come
                  back.
                </v-alert>
              </v-card-text>

              <v-card-actions v-if="this.user && this.userCollections.length>0">
                <v-btn
                    :disabled="saving"
                    :loading="saving"
                    @click="saveNewObject"
                >
                  Save
                </v-btn>
                <v-btn
                    :disabled="saving" text
                    @click="createDialog = false"
                >
                  Cancel
                </v-btn>
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
                  class="details"
              >
                <strong>{{ parameter }}</strong>: {{ value }}
              </v-list-item>
            </v-list>

            <v-list v-if="currentItem.objectInfo.length > 0" dense>
              <v-subheader>Object Details</v-subheader>
              <v-list-item
                  v-for="{value, parameter} in currentItem.objectInfo"
                  :key="`${parameter}:${value}`"
                  class="details"
              >
                <strong>{{ parameter }}</strong>: {{ value }}
              </v-list-item>
            </v-list>

            <v-list dense>
              <v-subheader>Map-Item Creator</v-subheader>
              <v-list-item class="details">{{
                currentItem.ownerUsername === "" ? "Atlas" : currentItem.ownerUsername
              }}</v-list-item>
            </v-list>

            <v-list dense v-if="currentItem.children.length > 0">
              <v-subheader>Children<v-spacer/><span class="mx-2 text-caption orange--text text--darken-1" v-if="undefinedChildren > 0">({{undefinedChildren}} {{ undefinedChildren === 1 ? "child is" : "children are"  }} hidden as you lack sufficient permission to view them.)</span></v-subheader>
              <v-list-item
                  v-for="child in populatedChildren"
                  v-if="child !== undefined"
                  :key="child.objectId"
                  style="height: 25px; min-height: 25px;"
                  @click="currentlySelected = mapData.findIndex(item => item.objectId === child.objectId);"
              >
                {{child.name}} - {{getCollectionNameById(child.collection)}}
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn
                color="blue lighten-4"
                text
            >
              Look At Object
            </v-btn>
            <v-btn
                color="warning"
                text
                @click="editObject()"
                v-show="currentItem.owner === $store.state.user.uid"
            >
              Edit Object
            </v-btn>
            <v-btn
                color="error"
                text
                @click="deleteObject()"
                v-show="currentItem.owner === $store.state.user.uid"
            >
              Delete Object
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="errorDialog" max-width="800" persistent>
      <v-alert :icon="false" class="mb-0" elevation="8" max-width="800" prominent type="error">
        <span class="text-h3">Uh oh...<br/></span> <span
          class="text-h4">Something went wrong!</span><br/>Our code wizards would love you to show
        them the following error if you get a chance.<br/><code>{{ errorMessage }}</code><br/>
        <v-btn class="mt-3" outlined @click="errorDialog=false">Dismiss</v-btn>
      </v-alert>
    </v-dialog>
    <v-dialog v-model="loadingDialog" max-width="300" persistent>
      <v-card>
        <v-card-title>{{ loadingMessage }}</v-card-title>
        <v-card-text>
          <v-progress-linear indeterminate></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
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
      newObjectValid: false,
      models: [
        {name: "Origin Station", path: "OriginStation"}
      ],
      propertyDialog: false,
      newProperty: {},
      saving: false,
      errorDialog: false,
      errorMessage: '',
      loadingDialog: false,
      loadingMessage: '',
      createMode: ''
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
    },
    existingParameters: function () {
      let parameters = [];
      this.$store.state.mapData.forEach(mapItem => {
        parameters.push(...mapItem.objectInfo.map(o => o.parameter));
      });
      return [...new Set(parameters)];
    },
    existingValues: function () {
      let values = [];
      this.$store.state.mapData.forEach(mapItem => {
        mapItem.objectInfo.forEach(prop => {
          if (prop.parameter === this.newProperty.parameter) {
            values.push(prop.value);
          }
        });
      });
      return [...new Set(values)];
    },
    populatedChildren: function () {
      let children = _.cloneDeep(this.currentItem.children);
      children = children.map(child=>this.mapData.find(item=>item.objectId === child.objectId));
      return children;
    },
    undefinedChildren: function() {
      let u = 0;
      this.populatedChildren.forEach(child=>{
        if(child === undefined){
          u += 1;
        }
      });
      return u;
    }
  },
  methods: {
    getMapItemById(id){
       let mapItem = this.mapData.find(item=>item.objectId === id);
       if(!mapItem){
         return null;
       }else{
         return mapItem;
       }
    },
    getCollectionNameById(id){
      if(!id) return null;
      return this.collections.find(col=>col.id === id).name
    },
    error: function (error) {
      this.errorDialog = true;
      this.errorMessage = error.stack ? error.stack : error.toString();
    },
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
        scale: 0,
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
        defaultZoom: 50,
        children: []
      };
      this.createMode = 'create';
      this.$nextTick(()=>{
        this.$refs.newObjectForm.resetValidation();
      });
    },
    saveNewObject: function () {
        if (this.$refs.newObjectForm.validate()) {
          this.newObject.children = this.newObject.children.map((child) => (
              { collectionId: child.collection, objectId: child.objectId }))
          this.saving = true;
          this.$store.dispatch(this.createMode === 'edit' ? 'editMapItem' : 'createMapItem', this.newObject)
              .then((res) => {
                this.saving = false;
                this.createDialog = false;
                this.currentlySelected = this.$store.state.mapData.findIndex(item => item.objectId === res.mapItem.objectId);
              })
              .catch((e) => {
                this.error(e)
              });
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
      //TODO This seems to need two clicks for some reason?
      if (this.$refs.newPropertyForm.validate()) {
        this.newObject.objectInfo.push(this.newProperty);
        this.$refs.newPropertyForm.resetValidation();
        this.propertyDialog = false;
      }
    },
    deleteObject: function () {
      let selectedObject = this.$store.state.mapData[this.currentlySelected];
      // noinspection JSUnresolvedFunction
      this.$confirm(`
        <div class="body-1">
          <span class="my-2">Are you sure you want to delete the object:</span><br/>
          <code>${selectedObject.name}</code><br/>
          <span class="font-weight-bold error--text my-2">This action is irreversible.</span>
        </div>
      `, {
        title: 'Delete Object',
        buttonTrueColor: 'error'
      }).then(res => {
        if (res) {
          this.loadingDialog = true;
          this.loadingMessage = "Deleting Object";
          this.$store.dispatch('deleteMapItem', selectedObject)
              .then(() => {
                this.loadingDialog = false;
                this.loadingMessage = '';
              })
              .catch((e) => {
                this.error(e)
              });
        }
      })
    },
    editObject: function () {
      this.newObject = _.cloneDeep(this.$store.state.mapData[this.currentlySelected]);

      this.newObject.collectionId = this.newObject.collection;
      delete this.newObject.collection;

      // Remove any dead children.
      this.newObject.children = this.newObject.children.filter(childRef=>this.mapData.some(item=>item.objectId === childRef.objectId));

      // Map children to their actual objects
      this.newObject.children = this.newObject.children.map(childRef=>this.mapData.find(item=>item.objectId === childRef.objectId));

      if (!this.newObject.rot) this.newObject.rot = {
        x: 0,
        y: 0,
        z: 0
      };

      this.createDialog = true;
      this.createMode = 'edit';
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
  .details {
    height: 20px;
    min-height: 20px;
  }
  .v-list-item:before {
    border-radius: 4px;
  }
</style>