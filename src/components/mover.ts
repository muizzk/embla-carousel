import { Direction } from './direction'
import { map } from './utils'
import { Vector1D } from './vector1d'

interface Params {
  location: Vector1D
  speed: number
  mass: number
  maxForce: number
}

export interface Mover {
  update(): Mover
  seek(target: Vector1D): Mover
  settle(target: Vector1D): boolean
  useSpeed(newSpeed: number): Mover
  useDefaultSpeed(): Mover
  location: Vector1D
  direction: Direction
}

export function Mover(params: Params): Mover {
  const self = {} as Mover
  const { location, speed, mass, maxForce } = params
  const velocity = Vector1D(0)
  const acceleration = Vector1D(0)
  const attraction = Vector1D(0)
  const direction = Direction(0)
  const state = { speed }

  function update(): Mover {
    velocity.add(acceleration)
    location.add(velocity)
    acceleration.multiply(0)
    return self
  }

  function applyForce(force: Vector1D): Mover {
    force.divide(mass)
    acceleration.add(force)
    return self
  }

  function seek(target: Vector1D): Mover {
    attraction.set(target).subtract(location)
    const mag = attraction.magnitude()
    const m = map(mag, 0, 100, 0, state.speed)
    direction.set(attraction)
    attraction
      .normalize()
      .multiply(m)
      .subtract(velocity)
      .limit(maxForce)
    applyForce(attraction)
    return self
  }

  function settle(target: Vector1D): boolean {
    const diff = target.get() - location.get()
    const diffRounded = Math.round(diff * 100) / 100
    const hasSettled = !diffRounded
    if (hasSettled) {
      location.set(target)
    }
    return hasSettled
  }

  function setSpeed(newSpeed: number): Mover {
    if (state.speed !== newSpeed) {
      state.speed = newSpeed
    }
    return self
  }

  return Object.assign(self, {
    direction,
    location,
    seek,
    settle,
    update,
    useDefaultSpeed: () => setSpeed(speed),
    useSpeed: setSpeed,
  })
}
