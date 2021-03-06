import { Vector1D } from './vector1d'

type Translates = 'x' | 'x3d'

export interface Translate {
  to(vector: Vector1D): Translate
  useDefault(): Translate
  use3d(): Translate
}

export function Translate(node: HTMLElement): Translate {
  const self = {} as Translate
  const state = { translateType: 'x' as Translates }
  const translates = { x, x3d }

  function x(xValue: number): string {
    return `translateX(${xValue}%)`
  }

  function x3d(xValue: number): string {
    return `translate3d(${xValue}%,0px,0px)`
  }

  function to(vector: Vector1D): Translate {
    const t = state.translateType
    const v = vector.get()
    node.style.transform = translates[t](v)
    return self
  }

  function setType(type: Translates): Translate {
    if (state.translateType !== type) {
      state.translateType = type
    }
    return self
  }

  return Object.assign(self, {
    to,
    use3d: () => setType('x3d'),
    useDefault: () => setType('x'),
  })
}
