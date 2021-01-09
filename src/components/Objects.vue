<template>
  <v-container
    v-if="this.$store.state.mapData.length === 0"
    fill-height
  >
    <v-row justify="center">
      <v-card>
        <v-card-title>Fetching Map Data</v-card-title>
        <v-card-text>
          <v-progress-linear indeterminate />
        </v-card-text>
      </v-card>
    </v-row>
  </v-container>
  <v-container
    v-else
    fluid
  >
    <v-text-field
      v-model="searchQuery"
      dense
      placeholder="Search"
    />
    <v-row
      dense
      no-gutters
    >
      <v-col cols="5">
        <v-select
          v-model="currentFilter"
          :items="filters"
          dense
          label="Select a property to filter"
          outlined
        />
      </v-col>
      <v-col
        :cols="sm ? 5 : 4"
      >
        <v-select
          v-model="currentFilterValue"
          :items="getFilters(currentFilter)"
          dense
          label="Select a value to filter"
          outlined
        />
      </v-col>
      <v-col cols="2">
        <v-btn
          block
          height="40"
          outlined
          @click="createFilter(currentFilter, currentFilterValue)"
        >
          Apply
        </v-btn>
      </v-col>
    </v-row>
    <v-row
      v-if="Object.keys(currentFilters).length>0"
      dense
    >
      <v-chip
        v-for="({parameter, value}) in currentFilters"
        :key="`${parameter}:${value}`"
        class="ml-2 mr-2"
        close
        @click:close="deleteFilter({parameter, value})"
      >
        {{ parameter }}: {{ value }}
      </v-chip>
    </v-row>
    <v-row style="color: white">
      <v-col
        :cols="sm ? 6 : 12"
        :order="sm ? 1 : 2"
      >
        <v-row style="margin-left:0">
          <!-- html is fucking weird -->
          <v-dialog
            v-model="createDialog"
            max-width="1000px"
          >
            <!-- eslint-disable-next-line -->
            <template #activator="{on, attrs}">
              <v-btn @click.stop="openCreateForm">
                Create Object
              </v-btn>
            </template>
            <v-card>
              <v-card-title v-if="user">
                {{ createMode.charAt(0).toUpperCase() + createMode.slice(1) }} Object
              </v-card-title>
              <v-card-title v-else>
                Don't Create Object?
              </v-card-title>

              <v-card-text v-if="user">
                <v-alert
                  v-if="userCollections.length===0"
                  text
                  type="error"
                >
                  You need to create a
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
                    :rules="[
                      c=> (c?c:'').trim() !==''
                        ||'You must select a collection to place the location in.'
                    ]"
                    :disabled="createMode === 'edit'"
                    item-text="name"
                    item-value="id"
                    label="Select a Collection to use"
                    placeholder="Select a Collection"
                  />
                  <v-text-field
                    v-model="newObject.name"
                    :rules="[n=> (n?n:'').trim() !== '' || 'You must give your location a name.']"
                    label="Location Name"
                  />
                  <v-row>
                    <v-col>
                      <v-text-field
                        v-model.number="newObjectPos.x"
                        label="X-Pos"
                        type="number"
                      />
                    </v-col>
                    <v-col>
                      <v-text-field
                        v-model.number="newObjectPos.y"
                        label="Y-Pos"
                        type="number"
                      />
                    </v-col>
                    <v-col>
                      <v-text-field
                        v-model.number="newObjectPos.z"
                        label="Z-Pos"
                        type="number"
                      />
                    </v-col>
                  </v-row>
                  <v-text-field
                    v-model.number="newObject.scale"
                    :rules="[
                      c=>c>0
                        ||'The object must be larger than &quot;literally non-existent&quot;.'
                    ]"
                    hint="Don't worry, you can change this later."
                    label="Size"
                    type="number"
                  />
                  <v-select
                    v-model="newObject.modelPath"
                    :items="models"
                    :rules="[m=> !!m || 'You must select a model to represent this location.']"
                    item-text="name"
                    item-value="path"
                    label="3D Model"
                  />
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
                            />
                          </v-col>
                          <v-col>
                            <v-text-field
                              v-model.number="newObjectRot.y"
                              hint="Degrees"
                              label="Y-Rot"
                              type="number"
                            />
                          </v-col>
                          <v-col>
                            <v-text-field
                              v-model.number="newObjectRot.z"
                              hint="Degrees"
                              label="Z-Rot"
                              type="number"
                            />
                          </v-col>
                        </v-row>
                        <v-text-field
                          v-model.number="newObject.defaultZoom"
                          :rules="[
                            c=>c>0
                              ||'The default zoom must be further ' +
                                'than &quot;inside the location&quot; away.'
                          ]"
                          hint="How many km should the camera
                            be from the object when you look at it?"
                          label="Default Zoom Distance"
                          type="number"
                        />
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
                        />
                        <v-btn
                          dark
                          @click.stop="openCreateProperty"
                        >
                          Add New Property
                        </v-btn>
                        <v-dialog
                          v-model="propertyDialog"
                          max-width="500px"
                        >
                          <v-card>
                            <v-card-title>New Property</v-card-title>
                            <v-card-text>
                              <v-form ref="newPropertyForm">
                                <v-row>
                                  <v-col>
                                    <v-combobox
                                      v-model="newProperty.parameter"
                                      :items="existingParameters"
                                      :rules="[
                                        n=> (n?n:'').trim()!==''
                                          ||'You must give your property a parameter.',
                                        ()=>!newObject.objectInfo
                                          .some(p=>p.parameter === newProperty.parameter
                                            && p.value === newProperty.value)
                                          || 'The property must not already exist.'
                                      ]"
                                      label="Parameter / Attribute"
                                    />
                                  </v-col>
                                  <v-col>
                                    <v-combobox
                                      v-model="newProperty.value"
                                      :items="existingValues"
                                      :rules="[
                                        n=> (n?n:'').trim()!==''
                                          ||'You must give your property a value.',
                                        ()=>!newObject.objectInfo
                                          .some(p=>p.parameter === newProperty.parameter
                                            && p.value === newProperty.value)
                                          || 'The property must not already exist.'
                                      ]"
                                      label="Property Value"
                                    />
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
                                @click="$refs.newPropertyForm.resetValidation();
                                        propertyDialog = false;"
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
                            @click:close="
                              newObject.objectInfo
                                .splice(newObject.objectInfo
                                  .findIndex(p=>p.parameter === property.parameter
                                    && p.value === property.value
                                  ), 1
                                )"
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
                <v-alert
                  text
                  type="error"
                >
                  You need to be signed in to create objects. Sign in using the login panel and come
                  back.
                </v-alert>
              </v-card-text>

              <v-card-actions v-if="user && userCollections.length>0">
                <v-btn
                  :disabled="saving"
                  :loading="saving"
                  @click="saveNewObject"
                >
                  Save
                </v-btn>
                <v-btn
                  :disabled="saving"
                  text
                  @click="createDialog = false"
                >
                  Cancel
                </v-btn>
              </v-card-actions>
              <v-card-actions v-else>
                <v-btn @click="createDialog = false">
                  Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-row>
        <v-list
          dense
          flat
          style="background-color: #343a40"
        >
          <v-list-item-group
            v-model="currentlySelected"
            color="blue lighten-3"
          >
            <v-list-item
              v-for="item in mapData"
              v-show="
                (searchResults.includes(
                  item.objectId.toString())
                  || searchQuery.trim()===''
                ) && checkFilter(item)"
              :key="item.objectId"
              :item="item"
            >
              <v-list-item-content>
                <v-list-item-title v-text="item.name" />
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
      <v-col
        :cols="sm ? 6 :12"
        :order="sm ? 2 : 1"
      >
        <p v-if="currentItem===undefined">
          No map item currently selected. <br>Select an item from
          the list to view its
          details.
        </p>
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

            <v-list
              v-if="currentItem.objectInfo.length > 0"
              dense
            >
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
              <v-list-item class="details">
                {{
                  currentItem.ownerUsername === "" ? "Atlas" : currentItem.ownerUsername
                }}
              </v-list-item>
            </v-list>

            <v-list
              v-if="currentItem.children.length > 0"
              dense
            >
              <v-subheader>
                Children<v-spacer /><span
                  v-if="undefinedChildren > 0"
                  class="mx-2 text-caption orange--text text--darken-1"
                >({{ undefinedChildren }}
                  {{ undefinedChildren === 1 ? "child is" : "children are" }}
                  hidden as you lack sufficient permission to view them.)</span>
              </v-subheader>
              <v-list-item
                v-for="child in filteredChildren"
                :key="child.objectId"
                style="height: 25px; min-height: 25px;"
                @click="currentlySelected = mapData
                  .findIndex(item => item.objectId === child.objectId);"
              >
                {{ child.name }} - {{ getCollectionNameById(child.collection) }}
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
              v-show="currentItem.owner === $store.state.user.uid"
              color="warning"
              text
              @click="editObject()"
            >
              Edit Object
            </v-btn>
            <v-btn
              v-show="currentItem.owner === $store.state.user.uid"
              color="error"
              text
              @click="deleteObject()"
            >
              Delete Object
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog
      v-model="errorDialog"
      max-width="800"
      persistent
    >
      <v-alert
        :icon="false"
        class="mb-0"
        elevation="8"
        max-width="800"
        prominent
        type="error"
      >
        <span class="text-h3">Uh oh...<br></span> <span
          class="text-h4"
        >Something went wrong!</span><br>Our code wizards would love you to show
        them the following error if you get a chance.<br><code>{{ errorMessage }}</code><br>
        <v-btn
          class="mt-3"
          outlined
          @click="errorDialog=false"
        >
          Dismiss
        </v-btn>
      </v-alert>
    </v-dialog>
    <v-dialog
      v-model="loadingDialog"
      max-width="300"
      persistent
    >
      <v-card>
        <v-card-title>{{ loadingMessage }}</v-card-title>
        <v-card-text>
          <v-progress-linear indeterminate />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Fuse from 'fuse.js';
