import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";

const CONFIG_URL = "config.yaml";

const defaultConfig = {
  drawfps: false,
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    positionZ: 2.67,
  },
  renderer: {
    alpha: true,
    antialias: true,
    pixelRatioCap: 2,
  },
  shader: {
    timeIncrement: 0.01,
    glitchTriggerThreshold: 0.99,
    glitchNoiseSpeed: 8.0,
    glitchStrengthNoiseSpeed: 12.0,
    glitchStrengthVariation: 0.3,
    glitchStrengthBase: 0.3,
    blockDensity: 30.0,
    blockTriggerThreshold: 0.97,
    blockNoiseSpeed: 4.0,
    glitchOffsetRangeX: 0.08,
    glitchOffsetRangeY: 0.04,
    blockOffsetRangeX: 0.12,
    waveFrequency: 12.0,
    waveSpeed: 0.4,
    waveAmplitude: 0.001,
    chromaticAberrationScale: 0.02,
    grainStrength: 0.015,
    grainNoiseScale: 1500.0,
    grainNoiseSpeed: 40.0,
    scanSpeed: 0.8,
    refreshLineSharpness: 300.0,
    refreshLineIntensity: 0.4,
    refreshGlowSharpness: 30.0,
    refreshGlowIntensity: 0.1,
    scanlineDensity: 2.0,
    scanlineMix: 0.05,
    scanlineBase: 0.95,
    pulseFrequency: 0.4,
    pulseAmplitude: 0.015,
    pulseBase: 0.985,
    vignetteInner: 0.6,
    vignetteOuter: 2.0,
    noiseScale: 5.0,
    noiseSpeed: 0.15,
    noiseIntensity: 0.04,
    glowPower: 1.5,
    glowIntensity: 0.2,
    colorRGain: 1.1,
    colorGGain: 0.12,
    colorBGain: 0.06,
    refreshLineColorScale: 0.5,
    glitchInvertMix: 0.3,
    glitchColorRMultiplier: 1.2,
    glitchColorGAdd: 0.2,
    glitchColorBAdd: 0.1,
    bandNoiseThreshold: 0.75,
    bandNoiseSpeed: 25.0,
    bandNoiseStrengthR: 0.4,
    bandNoiseStrengthG: 0.2,
    bandNoiseStrengthB: 0.6,
    alphaScale: 0.25,
    alphaBase: 0.12,
  },
  particles: {
    count: 10000,
    baseColorHex: 0xff0000,
    size: 0.0046,
    opacity: 0.5,
    blending: "additive",
    sizeAttenuation: true,
    colorVariationMin: 0.8,
    colorVariationRange: 0.2,
    rotationSpeedY: 0.001,
    rotationSpeedX: 0.0005,
    rotationSpeedZ: 0.00025,
    clusterProbability: 0.23,
    clusterOffsetMin: 0.5,
    clusterOffsetVariation: 0.5,
    sizeBase: 0.008,
    sizeRandom: 0.01,
    sizeDistanceScale: 1.5,
    sizeDistanceDivisor: 10,
    neighborDistance: 0.8,
    neighborCount: 8,
    pulseTriggerInterval: 0.4,
    pulseTriggerProbability: 0.12,
    pulseDuration: 1.0,
    pulseChainSpacing: 0.12,
    pulseChainDurationScale: 0.05,
    pulseParticleDuration: 0.8,
    pulseLineDistance: 1.0,
    pulseLineOpacityScale: 0.4,
    pulseLineColorHex: 0xffffff,
  },
  trails: {
    trackedParticles: 1000,
    length: 1000,
    colorHex: 0xff0000,
    opacity: 0.15,
    linewidth: 10,
  },
  markers: {
    sphereRadius: 0.08,
    sphereSegments: 16,
    ringInnerRadius: 0.12,
    ringOuterRadius: 0.15,
    ringSegments: 32,
    ringOpacity: 0.0,
    pulseScaleSpeed: 2.0,
    pulseScaleAmplitude: 0.1,
    ringRotationSpeed: 0.02,
    labelOffsetY: 40,
    labelMargin: 20,
    labelMinOpacity: 0.3,
  },
};

