import { Limit } from './limit'

interface Params {
  start: number
  limit: Limit
  loop: boolean
}

export interface Counter {
  min: number
  max: number
  get(): number
  set(n: number): Counter
  add(n: number): Counter
  clone(): Counter
}

export function Counter(params: Params): Counter {
  const self = {} as Counter
  const { start, limit, loop } = params
  const type = loop ? 'loop' : 'constrain'
  const state = { value: withinLimit(start) }

  function get(): number {
    return state.value
  }

  function set(n: number): Counter {
    state.value = withinLimit(n)
    return self
  }

  function withinLimit(n: number): number {
    return limit[type](n)
  }

  function add(n: number): Counter {
    if (n !== 0) {
      const one = n / Math.abs(n)
      set(get() + one)
      return add(n + one * -1)
    }
    return self
  }

  function clone(): Counter {
    const s = get()
    return Counter({ start: s, limit, loop })
  }

  return Object.assign(self, {
    add,
    clone,
    get,
    max: limit.high,
    min: limit.low,
    set,
  })
}
