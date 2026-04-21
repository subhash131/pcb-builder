import { 
  BaseBoxShapeUtil, 
  HTMLContainer, 
  TLBaseShape,
  Rectangle2d 
} from 'tldraw'
import { mmToPx } from '@workspace/core'

export type BoardOutlineShape = TLBaseShape<
  'board-outline',
  {
    w: number  // mm
    h: number // mm
  }
>

export class BoardOutlineShapeUtil extends BaseBoxShapeUtil<BoardOutlineShape> {
  static override type = 'board-outline' as const

  override getDefaultProps(): BoardOutlineShape['props'] {
    return {
      w: 100,
      h: 80,
    }
  }

  override getGeometry(shape: BoardOutlineShape) {
    return new Rectangle2d({
      width: mmToPx(shape.props.w),
      height: mmToPx(shape.props.h),
      isFilled: false,
    })
  }

  override component(shape: BoardOutlineShape) {
    const { w, h } = shape.props

    return (
      <HTMLContainer
        style={{
          width: mmToPx(w),
          height: mmToPx(h),
          border: '2px solid #ffff00', // Yellow board outline as per standard
          boxSizing: 'border-box',
          pointerEvents: 'none',
          backgroundColor: 'rgba(0, 50, 0, 0.4)', // Dark FR4-ish green
        }}
      />
    )
  }

  override indicator(shape: BoardOutlineShape) {
    return <rect width={mmToPx(shape.props.w)} height={mmToPx(shape.props.h)} />
  }
}