function toCamelCase(key) {
  return key
    .toLowerCase()
    .replace(/[_-](\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
}

function parseYamlValue(raw) {
  if (raw === undefined) return undefined;
  const value = raw.trim();
  if (value.length === 0) return "";
  if (/^[-+]?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (/^0x[0-9a-fA-F]+$/.test(value)) {
    return Number(value);
  }
  if (/^(true|false)$/i.test(value)) {
    return value.toLowerCase() === "true";
  }
  return value;
}

function parseYaml(content) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    if (trimmed.endsWith(":")) {
      const key = toCamelCase(trimmed.slice(0, -1).trim());
      const parent = stack[stack.length - 1].obj;
      if (!(key in parent)) {
        parent[key] = {};
      }
      stack.push({ indent, obj: parent[key] });
    } else {
      const [rawKey, ...rest] = trimmed.split(":");
      const key = toCamelCase(rawKey.trim());
      const value = parseYamlValue(rest.join(":"));
      stack[stack.length - 1].obj[key] = value;
    }
  }

  return root;
}

function deepMerge(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      key in target &&
      typeof target[key] === "object"
    ) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  });
  return target;
}

async function loadConfig() {
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) throw new Error(`Failed to fetch ${CONFIG_URL}`);
    const text = await response.text();
    const parsed = parseYaml(text);
    return deepMerge(JSON.parse(JSON.stringify(defaultConfig)), parsed);
  } catch (error) {
    console.warn("Using default animation config due to:", error);
    return JSON.parse(JSON.stringify(defaultConfig));
  }
}

