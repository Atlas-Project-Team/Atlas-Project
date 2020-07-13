import * as THREE from "three";
import 'three/examples/jsm/controls/OrbitControls.js';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import * as datgui from 'dat.gui';
import Vue from 'vue';
import Fuse from 'fuse.js';
import * as firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/firestore';

type mapItem = { objectId: string; pos: { x: number; y: number; z: number }; modelPath: string; objectInfo: { [key: string]: any }; scale: number; name: string, defaultZoom: number, children: object[] };

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        lookAt: (arg: string) => void;
        openItem: (arg: string) => void;
    }

    interface JQuery {
        collapse: (arg: string) => void;
    }
}

declare module 'vue/types/vue' {
    interface Vue {
        map: mapItem[],
        searchQuery: string,
        currentFilter: string,
        currentFilterValue: string,
        currentFilters: { [key: string]: string }
    }
}

// noinspection SpellCheckingInspection
const firebaseConfig = {
    apiKey: "AIzaSyButkqFXtrI90FUM-l7O-nWz-3TxIwd_0U",
    authDomain: "atlas-project-274801.firebaseapp.com",
    databaseURL: "https://atlas-project-274801.firebaseio.com",
    projectId: "atlas-project-274801",
    storageBucket: "atlas-project-274801.appspot.com",
    messagingSenderId: "807372296549",
    appId: "1:807372296549:web:b1e8fc3be8c2a27488918c",
    measurementId: "G-40XQC6G6E4"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.firestore();

let sidebarApp = new Vue({
    el: '#sidebar',
    data: {
        map: [],
        searchQuery: "",
        currentFilter: "Filter",
        currentFilterValue: "Value",
        currentFilters: {}
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
});


Vue.component('mapItem', {
    props: ['item', 'mapData'],
    template: `
        <div class="map-item card text-white bg-dark border-light mt-1 mb-1" v-bind:id="'item-'+item.objectId">
            <div class="card-header">
                <h4>
                    <a class="card-title text-white" data-toggle="collapse"
                       v-bind:href="'#item-collapse-'+item.objectId"
                       role="button">
                        {{item.name}}
                    </a>
                </h4>
            </div>
            <div class="collapse card-body" v-bind:id="'item-collapse-'+item.objectId">
                <h5 class="mb-2">Object Details:</h5>
                <p v-for="(property, key) in item.objectInfo" class="card-text mb-0">
                    <strong>{{key}}</strong>: {{property}}
                </p>
                <hr>
                <h5 v-if="item.children.length > 0">Children</h5>
                <div v-if="item.children.length > 0" class="list-group-flush bg-dark border-light pl-0">
                    <button v-for="child in item.children" v-bind:key="child.id"
                            class="list-group-item text-white bg-dark border-light"
                            v-bind:onclick="'window.openItem(&quot;'+child.id+'&quot;);'">
                        {{mapData.find((mapDataItem) => {
                        return mapDataItem.objectId === child.id
                    }).name}}
                    </button>
                </div>
                <hr v-if="item.children.length > 0">
                <button type="button" class="btn btn-outline-light text-white mt-2"
                        v-bind:onclick="'window.lookAt(&quot;'+item.objectId+'&quot;);'">Look at
                </button>
            </div>
        </div>
    `
});

interface Asteroid {
    object: THREE.Object3D;
    rotationAmount: THREE.Vector3;
}

let times: number[] = [];
let fps: number;

function refreshLoop() {
    window.requestAnimationFrame(() => {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        fps = times.length;
        document.getElementById('fps').innerText = `${fps.toString()} FPS`;
        refreshLoop();
    });
}

refreshLoop();

let mapData: mapItem[];
let asteroidsToLoad: number;
let asteroidA: THREE.Object3D;
let asteroidB: THREE.Object3D;
let asteroidC: THREE.Object3D;
let asteroidLODs: THREE.Object3D[];
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.Renderer;
let controls: OrbitControls;
let settings: { zoomIncrement: number; asteroidCount: number };
let uniforms: { texture: { value: THREE.Texture }; zoomDistance: { value: number }; scale: { value: number }; control: { value: THREE.Vector3 }; };
let asteroids: Asteroid[];
let spawnedAsteroids: number;
let cameraFocus: THREE.Vector3;
let cameraPosition: THREE.Vector3;
let cameraZoomDistance: number;
let grid: THREE.Object3D;
let sceneLights: { sun: THREE.Object3D | null; stars: THREE.Object3D | null } = {sun: null, stars: null};
let movement: { x: number[]; y: number[]; z: number[]; zoom: number[] } = {x: [], y: [], z: [], zoom: []};

const GCPAssets: string = "http://storage.googleapis.com/project-atlas-assets/HR_Assets/";

init().then(() => {
    animate();
})
    .catch(err => {
        console.error(err);
    });


function lookAt(objectId: string) {
    let object = mapData.find((item) => {
        return item.objectId === objectId
    });
    movement = easeBetween(controls.target, new THREE.Vector3(object.pos.x, object.pos.y, object.pos.z), camera.position.distanceTo(controls.target), object.defaultZoom, fps * 3);
    //controls.autoRotate = true;
    //controls.autoRotateSpeed = 0.5;
}

function openItem(objectId: string) {
    sidebarApp.searchQuery = mapData.find(val => {
        return val.objectId === objectId
    }).name;
    $('#item-collapse-' + objectId.toString()).collapse('show');
}

window.openItem = openItem;
window.lookAt = lookAt;

function easeBetween(start: THREE.Vector3, finish: THREE.Vector3, startZoom: number, finishZoom: number, duration: number) {
    let ease = (t: number) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    let m: { x: number[]; y: number[]; z: number[]; zoom: number[] } = {x: [], y: [], z: [], zoom: []};
    let d: { x: number; y: number; z: number; zoom: number } = {x: 0, y: 0, z: 0, zoom: 0};
    d.x = finish.x - start.x;
    d.y = finish.y - start.y;
    d.z = finish.z - start.z;
    d.zoom = finishZoom - startZoom;
    for (let i = 0; i < duration; i++) {
        let t: number = ease((i + 1) / duration) - ease(i / duration);
        m.x.push(d.x * t);
        m.y.push(d.y * t);
        m.z.push(d.z * t);
        m.zoom.push(d.zoom * t);
    }
    return m;
}

async function init() {
    mapData = [];

    await db.collection("mapData").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let data = <mapItem>doc.data();
            data.objectId = doc.id;
            // noinspection JSSuspiciousNameCombination
            data.pos = {
                x: data.pos.y,
                y: data.pos.z,
                z: data.pos.x
            };
            mapData.push(data);
        });
    });

    sidebarApp.map = mapData;

    asteroidsToLoad = 12;

    asteroidA = loadNewAsteroid([GCPAssets + "models/Asteroids/a4.glb", GCPAssets + "models/Asteroids/a3.glb", GCPAssets + "models/Asteroids/a2.glb", GCPAssets + "models/Asteroids/a1.glb"]);
    asteroidB = loadNewAsteroid([GCPAssets + "models/Asteroids/b4.glb", GCPAssets + "models/Asteroids/b3.glb", GCPAssets + "models/Asteroids/b2.glb", GCPAssets + "models/Asteroids/b1.glb"]);
    asteroidC = loadNewAsteroid([GCPAssets + "models/Asteroids/c4.glb", GCPAssets + "models/Asteroids/c3.glb", GCPAssets + "models/Asteroids/c2.glb", GCPAssets + "models/Asteroids/c1.glb"]);

    asteroidLODs = [
        asteroidA,
        asteroidB,
        asteroidC
    ];

    // Define standard three.js-libs objects required to make scene function properly
    scene = new THREE.Scene(); // Scene itself, contains all objects
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, Math.pow(10, 0), Math.pow(10, 6)); // Camera using a perspective view (as opposed to orthographic. Aspect ratio set to match window and camera renders from 0.1 units away to 10^6 units away.
    renderer = new THREE.WebGLRenderer({antialias: true}); // Three.js-libs renderer. The actual web element (canvas object) if I'm not mistaken?
    controls = new OrbitControls(camera, renderer.domElement); // Uses standard orbit controls to manipulate the camera's movement. Might change it to be more like E:D at some point but this works for now.
    settings = {
        zoomIncrement: 10, // The factor that the grid is scaled by. By default it is 10, i.e. 1x1 grid -> 10x10 grid -> 100x100 grid
        asteroidCount: 1000 // The number of asteroids to render around Eos
    };

    // stop autorotate after the first interaction
    controls.addEventListener('start', function () {
        controls.autoRotate = false;
    });

    // Initialize uniforms.
    uniforms = {
        texture: {
            value: new THREE.TextureLoader().load(GCPAssets + "textures/White.png")
        },
        control: {
            value: controls.target,
        },
        zoomDistance: {
            value: 1.0
        },
        scale: {
            value: 1.0
        }
    };
    uniforms.texture.value.wrapS = uniforms.texture.value.wrapT = THREE.RepeatWrapping;

    // Create shader material
    let shaderMaterial = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent

    });

    grid = new THREE.Group();
    let divisions = 100;
    let divider = Math.round(divisions / 2);

    let geometry, line;
    for (let x = -divider; x <= divider; x++) {
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(x, 0, -divider),
            new THREE.Vector3(x, 0, divider)
        );
        line = new THREE.Line(geometry, shaderMaterial);
        grid.add(line);
    }

    for (let y = -divider; y <= divider; y++) {
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(-divider, 0, y),
            new THREE.Vector3(divider, 0, y)
        );
        line = new THREE.Line(geometry, shaderMaterial);
        grid.add(line);
    }

    scene.add(grid);

    asteroids = [];
    spawnedAsteroids = 0;

    for (let mapObject in mapData) {
        // noinspection JSUnfilteredForInLoop ,JSUnusedLocalSymbols
        let {name, scale, objectId, pos, modelPath, objectInfo} = mapData[mapObject];

        let loader = new GLTFLoader();

        loader.load(GCPAssets + modelPath + 'model.glb', (gltf) => {
            gltf.scene.scale.set(scale, scale, scale);
            gltf.scene.position.set(pos.x, pos.y, pos.z);
            scene.add(gltf.scene);
        }, undefined, (err) => {
            console.error(err)
        });
    }


    renderer.setSize(window.innerWidth, window.innerHeight); // Set renderer object (canvas element) to match window size
    document.getElementById('canvas').appendChild(renderer.domElement); // Add the canvas element to the page.

    // Load in a space cube map at /Assets/skybox/ to act as a backdrop.
    scene.background = new THREE.CubeTextureLoader()
        .setPath(GCPAssets + "skybox/")
        .load([
            'right.jpg', //     positive x
            'left.jpg', //      negative x
            'top.jpg', //       positive y
            'bottom.jpg', //    negative y
            'front.jpg', //     positive z
            'back.jpg' //       negative z
        ]);

    // Define a directional light source coming from approximately where the main star is on the cubemap
    sceneLights.sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sceneLights.sun.position.set(-1, -0.15, -0.1);
    scene.add(sceneLights.sun);

    // Add a soft ambient light source to illuminate objects indirectly, as if from other smaller stars.
    sceneLights.stars = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(sceneLights.stars);

    // Position the camera above and behind the scene.
    camera.position.set(0, 4000, 20000);
    controls.update();
}