import Vue from 'vue';
import _ from 'lodash';
import vuetify from '../plugins/vuetify.ts';

export default {
  name: 'Objects',
  vuetify,
  data() {
    return {
      searchQuery: '',
      currentFilter: 'Filter',
      currentFilterValue: 'Value',
      currentFilters: [],
      currentlySelected: undefined,
      createDialog: false,
      newObject: {},
      newObjectValid: false,
      models: [
        { name: 'Origin Station', path: 'OriginStation' },
      ],
      propertyDialog: false,
      newProperty: {},
      saving: false,
      errorDialog: false,
      errorMessage: '',
      loadingDialog: false,
      loadingMessage: '',
      createMode: '',
      breakpoint: 'xs',
    };
  },
  computed: {
    xs() {
      return true;
    },
    sm() {
      return ['sm', 'md', 'lg', 'xl'].includes(this.breakpoint);
    },
    md() {
      return ['md', 'lg', 'xl'].includes(this.breakpoint);
    },
    lg() {
      return ['lg', 'xl'].includes(this.breakpoint);
    },
    xl() {
      return this.breakpoint === 'xl';
    },
    mapData() {
      return this.$store.state.mapData;
    },
    newObjectPos() {
      if (_.isEqual(this.newObject, {})) {
        return { x: 0, y: 0, z: 0 };
      }
      return this.newObject.pos;
    },
    newObjectRot() {
      if (_.isEqual(this.newObject, {})) {
        return { x: 0, y: 0, z: 0 };
      }
      return this.newObject.rot;
    },
    collections() {
      return this.$store.state.collections;
    },
    user() {
      return this.$store.state.user;
    },
    userCollections() {
      return this.collections.filter((collection) => collection.owner === this.user.uid);
    },
    currentItem() {
      return this.mapData[this.currentlySelected];
    },
    searchResults() {
      return this.fuse.search(this.searchQuery).map((value) => value.item.objectId.toString());
    },
    fuse() {
      return new Fuse(this.mapData, {
        keys: ['name'],
      });
    },
    filters() {
      const filters = [];
      this.mapData.forEach((item) => {
        item.objectInfo.forEach(({ parameter }) => {
          if (!filters.includes(parameter)) {
            filters.push(parameter);
          }
        });
      });
      return filters;
    },
    existingParameters() {
      const parameters = [];
      this.$store.state.mapData.forEach((mapItem) => {
        parameters.push(...mapItem.objectInfo.map((o) => o.parameter));
      });
      return [...new Set(parameters)];
    },
    existingValues() {
      const values = [];
      this.$store.state.mapData.forEach((mapItem) => {
        mapItem.objectInfo.forEach((prop) => {
          if (prop.parameter === this.newProperty.parameter) {
            values.push(prop.value);
          }
        });
      });
      return [...new Set(values)];
    },
    populatedChildren() {
      let children = _.cloneDeep(this.currentItem.children);
      children = children.map(
        (child) => this.mapData.find((item) => item.objectId === child.objectId),
      );
      return children;
    },
    filteredChildren() {
      return this.populatedChildren.filter((child) => !!child);
    },
    undefinedChildren() {
      let u = 0;
      this.populatedChildren.forEach((child) => {
        if (child === undefined) {
          u += 1;
        }
      });
      return u;
    },
  },
  mounted() {
    const onResize = () => {
      const width = this.$el.clientWidth;

      if (width <= 600) {
        this.breakpoint = 'xs';
      } else if (width <= 960) {
        this.breakpoint = 'sm';
      } else if (width <= 1264) {
        this.breakpoint = 'md';
      } else if (width <= 1904) {
        this.breakpoint = 'lg';
      } else {
        this.breakpoint = 'xl';
      }
    };

    // noinspection JSUnresolvedFunction
    new ResizeObserver(onResize).observe(this.$el);
  },
  methods: {
    getCollectionNameById(id) {
      if (!id) return null;
      return this.collections.find((col) => col.id === id).name;
    },
    error(error) {
      this.errorDialog = true;
      this.errorMessage = error.stack ? error.stack : error.toString();
    },
    getFilters(filter) {
      const filters = [];
      this.mapData.forEach((item) => {
        if (item.objectInfo.map((a) => a.parameter).includes(filter)) {
          filters.push(item.objectInfo.find((i) => i.parameter === filter).value.toString());
        }
      });
      return filters;
    },
    createFilter(filter, value) {
      if (filter === 'Filter' || value === 'Value') {
        return;
      }
      this.currentFilters.push({ parameter: filter, value });
      this.currentFilter = 'Filter';
      this.currentFilterValue = 'Value';
    },
    deleteFilter(filter) {
      this.currentFilters.forEach((v) => {
        if (_.isEqual({ parameter: v.parameter, value: v.value }, filter)) {
          Vue.delete(this.currentFilters, this.currentFilters.findIndex((val) => _.isEqual({
            parameter: val.parameter,
            value: val.value,
          }, filter)));
        }
      });
    },
    checkFilter(item) {
      return !this.currentFilters.some((filter) => !item.objectInfo.some((v) => _.isEqual({
        parameter: v.parameter,
        value: v.value,
      }, filter)));
    },
    openCreateForm() {
      this.createDialog = true;
      this.newObject = {
        collectionId: '',
        name: '',
        scale: 0,
        objectInfo: [],
        pos: {
          x: 0,
          y: 0,
          z: 0,
        },
        rot: {
          x: 0,
          y: 0,
          z: 0,
        },
        modelPath: '',
        defaultZoom: 50,
        children: [],
      };
      this.createMode = 'create';
      this.$nextTick(() => {
        this.$refs.newObjectForm.resetValidation();
      });
    },
    saveNewObject() {
      if (this.$refs.newObjectForm.validate()) {
        this.newObject.children = this.newObject.children.map((child) => (
          { collectionId: child.collection, objectId: child.objectId }));
        this.saving = true;
        this.$store.dispatch(this.createMode === 'edit' ? 'editMapItem' : 'createMapItem', this.newObject)
          .then((res) => {
            this.saving = false;
            this.createDialog = false;
            this.currentlySelected = this.$store.state.mapData
              .findIndex((item) => item.objectId === res.mapItem.objectId);
          })
          .catch((e) => {
            this.error(e);
          });
      }
    },
    openCreateProperty() {
      this.propertyDialog = true;
      this.newProperty = {
        parameter: '',
        value: '',
      };
    },
    saveProperty() {
      // TODO This seems to need two clicks for some reason?
      if (this.$refs.newPropertyForm.validate()) {
        this.newObject.objectInfo.push(this.newProperty);
        this.$refs.newPropertyForm.resetValidation();
        this.propertyDialog = false;
      }
    },
    deleteObject() {
      const selectedObject = this.$store.state.mapData[this.currentlySelected];
      // noinspection JSUnresolvedFunction
      this.$confirm(`
        <div class="body-1">
          <span class="my-2">Are you sure you want to delete the object:</span><br/>
          <code>${selectedObject.name}</code><br/>
          <span class="font-weight-bold error--text my-2">This action is irreversible.</span>
        </div>
      `, {
        title: 'Delete Object',
        buttonTrueColor: 'error',
      }).then((res) => {
        if (res) {
          this.loadingDialog = true;
          this.loadingMessage = 'Deleting Object';
          this.$store.dispatch('deleteMapItem', selectedObject)
            .then(() => {
              this.loadingDialog = false;
              this.loadingMessage = '';
            })
            .catch((e) => {
              this.error(e);
            });
        }
      });
    },
    editObject() {
      this.newObject = _.cloneDeep(this.$store.state.mapData[this.currentlySelected]);

      this.newObject.collectionId = this.newObject.collection;
      delete this.newObject.collection;

      // Remove any dead children.
      this.newObject.children = this.newObject.children
        .filter((childRef) => this.mapData.some((item) => item.objectId === childRef.objectId));

      // Map children to their actual objects
      this.newObject.children = this.newObject.children
        .map((childRef) => this.mapData.find((item) => item.objectId === childRef.objectId));

      if (!this.newObject.rot) {
        this.newObject.rot = {
          x: 0,
          y: 0,
          z: 0,
        };
      }

      this.createDialog = true;
      this.createMode = 'edit';
    },
  },
};
</script>

<style scoped>
  .details {
    height: 20px;
    min-height: 20px;
  }

  /*noinspection CssUnusedSymbol*/
  .v-list-item:before {
    border-radius: 4px;
  }
</style>