function createShaderMaterial(shaderCfg) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      glitchTriggerThreshold: { value: shaderCfg.glitchTriggerThreshold },
      glitchNoiseSpeed: { value: shaderCfg.glitchNoiseSpeed },
      glitchStrengthNoiseSpeed: { value: shaderCfg.glitchStrengthNoiseSpeed },
      glitchStrengthVariation: { value: shaderCfg.glitchStrengthVariation },
      glitchStrengthBase: { value: shaderCfg.glitchStrengthBase },
      blockDensity: { value: shaderCfg.blockDensity },
      blockTriggerThreshold: { value: shaderCfg.blockTriggerThreshold },
      blockNoiseSpeed: { value: shaderCfg.blockNoiseSpeed },
      glitchOffsetRangeX: { value: shaderCfg.glitchOffsetRangeX },
      glitchOffsetRangeY: { value: shaderCfg.glitchOffsetRangeY },
      blockOffsetRangeX: { value: shaderCfg.blockOffsetRangeX },
      waveFrequency: { value: shaderCfg.waveFrequency },
      waveSpeed: { value: shaderCfg.waveSpeed },
      waveAmplitude: { value: shaderCfg.waveAmplitude },
      chromaticAberrationScale: { value: shaderCfg.chromaticAberrationScale },
      grainStrength: { value: shaderCfg.grainStrength },
      grainNoiseScale: { value: shaderCfg.grainNoiseScale },
      grainNoiseSpeed: { value: shaderCfg.grainNoiseSpeed },
      scanSpeed: { value: shaderCfg.scanSpeed },
      refreshLineSharpness: { value: shaderCfg.refreshLineSharpness },
      refreshLineIntensity: { value: shaderCfg.refreshLineIntensity },
      refreshGlowSharpness: { value: shaderCfg.refreshGlowSharpness },
      refreshGlowIntensity: { value: shaderCfg.refreshGlowIntensity },
      scanlineDensity: { value: shaderCfg.scanlineDensity },
      scanlineMix: { value: shaderCfg.scanlineMix },
      scanlineBase: { value: shaderCfg.scanlineBase },
      pulseFrequency: { value: shaderCfg.pulseFrequency },
      pulseAmplitude: { value: shaderCfg.pulseAmplitude },
      pulseBase: { value: shaderCfg.pulseBase },
      vignetteInner: { value: shaderCfg.vignetteInner },
      vignetteOuter: { value: shaderCfg.vignetteOuter },
      noiseScale: { value: shaderCfg.noiseScale },
      noiseSpeed: { value: shaderCfg.noiseSpeed },
      noiseIntensity: { value: shaderCfg.noiseIntensity },
      glowPower: { value: shaderCfg.glowPower },
      glowIntensity: { value: shaderCfg.glowIntensity },
      colorRGain: { value: shaderCfg.colorRGain },
      colorGGain: { value: shaderCfg.colorGGain },
      colorBGain: { value: shaderCfg.colorBGain },
      refreshLineColorScale: { value: shaderCfg.refreshLineColorScale },
      glitchInvertMix: { value: shaderCfg.glitchInvertMix },
      glitchColorRMultiplier: { value: shaderCfg.glitchColorRMultiplier },
      glitchColorGAdd: { value: shaderCfg.glitchColorGAdd },
      glitchColorBAdd: { value: shaderCfg.glitchColorBAdd },
      bandNoiseThreshold: { value: shaderCfg.bandNoiseThreshold },
      bandNoiseSpeed: { value: shaderCfg.bandNoiseSpeed },
      bandNoiseStrengthR: { value: shaderCfg.bandNoiseStrengthR },
      bandNoiseStrengthG: { value: shaderCfg.bandNoiseStrengthG },
      bandNoiseStrengthB: { value: shaderCfg.bandNoiseStrengthB },
      alphaScale: { value: shaderCfg.alphaScale },
      alphaBase: { value: shaderCfg.alphaBase },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec2 resolution;
      uniform float glitchTriggerThreshold;
      uniform float glitchNoiseSpeed;
      uniform float glitchStrengthNoiseSpeed;
      uniform float glitchStrengthVariation;
      uniform float glitchStrengthBase;
      uniform float blockDensity;
      uniform float blockTriggerThreshold;
      uniform float blockNoiseSpeed;
      uniform float glitchOffsetRangeX;
      uniform float glitchOffsetRangeY;
      uniform float blockOffsetRangeX;
      uniform float waveFrequency;
      uniform float waveSpeed;
      uniform float waveAmplitude;
      uniform float chromaticAberrationScale;
      uniform float grainStrength;
      uniform float grainNoiseScale;
      uniform float grainNoiseSpeed;
      uniform float scanSpeed;
      uniform float refreshLineSharpness;
      uniform float refreshLineIntensity;
      uniform float refreshGlowSharpness;
      uniform float refreshGlowIntensity;
      uniform float scanlineDensity;
      uniform float scanlineMix;
      uniform float scanlineBase;
      uniform float pulseFrequency;
      uniform float pulseAmplitude;
      uniform float pulseBase;
      uniform float vignetteInner;
      uniform float vignetteOuter;
      uniform float noiseScale;
      uniform float noiseSpeed;
      uniform float noiseIntensity;
      uniform float glowPower;
      uniform float glowIntensity;
      uniform float colorRGain;
      uniform float colorGGain;
      uniform float colorBGain;
      uniform float refreshLineColorScale;
      uniform float glitchInvertMix;
      uniform float glitchColorRMultiplier;
      uniform float glitchColorGAdd;
      uniform float glitchColorBAdd;
      uniform float bandNoiseThreshold;
      uniform float bandNoiseSpeed;
      uniform float bandNoiseStrengthR;
      uniform float bandNoiseStrengthG;
      uniform float bandNoiseStrengthB;
      uniform float alphaScale;
      uniform float alphaBase;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= resolution.x / resolution.y;

        float glitchIntensity = step(glitchTriggerThreshold, noise(vec2(time * glitchNoiseSpeed, 0.0)));
        float glitchStrength = glitchIntensity * (noise(vec2(time * glitchStrengthNoiseSpeed, 0.0)) * glitchStrengthVariation + glitchStrengthBase);

        float blockY = floor(vUv.y * blockDensity) / blockDensity;
        float blockGlitch = step(blockTriggerThreshold, noise(vec2(blockY, time * blockNoiseSpeed))) * glitchIntensity;

        vec2 glitchOffset = vec2(
          (noise(vec2(time * (glitchStrengthNoiseSpeed + 3.0), 0.0)) - 0.5) * glitchOffsetRangeX,
          (noise(vec2(time * (glitchStrengthNoiseSpeed + 3.0), 1.0)) - 0.5) * glitchOffsetRangeY
        ) * glitchStrength;

        glitchOffset.x += (noise(vec2(blockY, time * (blockNoiseSpeed * 2.0))) - 0.5) * blockOffsetRangeX * blockGlitch;

        float waveDistortion = sin(uv.y * waveFrequency + time * waveSpeed) * waveAmplitude;
        uv.x += waveDistortion;
        uv += glitchOffset;

        float chromaticAberration = glitchStrength * chromaticAberrationScale;
        float grain = (noise(vUv * grainNoiseScale + time * grainNoiseSpeed) - 0.5) * grainStrength;

        float scanPosition = mod(time * scanSpeed, 2.0) - 1.0;
        float scanDist = abs(uv.y - scanPosition);

        float refreshLine = exp(-scanDist * refreshLineSharpness) * refreshLineIntensity;
        float refreshGlow = exp(-scanDist * refreshGlowSharpness) * refreshGlowIntensity;

        float scanlines = sin(vUv.y * resolution.y * scanlineDensity) * 0.5 + 0.5;
        scanlines = scanlines * scanlineMix + scanlineBase;

        float pulse = sin(time * pulseFrequency) * pulseAmplitude + pulseBase;

        float dist = length(uv);
        float crtGlow = 1.0 - smoothstep(0.0, 1.8, dist);
        crtGlow = pow(crtGlow, glowPower) * glowIntensity;

        float vignette = 1.0 - smoothstep(vignetteInner, vignetteOuter, dist);
        vignette *= pulse;

        float n = noise(uv * noiseScale + time * noiseSpeed) * noiseIntensity + grain;

        vec2 uvR = uv + vec2(chromaticAberration, 0.0);
        vec2 uvG = uv;
        vec2 uvB = uv - vec2(chromaticAberration, 0.0);

        float distR = length(uvR);
        float distG = length(uvG);
        float distB = length(uvB);

        float crtGlowR = pow(max(0.0, 1.0 - smoothstep(0.0, 1.8, distR)), glowPower) * glowIntensity;
        float crtGlowG = pow(max(0.0, 1.0 - smoothstep(0.0, 1.8, distG)), glowPower) * glowIntensity;
        float crtGlowB = pow(max(0.0, 1.0 - smoothstep(0.0, 1.8, distB)), glowPower) * glowIntensity;

        float intensityR = crtGlowR + refreshLine + refreshGlow + n;
        float intensityG = crtGlowG + refreshLine + refreshGlow + n;
        float intensityB = crtGlowB + refreshLine + refreshGlow + n;

        intensityR *= scanlines * vignette;
        intensityG *= scanlines * vignette;
        intensityB *= scanlines * vignette;

        vec3 color = vec3(intensityR * colorRGain, intensityG * colorGGain, intensityB * colorBGain);

        color += vec3(1.0, 0.15, 0.05) * refreshLine * refreshLineColorScale;
        color += vec3(0.9, 0.0, 0.0) * pow(crtGlowG, 2.5) * 0.25;

        if (glitchIntensity > 0.5) {
          float inversionAmount = blockGlitch * glitchInvertMix;
          color = mix(color, vec3(1.0) - color, inversionAmount);

          color.r *= glitchColorRMultiplier + glitchStrength * 0.2;
          color.g += glitchColorGAdd * glitchStrength;
          color.b += glitchColorBAdd * glitchStrength;

          float bandNoise = step(bandNoiseThreshold, noise(vec2(vUv.y * 60.0, time * bandNoiseSpeed))) * glitchStrength;
          color += vec3(
            bandNoise * bandNoiseStrengthR,
            bandNoise * bandNoiseStrengthG,
            bandNoise * bandNoiseStrengthB
          );
        }

        float alpha = (intensityR + intensityG + intensityB) * alphaScale + alphaBase;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

