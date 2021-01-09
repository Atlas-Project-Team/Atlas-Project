<template>
  <v-container
    fluid
    class="fill-height pa-0"
  >
    <v-row
      v-show="!loaded"
      justify="center"
    >
      <v-card
        min-width="300"
        max-width="400"
      >
        <v-card-title>
          Loading Map Assets
        </v-card-title>
        <v-card-subtitle v-if="$store.state.assetsRequested === 0">
          Preparing to load assets...
        </v-card-subtitle>
        <v-card-subtitle v-else>
          {{ $store.state.assetsLoaded }} out of {{ $store.state.assetsRequested }} loaded.
        </v-card-subtitle>
        <v-card-text v-if="$store.state.assets.size === 0">
          <v-progress-linear indeterminate />
        </v-card-text>
        <v-card-text v-else>
          <v-progress-linear :value="$store.state.assetsLoaded/$store.state.assetsRequested*100" />
        </v-card-text>
      </v-card>
    </v-row>
    <div
      v-show="loaded"
      class="mapContainer"
      style="position: relative; height: 100%; width: 100%"
    >
      <span
        class="scale text-h6"
        style="position: absolute;
          left: 5px;
          bottom: 5px;
          z-index: 1;
          pointer-events: none;"
      >
        Scale 1:1
      </span>
    </div>
  </v-container>
</template>

