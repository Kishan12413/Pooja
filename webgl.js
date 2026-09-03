/* =========================================================
   HERO WEBGL — "The Kinetic Spine"
   A particle column tracing a spinal sine-curve, coloured on a
   gradient from turmeric gold (physiotherapy / energy) to sage
   green (Ayurveda / herb), with soft ambient dust particles.
   Built with three.js r128. Respects prefers-reduced-motion.
   ========================================================= */

(function () {
  const canvas = document.getElementById('spineCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    canvas.clientWidth / canvas.clientHeight || window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function sizeRenderer() {
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  sizeRenderer();

  /* ---------- Colour ramp: turmeric -> cream -> sage ---------- */
  const colA = new THREE.Color(0xd9a441); // turmeric
  const colB = new THREE.Color(0xf3ecdd); // cream
  const colC = new THREE.Color(0x7c8f63); // sage

  function rampColor(t) {
    if (t < 0.5) return colA.clone().lerp(colB, t / 0.5);
    return colB.clone().lerp(colC, (t - 0.5) / 0.5);
  }

  /* ---------- Spine particles: sine curve of vertebrae ---------- */
  const SPINE_COUNT = 260;
  const spineGeo = new THREE.BufferGeometry();
  const spinePos = new Float32Array(SPINE_COUNT * 3);
  const spineCol = new Float32Array(SPINE_COUNT * 3);
  const spineBase = []; // store base positions for animation

  for (let i = 0; i < SPINE_COUNT; i++) {
    const t = i / (SPINE_COUNT - 1); // 0..1 head to base
    const y = 3.6 - t * 7.2;
    const curve = Math.sin(t * Math.PI * 2.1) * 0.9;
    const jitter = (Math.random() - 0.5) * 0.35;
    const x = curve + jitter;
    const z = Math.cos(t * Math.PI * 2.1) * 0.5 + (Math.random() - 0.5) * 0.35;

    spineBase.push({ x, y, z, t });
    spinePos[i * 3] = x;
    spinePos[i * 3 + 1] = y;
    spinePos[i * 3 + 2] = z;

    const c = rampColor(t);
    spineCol[i * 3] = c.r;
    spineCol[i * 3 + 1] = c.g;
    spineCol[i * 3 + 2] = c.b;
  }

  spineGeo.setAttribute('position', new THREE.BufferAttribute(spinePos, 3));
  spineGeo.setAttribute('color', new THREE.BufferAttribute(spineCol, 3));

  const spineMat = new THREE.PointsMaterial({
    size: 0.075,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    depthWrite: false
  });

  const spinePoints = new THREE.Points(spineGeo, spineMat);
  scene.add(spinePoints);

  /* ---------- Ambient dust particles ---------- */
  const DUST_COUNT = 180;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST_COUNT * 3);
  const dustCol = new Float32Array(DUST_COUNT * 3);
  const dustSpeed = [];

  for (let i = 0; i < DUST_COUNT; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 12;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    const c = rampColor(Math.random());
    dustCol[i * 3] = c.r;
    dustCol[i * 3 + 1] = c.g;
    dustCol[i * 3 + 2] = c.b;
    dustSpeed.push(0.05 + Math.random() * 0.1);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    depthWrite: false
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  /* ---------- Connecting spine "vertebrae" line (faint) ---------- */
  const linePts = spineBase
    .filter((_, i) => i % 6 === 0)
    .map((p) => new THREE.Vector3(p.x, p.y, p.z));
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xd9a441,
    transparent: true,
    opacity: 0.18
  });
  const spineLine = new THREE.Line(lineGeo, lineMat);
  scene.add(spineLine);

  /* ---------- Interaction: gentle mouse parallax ---------- */
  let targetRotY = 0;
  let targetRotX = 0;
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY = nx * 0.35;
    targetRotX = ny * 0.15;
  });

  /* ---------- Animate ---------- */
  const clock = new THREE.Clock();
  const group = new THREE.Group();
  group.add(spinePoints, dustPoints, spineLine);
  scene.add(group);

  let currentRotY = 0;
  let currentRotX = 0;

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (!reduceMotion) {
      // Breathing motion along the spine (subtle wave)
      const pos = spineGeo.attributes.position;
      for (let i = 0; i < SPINE_COUNT; i++) {
        const b = spineBase[i];
        const wave = Math.sin(elapsed * 0.6 + b.t * 6) * 0.06;
        pos.setX(i, b.x + wave);
        pos.setZ(i, b.z + Math.cos(elapsed * 0.5 + b.t * 5) * 0.05);
      }
      pos.needsUpdate = true;

      // Drifting dust
      const dpos = dustGeo.attributes.position;
      for (let i = 0; i < DUST_COUNT; i++) {
        let y = dpos.getY(i) + dustSpeed[i] * 0.01;
        if (y > 5.2) y = -5.2;
        dpos.setY(i, y);
      }
      dpos.needsUpdate = true;

      currentRotY += (targetRotY - currentRotY) * 0.03;
      currentRotX += (targetRotX - currentRotX) * 0.03;
      group.rotation.y = 0.15 * Math.sin(elapsed * 0.15) + currentRotY;
      group.rotation.x = currentRotX;
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', sizeRenderer);
})();
