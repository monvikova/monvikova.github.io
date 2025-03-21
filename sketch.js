import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();

// Zmenšení celé scény na polovinu
scene.scale.set(0.5, 0.5, 0.5);

// Posunutí celé scény mírně nahoru
scene.position.set(0, -1, 0); // Posun dolu

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
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

// Načtení modelů pomocí GLTFLoader
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

// Třída Strom
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
        strom.position.set(this.x, -5, this.z); // Stromy umístěné níže (y = -5)
        strom.scale.set(1.5, 1.5, 1.5); // Velikost stromu
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

// Funkce na rozmístění stromů kolem modelu `scena.glb`
function spawnStromyAroundScene(numberOfTrees, radius) {
  for (let i = 0; i < numberOfTrees; i++) {
    const angle = (i / numberOfTrees) * 2 * Math.PI; // Rovnoměrné rozložení stromů v kruhu
    const x = Math.cos(angle) * radius; // Souřadnice X
    const z = Math.sin(angle) * radius; // Souřadnice Z

    new Strom(x, z); // Přidání stromu na vypočítanou pozici
  }
}

// Třída Duch
class Duch {
  constructor(x, y, z, scale) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.scale = scale;
    this.duch = null;
    this.spawnInterval = 10000;
    this.startAnimation();
  }

  startAnimation() {
    setInterval(() => {
      this.spawnDuch();
    }, this.spawnInterval);
  }

  spawnDuch() {
    loader.load(
      'duch.glb',
      (gltf) => {
        if (this.duch) {
          scene.remove(this.duch);
        }
        const duch = gltf.scene;
        duch.position.set(this.x, this.y, this.z);
        duch.scale.set(this.scale, this.scale, this.scale);
        duch.rotation.y = -Math.PI / 2;

        duch.traverse((node) => {
          if (node.isMesh) {
            node.material.transparent = true;
            node.material.opacity = 0.5;
          }
        });

        this.duch = duch;
        scene.add(duch);
        this.playSound();
        this.animateDuch(duch);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% načteno duch');
      },
      (error) => {
        console.log('Chyba při načítání ducha:', error);
      }
    );
  }

  playSound() {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('smich.mp3', (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(1);
      sound.play();
      console.log('Zvuk přehrán: smich.mp3');
    });
  }

  animateDuch(duch) {
    const duration = 5000;
    const targetY = 10;
    const startY = this.y;
    const startTime = performance.now();

    const update = (time) => {
      const elapsedTime = time - startTime;
      const t = elapsedTime / duration;

      if (t < 1) {
        const currentY = startY + t * (targetY - startY);
        duch.position.y = currentY;
        requestAnimationFrame(update);
      } else {
        scene.remove(duch);
        console.log('Duch zmizel.');
      }
    };

    requestAnimationFrame(update);
  }
}

// Třída Křeček
class Krecek {
  constructor(position, rotation) {
    this.position = position;
    this.rotation = rotation;
    this.object = null;

    loader.load(
      'krecek.gltf',
      (gltf) => {
        const krecek = gltf.scene;
        krecek.position.set(this.position.x, this.position.y - 1, this.position.z);
        krecek.scale.set(0.3, 0.3, 0.3);
        krecek.rotation.y = this.rotation;

        krecek.traverse((node) => {
          if (node.isMesh) {
            node.material.transparent = true;
            node.material.opacity = 0.3;
          }
        });

        this.object = krecek;
        scene.add(krecek);
        console.log('Nový křeček přidán:', krecek);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% načteno křeček');
      },
      (error) => {
        console.log('Chyba při načítání křečka:', error);
      }
    );
  }

  updateMovement() {
    if (this.object) {
      this.object.position.x -= Math.sin(this.object.rotation.y) * 0.05;
      this.object.position.z -= Math.cos(this.object.rotation.y) * 0.05;

      const distanceFromCenter = Math.sqrt(
        Math.pow(this.object.position.x, 2) + Math.pow(this.object.position.z, 2)
      );

      if (distanceFromCenter > 10) {
        this.object.rotation.y = randomRange(0, 2 * Math.PI);
      }
    }
  }
}

// Spawnování více křečků
const maxKrecku = 10;
const krecekObjects = [];

function spawnKrecky() {
  for (let i = 0; i < maxKrecku; i++) {
    const position = {
      x: randomRange(-8, 5),
      y: -1,
      z: randomRange(-5, 5),
    };
    const rotation = randomRange(0, 2 * Math.PI);
    const krecek = new Krecek(position, rotation);
    krecekObjects.push(krecek);
  }
}

// Aktualizace pohybu všech křečků
function updateAllKrecekMovement() {
  krecekObjects.forEach((krecek) => krecek.updateMovement());
}

// Spuštění spawnování
const duchInstance = new Duch(0, -5, -3, 0.8); // Přidání ducha
spawnStromyAroundScene(20, 15); // Rozmístění 20 stromů blízko modelu `scena.glb`
spawnKrecky(); // Spawnování křečků

function animate() {
  updateAllKrecekMovement(); // Aktualizace pohybu křečků
  renderer.render(scene, camera); // Vykreslení scény
}

