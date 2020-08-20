<template>
    <v-container fluid>
        <h4 style="color: white; text-align: right">Objects</h4>
        <v-text-field
            v-model="searchQuery"
            placeholder="Search"
            dense
            dark
            ></v-text-field>
        <v-row dense no-gutters>
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
            <v-col cols="4" sm="5">
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
                <v-btn height="40" block outlined dark v-on:click="createFilter(currentFilter, currentFilterValue)">Apply</v-btn>
            </v-col>
        </v-row>
        <v-row dense v-if="Object.keys(currentFilters).length>0">
            <v-chip
                    v-for="({parameter, value}) in currentFilters"
                    :key="`${parameter}:${value}`"
                    class="ml-2 mr-2"
                    close
                    @click:close="deleteFilter({parameter, value})"
            >{{parameter}}: {{value}}</v-chip>
        </v-row>
        <v-row style="color: white">
            <v-col cols="12" sm="6" order="2" order-sm="1">
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
            <v-col cols="12" sm="6" order="1" order-sm="2">
                <p v-if="currentItem===undefined">No map item currently selected. <br/>Select an item from the list to view its details.</p>
                <v-card v-else dark>
                    <v-card-title>{{currentItem.name}}</v-card-title>
                    <v-card-text>
                        <v-list dense>
                            <v-subheader>Object Details</v-subheader>
                            <v-list-item
                                v-for="{value, parameter} in currentItem.objectInfo"
                                :key="`${parameter}:${value}`"
                                style="height: 20px; min-height: 20px;">
                                <strong>{{parameter}}</strong>: {{value}}
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

<script lang="js">
    import Fuse from "fuse.js";
    import Vue from "vue";
    import _ from "lodash";
    import {parameters} from "../../../.storybook/preview";

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
                currentFilters: [],
                currentlySelected: undefined
            }
        },
        computed: {
            currentItem: function() {
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
                    if (item.objectInfo.map(a=>a.parameter).includes(filter)) {
                        filters.push(item.objectInfo.find(item=>item.parameter===filter).value.toString())
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
                        Vue.delete(this.currentFilters, this.currentFilters.findIndex(v=>_.isEqual({parameter: v.parameter, value: v.value}, filter)))
                    }
                })
            }
            ,
            checkFilter: function (item) {
                for (let filter of this.currentFilters) {
                    if (!item.objectInfo.some(v=>_.isEqual({parameter: v.parameter, value: v.value}, filter))) {
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