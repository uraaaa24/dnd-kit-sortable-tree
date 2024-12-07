'use client'

import { TreeItem } from '@/type/treeItem'
import React from 'react'
import { useSortableTree } from './useSortableTree'
import {
  defaultDropAnimation,
  DndContext,
  DragOverlay,
  DropAnimation,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { SortableTreeItem } from './sortableTreeItem'
import { CSS } from '@dnd-kit/utilities'
import { getChildrenIds } from '@/utils'
import { createPortal } from 'react-dom'

const INDENTION_WIDTH = 20

// https://docs.dndkit.com/api-documentation/context-provider#layout-measuring
const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always
  }
}

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5
        })
      }
    ]
  },
  easing: 'ease-out',
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing
    })
  }
}

type SortableTreeProps = {
  defaultItems: TreeItem[]
}

const SortableTree = ({ defaultItems }: SortableTreeProps) => {
  const {
    flattenedItems,
    activeId,
    activeItem,
    sortedIds,
    expandedIds,
    projected,
    getDndContextProps,
    handleToggleExpand
  } = useSortableTree({ defaultItems })

  const sensors = useSensors(useSensor(PointerSensor))

  return (
    <DndContext sensors={sensors} {...getDndContextProps(measuring)}>
      <SortableContext items={sortedIds}>
        {flattenedItems.map((item) => (
          <SortableTreeItem
            key={item.id}
            item={item}
            depth={item.id === activeId && projected ? projected.depth : item.depth}
            onExpand={item.children.length > 0 ? () => handleToggleExpand(item.id) : undefined}
            expanded={item.children.length > 0 && expandedIds.includes(item.id)}
            indentionWidth={INDENTION_WIDTH}
          />
        ))}

        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeId && activeItem && (
              <SortableTreeItem
                item={activeItem}
                depth={activeItem.depth}
                indentionWidth={INDENTION_WIDTH}
                clone
                childrenCount={getChildrenIds(flattenedItems, activeId).length}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  )
}

export default SortableTree
