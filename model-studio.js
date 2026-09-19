import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector('#modelCanvas');
const viewport = document.querySelector('#viewport');
const panel = document.querySelector('#viewerPanel');
const loading = document.querySelector('#modelLoading');
const progress = document.querySelector('#loadingProgress');
const errorBox = document.querySelector('#viewerError');
const stats = document.querySelector('#modelStats');
const resetButton = document.querySelector('#resetView');
const fullscreenButton = document.querySelector('#toggleFullscreen');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050911);
scene.fog = new THREE.FogExp2(0x050911, 0.018);

const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 5000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xcceeff, 0x15101b, 2.1));
const key = new THREE.DirectionalLight(0xdaf7ff, 3.5);
key.position.set(4, 7, 6);
key.castShadow = true;
scene.add(key);
const rim = new THREE.DirectionalLight(0xff8fd1, 2.5);
rim.position.set(-5, 3, -4);
scene.add(rim);
const fill = new THREE.PointLight(0x7ee7ff, 2.4, 0, 2);
fill.position.set(0, -1, 5);
scene.add(fill);

const grid = new THREE.GridHelper(40, 40, 0x4a8292, 0x162934);
scene.add(grid);
const axes = new THREE.AxesHelper(2.2);
scene.add(axes);

const orbit = {
  target: new THREE.Vector3(),
  radius: 8,
  theta: Math.PI * 0.22,
  phi: Math.PI * 0.42,
  minRadius: 1,
  maxRadius: 40,
  initial: null
};
let model = null;
let modelSize = 4;
let renderRequested = false;
const pointers = new Map();
let lastPinchDistance = 0;

function requestRender() {
  if (renderRequested) return;
  renderRequested = true;
  requestAnimationFrame(() => {
    renderRequested = false;
    renderer.render(scene, camera);
  });
}

function updateCamera() {
  orbit.phi = THREE.MathUtils.clamp(orbit.phi, 0.035, Math.PI - 0.035);
  orbit.radius = THREE.MathUtils.clamp(orbit.radius, orbit.minRadius, orbit.maxRadius);
  const sinPhi = Math.sin(orbit.phi);
  camera.position.set(
    orbit.target.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
    orbit.target.y + orbit.radius * Math.cos(orbit.phi),
    orbit.target.z + orbit.radius * sinPhi * Math.cos(orbit.theta)
  );
  camera.lookAt(orbit.target);
  requestRender();
}

function resize() {
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  requestRender();
}

function fitModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  modelSize = Math.max(size.x, size.y, size.z) || 1;
  object.position.sub(center);
  object.updateMatrixWorld(true);

  orbit.target.set(0, 0, 0);
  orbit.radius = modelSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.35;
  orbit.minRadius = Math.max(modelSize * 0.18, 0.05);
  orbit.maxRadius = Math.max(modelSize * 8, orbit.radius * 3);
  camera.near = Math.max(modelSize / 1000, 0.001);
  camera.far = Math.max(modelSize * 100, 100);
  camera.updateProjectionMatrix();

  grid.scale.setScalar(Math.max(modelSize / 10, 0.1));
  grid.position.y = -size.y * 0.5;
  axes.scale.setScalar(Math.max(modelSize / 8, 0.1));
  axes.position.set(-size.x * 0.55, -size.y * 0.5, size.z * 0.55);
  orbit.initial = { radius: orbit.radius, theta: Math.PI * 0.22, phi: Math.PI * 0.42 };
  resetView();
}

function resetView() {
  if (!orbit.initial) return;
  orbit.radius = orbit.initial.radius;
  orbit.theta = orbit.initial.theta;
  orbit.phi = orbit.initial.phi;
  updateCamera();
}

function countTriangles(object) {
  let triangles = 0;
  object.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const geometry = child.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : (geometry.attributes.position?.count || 0) / 3;
  });
  return Math.round(triangles);
}

new GLTFLoader().load(
  './assets/model-01.glb',
  (gltf) => {
    model = gltf.scene;
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (Array.isArray(child.material)) child.material.forEach((material) => { material.needsUpdate = true; });
      else if (child.material) child.material.needsUpdate = true;
    });
    scene.add(model);
    fitModel(model);
    stats.textContent = `${countTriangles(model).toLocaleString()} TRIANGLES / READY`;
    loading.classList.add('is-hidden');
    requestRender();
  },
  (event) => {
    if (!event.total) {
      progress.textContent = '读取中';
      return;
    }
    progress.textContent = `${Math.min(100, Math.round(event.loaded / event.total * 100))}%`;
  },
  (error) => {
    console.error('模型 1 加载失败：', error);
    loading.classList.add('is-hidden');
    errorBox.hidden = false;
    stats.textContent = 'LOAD ERROR';
  }
);

viewport.addEventListener('pointerdown', (event) => {
  viewport.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    lastPinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
viewport.addEventListener('pointermove', (event) => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 1) {
    orbit.theta -= (event.clientX - previous.x) * 0.008;
    orbit.phi -= (event.clientY - previous.y) * 0.008;
    updateCamera();
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastPinchDistance > 0) orbit.radius *= lastPinchDistance / Math.max(distance, 1);
    lastPinchDistance = distance;
    updateCamera();
  }
});
function releasePointer(event) {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) lastPinchDistance = 0;
}
viewport.addEventListener('pointerup', releasePointer);
viewport.addEventListener('pointercancel', releasePointer);
viewport.addEventListener('wheel', (event) => {
  event.preventDefault();
  orbit.radius *= Math.exp(event.deltaY * 0.0012);
  updateCamera();
}, { passive: false });
viewport.addEventListener('dblclick', resetView);
resetButton.addEventListener('click', resetView);
fullscreenButton.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await panel.requestFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement ? '退出全屏' : '全屏';
  resize();
});
new ResizeObserver(resize).observe(viewport);
window.addEventListener('orientationchange', resize);
resize();
updateCamera();
