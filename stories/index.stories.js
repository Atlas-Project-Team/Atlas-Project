import SmallObjects from '../src/components/objects/objects.vue';
import client from '../src/apolloClient';
import {gql} from "@apollo/client";

let mapData = [];

client.query({
    query: gql`
        {
            mapData {
                name,
                objectId,
                pos {x,y,z},
                modelPath,
                objectInfo {
                    parameter,
                    value
                },
                scale,
                defaultZoom
            }
        }
    `
})
.then(res => {
    mapData = res.data.mapData;
    console.log(mapData);
});

export default {
    title: "Objects",
}

const sampleData = [
    {
        "objectId": 0,
        "pos": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
        },
        "modelPath": "Assets/models/Neptune/",
        "objectInfo": [
            {"parameter": "Object", "value": "Planet"},
            {"parameter": "Type", "value": "Gas Giant"},
        ],
        "scale": 10.0,
        "name": "Eos",
        "defaultZoom": 20000
    },
    {
        "scale": 1.0,
        "name": "Eos 222",
        "objectId": 1,
        "pos": {
            "x": 15.0,
            "y": 0.0,
            "z": 0.0
        },
        "modelPath": "Assets/models/Station/",
        "objectInfo": [
            {"parameter": "Object", "value": "Station"},
            {"parameter": "Type", "value": "Neutral"},
        ],
        "defaultZoom": 500
    }
]

export const Default = () => ({
        components: {SmallObjects},
        template: '<small-objects :mapData="mapData"></small-objects>',
        props: {
            mapData: {
                default: () => sampleData,
            }
        }
    }
);

export const LiveData = () => ({
        components: {SmallObjects},
        template: '<small-objects :mapData="mapData"></small-objects>',
        props: {
            mapData: {
                default: () => mapData,
            }
        }
    }
);