// 3D part of the portfolio (Three.js):
//  1) background scene: floating shapes + particles that react to the mouse and scroll
//  2) avatar stage: loads the Blender avatar (assets/models/avatar.glb) with Idle/Wave animations.
//     If the GLB is missing, a placeholder avatar built from simple shapes is shown.

let THREE, GLTFLoader, OrbitControls;
try {
  THREE = await import("three");
  ({ GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js"));
  ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
} catch (e) {
  console.warn("Three.js could not be loaded (offline?). 3D features disabled.", e);
  const stage = document.getElementById("avatar-stage");
  if (stage) stage.innerHTML = '<div style="height:100%;display:grid;place-items:center;font-size:8rem">🧑‍💻</div>';
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0 }; // -1..1
addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
}, { passive: true });

const isLight = () => document.documentElement.dataset.theme === "light";
const palette = () => (isLight()
  ? { a: 0x6544f5, b: 0x0891b2, c: 0xf472b6, particles: 0x6544f5 }
  : { a: 0x7c5cff, b: 0x22d3ee, c: 0xf472b6, particles: 0xffffff });

if (THREE) {
  initBackground();
  initAvatar();
}

/* =========================================================== BACKGROUND */
function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 12;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(5, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x22d3ee, 30, 30);
  rim.position.set(-6, -3, 4);
  scene.add(rim);

  // floating shapes
  const geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusKnotGeometry(0.7, 0.22, 100, 16),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.8, 0.25, 16, 50),
    new THREE.DodecahedronGeometry(0.9, 0),
    new THREE.TetrahedronGeometry(1, 0),
  ];
  const spots = [[-8, 4, -3], [8, 3, -4], [-7, -4, -2], [7.5, -3.5, -3], [0, 6, -7], [-2, -6, -6], [3, 1, -9], [-9.5, 0, -6]];
  const shapes = spots.map((pos, i) => {
    const p = palette();
    const mat = new THREE.MeshStandardMaterial({
      color: [p.a, p.b, p.c][i % 3], metalness: 0.35, roughness: 0.25, flatShading: true,
      transparent: true, opacity: 0.85,
    });
    const m = new THREE.Mesh(geos[i % geos.length], mat);
    m.position.set(...pos);
    m.userData = { base: new THREE.Vector3(...pos), speed: 0.2 + Math.random() * 0.4, phase: Math.random() * 6, spin: 0, scale: 1, colorIndex: i % 3 };
    m.scale.setScalar(0.8 + Math.random() * 0.5);
    m.userData.baseScale = m.scale.x;
    scene.add(m);
    return m;
  });

  // particles
  const count = innerWidth < 760 ? 400 : 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.05, color: palette().particles, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(pgeo, pmat);
  scene.add(particles);

  // hover (grow) and click (spin) using a raycaster, even though the canvas is behind the page
  const ray = new THREE.Raycaster();
  let hovered = null;
  addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, textarea, select, label, video, .card, #avatar-stage, .chat-panel")) return;
    if (hovered) hovered.userData.spin = 12;
  });

  document.addEventListener("themechange", () => {
    const p = palette();
    shapes.forEach((m) => m.material.color.setHex([p.a, p.b, p.c][m.userData.colorIndex]));
    pmat.color.setHex(p.particles);
  });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    // on small screens pull shapes closer to the centre so they stay visible
    const k = innerWidth < 760 ? 0.55 : 1;
    shapes.forEach((m) => (m.position.x = m.userData.base.x * k));
  }
  addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const scroll = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1);

    // camera parallax with mouse + scroll
    camera.position.x += (pointer.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 1.0 - scroll * 4 - camera.position.y) * 0.04;
    camera.lookAt(0, -scroll * 4, 0);

    ray.setFromCamera(pointer, camera);
    hovered = ray.intersectObjects(shapes, false)[0]?.object || null;

    shapes.forEach((m) => {
      const d = m.userData;
      const motion = reducedMotion ? 0.2 : 1;
      m.position.y = d.base.y + Math.sin(t * d.speed + d.phase) * 0.6 * motion;
      d.spin *= 0.95;
      m.rotation.x += (0.003 + d.spin * dt * 0.2) * motion;
      m.rotation.y += (0.005 + d.spin * dt * 0.3) * motion + scroll * 0.0005;
      const target = d.baseScale * (m === hovered ? 1.35 : 1);
      m.scale.setScalar(m.scale.x + (target - m.scale.x) * 0.1);
      m.material.emissive?.setHex(m === hovered ? 0x222244 : 0x000000);
    });
    particles.rotation.y = t * 0.02 + pointer.x * 0.05;
    particles.rotation.x = pointer.y * 0.05;

    renderer.render(scene, camera);
  });
}

