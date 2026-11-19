import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

/**
 * The landing "screen": a brushed-gold sculpture seen through fluted glass.
 * Technique after Miro Leon Bucher's displacement-map ShaderPass tutorial
 * (see docs/CREDITS.md). Differences: the glass ribs are generated in the
 * shader (no texture download), the environment is three's RoomEnvironment
 * (no HDR download), and nothing renders while the screen is hidden,
 * scrolled away, or paused.
 */

const FLUTED = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uRibs: { value: 26.0 },
    uStrength: { value: 0.018 },
    uBand: { value: new THREE.Vector2(0.16, 0.84) },
    uAspect: { value: 1.0 },
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
    uniform float uRibs;
    uniform float uStrength;
    uniform vec2 uBand;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      float inBand = step(uBand.x, uv.x) * step(uv.x, uBand.y);
      // Each rib is a little cylindrical lens: offset grows from its centre to its edges.
      float ribs = uRibs * uAspect;
      float r = fract(uv.x * ribs) - 0.5;
      float lens = r * abs(r) * 4.0;
      vec2 duv = uv + vec2(lens * uStrength * inBand, 0.0);
      // A hint of dispersion at the rib edges
      float ca = 0.0025 * inBand * abs(r) * 2.0;
      vec3 col;
      col.r = texture2D(tDiffuse, duv + vec2(ca, 0.0)).r;
      col.g = texture2D(tDiffuse, duv).g;
      col.b = texture2D(tDiffuse, duv - vec2(ca, 0.0)).b;
      // Rib highlights and the two hairline edges of the glass panel
      float sheen = smoothstep(0.42, 0.5, abs(r)) * 0.06 * inBand;
      float edge = (1.0 - smoothstep(0.0, 0.0018, abs(uv.x - uBand.x))) + (1.0 - smoothstep(0.0, 0.0018, abs(uv.x - uBand.y)));
      col += sheen + edge * 0.22;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

export default function GlassScreen({ paused, onReady }: { paused: boolean; onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  const kick = useRef<() => void>(() => {})

  useEffect(() => {
    pausedRef.current = paused
    kick.current()
  }, [paused])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = matchMedia('(max-width: 767px)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: 'high-performance', alpha: false })
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.4 : 1.75))
    renderer.setClearColor(0x000000)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.075)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 9)

    // Sculpture: a gold knot held inside three slow rings, like reels on a spindle.
    const gold = new THREE.MeshPhysicalMaterial({ color: 0xd7ac54, metalness: 1, roughness: 0.26, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 1.35 })
    const darkGold = new THREE.MeshPhysicalMaterial({ color: 0x8a6a2c, metalness: 1, roughness: 0.42, envMapIntensity: 1.0 })
    const group = new THREE.Group()
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.25, 0.34, small ? 160 : 260, small ? 24 : 40, 2, 3), gold)
    group.add(knot)
    const rings = [2.35, 2.75, 3.15].map((r, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018 + i * 0.006, 8, 180), i === 1 ? gold : darkGold)
      m.rotation.set(Math.PI / 2 + i * 0.35, i * 0.6, 0)
      group.add(m)
      return m
    })
    scene.add(group)

    const key = new THREE.DirectionalLight(0xfff1d6, 2.2)
    key.position.set(4, 5, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x3d8f9b, 1.4) // brand teal, brightened, from behind
    rim.position.set(-5, -2, -6)
    scene.add(rim)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const after = new AfterimagePass(0.82)
    composer.addPass(after)
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.6, 0.62)
    composer.addPass(bloom)
    const fluted = new ShaderPass(FLUTED)
    composer.addPass(fluted)
    composer.addPass(new OutputPass())

    // Size to the container, not the window
    const resize = () => {
      const w = Math.max(1, el.clientWidth)
      const h = Math.max(1, el.clientHeight)
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      composer.setSize(w, h)
      bloom.resolution.set(w / 2, h / 2)
      camera.aspect = w / h
      // Keep the sculpture inside narrow (portrait) screens
      camera.position.z = w / h < 0.8 ? 12.5 : w / h < 1.1 ? 10.5 : 9
      camera.updateProjectionMatrix()
      fluted.uniforms.uAspect.value = Math.min(1.6, Math.max(0.55, w / h))
      if (!running) draw(lastT)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    // Pointer parallax (fine pointers only; phones keep the scripted orbit)
    const target = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      target.x = (e.clientX / innerWidth - 0.5) * 0.6
      target.y = (e.clientY / innerHeight - 0.5) * 0.4
    }
    addEventListener('pointermove', onMove, { passive: true })

    let theta = 0.6
    let lastT = 0
    let raf = 0
    let running = false
    let visible = true
    let shown = false

    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016)
      lastT = t
      theta += dt * 0.3
      camera.position.x = Math.sin(theta) * 1.6 + target.x
      camera.position.y = Math.sin(theta * 0.7) * 0.8 - target.y
      camera.lookAt(0, 0, 0)
      knot.rotation.y += dt * 0.25
      knot.rotation.x = Math.sin(theta * 0.5) * 0.25
      rings.forEach((r, i) => (r.rotation.z += dt * (0.12 + i * 0.05) * (i % 2 ? -1 : 1)))
      composer.render(dt)
      if (!shown) {
        shown = true
        onReady?.()
      }
    }
    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const sync = () => {
      const should = visible && !pausedRef.current && !reduce && !document.hidden
      if (should && !running) {
        running = true
        lastT = performance.now()
        raf = requestAnimationFrame(loop)
      } else if (!should && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    }
    kick.current = sync

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      sync()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)

    resize()
    // Reduced motion: one still frame, settled
    if (reduce) {
      after.uniforms.damp.value = 0
      draw(performance.now())
    }
    sync()

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', sync)
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
      gold.dispose()
      darkGold.dispose()
      env.dispose()
      pmrem.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={host} className="absolute inset-0" />
}
