import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer)); // Přidání VR tlačítka
renderer.xr.enabled = true; // Povolení WebXR

const controls = new OrbitControls(camera, renderer.domElement);

// Ambientní světlo
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
scene.add(ambientLight);

// Lampa za křečkem
const lamp = new THREE.SpotLight(0xFFFFFF, 500);
lamp.position.set(0, 5, 5);
lamp.angle = Math.PI / 6;
lamp.penumbra = 0.3;
lamp.decay = 2;
lamp.distance = 1000;
lamp.target.position.set(0, 0, 0);
scene.add(lamp);
scene.add(lamp.target);

const lampGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
const lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);
lampMesh.position.copy(lamp.position);
scene.add(lampMesh);

camera.position.z = 5;

const loader = new GLTFLoader();

loader.load(
  'scena.glb',
  function (gltf) {
    const mainScene = gltf.scene;
    mainScene.scale.set(20, 20, 20);
    mainScene.position.set(0, -10, 0);
    scene.add(mainScene);
    console.log('Hlavní scéna přidána a zvětšena:', mainScene);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% načteno');
  },
  function (error) {
    console.log('Chyba při načítání:', error);
  }
);

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

class Strom {
  constructor(x, z) {
    this.x = x;
    this.z = z;
    this.strom = null;

    this.spawnStrom();
  }

  spawnStrom() {
    loader.load(
      'strom.glb',
      (gltf) => {
        const strom = gltf.scene;
        strom.position.set(this.x, -5, this.z);
        strom.scale.set(1.5, 1.5, 1.5);
        scene.add(strom);
        this.strom = strom;
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% načteno strom');
      },
      (error) => {
        console.log('Chyba při načítání stromu:', error);
      }
    );
  }
}

function spawnStromyAroundScene(numberOfTrees, radius) {
  for (let i = 0; i < numberOfTrees; i++) {
    const angle = (i / numberOfTrees) * 2 * Math.PI;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    new Strom(x, z);
  }
}

spawnStromyAroundScene(20, 15);

renderer.setAnimationLoop(function () {
  renderer.render(scene, camera);
});
