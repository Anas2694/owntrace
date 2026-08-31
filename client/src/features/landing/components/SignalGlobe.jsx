import { useEffect, useRef, useState } from 'react'
import * as THREE from '../../../vendor/three/three.module.js'
import { DRACOLoader } from '../../../vendor/three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from '../../../vendor/three/addons/loaders/GLTFLoader.js'

const CAMERA_START = new THREE.Vector3(-0.9402467715968077, 44.74909609020689, -32.22785030246248)
const CAMERA_END = new THREE.Vector3(-0.3476000206045236, 16.543302453007325, -11.914320546031316)

function SignalGlobe() {
  const hostRef = useRef(null)
  const [fallback, setFallback] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !window.WebGL2RenderingContext) {
      setFallback(true)
      return undefined
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(3, 1, 0.1)
    camera.position.copy(CAMERA_START)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xdddddd, 7)
    ambient.position.set(0, 20, 0)
    const directional = new THREE.DirectionalLight(0xffffff, 4)
    directional.position.set(14.179104477611936, -15.793010752688176, 10)
    scene.add(ambient, directional)

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/3d/draco/')
    dracoLoader.setDecoderConfig({ type: 'wasm' })
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let globeGroup
    let earth
    let graticules
    let skyDots
    let visible = true
    let documentActive = !document.hidden
    let frame = 0
    let disposed = false

    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      const distance = 25000
      renderer.setPixelRatio(width < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5))
      camera.aspect = width / height
      camera.fov = 2 * Math.atan(Math.sqrt((1.2 * height) ** 2 + (1.2 * width) ** 2) / (2 * distance)) * (180 / Math.PI)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const updateCamera = () => {
      const section = host.closest('section')
      if (!section) return
      const rect = section.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)))
      camera.position.lerpVectors(CAMERA_START, CAMERA_END, progress)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }

    const render = () => {
      if (!visible || !documentActive) return
      if (!reducedMotion.matches) {
        if (skyDots) skyDots.rotation.y += 0.002
        if (earth) earth.rotation.y += 0.003
        if (graticules) graticules.rotation.y += 0.005
      }
      updateCamera()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }

    const restart = () => {
      cancelAnimationFrame(frame)
      if (visible && documentActive) frame = requestAnimationFrame(render)
    }

    loader.load('/3d/earth.glb', (gltf) => {
      if (disposed) return
      const nodes = {}
      const materials = {}
      gltf.scene.traverse((object) => {
        if (object.name) nodes[object.name] = object
        if (object.material?.name) materials[object.material.name] = object.material
      })

      globeGroup = new THREE.Group()
      const dotReference = nodes.DotReference
      if (dotReference?.geometry) {
        const dot = new THREE.Mesh(dotReference.geometry, materials.DotReference || dotReference.material)
        dot.position.set(-0.191, -0.243, -0.03)
        dot.scale.set(0.053, 0.05, 0.05)
        globeGroup.add(dot)
      }
      if (nodes.Graticules?.geometry) {
        graticules = new THREE.Mesh(nodes.Graticules.geometry, materials['Graticules.001'] || nodes.Graticules.material)
        graticules.scale.set(1.017, 1.016, 1.017)
        globeGroup.add(graticules)
      }
      if (nodes.Earth?.geometry) {
        earth = new THREE.Mesh(nodes.Earth.geometry, materials.Earth || nodes.Earth.material)
        globeGroup.add(earth)
      }
      if (nodes.SkyDots?.geometry && dotReference?.material) {
        skyDots = new THREE.InstancedMesh(nodes.SkyDots.geometry, materials.DotReference || dotReference.material, 20000)
        if (nodes.SkyDots.instanceMatrix) skyDots.instanceMatrix.copy(nodes.SkyDots.instanceMatrix)
        skyDots.scale.set(1.026, 1.016, 1.026)
        globeGroup.add(skyDots)
      }
      scene.add(globeGroup)
      setFallback(false)
      restart()
    }, undefined, () => setFallback(true))

    const resizeObserver = new ResizeObserver(resize)
    const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; restart() }, { rootMargin: '16px 0px' })
    const onVisibility = () => { documentActive = !document.hidden; restart() }
    const onContextLost = (event) => { event.preventDefault(); setFallback(true) }

    resizeObserver.observe(host)
    intersectionObserver.observe(host)
    document.addEventListener('visibilitychange', onVisibility)
    reducedMotion.addEventListener('change', restart)
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    resize()
    restart()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener('change', restart)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      dracoLoader.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="ot-signal-globe" ref={hostRef}>
      {fallback ? <img src="/images/spur-earth-fallback.webp" alt="Abstract globe of connected digital signals" /> : null}
    </div>
  )
}

export default SignalGlobe