// Animate subroutine, called each frame to update the scene.
function animate() {
    //stats.begin();
    // Schedule a new frame at the monitor's refresh rate
    requestAnimationFrame(animate);

    cameraZoomDistance = camera.position.distanceTo(controls.target);

    if (movement.x.length > 0) {
        controls.target.x += movement.x.shift()
    }
    if (movement.y.length > 0) {
        controls.target.y += movement.y.shift()
    }
    if (movement.z.length > 0) {
        controls.target.z += movement.z.shift()
    }
    if (movement.zoom.length > 0) {
        cameraZoomDistance += movement.zoom.shift()
    }
    // Reposition the camera at the correct zoom distance from the controls target
    let cameraPos = camera.position;
    cameraPos.sub(controls.target);
    let zoomFactor = cameraZoomDistance / cameraPos.distanceTo(new THREE.Vector3(0, 0, 0));
    cameraPos.multiplyScalar(zoomFactor);
    cameraPos.add(controls.target);
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    // Find the distance from the camera to the point it orbits around
    cameraFocus = controls.target;
    cameraPosition = camera.position;
    cameraZoomDistance = cameraPosition.distanceTo(cameraFocus);

    uniforms.zoomDistance.value = cameraZoomDistance;

    // Define a "Zoom Factor" by taking the logarithm of the zoom distance divided by five, in the base of the increment defined earlier in the settings object.
    zoomFactor = Math.floor(Math.log(cameraZoomDistance) / Math.log(settings.zoomIncrement));

    // Dynamically set camera near/far plane
    camera.near = (Math.pow(settings.zoomIncrement, zoomFactor) / 1000);
    camera.far = (Math.pow(settings.zoomIncrement, zoomFactor) * 1000);
    camera.updateProjectionMatrix();

    // Dynamically set fog near/far plane

    // Ensure number of asteroids rendered matches setting
    while (spawnedAsteroids !== settings.asteroidCount && asteroidsToLoad === 0) {
        if (asteroids.length < settings.asteroidCount) {
            // Add more asteroids
            let lod: Asteroid = {
                object: asteroidLODs[Math.floor(Math.random() * asteroidLODs.length)],
                rotationAmount: new THREE.Vector3(Math.random() * 0.0015, Math.random() * 0.0015, Math.random() * 0.0015)
            };
            lod.object = lod.object.clone();

            let radius: number = 14000 + Math.random() * 2200;
            let angle: number = Math.random() * 2 * Math.PI;
            lod.object.position.set(Math.cos(angle) * radius + (Math.random() - 0.5) * 1000 + 15000, (Math.random() - 0.5) * 42, Math.sin(angle) * radius + (Math.random() - 0.5) * 1000);
            lod.object.scale.set((Math.random() + 0.5) * 10, (Math.random() + 0.5) * 10, (Math.random() + 0.5) * 10);
            lod.object.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
            asteroids.push(lod);
            scene.add(asteroids[asteroids.length - 1].object);

            spawnedAsteroids++;
        } else if (asteroids.length > settings.asteroidCount) {
            // Remove some asteroids
            scene.remove(asteroids.pop().object);
            spawnedAsteroids--;
        }
    }

    // Rotate the asteroids
    for (let asteroid in asteroids) {
        // noinspection JSUnfilteredForInLoop *Shut up WebStorm*
        asteroids[asteroid].object.rotation.x += asteroids[asteroid].rotationAmount.x;
        // noinspection JSUnfilteredForInLoop *Shut up WebStorm*
        asteroids[asteroid].object.rotation.y += asteroids[asteroid].rotationAmount.y;
        // noinspection JSUnfilteredForInLoop *Shut up WebStorm*
        asteroids[asteroid].object.rotation.z += asteroids[asteroid].rotationAmount.z;
    }

    // Output a scale in text to a h1 element on top of the canvas
    document.getElementById("scale").innerText = "1 Grid Tile = " + Math.pow(settings.zoomIncrement, zoomFactor).toString() + "km × " + Math.pow(settings.zoomIncrement, zoomFactor).toString() + "km.";

    // Scale the grid to match the zoom factor, that is to say, scale it by zoom Increment raised to the power of zoom Factor
    grid.scale.set(Math.pow(settings.zoomIncrement, zoomFactor), Math.pow(settings.zoomIncrement, zoomFactor), Math.pow(settings.zoomIncrement, zoomFactor));
    let target = controls.target;

    grid.position.x = Math.pow(settings.zoomIncrement, zoomFactor) * Math.floor(target.x / Math.pow(settings.zoomIncrement, zoomFactor));
    grid.position.y = 0;
    grid.position.z = Math.pow(settings.zoomIncrement, zoomFactor) * Math.floor(target.z / Math.pow(settings.zoomIncrement, zoomFactor));


    uniforms.scale.value = Math.pow(settings.zoomIncrement, zoomFactor);
    uniforms.control.value = controls.target.clone().sub(grid.position);

    // Update controls system each frame to prevent issues when moving camera or resizing window
    controls.update();

    // Render this frame.
    renderer.render(scene, camera);
    //stats.end();
}

