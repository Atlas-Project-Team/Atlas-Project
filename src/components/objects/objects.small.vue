<template>
    <div>
        <div class="input-group mb-1">
            <input class="form-control text-white bg-dark border-light" id="search" onsubmit="" placeholder="Search"
                   type="search" v-model="searchQuery">
        </div>
        <div class="input-group mb-1">
            <select class="custom-select bg-dark border-light text-white" id="filterBarFilterSelect"
                    v-model="currentFilter">
                <option disabled selected value="Filter">Filter</option>
                <option v-bind:value="filter" v-for="filter in filters">{{filter}}</option>
            </select>
            <select class="custom-select bg-dark border-light text-white" id="filterBarFilterValue"
                    v-model="currentFilterValue">
                <option disabled selected value="Value">Value</option>
                <option v-bind:value="value" v-for="value in getFilters(currentFilter)">{{value}}</option>
            </select>
            <div class="input-group-append">
                <button class="btn btn-outline-light" type="button"
                        v-on:click="createFilter(currentFilter, currentFilterValue)">Filter
                </button>
            </div>
        </div>
        <div class="mb-3" id="filters">
            <span class="badge badge-pill badge-light m-1" v-for="(value, filter) in currentFilters">{{filter}}: {{value}} <button
                    class="btn btn-link text-dark pt-0 pb-0 pr-0 pl-1 mb-1" v-on:click="deleteFilter(filter)">×</button></span>
        </div>
        <div class="h-100" id="mapData">
            <map-item
                    v-bind:item="item"
                    v-bind:key="item.objectId"
                    v-bind:map-data="map"
                    v-for="item in map"
                    v-if="(searchResults.includes(item.objectId.toString()) || searchQuery.trim()==='') && checkFilter(item)"
            ></map-item>
        </div>
        <div class="align-bottom" id="userInfo">
            <div class="text-white">
                <div class="card text-white bg-dark border-light" v-if="user">
                    <div class="card-body p-3">
                        Currently signed in as: {{user.email}}
                    </div>
                    <button class="btn btn-outline-light text-white" onclick="window.signOut()" type="button">Sign Out
                    </button>
                </div>
                <div class="card text-white bg-dark border-light" v-else>
                    <button class="btn btn-outline-light text-white" onclick="window.location.href='./auth.html';"
                            type="button">Sign In/Up
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Fuse from "fuse.js";
    import Vue from "vue";

    type mapItem = { objectId: string; pos: { x: number; y: number; z: number }; rot: { x: number; y: number; z: number }; modelPath: string; objectInfo: { [key: string]: any }; scale: number; name: string, defaultZoom: number, children: object[] };

    module.exports = {
        name: "objects.small",
        props: {
            mapData: {
                type: Array,
                required: true,
                default: () => ({})
            }
        },
        data: {
            searchQuery: "",
            currentFilter: "Filter",
            currentFilterValue: "Value",
            currentFilters: {},
            user: null
        },
        computed: {
            searchResults: function (): string[] {
                return this.fuse.search(this.searchQuery).map((value: any) => {
                    return value.item.objectId.toString()
                })
            },
            fuse: function (): any {
                return new Fuse(this.map, {
                    keys: ['name']
                });
            },
            filters: function (): string[] {
                let filters: string[] = [];
                this.map.forEach((item: mapItem) => {
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
            getFilters: function (filter: string): string[] {
                let filters: string[] = [];
                this.map.forEach((item: mapItem) => {
                    if (Object.keys(item.objectInfo).includes(filter)) {
                        filters.push(item.objectInfo[filter].toString())
                    }
                });
                return filters
            },
            createFilter: function (filter: string, value: string): void {
                if (filter === "Filter" || value == "Value") {
                    return
                }
                this.currentFilters[filter] = value;
                this.currentFilter = "Filter";
                this.currentFilterValue = "Value";
                return
            },
            deleteFilter: function (filter: string): void {
                if (Object.keys(this.currentFilters).includes(filter)) {
                    Vue.delete(this.currentFilters, filter)
                }
                return
            },
            checkFilter: function (item: mapItem): boolean {
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
        watch: {
            searchQuery: function (): void {
                $('.collapse').collapse('hide');
            }
        }
    }
</script>

<style scoped>

</style>