import { render } from 'react-dom'
import { TextureLoader, Math as ThreeMath, UniformsUtils } from 'three'
import { useSpring, useTransition, animated, config } from 'react-spring/three'
import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useDrag } from 'react-use-gesture'
import { Canvas, useThree } from 'react-three-fiber'
import { HoverImageShader } from './resources/index'
import image2 from './resources/images/smiling.jpg'
import './styles.css'

const image = 'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=934&q=80'
const { degToRad } = ThreeMath
const loader = new TextureLoader()

function Texture({ texture, hoverValue, opacity, onHover, ...props }) {
  return (
    <animated.mesh onPointerMove={e => onHover(true)} onPointerOver={e => onHover(true)} onPointerOut={e => onHover(false)} {...props}>
      <planeBufferGeometry attach="geometry" args={[5, 7]} />
      <animated.shaderMaterial
        attach="material"
        transparent
        args={[{ ...HoverImageShader, uniforms: UniformsUtils.clone(HoverImageShader.uniforms) }]}
        uniforms-texture-value={texture}
        uniforms-hover-value={hoverValue}
        uniforms-opacity-value={opacity}
      />
    </animated.mesh>
  )
}

function Image({ url, backUrl, rotation, ...props }) {
  const [hovered, setHover] = useState(false)

  const { invalidate } = useThree()
  const textures = useMemo(() => {
    return [{ id: 'front', texture: loader.load(url, invalidate), deg: 0 }, { id: 'back', texture: loader.load(backUrl, invalidate), deg: 180 }]
  }, [url, backUrl, invalidate])

  const { hoverValue } = useSpring({
    hoverValue: hovered ? 1 : 0,
    config: config.molasses
  })

  const transitions = useTransition(textures, item => item.id, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: config.default
  })

  return transitions.map(({ item: { texture, deg }, props: { opacity }, key }) => (
    <Texture
      key={key}
      {...props}
      texture={texture}
      hoverValue={hoverValue}
      onHover={setHover}
      rotation={rotation.interpolate((x, y, z) => [degToRad(x), degToRad(y + deg), degToRad(z)])}
      opacity={opacity}
    />
  ))
}

function App() {
  const dragDelta = useRef(0)

  const [props, set] = useSpring(() => ({
    pos: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    config: { mass: 10, tension: 1000, friction: 300, precision: 0.00001 }
  }))

  const [{ rotation }, setRotation] = useSpring(() => ({
    rotation: [0, 0, 0],
    config: { mass: 10, tension: 1000, friction: 300, precision: 0.00001 }
  }))

  const onClick = useCallback(
    e => {
      // filter clicks from dragging
      if (dragDelta.current < 100) {
        const [x, y, z] = rotation.getValue()

        setRotation({
          rotation: [x, y + 180, z],
          config: config.default
        })
      }
    },
    [rotation, setRotation]
  )

  const bind = useDrag(({ first, last, time, down, delta, velocity, direction, memo = rotation.getValue() }) => {
    if (first) {
      dragDelta.current = time
    }

    if (last) {
      dragDelta.current = time - dragDelta.current
    }

    const x = memo[0] + (delta[1] / window.innerWidth) * 180
    const y = memo[1] + (delta[0] / window.innerHeight) * 180
    const vxyz = [direction[1] * (velocity / 1), direction[0] * (velocity / 1), 0]

    setRotation({
      rotation: [x, y, 0],
      immediate: down,
      config: { velocity: vxyz, decay: true }
    })

    return memo
  })

  return (
    <div
      className="main"
      {...bind()}
      onMouseMove={({ clientX, clientY }) => {
        const x = (clientX / window.innerWidth) * 2 - 1
        const y = -(clientY / window.innerHeight) * 2 + 1

        set({
          pos: [x, 0, 0],
          scale: [1 - y * 0.1, 1 - y * 0.1, 1]
        })
      }}>
      <Canvas pixelRatio={window.devicePixelRatio || 1} style={{ background: '#272727' }} camera={{ fov: 75, position: [0, 0, 7] }}>
        <Image url={image} backUrl={image2} {...props} onClick={onClick} rotation={rotation} />
      </Canvas>
      <a href="https://codepen.io/frost084/full/OKZNRm" className="top-left">
        Hover effect by TheFrost
      </a>
      <a href="https://codesandbox.io/s/react-three-fiber-hover-zoom-channel-displacement-4o8gj" className="bottom-left">
        Previous demo
      </a>
      <a href="https://codesandbox.io/s/react-three-fiber-rotate-video-4sz8c" className="bottom-right">
        Next demo
      </a>
    </div>
  )
}

render(<App />, document.getElementById('root'))
