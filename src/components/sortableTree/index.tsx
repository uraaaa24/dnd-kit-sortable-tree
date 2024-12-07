'use client'

import { TreeItem } from '@/type/treeItem'
import React from 'react'
import { useSortableTree } from './useSortableTree'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { SortableTreeItem } from './sortableTreeItem'

const INDENTION_WIDTH = 20

type SortableTreeProps = {
  defaultItems: TreeItem[]
}

const SortableTree = ({ defaultItems }: SortableTreeProps) => {
  const {
    flattenedItems,
    activeId,
    sortedIds,
    expandedIds,
    projected,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleToggleExpand
  } = useSortableTree({ defaultItems })

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
      </SortableContext>
    </DndContext>
  )
}

export default SortableTree
