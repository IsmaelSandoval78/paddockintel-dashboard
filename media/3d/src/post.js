import * as THREE from 'three'
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

/** Objects on this layer are also drawn into the glow buffer. */
export const GLOW_LAYER = 1

const blurShader = {
  uniforms: {
    tDiffuse: { value: null },
    uDirection: { value: new THREE.Vector2(1, 0) },
    uTexel: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uDirection;
    uniform vec2 uTexel;
    varying vec2 vUv;
    void main() {
      vec2 step = uDirection * uTexel;
      vec4 sum = texture2D(tDiffuse, vUv) * 0.2270270270;
      sum += texture2D(tDiffuse, vUv + step * 1.3846153846) * 0.3162162162;
      sum += texture2D(tDiffuse, vUv - step * 1.3846153846) * 0.3162162162;
      sum += texture2D(tDiffuse, vUv + step * 3.2307692308) * 0.0702702703;
      sum += texture2D(tDiffuse, vUv - step * 3.2307692308) * 0.0702702703;
      gl_FragColor = sum;
    }
  `,
}

/**
 * Final pass. The scene buffer is linear and un-tonemapped, so this applies
 * the ACES curve and the sRGB encode itself, adds the glow buffer, and then
 * prints the result: channel misregistration, a soft halftone screen, paper
 * grain and the red-flag tint.
 */
const risoShader = {
  uniforms: {
    tDiffuse: { value: null },
    tGlow: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uExposure: { value: 1.05 },
    uGlow: { value: 0.6 },
    uGrain: { value: 0.05 },
    uHalftone: { value: 0.12 },
    uMisregister: { value: 0.9 },
    uTint: { value: 0 },
    uVignette: { value: 0.75 },
    uPaper: { value: new THREE.Color('#f3ecdd') },
    uRed: { value: new THREE.Color('#a08415') },
    // Safe zone: inside this uv rect (x0, y0, x1, y1) the scene washes back
    // to the bare page, so text laid over it never sits on the track.
    tBg: { value: null },
    uSafe: { value: new THREE.Vector4(0, 0, 0, 0) },
    uSafeFeather: { value: new THREE.Vector2(0.04, 0.06) },
    uSafeAmount: { value: 0 },
  },
  vertexShader: blurShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tGlow;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uExposure;
    uniform float uGlow;
    uniform float uGrain;
    uniform float uHalftone;
    uniform float uMisregister;
    uniform float uTint;
    uniform float uVignette;
    uniform vec3 uPaper;
    uniform vec3 uRed;
    uniform sampler2D tBg;
    uniform vec4 uSafe;
    uniform vec2 uSafeFeather;
    uniform float uSafeAmount;
    varying vec2 vUv;

    const mat3 ACES_IN = mat3(
      0.59719, 0.07600, 0.02840,
      0.35458, 0.90834, 0.13383,
      0.04823, 0.01566, 0.83777
    );
    const mat3 ACES_OUT = mat3(
       1.60475, -0.10208, -0.00327,
      -0.53108,  1.10813, -0.07276,
      -0.07367, -0.00605,  1.07602
    );

    vec3 rrtAndOdtFit(vec3 v) {
      vec3 a = v * (v + 0.0245786) - 0.000090537;
      vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
      return a / b;
    }

    vec3 toneMap(vec3 color) {
      color *= uExposure / 0.6;
      color = ACES_IN * color;
      color = rrtAndOdtFit(color);
      color = ACES_OUT * color;
      return clamp(color, 0.0, 1.0);
    }

    vec3 linearToSRGB(vec3 c) {
      return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(0.41666)) - 0.055,
                 step(vec3(0.0031308), c));
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // One ink screen: a rotated grid of dots.
    float screen(vec2 p, float angle, float scale) {
      float s = sin(angle);
      float c = cos(angle);
      vec2 q = vec2(p.x * c - p.y * s, p.x * s + p.y * c) * scale;
      return sin(q.x) * sin(q.y);
    }

    void main() {
      vec2 px = 1.0 / uResolution;

      // Misregistration: the ink plates never line up perfectly.
      vec2 shift = px * uMisregister;
      vec3 linear;
      linear.r = texture2D(tDiffuse, vUv + shift).r;
      linear.g = texture2D(tDiffuse, vUv).g;
      linear.b = texture2D(tDiffuse, vUv - shift).b;

      // Halo from the emissive-only buffer, added before the curve so it
      // behaves like real light rather than a pasted-on white smear.
      linear += texture2D(tGlow, vUv).rgb * uGlow;

      if (uSafeAmount > 0.001) {
        vec2 lo = smoothstep(uSafe.xy - uSafeFeather, uSafe.xy, vUv);
        vec2 hi = 1.0 - smoothstep(uSafe.zw, uSafe.zw + uSafeFeather, vUv);
        float inside = lo.x * lo.y * hi.x * hi.y;
        linear = mix(linear, texture2D(tBg, vUv).rgb, inside * uSafeAmount);
      }

      vec3 color = linearToSRGB(toneMap(linear));

      // ACES drains the warmth out of a cream page; put some of it back.
      float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = clamp(mix(vec3(l), color, 1.24) * vec3(1.03, 1.0, 0.945), 0.0, 1.0);

      // Red flag: the scene is already lit red; this just unifies it into one ink.
      if (uTint > 0.001) {
        float l = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, uRed * (0.3 + 0.8 * l), uTint * 0.35);
      }

      // Halftone screen, strongest in the midtones so the paper stays clean.
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      vec2 sp = gl_FragCoord.xy;
      float dots = screen(sp, 0.26, 1.15) * 0.5 + screen(sp, 1.31, 1.15) * 0.5;
      float midtone = max(1.0 - abs(luma - 0.45) * 2.0, 0.0);
      color *= 1.0 - uHalftone * midtone * (0.5 - 0.5 * dots);

      // Paper grain.
      float grain = hash(gl_FragCoord.xy + fract(uTime) * 311.7) - 0.5;
      color += grain * uGrain * (0.35 + 0.65 * (1.0 - luma));

      // Soft vignette: the corners sink into a cool navy ink, not grey, so
      // the eye is pulled to the middle of the frame.
      vec2 v = (vUv - 0.5) * vec2(1.0, 0.86);
      float vig = smoothstep(0.28, 0.78, length(v) * 1.15);
      color = mix(color, color * vec3(0.80, 0.80, 0.88), vig * uVignette);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

export function createPost(renderer, scene, camera) {
  // The riso pass does its own tone mapping, so the buffers stay linear.
  renderer.toneMapping = THREE.NoToneMapping

  const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 4,
  })
  const glowOptions = { type: THREE.HalfFloatType, depthBuffer: false }
  const glowTarget = new THREE.WebGLRenderTarget(1, 1, glowOptions)
  const blurA = new THREE.WebGLRenderTarget(1, 1, glowOptions)
  const blurB = new THREE.WebGLRenderTarget(1, 1, glowOptions)

  const blurMaterial = new THREE.ShaderMaterial(blurShader)
  const risoMaterial = new THREE.ShaderMaterial(risoShader)
  const quad = new FullScreenQuad(risoMaterial)

  const black = new THREE.Color(0, 0, 0)
  let glowWidth = 1
  let glowHeight = 1

  function setSize(width, height) {
    const dpr = renderer.getPixelRatio()
    const w = Math.round(width * dpr)
    const h = Math.round(height * dpr)
    sceneTarget.setSize(w, h)
    glowWidth = Math.max(1, Math.round(w / 2))
    glowHeight = Math.max(1, Math.round(h / 2))
    glowTarget.setSize(glowWidth, glowHeight)
    blurA.setSize(glowWidth, glowHeight)
    blurB.setSize(glowWidth, glowHeight)
    risoMaterial.uniforms.uResolution.value.set(w, h)
  }

  function blur(source, destination, dx, dy) {
    quad.material = blurMaterial
    blurMaterial.uniforms.tDiffuse.value = source.texture
    blurMaterial.uniforms.uDirection.value.set(dx, dy)
    blurMaterial.uniforms.uTexel.value.set(1 / glowWidth, 1 / glowHeight)
    renderer.setRenderTarget(destination)
    quad.render(renderer)
  }

  function render(time, tint) {
    const background = scene.background
    const fog = scene.fog

    // 1. Emissive objects only, on black: the glow source.
    scene.background = null
    scene.fog = null
    camera.layers.set(GLOW_LAYER)
    renderer.setClearColor(black, 1)
    renderer.setRenderTarget(glowTarget)
    renderer.clear()
    renderer.render(scene, camera)

    // 2. Two separable blur passes, then widen it once more.
    blur(glowTarget, blurA, 1, 0)
    blur(blurA, blurB, 0, 1)
    blur(blurB, blurA, 2, 0)
    blur(blurA, blurB, 0, 2)

    // 3. The scene itself.
    scene.background = background
    scene.fog = fog
    camera.layers.set(0)
    renderer.setRenderTarget(sceneTarget)
    renderer.clear()
    renderer.render(scene, camera)

    // 4. Print it.
    quad.material = risoMaterial
    risoMaterial.uniforms.tDiffuse.value = sceneTarget.texture
    risoMaterial.uniforms.tGlow.value = blurB.texture
    risoMaterial.uniforms.uTime.value = time
    risoMaterial.uniforms.uTint.value = tint
    if (background?.isTexture) risoMaterial.uniforms.tBg.value = background
    else risoMaterial.uniforms.uSafeAmount.value = 0
    renderer.setRenderTarget(null)
    quad.render(renderer)
  }

  return { setSize, render, riso: risoMaterial }
}
