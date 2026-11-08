import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * A soft vertical gradient used as the backdrop. `texture.paint(top, bottom)`
 * redraws it, which is how the red flag recolours the sky.
 */
function gradientTexture(top, bottom) {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.paint = (topColor, bottomColor) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, topColor)
    gradient.addColorStop(0.3, bottomColor)
    gradient.addColorStop(1, bottomColor)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 4, 512)
    texture.needsUpdate = true
  }
  texture.paint(top, bottom)
  return texture
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  // The gradient settles onto exactly the fog colour, so the far edge of the
  // ground plane dissolves into the sky instead of drawing a hard horizon.
  // The haze is a touch paler and cooler than the ground, so whatever sits
  // far away (the back of the circuit in the wide shots) lifts off into a
  // light mist and the frame gains depth.
  const horizon = '#f5f1ea'
  scene.background = gradientTexture('#fdfaf4', horizon)
  scene.fog = new THREE.Fog(new THREE.Color(horizon), 55, 300)

  // Gentle image-based reflections so the clearcoat has something to catch.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envMap = pmrem.fromScene(new RoomEnvironment()).texture
  scene.environment = envMap
  scene.environmentIntensity = 0.3
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 2000)
  camera.position.set(0, 95, 155)
  camera.lookAt(0, 8, 0)

  // --- lighting -------------------------------------------------------------
  const hemi = new THREE.HemisphereLight('#fffdf6', '#d9c9a8', 1.1)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight('#fff6e2', 2.3)
  sun.position.set(55, 85, 40)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 20
  sun.shadow.camera.far = 320
  sun.shadow.camera.left = -110
  sun.shadow.camera.right = 110
  sun.shadow.camera.top = 110
  sun.shadow.camera.bottom = -110
  sun.shadow.bias = -0.0008
  sun.shadow.normalBias = 0.04
  sun.shadow.radius = 4
  scene.add(sun)
  scene.add(sun.target)

  // --- ground ---------------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({
      color: '#eee4cf',
      roughness: 0.96,
      metalness: 0,
    })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const grid = new THREE.GridHelper(900, 180, '#c9b893', '#d8caab')
  grid.material.transparent = true
  grid.material.opacity = 0.35
  grid.position.y = 0.02
  scene.add(grid)

  return { renderer, scene, camera, sun, hemi, ground, grid, envMap }
}