<script>
import {
  AmbientLight,
  CubeTextureLoader, DirectionalLight,
  Geometry,
  Group, Line,
  PerspectiveCamera, Scene, ShaderMaterial, Vector3, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export default {
  name: 'Map',
  data() {
    return {
      width: 0,
      height: 0,
      loaded: false,
    };
  },
  computed: {
    loadPercentage() {
      return (this.$store.state.assetsLoaded / this.$store.state.assetsRequested) * 100;
    },
  },
  watch: {
    loadPercentage(val) {
      if (val === 100) this.loaded = true;
    },
  },
  async mounted() {
    if (this.loadPercentage === 100) this.loaded = true;

    this.width = this.$el.clientWidth;
    this.height = this.$el.clientHeight;

    // Begin renderer scripts

    const movement = {
      x: [], y: [], z: [], zoom: [],
    };
    let scaleText;

    // Define standard three.js-libs objects required to make scene function properly
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      this.width / this.height,
      10 ** -1,
      10 ** 6,
    );
    const renderer = new WebGLRenderer({ antialias: true }); // Three.js-libs renderer.
    const controls = new OrbitControls(camera, renderer.domElement);

    // Uses standard orbit controls to manipulate the camera's movement.
    const settings = {
      zoomIncrement: 10, // The factor that the grid is scaled by.
      // By default it is 10, i.e. 1x1 grid -> 10x10 grid -> 100x100 grid
      asteroidCount: 1000, // The number of asteroids to render around Eos
    };

    // Stop autorotate after the first interaction
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    // Initialize uniforms.
    const uniforms = {
      control: {
        value: controls.target,
      },
      zoomDistance: {
        value: 1.0,
      },
      scale: {
        value: 1.0,
      },
    };

    // Create shader material
    const shaderMaterial = new ShaderMaterial({
      transparent: true,
      uniforms,
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
    });

    // Create grid
    const grid = new Group();
    const divisions = 100;
    const divider = Math.round(divisions / 2);

    for (let x = -divider; x <= divider; x += 1) {
      const geometry = new Geometry();
      geometry.vertices.push(
        new Vector3(x, 0, -divider),
        new Vector3(x, 0, divider),
      );
      const line = new Line(geometry, shaderMaterial);
      grid.add(line);
    }

    for (let y = -divider; y <= divider; y += 1) {
      const geometry = new Geometry();
      geometry.vertices.push(
        new Vector3(-divider, 0, y),
        new Vector3(divider, 0, y),
      );
      const line = new Line(geometry, shaderMaterial);
      grid.add(line);
    }

    scene.add(grid);

    // Spawn Eos into scene.
    const loader = new GLTFLoader();

    this.$store.getters.assets('StarbaseEos.glb').then((localUrl) => {
      loader.load(localUrl, (gltf) => {
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.rotation.set(0, 0, 0);
        console.log(`Spawned Eos using local url: ${localUrl}`);
        scene.add(gltf.scene);
      }, undefined, (err) => {
        console.error(err);
      });
    });

    // Load map items into scene.
    console.log(this.$store.state.mapData);
    this.$store.state.mapData.forEach((mapItem) => {
      const {
        scale, pos, modelPath,
      } = mapItem;

      let {
        rot,
      } = mapItem;

      if (rot === undefined) rot = { x: 0, y: 0, z: 0 };

      const loader = new GLTFLoader();

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('./draco/');
      loader.setDRACOLoader(dracoLoader);

      const p = this.$store.getters.assets(`${modelPath}.glb`);
      console.log(p);
      p.then((localUrl) => {
        loader.load(localUrl, (gltf) => {
          gltf.scene.scale.set(scale, scale, scale);
          gltf.scene.position.set(pos.x, pos.y, pos.z);
          gltf.scene.rotation.set(rot.x, rot.y, rot.z);
          console.log(`Spawned asset using local url: ${localUrl}`);
          scene.add(gltf.scene);
        }, undefined, (err) => {
          console.error(err);
        });
      });
    });

    renderer.setSize(this.width, this.height);
    // Set renderer object (canvas element) to match window size
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    // eslint-disable-next-line prefer-const
    scaleText = this.$el.querySelector('.scale');
    this.$el.querySelector('.mapContainer').appendChild(renderer.domElement); // Add the canvas element to the page.

    const right = this.$store.getters.assets('Static/skybox/right.jpg');
    const left = this.$store.getters.assets('Static/skybox/left.jpg');
    const top = this.$store.getters.assets('Static/skybox/top.jpg');
    const bottom = this.$store.getters.assets('Static/skybox/bottom.jpg');
    const front = this.$store.getters.assets('Static/skybox/front.jpg');
    const back = this.$store.getters.assets('Static/skybox/back.jpg');

    // Load in a space cube map at /Assets/skybox/ to act as a backdrop.
    Promise.all([right, left, top, bottom, front, back]).then((textures) => {
      scene.background = new CubeTextureLoader()
        .load(textures);
    });

    // Lighting
    const sceneLights = {};

    // Define a directional light source coming from
    // approximately where the main star is on the cubeMap
    sceneLights.sun = new DirectionalLight(0xffffff, 0.9);
    sceneLights.sun.position.set(-1, -0.15, -0.1);
    scene.add(sceneLights.sun);

    // Add a soft ambient light source to
    // illuminate objects indirectly, as if from other smaller stars.
    sceneLights.stars = new AmbientLight(0x404040, 0.5);
    scene.add(sceneLights.stars);

    // Position the camera above and behind the scene.
    camera.position.set(0, 4000, 20000);
    controls.update();

    // Animate subroutine, called each frame to update the scene.
    const animate = () => {
      // stats.begin();
      // Schedule a new frame at the monitor's refresh rate
      requestAnimationFrame(animate);

      let cameraZoomDistance = camera.position.distanceTo(controls.target);

      if (movement.x.length > 0) {
        controls.target.x += movement.x.shift();
      }
      if (movement.y.length > 0) {
        controls.target.y += movement.y.shift();
      }
      if (movement.z.length > 0) {
        controls.target.z += movement.z.shift();
      }
      if (movement.zoom.length > 0) {
        cameraZoomDistance += movement.zoom.shift();
      }
      // Reposition the camera at the correct zoom distance from the controls target
      const cameraPos = camera.position;
      cameraPos.sub(controls.target);
      let zoomFactor = cameraZoomDistance / cameraPos.distanceTo(new Vector3(0, 0, 0));
      cameraPos.multiplyScalar(zoomFactor);
      cameraPos.add(controls.target);
      camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

      // Find the distance from the camera to the point it orbits around
      const cameraFocus = controls.target;
      const cameraPosition = camera.position;
      cameraZoomDistance = cameraPosition.distanceTo(cameraFocus);

      uniforms.zoomDistance.value = cameraZoomDistance;

      // Define a "Zoom Factor" by taking the logarithm
      // of the zoom distance divided by five, in the base
      // of the increment defined earlier in the settings object.
      zoomFactor = Math.floor(Math.log(cameraZoomDistance) / Math.log(settings.zoomIncrement));

      // Dynamically set camera near/far plane
      camera.near = ((settings.zoomIncrement ** zoomFactor) / 1000);
      camera.far = ((settings.zoomIncrement ** zoomFactor) * 1000);
      camera.aspect = this.width / this.height;
      camera.updateProjectionMatrix();

      // Dynamically set fog near/far plane

      // Output a scale in text to a h1 element on top of the canvas
      scaleText.innerText = `1 Grid Tile = ${(settings.zoomIncrement ** zoomFactor).toString()}km × ${(settings.zoomIncrement ** zoomFactor).toString()}km.`;

      // Scale the grid to match the zoom factor, that is to say,
      // scale it by zoom Increment raised to the power of zoom Factor
      grid.scale.set(
        settings.zoomIncrement ** zoomFactor,
        settings.zoomIncrement ** zoomFactor,
        settings.zoomIncrement ** zoomFactor,
      );
      const { target } = controls;

      grid.position.x = (settings.zoomIncrement ** zoomFactor)
          * Math.floor(target.x / (settings.zoomIncrement ** zoomFactor));
      grid.position.y = 0;
      grid.position.z = (settings.zoomIncrement ** zoomFactor)
          * Math.floor(target.z / (settings.zoomIncrement ** zoomFactor));

      uniforms.scale.value = settings.zoomIncrement ** zoomFactor;
      uniforms.control.value = controls.target.clone().sub(grid.position);

      // Update controls system each frame to prevent issues when moving camera or resizing window
      controls.update();

      // Render this frame.
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      this.width = this.$el.clientWidth;
      this.height = this.$el.clientHeight;
      renderer.setSize(this.width, this.height);
    };

    // noinspection JSUnresolvedFunction
    new ResizeObserver(onResize).observe(this.$el);
  },
};
</script>

<style scoped></style>