document.body.onresize = () => {

    // Reset the camera and viewport to match the window dimensions if it is resized.
    camera.aspect = (window.innerWidth * 0.85) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize((window.innerWidth * 0.85), window.innerHeight);

};

window.onload = () => {
    const gui = new datgui.GUI();
    gui.add(settings, "zoomIncrement").min(2).max(20).step(1);
    gui.add(settings, "asteroidCount").min(0).max(10000).step(1);
};

document.body.onload = () => {
    document.getElementById("loading").remove();
};

function loadNewAsteroid(model: string[]) {
    let asteroidLoader = new GLTFLoader();

    let lod = new THREE.LOD();

    asteroidLoader.load(model[3], (gltf) => {
        lod.addLevel(gltf.scene.children[0], 100000);
        asteroidsToLoad--
    }, undefined, (err) => {
        console.error(err);
    });

    asteroidLoader.load(model[2], (gltf) => {
        lod.addLevel(gltf.scene.children[0], 10000);
        asteroidsToLoad--
    }, undefined, (err) => {
        console.error(err);
    });

    asteroidLoader.load(model[1], (gltf) => {
        lod.addLevel(gltf.scene.children[0], 1000);
        asteroidsToLoad--
    }, undefined, (err) => {
        console.error(err);
    });

    asteroidLoader.load(model[0], (gltf) => {
        lod.addLevel(gltf.scene.children[0], 100);
        asteroidsToLoad--
    }, undefined, (err) => {
        console.error(err);
    });

    return lod;
}