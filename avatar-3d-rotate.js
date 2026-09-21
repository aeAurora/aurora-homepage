import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js';

const stage = document.getElementById('avatarStage');
const viewport = document.getElementById('avatarOrbit');
const canvas = document.getElementById('avatar3dCanvas');
const loading = document.getElementById('avatarLoading');
const status = document.getElementById('avatarStatus');
const sizeControl = document.getElementById('avatarSize');
const sizeValue = document.getElementById('avatarSizeValue');
const sizeReset = document.getElementById('avatarSizeReset');
const controls = stage ? Array.from(stage.querySelectorAll('[data-avatar-action]')) : [];

if (stage && viewport && canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 1000);
  const clock = new THREE.Clock();
  const actions = new Map();
  const FRONT_ROTATION_Y = Math.PI * 1.5;
  let mixer = null;
  let currentAction = null;
  let modelPivot = null;
  let ready = false;
  let statusTimer = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartRotation = FRONT_ROTATION_Y;
  let targetRotationY = FRONT_ROTATION_Y;
  let currentRotationY = FRONT_ROTATION_Y;
  let frameRequest = 0;
  let lastFrameTime = 0;
  let stageVisible = true;
  let pageVisible = !document.hidden;
  let forceRender = true;
  let avatarScale = 1;

  scene.add(new THREE.HemisphereLight(0xe9f7ff, 0x24172f, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
  keyLight.position.set(4, 7, 6);
  scene.add(keyLight);
  const cyanLight = new THREE.DirectionalLight(0x72e4e0, 2.0);
  cyanLight.position.set(-5, 2, 3);
  scene.add(cyanLight);
  const pinkLight = new THREE.DirectionalLight(0xef8fc5, 1.6);
  pinkLight.position.set(4, 1, -3);
  scene.add(pinkLight);

  function showStatus(text, persistent = false) {
    if (!status) return;
    window.clearTimeout(statusTimer);
    status.textContent = text;
    status.classList.add('show');
    if (!persistent) statusTimer = window.setTimeout(() => status.classList.remove('show'), 1600);
  }

  function resize() {
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    forceRender = true;
    requestRender();
  }

  function frameModel(object) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * camera.aspect);
    const fitHeightDistance = size.y / (2 * Math.tan(verticalFov * 0.5));
    const fitWidthDistance = size.x / (2 * Math.tan(horizontalFov * 0.5));
    const distance = Math.max(fitHeightDistance, fitWidthDistance, size.z * 1.5) * 1.08;
    object.position.sub(center);
    camera.position.set(0, size.y * 0.03, distance);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = distance * 100;
    camera.lookAt(0, size.y * 0.02, 0);
    camera.updateProjectionMatrix();
  }

  function applyAvatarScale(value, announce = false) {
    avatarScale = THREE.MathUtils.clamp(Number(value) / 100, 0.75, 1.3);
    if (modelPivot) modelPivot.scale.setScalar(avatarScale);
    if (sizeValue) sizeValue.value = `${Math.round(avatarScale * 100)}%`;
    if (sizeControl) sizeControl.value = String(Math.round(avatarScale * 100));
    forceRender = true;
    requestRender();
    if (announce) showStatus(document.documentElement.lang === 'en' ? `Avatar size: ${Math.round(avatarScale * 100)}%` : `人物大小：${Math.round(avatarScale * 100)}%`);
  }

  if (sizeControl) {
    sizeControl.addEventListener('input', () => applyAvatarScale(sizeControl.value));
    sizeControl.addEventListener('change', () => applyAvatarScale(sizeControl.value, true));
  }
  if (sizeReset) sizeReset.addEventListener('click', () => applyAvatarScale(100, true));

  function playClip(name, label) {
    if (!ready || !mixer) {
      showStatus('3D 模型仍在加载，请稍候', true);
      return;
    }
    const next = actions.get(name);
    if (!next) {
      showStatus(`未找到动作：${name}`);
      return;
    }
    if (currentAction && currentAction !== next) currentAction.fadeOut(0.22);
    next.reset();
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    next.fadeIn(0.22).play();
    currentAction = next;
    requestRender();
    controls.forEach((button) => button.classList.toggle('is-active', button.dataset.avatarAction === name));
    showStatus(document.documentElement.lang === 'en' ? (label || name) : `正在播放：${label || name}`, true);
  }

  controls.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopImmediatePropagation();
      playClip(button.dataset.avatarAction, document.documentElement.lang === 'en' ? button.dataset.labelEn : button.dataset.label);
    });
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!ready || event.button !== 0) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartRotation = targetRotationY;
    canvas.setPointerCapture(event.pointerId);
    stage.classList.add('is-rotating');
    requestRender();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (dragging) {
      targetRotationY = dragStartRotation + (event.clientX - dragStartX) * 0.012;
      requestRender();
    }
  });
  function finishRotation(event) {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    stage.classList.remove('is-rotating');
    showStatus(document.documentElement.lang === 'en' ? 'Drag to rotate · Double-click for front view' : '拖动可旋转 · 双击恢复正脸');
  }
  canvas.addEventListener('pointerup', finishRotation);
  canvas.addEventListener('pointercancel', finishRotation);
  canvas.addEventListener('dblclick', () => {
    targetRotationY = FRONT_ROTATION_Y;
    requestRender();
    showStatus(document.documentElement.lang === 'en' ? 'Front view restored' : '已恢复正脸方向');
  });

  new GLTFLoader().load(
    'assets/aurora-new-lite.glb',
    (gltf) => {
      const model = gltf.scene;
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.frustumCulled = false;
        if (node.material) {
          node.material.metalness = Math.min(node.material.metalness || 0, 0.35);
          node.material.needsUpdate = true;
        }
      });
      modelPivot = new THREE.Group();
      modelPivot.rotation.y = FRONT_ROTATION_Y;
      modelPivot.scale.setScalar(avatarScale);
      modelPivot.add(model);
      scene.add(modelPivot);
      frameModel(model);

      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => actions.set(clip.name, mixer.clipAction(clip)));
      mixer.addEventListener('finished', (event) => {
        if (event.action !== currentAction) return;
        controls.forEach((button) => button.classList.remove('is-active'));
        forceRender = true;
        showStatus(document.documentElement.lang === 'en' ? 'Ready · choose another action' : '动作完成 · 可选择其他动作');
      });
      ready = true;
      stage.classList.add('model-ready');
      if (loading) loading.classList.add('is-hidden');
      showStatus(document.documentElement.lang === 'en' ? 'Ready · drag to rotate' : '3D 形象已就绪 · 拖动可旋转');
      resize();
    },
    (event) => {
      if (!event.lengthComputable || !loading) return;
      const percent = Math.min(100, Math.round(event.loaded / event.total * 100));
      const text = loading.querySelector('b');
      if (text) text.textContent = `正在加载 3D 形象… ${percent}%`;
      if (status) status.textContent = `模型加载 ${percent}%`;
    },
    (error) => {
      console.error('Unable to load Aurora 3D avatar:', error);
      stage.classList.add('model-error');
      const text = loading && loading.querySelector('b');
      if (text) text.textContent = '3D 形象加载失败，请刷新重试';
      showStatus(document.documentElement.lang === 'en' ? 'Unable to load 3D avatar' : '3D 形象加载失败', true);
    }
  );

  new ResizeObserver(resize).observe(viewport);

  function renderFrame(now) {
    frameRequest = 0;
    if (!stageVisible || !pageVisible) {
      lastFrameTime = 0;
      return;
    }

    const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0;
    lastFrameTime = now;
    if (mixer && delta) mixer.update(delta);

    if (modelPivot) {
      currentRotationY += (targetRotationY - currentRotationY) * Math.min(1, delta * 12);
      if (Math.abs(targetRotationY - currentRotationY) <= 0.0005) currentRotationY = targetRotationY;
      modelPivot.rotation.y = currentRotationY;
    }

    renderer.render(scene, camera);
    forceRender = false;

    const actionRunning = Boolean(currentAction && currentAction.isRunning());
    const rotationSettling = Math.abs(targetRotationY - currentRotationY) > 0.0005;
    if (dragging || actionRunning || rotationSettling) {
      frameRequest = requestAnimationFrame(renderFrame);
    } else {
      lastFrameTime = 0;
    }
  }

  function requestRender() {
    forceRender = true;
    if (!frameRequest && stageVisible && pageVisible) frameRequest = requestAnimationFrame(renderFrame);
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    stageVisible = Boolean(entries[0] && entries[0].isIntersecting);
    if (stageVisible) {
      clock.getDelta();
      requestRender();
    } else if (frameRequest) {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      lastFrameTime = 0;
    }
  }, { rootMargin: '100px 0px', threshold: 0 });
  visibilityObserver.observe(stage);

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) {
      clock.getDelta();
      requestRender();
    } else if (frameRequest) {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      lastFrameTime = 0;
    }
  });

  resize();
  requestRender();
}
