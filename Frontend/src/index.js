let THREE = require('three');
let {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
let {GLTFLoader} = require('three/examples/jsm/loaders/GLTFLoader');
let datgui = require('dat.gui');
let Stats = require('stats-js');


let stats, mapData, asteroidsToLoad, asteroidA, asteroidB, asteroidC, asteroidLODs;
let scene, camera, renderer, controls, settings, uniforms, asteroids, spawnedAsteroids;
let cameraFocus, cameraPosition, cameraZoomDistance, zoomFactor, grid;

const GCPAssets = "http://storage.googleapis.com/project-atlas-assets/Assets/";

init();
animate();

function init() {
    stats = Stats();
    document.getElementById("canvasOverlay").appendChild(stats.dom);
    // Dummy Map data to test on before we add in
    mapData = [
        {
            "objectId": 0,
            "pos": {
                "x": 0.0,
                "y": 0.0,
                "z": 0.0
            },
            "modelPath": GCPAssets + "models/Neptune/",
            "objectInfo": {
                "Object": "Planet",
                "Type": "Gas Giant"
            },
            "scale": 11144.9,
            "name": "Eos"
        },
        {
            "scale": 0.001,
            "name": "Eos 222",
            "objectId": 1,
            "pos": {
                "x": 15000.0,
                "y": 0.0,
                "z": 0.0
            },
            "modelPath": GCPAssets + "models/Station/",
            "objectInfo": {
                "Object": "Station",
                "Type": "Neutral"
            }
        }
    ];

    asteroidsToLoad = 12;

    asteroidA = loadNewAsteroid([GCPAssets + "models/Asteroids/a4.gltf", GCPAssets + "models/Asteroids/a3.gltf", GCPAssets + "models/Asteroids/a2.gltf", GCPAssets + "models/Asteroids/a1.gltf"]);
    asteroidB = loadNewAsteroid([GCPAssets + "models/Asteroids/b4.gltf", GCPAssets + "models/Asteroids/b3.gltf", GCPAssets + "models/Asteroids/b2.gltf", GCPAssets + "models/Asteroids/b1.gltf"]);
    asteroidC = loadNewAsteroid([GCPAssets + "models/Asteroids/c4.gltf", GCPAssets + "models/Asteroids/c3.gltf", GCPAssets + "models/Asteroids/c2.gltf", GCPAssets + "models/Asteroids/c1.gltf"]);

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

    geometry = new THREE.BoxGeometry();
    let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    let cube = new THREE.Mesh(geometry, material);
    scene.add(cube);


    asteroids = [];
    spawnedAsteroids = 0;

    for (let mapObject in mapData) {
        // noinspection JSUnfilteredForInLoop *because JSON Validation is way easier*,JSUnusedLocalSymbols
        let {name, scale, objectId, pos, modelPath, objectInfo} = mapData[mapObject];

        let loader = new GLTFLoader();

        loader.load(modelPath + 'scene.gltf', (gltf) => {
            gltf.scene.scale.set(scale, scale, scale);
            gltf.scene.position.set(pos.x, pos.y, pos.z);
            scene.add(gltf.scene);
        }, undefined, (err) => {
            console.error(err)
        });
    }


    renderer.setSize(window.innerWidth, window.innerHeight); // Set renderer object (canvas element) to match window size
    document.body.appendChild(renderer.domElement); // Add the canvas element to the page.

    // Load in a space cube map at /Assets/skybox/ to act as a backdrop.
    scene.background = new THREE.CubeTextureLoader()
        .setPath(GCPAssets + "skybox/")
        .load([
            'right.png', //     positive x
            'left.png', //      negative x
            'top.png', //       positive y
            'bottom.png', //    negative y
            'front.png', //     positive z
            'back.png' //       negative z
        ]);

    // Define a directional light source coming from approximately where the main star is on the cubemap
    scene.sun = new THREE.DirectionalLight(0xffffff, 0.9);
    scene.sun.position.set(-1, -0.15, -0.1);
    scene.add(scene.sun);

    // Add a soft ambient light source to illuminate objects indirectly, as if from other smaller stars.
    scene.stars = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(scene.stars);

    // Add a grid that spans 1000 squares, each 1x1 unit.
    //gridHelper = new THREE.GridHelper(1000, 1000);
    //scene.add(gridHelper);

    // Position the camera above and behind the scene.
    camera.position.set(0, 4000, 20000);
    controls.update();
}

// Animate subroutine, called each frame to update the scene.
function animate() {
    stats.begin();
    // Schedule a new frame at the monitor's refresh rate
    requestAnimationFrame(animate);


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
            let lod = asteroidLODs[Math.floor(Math.random() * asteroidLODs.length)];
            lod = lod.clone();

            let radius = 14000 + Math.random() * 2200;
            let angle = Math.random() * 2 * Math.PI;
            lod.position.set(Math.cos(angle) * radius + (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, Math.sin(angle) * radius + (Math.random() - 0.5) * 1000);
            lod.scale.set((Math.random() + 0.5) * 100, (Math.random() + 0.5) * 100, (Math.random() + 0.5) * 100);
            lod.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
            lod.rotationAmounts = new THREE.Vector3(Math.random() * 0.0075, Math.random() * 0.0075, Math.random() * 0.0075);
            asteroids.push(lod);
            scene.add(asteroids[asteroids.length - 1]);

            spawnedAsteroids++;
        } else if (asteroids.length > settings.asteroidCount) {
            // Remove some asteroids
            scene.remove(asteroids.pop());
            spawnedAsteroids--;
        }
    }

    // Rotate the asteroids
    for (let asteroid in asteroids) {
        // noinspection JSUnfilteredForInLoop *Shut up WebStorm*
        asteroids[asteroid].rotation.x += asteroids[asteroid].rotationAmounts.x;
        // noinspection JSUnfilteredForInLoop *Shut up WebStorm*
        asteroids[asteroid].rotation.y += asteroids[asteroid].rotationAmounts.y;
        // noinspection JSUnfilteredForInLoop *Shut up WebStorm*
        asteroids[asteroid].rotation.z += asteroids[asteroid].rotationAmounts.z;
    }

    // Output a scale in text to a h1 element on top of the canvas
    document.getElementById("scale").innerText = "1 Grid Tile = " + Math.pow(settings.zoomIncrement, zoomFactor).toString() + "km × " + Math.pow(settings.zoomIncrement, zoomFactor).toString() + "km.";

    // Scale the grid to match the zoom factor, that is to say, scale it by zoom Increment raised to the power of zoom Factor
    grid.scale.set(Math.pow(settings.zoomIncrement, zoomFactor), Math.pow(settings.zoomIncrement, zoomFactor), Math.pow(settings.zoomIncrement, zoomFactor));
    let target = controls.target;
    // noinspection DuplicatedCode
    grid.position.x = Math.pow(settings.zoomIncrement, zoomFactor) * Math.floor(target.x / Math.pow(settings.zoomIncrement, zoomFactor));
    grid.position.y = Math.pow(settings.zoomIncrement, zoomFactor) * Math.floor(target.y / Math.pow(settings.zoomIncrement, zoomFactor));
    grid.position.z = Math.pow(settings.zoomIncrement, zoomFactor) * Math.floor(target.z / Math.pow(settings.zoomIncrement, zoomFactor));


    uniforms.scale.value = Math.pow(settings.zoomIncrement, zoomFactor);
    uniforms.control.value = controls.target.clone().sub(grid.position);

    // Update controls system each frame to prevent issues when moving camera or resizing window
    controls.update();

    // Render this frame.
    renderer.render(scene, camera);
    stats.end();
}

document.body.onresize = () => {

    // Reset the camera and viewport to match the window dimensions if it is resized.
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

};

window.onload = () => {
    const gui = new datgui.GUI();
    gui.add(settings, "zoomIncrement").min(2).max(20).step(1);
    gui.add(settings, "asteroidCount").min(0).max(10000).step(1);
};

function loadNewAsteroid(model) {
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