function hexToColor(hex) {
  return new THREE.Color(hex);
}

function createFpsOverlay() {
  const fpsElement = document.createElement("div");
  fpsElement.style.position = "fixed";
  fpsElement.style.top = "12px";
  fpsElement.style.right = "16px";
  fpsElement.style.padding = "6px 10px";
  fpsElement.style.color = "#ffff3b";
  fpsElement.style.fontFamily = '"Orbitron", monospace';
  fpsElement.style.fontSize = "0.9rem";
  fpsElement.style.letterSpacing = "0.1em";
  fpsElement.style.background = "rgba(0, 0, 0, 0.4)";
  fpsElement.style.borderRadius = "6px";
  fpsElement.style.textShadow =
    "0 0 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.8)";
  fpsElement.style.pointerEvents = "none";
  fpsElement.textContent = "FPS: --";
  document.body.appendChild(fpsElement);
  return fpsElement;
}

function createParticles(particlesCfg, scene) {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = particlesCfg.count;
  const posArray = new Float32Array(particlesCount * 3);
  const sizeArray = new Float32Array(particlesCount);

  for (let i = 0; i < particlesCount; i++) {
    const radius = Math.abs(
      (Math.random() + Math.random()) /
        Math.random() ** (Math.random() ** Math.pow(1, -Math.random()))
    );
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i * 3 + 2] = radius * Math.cos(phi);

    if (Math.random() < particlesCfg.clusterProbability) {
      const clusterOffset =
        (Math.random() + 1) * particlesCfg.clusterOffsetMin *
        (1 + Math.random() * particlesCfg.clusterOffsetVariation);
      posArray[i * 3] += clusterOffset;
      posArray[i * 3 + 1] += clusterOffset;
    }

    const distFromCenter = radius;
    sizeArray[i] =
      (particlesCfg.sizeBase + Math.random() * particlesCfg.sizeRandom) *
      (particlesCfg.sizeDistanceScale - distFromCenter / particlesCfg.sizeDistanceDivisor);
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );
  particlesGeometry.setAttribute(
    "size",
    new THREE.BufferAttribute(sizeArray, 1)
  );

  const color = hexToColor(particlesCfg.baseColorHex);
  const colors = new Float32Array(particlesCount * 3);
  const baseR = color.r;
  const baseG = color.g;
  const baseB = color.b;

  for (let i = 0; i < particlesCount; i++) {
    const variation =
      particlesCfg.colorVariationMin + Math.random() * particlesCfg.colorVariationRange;
    colors[i * 3] = baseR * variation;
    colors[i * 3 + 1] = baseG * variation;
    colors[i * 3 + 2] = baseB * variation;
  }
  particlesGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  );

  const blendingMode =
    particlesCfg.blending === "additive"
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;

  const particlesMaterial = new THREE.PointsMaterial({
    size: particlesCfg.size,
    color: particlesCfg.baseColorHex,
    transparent: true,
    opacity: particlesCfg.opacity,
    blending: blendingMode,
    sizeAttenuation: particlesCfg.sizeAttenuation,
    vertexColors: false,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  return {
    mesh: particlesMesh,
    geometry: particlesGeometry,
    colors,
  };
}

function createTaggedMarkers(markersCfg, taggedPoints, scene, labelsContainer) {
  const taggedMarkers = [];
  const taggedLabelElements = [];

  const sphereGeometry = new THREE.SphereGeometry(
    markersCfg.sphereRadius,
    markersCfg.sphereSegments,
    markersCfg.sphereSegments
  );
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });

  for (const point of taggedPoints) {
    const marker = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
    marker.position.copy(point.position);

    const ringGeometry = new THREE.RingGeometry(
      markersCfg.ringInnerRadius,
      markersCfg.ringOuterRadius,
      markersCfg.ringSegments
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: markersCfg.ringOpacity,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(point.position);
    marker.add(ring);

    scene.add(marker);
    taggedMarkers.push({ mesh: marker, ring, data: point });

    const label = document.createElement("a");
    label.className = "tagged-label";
    label.textContent = point.label;
    label.href = point.url;
    labelsContainer.appendChild(label);
    taggedLabelElements.push(label);
  }

  return { taggedMarkers, taggedLabelElements };
}

