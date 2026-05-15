import { HTMLContainer, Rectangle2d, ShapeUtil, T, resizeBox, type TLResizeInfo } from 'tldraw'
import type { GroupRegionShape } from '../types'

export class GroupRegionShapeUtil extends ShapeUtil<GroupRegionShape> {
  static override type = 'group-region' as const
  static override props = {
    w: T.number,
    h: T.number,
    label: T.string,
    createdAt: T.string,
    updatedAt: T.string,
  }

  override canEdit() {
    return true
  }

  override canResize() {
    return true
  }

  override getDefaultProps(): GroupRegionShape['props'] {
    const now = new Date().toISOString()
    return {
      w: 460,
      h: 320,
      label: 'Group',
      createdAt: now,
      updatedAt: now,
    }
  }

  override getGeometry(shape: GroupRegionShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override component(shape: GroupRegionShape) {
    return (
      <HTMLContainer>
        <div className="group-region" style={{ width: shape.props.w, height: shape.props.h }}>
          <div className="group-region-label">{shape.props.label || 'Group'}</div>
        </div>
      </HTMLContainer>
    )
  }

  override getIndicatorPath(shape: GroupRegionShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, 20)
    return path
  }

  override onResize(shape: GroupRegionShape, info: TLResizeInfo<GroupRegionShape>) {
    return resizeBox(shape, info, { minWidth: 220, minHeight: 150 })
  }
}
