import { AlignSize } from './alignSize'
import { Animation } from './animation'
import { ChunkSize } from './chunkSize'
import { Counter } from './counter'
import { DragBehaviour } from './dragBehaviour'
import { InfiniteShifter } from './infiniteShifter'
import { Limit } from './limit'
import { Mover } from './mover'
import { Options } from './options'
import { Pointer } from './pointer'
import { TargetFinder } from './targetFinder'
import { Translate } from './translate'
import { Traveller } from './traveller'
import { rectWidth } from './utils'
import { Vector1D } from './vector1d'
import { VectorBounds } from './vectorBounds'
import { VectorLooper } from './vectorLooper'

export interface Engine {
  animation: Animation
  bounds: VectorBounds
  index: Counter
  pointer: DragBehaviour
  target: Vector1D
  translate: Translate
  travel: Traveller
  infinite: VectorLooper
  shifter: InfiniteShifter
  mover: Mover
}

export function Engine(
  root: HTMLElement,
  container: HTMLElement,
  slides: HTMLElement[],
  options: Options,
): Engine {
  // Options
  const { align, startIndex, loop, speed } = options
  const speedLimit = Limit({ low: 5, high: 20 })

  // Index
  const index = Counter({
    limit: Limit({ low: 0, high: slides.length - 1 }),
    loop,
    start: startIndex,
  })

  // Measurements
  const rootSize = rectWidth(container)
  const chunkSize = ChunkSize(rootSize)
  const alignSize = AlignSize({ align, root: chunkSize.getRoot })
  const slideSizes = slides.map(rectWidth).map(chunkSize.measure)
  const alignSizes = slideSizes.map(alignSize.measure)
  const contentSize = slideSizes.reduce((a, s) => a + s, 0)
  const diffDistances = slideSizes.map((size, current) => {
    const counter = index.clone()
    const next = counter.set(current + 1).get()
    return size + alignSizes[current] - alignSizes[next]
  })
  const slidePositions = slides.map((s, i) => {
    const distances = diffDistances.slice(0, i)
    return distances.reduce((a, d) => a - d, alignSizes[0])
  })
  const highLimit = alignSizes[0]
  const lowLimit =
    -contentSize +
    alignSizes[0] +
    (loop ? chunkSize.measure(1) : slideSizes[index.max])
  const limit = Limit({ high: highLimit, low: lowLimit })

  // Draw
  const direction = (): number =>
    pointer.isDown()
      ? pointer.direction.get()
      : slider.mover.direction.get()

  const update = (): void => {
    if (!pointer.isDown()) {
      if (!loop) {
        slider.bounds.constrain(target)
      }
      slider.mover.seek(target).update()

      if (slider.mover.settle(target)) {
        slider.animation.stop()
        slider.translate.useDefault()
      }
    }
    if (loop) {
      slider.infinite.loop(direction())
      slider.shifter.shiftAccordingTo(slider.mover.location)
    }
    slider.translate.to(slider.mover.location).use3d()
    slider.animation.proceed()
  }

  // Shared
  const animation = Animation(update)
  const startLocation = slidePositions[index.get()]
  const location = Vector1D(startLocation)
  const target = Vector1D(startLocation)
  const onSelect = () => options.onSelect(slider.index.get())
  const mover = Mover({
    location,
    mass: 1.5,
    maxForce: chunkSize.getRoot * 2,
    speed: speedLimit.constrain(speed),
  })
  const travel = Traveller({
    animation,
    findTarget: TargetFinder({
      diffDistances,
      index,
      location,
      loop,
    }),
    index,
    moverTarget: target,
    onSelect,
  })

  // Pointer
  const pointer = DragBehaviour({
    animation,
    element: root,
    index,
    limit,
    location,
    loop: options.loop,
    mover,
    onSelect,
    pointer: Pointer(chunkSize),
    target,
    travel,
  })

  // Slider
  const slider = {
    animation,
    bounds: VectorBounds({
      animation,
      limit,
      location,
      mover,
      tolerance: 50,
    }),
    index,
    infinite: VectorLooper({
      limit,
      location,
      span: contentSize,
      vectors: [location, target, pointer.dragStartLocation],
    }),
    mover,
    pointer,
    shifter: InfiniteShifter({
      alignSizes,
      chunkSize,
      itemSizes: slideSizes,
      items: slides,
    }),
    target,
    translate: Translate(container),
    travel,
  }

  return slider
}