/* =========================================================== AVATAR */
function initAvatar() {
  const stage = document.getElementById("avatar-stage");
  if (!stage) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.4, 6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.05, 0);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI / 3;
  controls.maxPolarAngle = Math.PI / 1.9;
  controls.autoRotate = false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rimA = new THREE.PointLight(0x7c5cff, 25, 12);
  rimA.position.set(-3, 2.5, -2);
  scene.add(rimA);
  const rimB = new THREE.PointLight(0x22d3ee, 20, 12);
  rimB.position.set(3, 1, -2);
  scene.add(rimB);

  // glowing platform
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.2, 0.12, 64),
    new THREE.MeshStandardMaterial({ color: 0x1b1b2e, metalness: 0.6, roughness: 0.3 }),
  );
  platform.position.y = -0.06;
  platform.receiveShadow = true;
  scene.add(platform);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.025, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
  );
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  let avatar = null;     // THREE.Object3D
  let mixer = null;      // for GLB animations
  let actions = {};      // { idle, wave }
  let head = null;       // bone or mesh that looks at the mouse
  let headRest = null;   // rest rotation of the head (so mouse-follow never accumulates)
  let placeholder = null;
  let waveUntil = 0;
  const clock = new THREE.Clock();

  new GLTFLoader().load(
    "/assets/models/avatar.glb",
    (gltf) => {
      avatar = gltf.scene;
      // fit to ~2 units tall, feet on the platform
      const box = new THREE.Box3().setFromObject(avatar);
      const size = box.getSize(new THREE.Vector3());
      const s = 2 / (size.y || 1);
      avatar.scale.setScalar(s);
      box.setFromObject(avatar);
      const c = box.getCenter(new THREE.Vector3());
      avatar.position.x -= c.x;
      avatar.position.z -= c.z;
      avatar.position.y -= box.min.y;
      avatar.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(avatar);

      head = avatar.getObjectByName("Head") || findByName(avatar, /head/i);
      headRest = head ? head.quaternion.clone() : null;
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(avatar);
        const idle = gltf.animations.find((a) => /idle/i.test(a.name)) || gltf.animations[0];
        const wave = gltf.animations.find((a) => /wave|hello|greet/i.test(a.name));
        actions.idle = mixer.clipAction(idle).play();
        if (wave) {
          actions.wave = mixer.clipAction(wave);
          actions.wave.setLoop(THREE.LoopOnce, 1);
          actions.wave.clampWhenFinished = false;
          mixer.addEventListener("finished", (e) => {
            if (e.action === actions.wave) actions.idle.reset().fadeIn(0.3).play();
          });
        }
      }
      setTimeout(wave, 900); // greet visitors
    },
    undefined,
    () => {
      // GLB not found yet -> placeholder avatar
      placeholder = buildPlaceholder();
      avatar = placeholder.root;
      head = placeholder.head;
      scene.add(avatar);
      setTimeout(wave, 900);
    },
  );

  function findByName(root, re) {
    let found = null;
    root.traverse((o) => { if (!found && re.test(o.name)) found = o; });
    return found;
  }

  function wave() {
    if (actions.wave) {
      actions.idle?.fadeOut(0.25);
      actions.wave.reset().fadeIn(0.25).play();
    } else {
      waveUntil = clock.elapsedTime + 2.2;
    }
  }
  document.addEventListener("avatar:wave", wave);
  document.addEventListener("avatar:talk", () => { if (!actions.wave) waveUntil = clock.elapsedTime + 1.2; });

  // click (without dragging) = wave
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) wave();
    down = null;
  });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // only render while visible (saves battery)
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(stage);

  const look = new THREE.Quaternion();
  const euler = new THREE.Euler();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!visible) return;

    if (head && headRest) head.quaternion.copy(headRest);
    mixer?.update(dt);
    if (placeholder) animatePlaceholder(placeholder, t, t < waveUntil);
    else if (avatar && !mixer) avatar.rotation.y = Math.sin(t * 0.6) * 0.15;

    // head follows the mouse (applied on top of the animation)
    if (head) {
      euler.set(-pointer.y * 0.35, pointer.x * 0.6, 0);
      look.setFromEuler(euler);
      if (placeholder) head.quaternion.slerp(look, 0.1);
      else head.quaternion.multiply(look);
    }
    ring.material.color.setHSL((0.52 + Math.sin(t * 0.5) * 0.08) % 1, 0.9, 0.55);
    controls.update();
    renderer.render(scene, camera);
  });
}