function clampToScreen(x, y, width, height, margin) {
  const clampedX = Math.max(
    margin + width / 2,
    Math.min(window.innerWidth - margin - width / 2, x)
  );
  const clampedY = Math.max(
    margin + height / 2,
    Math.min(window.innerHeight - margin - height / 2, y)
  );
  return { x: clampedX, y: clampedY };
}

loadConfig().then(initAnimation).catch((error) => {
  console.error("Failed to initialise animation:", error);
});

function initAnimation(config) {
  const cameraCfg = config.camera;
  const rendererCfg = config.renderer;
  const shaderCfg = config.shader;
  const particlesCfg = config.particles;
  const trailsCfg = config.trails;
  const markersCfg = config.markers;

  const container = document.getElementById("shader-container");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    cameraCfg.fov,
    window.innerWidth / window.innerHeight,
    cameraCfg.near,
    cameraCfg.far
  );
  camera.position.z = cameraCfg.positionZ;

  const renderer = new THREE.WebGLRenderer({
    alpha: rendererCfg.alpha,
    antialias: rendererCfg.antialias,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, rendererCfg.pixelRatioCap)
  );
  container.appendChild(renderer.domElement);

  const material = createShaderMaterial(shaderCfg);
  const geometry = new THREE.PlaneGeometry(5, 5);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const taggedPoints = [
    {
      label: "BLOG",
      position: new THREE.Vector3(-2.5, 1.8, 0.5),
      url: "#blog",
    },
    {
      label: "GITHUB",
      position: new THREE.Vector3(2.8, 1.2, -0.3),
      url: "#github",
    },
    {
      label: "DISCORD",
      position: new THREE.Vector3(-2.2, -1.5, 0.8),
      url: "#discord",
    },
    {
      label: "EMAIL",
      position: new THREE.Vector3(2.5, -1.8, -0.5),
      url: "#email",
    },
  ];

  const labelsContainer = document.getElementById("tagged-labels-container");
  const { taggedMarkers, taggedLabelElements } = createTaggedMarkers(
    markersCfg,
    taggedPoints,
    scene,
    labelsContainer
  );

  const particles = createParticles(particlesCfg, scene);
  const particlesMesh = particles.mesh;
  const particlesGeometry = particles.geometry;
  const colors = particles.colors;
  const baseParticleColor = hexToColor(particlesCfg.baseColorHex);
  const baseR = baseParticleColor.r;
  const baseG = baseParticleColor.g;
  const baseB = baseParticleColor.b;

  const pulseLines = [];
  const activePulseChains = [];
  let lastPulseTime = 0;

  const trailLines = [];
  const trailHistory = [];

  const trailColor = hexToColor(trailsCfg.colorHex);
  const pulseLineColor = hexToColor(particlesCfg.pulseLineColorHex);
  for (let i = 0; i < trailsCfg.trackedParticles; i++) {
    trailHistory[i] = [];
    const trailGeometry = new THREE.BufferGeometry();
    const initialPoints = Array(trailsCfg.length)
      .fill(null)
      .map(() => new THREE.Vector3(0, 0, 0));
    trailGeometry.setFromPoints(initialPoints);
    const trailMaterial = new THREE.LineBasicMaterial({
      color: trailColor,
      transparent: true,
      opacity: trailsCfg.opacity,
      linewidth: trailsCfg.linewidth,
    });
    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    trailLines.push(trailLine);
    scene.add(trailLine);
  }

  function findNearbyParticles(sourceIdx, maxDistance, count) {
    const positions = particlesGeometry.attributes.position.array;
    const sourcePos = new THREE.Vector3(
      positions[sourceIdx * 3],
      positions[sourceIdx * 3 + 1],
      positions[sourceIdx * 3 + 2]
    );

    const nearby = [];
    for (let i = 0; i < particlesCfg.count; i++) {
      if (i === sourceIdx) continue;
      const pos = new THREE.Vector3(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      const distance = sourcePos.distanceTo(pos);
      if (distance < maxDistance) {
        nearby.push({ index: i, distance });
      }
    }

    nearby.sort((a, b) => a.distance - b.distance);
    return nearby.slice(0, count).map((p) => p.index);
  }

  const fpsOverlay = config.drawfps ? createFpsOverlay() : null;
  let lastFrameTime = performance.now();
  let fpsAccumulatedMs = 0;
  let fpsFrameCounter = 0;

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;

    if (fpsOverlay && delta > 0) {
      fpsAccumulatedMs += delta;
      fpsFrameCounter += 1;
      if (fpsAccumulatedMs >= 250) {
        const fps = Math.round((fpsFrameCounter * 1000) / fpsAccumulatedMs);
        fpsOverlay.textContent = `FPS: ${fps}`;
        fpsAccumulatedMs = 0;
        fpsFrameCounter = 0;
      }
    }

    const currentTime = material.uniforms.time.value;
    material.uniforms.time.value += shaderCfg.timeIncrement;

    particlesMesh.rotation.y += particlesCfg.rotationSpeedY;
    particlesMesh.rotation.x += particlesCfg.rotationSpeedX;
    particlesMesh.rotation.z += particlesCfg.rotationSpeedZ;

    taggedMarkers.forEach((marker, index) => {
      marker.mesh.rotation.copy(particlesMesh.rotation);
      marker.ring.rotation.z += markersCfg.ringRotationSpeed;

      const scale = 1 + Math.sin(currentTime * markersCfg.pulseScaleSpeed + index) * markersCfg.pulseScaleAmplitude;
      marker.mesh.scale.setScalar(scale);

      const vector = marker.mesh.position.clone();
      vector.applyEuler(particlesMesh.rotation);
      vector.project(camera);

      const x = (vector.x * 0.5 + 0.8) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.8) * window.innerHeight;

      const label = taggedLabelElements[index];
      const labelRect = label.getBoundingClientRect();
      const labelWidth = labelRect.width || 100;
      const labelHeight = labelRect.height || 40;
      const isBehindCamera = vector.z > 1;

      const clamped = clampToScreen(
        x,
        y - markersCfg.labelOffsetY,
        labelWidth,
        labelHeight,
        markersCfg.labelMargin
      );

      label.style.left = `${clamped.x}px`;
      label.style.top = `${clamped.y}px`;
      label.style.transform = "translateX(-50%)";
      label.style.opacity = isBehindCamera ? String(markersCfg.labelMinOpacity) : "1";
      label.style.pointerEvents = "all";
    });

    if (
      currentTime - lastPulseTime > particlesCfg.pulseTriggerInterval &&
      Math.random() < particlesCfg.pulseTriggerProbability
    ) {
      lastPulseTime = currentTime;
      const sourceIdx = Math.floor(Math.random() * particlesCfg.count);
      const chain = [sourceIdx];
      const nearbyIndices = findNearbyParticles(
        sourceIdx,
        particlesCfg.neighborDistance,
        particlesCfg.neighborCount
      );
      chain.push(...nearbyIndices);
      activePulseChains.push({
        particles: chain,
        startTime: currentTime,
        chainDuration: chain.length * particlesCfg.pulseChainDurationScale,
      });
    }

    // reset base colors each frame before pulses are applied
    for (let i = 0; i < particlesCfg.count; i++) {
      const variation =
        particlesCfg.colorVariationMin + Math.random() * particlesCfg.colorVariationRange;
      colors[i * 3] = baseR * variation;
      colors[i * 3 + 1] = baseG * variation;
      colors[i * 3 + 2] = baseB * variation;
    }

    pulseLines.forEach((line) => {
      scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    pulseLines.length = 0;

    const positions = particlesGeometry.attributes.position.array;
    const particleIntensities = new Map();
    const activeParticleIndices = new Set();

    for (let i = activePulseChains.length - 1; i >= 0; i--) {
      const chain = activePulseChains[i];
      const elapsed = currentTime - chain.startTime;

      if (elapsed > particlesCfg.pulseDuration) {
        activePulseChains.splice(i, 1);
        continue;
      }

      const halfDuration = particlesCfg.pulseDuration / 2;
      const isPropagating = elapsed < halfDuration;

      chain.particles.forEach((particleIdx, chainIndex) => {
        let particleTime;
        if (isPropagating) {
          particleTime = elapsed - chainIndex * particlesCfg.pulseChainSpacing;
        } else {
          const decayElapsed = elapsed - halfDuration;
          const reverseIndex = chain.particles.length - 1 - chainIndex;
          particleTime = decayElapsed - reverseIndex * particlesCfg.pulseChainSpacing;
        }

        if (
          particleTime >= 0 &&
          particleTime < particlesCfg.pulseParticleDuration
        ) {
          const fade = 1.0 - particleTime / particlesCfg.pulseParticleDuration;
          const intensity = Math.pow(fade, 0.6);
          activeParticleIndices.add(particleIdx);
          particleIntensities.set(
            particleIdx,
            Math.max(particleIntensities.get(particleIdx) || 0, intensity)
          );
          colors[particleIdx * 3] = 1.0;
          colors[particleIdx * 3 + 1] = intensity;
          colors[particleIdx * 3 + 2] = intensity;
        }
      });
    }

    const activeArray = Array.from(activeParticleIndices);
    for (let i = 0; i < activeArray.length; i++) {
      for (let j = i + 1; j < activeArray.length; j++) {
        const idx1 = activeArray[i];
        const idx2 = activeArray[j];

        const pos1 = new THREE.Vector3(
          positions[idx1 * 3],
          positions[idx1 * 3 + 1],
          positions[idx1 * 3 + 2]
        ).applyEuler(particlesMesh.rotation);

        const pos2 = new THREE.Vector3(
          positions[idx2 * 3],
          positions[idx2 * 3 + 1],
          positions[idx2 * 3 + 2]
        ).applyEuler(particlesMesh.rotation);

        const distance = pos1.distanceTo(pos2);
        if (distance < particlesCfg.pulseLineDistance) {
          const intensity1 = particleIntensities.get(idx1) || 0;
          const intensity2 = particleIntensities.get(idx2) || 0;
          const avgIntensity = (intensity1 + intensity2) / 2;

          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            pos1,
            pos2,
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: pulseLineColor,
            transparent: true,
            opacity: avgIntensity * particlesCfg.pulseLineOpacityScale,
            blending: THREE.AdditiveBlending,
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          pulseLines.push(line);
          scene.add(line);
        }
      }
    }

    particlesGeometry.attributes.color.needsUpdate = true;

    for (let i = 0; i < trailsCfg.trackedParticles; i++) {
      const particleIdx = Math.floor((i / trailsCfg.trackedParticles) * particlesCfg.count);
      const particlePos = new THREE.Vector3(
        positions[particleIdx * 3],
        positions[particleIdx * 3 + 1],
        positions[particleIdx * 3 + 2]
      );
      particlePos.applyEuler(particlesMesh.rotation);

      trailHistory[i].unshift(particlePos.clone());
      if (trailHistory[i].length > trailsCfg.length) {
        trailHistory[i].pop();
      }

      if (trailHistory[i].length > 1) {
        const trailPoints = trailHistory[i].map((pos) => pos.clone());
        while (trailPoints.length < trailsCfg.length) {
          trailPoints.push(trailPoints[trailPoints.length - 1].clone());
        }

        const trailPositions = trailLines[i].geometry.attributes.position.array;
        for (let j = 0; j < trailsCfg.length && j < trailPoints.length; j++) {
          trailPositions[j * 3] = trailPoints[j].x;
          trailPositions[j * 3 + 1] = trailPoints[j].y;
          trailPositions[j * 3 + 2] = trailPoints[j].z;
        }
        trailLines[i].geometry.attributes.position.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.resolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  });
}
