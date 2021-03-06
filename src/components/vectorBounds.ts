import { Animation } from './animation'
import { Limit } from './limit'
import { Mover } from './mover'
import { Vector1D } from './vector1d'

interface Params {
  limit: Limit
  location: Vector1D
  mover: Mover
  animation: Animation
  tolerance: number
}

export interface VectorBounds {
  constrain(v: Vector1D): VectorBounds
}

export function VectorBounds(params: Params): VectorBounds {
  const self = {} as VectorBounds
  const { limit, location, mover, animation, tolerance } = params
  const state = { timeout: 0 }

  function shouldConstrain(v: Vector1D): boolean {
    const l = location.get()
    const isLowLimit = v.get() === limit.low
    const isHighLimit = v.get() === limit.high
    return (
      (limit.reached.low(l) && !isLowLimit) ||
      (limit.reached.high(l) && !isHighLimit)
    )
  }

  function constrain(v: Vector1D): VectorBounds {
    if (!state.timeout && shouldConstrain(v)) {
      const constraint = limit.constrain(v.get())
      state.timeout = window.setTimeout(() => {
        v.setNumber(constraint)
        mover.useSpeed(10)
        animation.start()
        state.timeout = 0
      }, tolerance)
    }
    return self
  }

  return Object.assign(self, {
    constrain,
  })
}