/* ----- placeholder avatar (used until you export your own avatar.glb from Blender) ----- */
function buildPlaceholder() {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
  const hoodie = new THREE.MeshStandardMaterial({ color: 0x7c5cff, roughness: 0.5 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x23233a, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1110, roughness: 0.8 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const mesh = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  };

  const body = new THREE.Group();
  root.add(body);
  body.add(mesh(new THREE.CapsuleGeometry(0.36, 0.55, 8, 16), hoodie, 0, 1.12, 0));
  // legs
  for (const x of [-0.16, 0.16]) {
    body.add(mesh(new THREE.CapsuleGeometry(0.13, 0.55, 6, 12), pants, x, 0.45, 0));
    body.add(mesh(new THREE.BoxGeometry(0.22, 0.12, 0.36), shoe, x, 0.06, 0.05));
  }
  // head
  const head = new THREE.Group();
  head.position.set(0, 1.72, 0);
  head.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.14, 12), skin, 0, -0.18, 0));
  head.add(mesh(new THREE.SphereGeometry(0.3, 32, 24), skin, 0, 0.08, 0));
  const hair = mesh(new THREE.SphereGeometry(0.315, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), dark, 0, 0.12, -0.02);
  hair.scale.set(1, 0.8, 1);
  head.add(hair);
  for (const x of [-0.1, 0.1]) {
    head.add(mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }), x, 0.1, 0.26));
    head.add(mesh(new THREE.SphereGeometry(0.025, 12, 8), dark, x, 0.1, 0.3));
  }
  const smile = mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 20, Math.PI), dark, 0, -0.02, 0.27);
  smile.rotation.z = Math.PI;
  head.add(smile);
  body.add(head);
  // arms (pivot at the shoulder so they can rotate)
  const arms = {};
  for (const [side, x] of [["left", -0.47], ["right", 0.47]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.45, 0);
    pivot.add(mesh(new THREE.CapsuleGeometry(0.1, 0.5, 6, 12), hoodie, 0, -0.32, 0));
    pivot.add(mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, 0, -0.68, 0));
    body.add(pivot);
    arms[side] = pivot;
  }
  return { root, body, head, arms };
}

function animatePlaceholder(p, t, waving) {
  const m = reducedMotion ? 0.3 : 1;
  p.body.position.y = Math.sin(t * 2) * 0.02 * m;
  p.body.rotation.y = Math.sin(t * 0.6) * 0.12 * m;
  p.arms.left.rotation.z = -0.12 + Math.sin(t * 2) * 0.03 * m;
  const target = waving ? 2.7 + Math.sin(t * 12) * 0.35 : 0.12 - Math.sin(t * 2) * 0.03 * m;
  p.arms.right.rotation.z += (target - p.arms.right.rotation.z) * 0.18;
}
