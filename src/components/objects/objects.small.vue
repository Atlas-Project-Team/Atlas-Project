<template>
    <div>
        <p v-for="mapItem in mapData" :key="mapItem.objectId">
            {{mapItem.name}}
        </p>
    </div>
</template>

<script>
    module.exports = {
        name: "objects.small",
        data () {
            return {
                mapData: [
                    {
                        "objectId": 0,
                        "pos": {
                            "x": 0.0,
                            "y": 0.0,
                            "z": 0.0
                        },
                        "modelPath": "Assets/models/Neptune/",
                        "objectInfo": {
                            "Object": "Planet",
                            "Type": "Gas Giant"
                        },
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
                        "objectInfo": {
                            "Object": "Station",
                            "Type": "Neutral"
                        },
                        "defaultZoom": 500
                    }
                ]
            }
        }
    }
</script>

<style scoped>

</style>