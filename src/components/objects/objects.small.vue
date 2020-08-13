<template>
    <v-container fluid style="width: 33vw; height: 50vh; background-color: #343a40">
        <h4 style="color: white; text-align: right">Objects</h4>
        <v-text-field
            v-model="searchQuery"
            placeholder="Search"
            dense
            dark
            ></v-text-field>
        <v-row dense>
            <v-col cols="5">
                <v-select
                        v-model="currentFilter"
                        :items="filters"
                        label="Select a property to filter"
                        outlined
                        dense
                        dark
                ></v-select>
            </v-col>
            <v-col cols="4">
                <v-select
                        v-model="currentFilterValue"
                        :items="getFilters(currentFilter)"
                        label="Select a value to filter"
                        outlined
                        dense
                        dark
                ></v-select>
            </v-col>
            <v-col cols="2">
                <v-btn outlined dark v-on:click="createFilter(currentFilter, currentFilterValue)">Apply</v-btn>
            </v-col>
        </v-row>
        <v-row dense v-if="Object.keys(currentFilters).length>0">
            <v-chip
                    v-for="(value, filter) in currentFilters"
                    :key="`${filter}:${value}`"
                    class="ml-2 mr-2"
                    close
                    @click:close="deleteFilter(filter)"
            >{{filter}}: {{value}}</v-chip>
        </v-row>
        <v-row style="color: white">
            <v-col>
                <v-list flat dark dense style="background-color: #343a40">
                    <v-list-item-group
                        v-model="currentlySelected"
                        color="blue lighten-3">
                        <v-list-item
                                v-bind:item="item"
                                v-bind:key="item.objectId"
                                :map-data="mapData"
                                v-for="item in mapData"
                                v-show="(searchResults.includes(item.objectId.toString()) || searchQuery.trim()==='') && checkFilter(item)">
                            <v-list-item-content>
                                <v-list-item-title v-text="item.name"></v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list-item-group>
                </v-list>
            </v-col>
            <v-col>
                <p v-if="currentItem===undefined">No map item currently selected. <br/>Select an item from the list to view its details.</p>
                <v-card v-else dark>
                    <v-card-title>{{currentItem.name}}</v-card-title>
                    <v-card-text>
                        <v-list dense>
                            <v-subheader>Object Details</v-subheader>
                            <v-list-item
                                v-for="(property, key) in currentItem.objectInfo"
                                :key="key"
                                style="height: 20px; min-height: 20px;">
                                <strong>{{key}}</strong>: {{property}}
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                                text
                                color="blue lighten-4"
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

    export default {
        name: "objects.small",
        props: {
            mapData: {
                type: Array,
                required: true,
                default: () => ({})
            }
        },
        data() {
            return {
                searchQuery: "",
                currentFilter: "Filter",
                currentFilterValue: "Value",
                currentFilters: {},
                currentlySelected: undefined
            }
        },
        computed: {
            currentItem: function() {
                return this.mapData.find(v=>v.objectId===this.currentlySelected);
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
                    Object.keys(item.objectInfo).forEach(key => {
                        if (!filters.includes(key)) {
                            filters.push(key)
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
                    if (Object.keys(item.objectInfo).includes(filter)) {
                        filters.push(item.objectInfo[filter].toString())
                    }
                });
                return filters
            }
            ,
            createFilter: function (filter, value) {
                if (filter === "Filter" || value === "Value") {
                    return
                }
                this.currentFilters[filter] = value;
                this.currentFilter = "Filter";
                this.currentFilterValue = "Value";
            }
            ,
            deleteFilter: function (filter) {
                if (Object.keys(this.currentFilters).includes(filter)) {
                    Vue.delete(this.currentFilters, filter)
                }
            }
            ,
            checkFilter: function (item) {
                for (let filter in this.currentFilters) {
                    // noinspection JSUnfilteredForInLoop
                    if (!item.objectInfo.hasOwnProperty(filter)) {
                        return false
                    } else {
                        // noinspection JSUnfilteredForInLoop
                        if (item.objectInfo[filter] !== this.currentFilters[filter]) {
                            return false
                        }
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