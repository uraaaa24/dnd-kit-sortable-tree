'use client'

import { FlattenedItem, FlattenedItems, SensorContext, TreeItem } from '@/type/treeItem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  MeasuringStrategy,
  closestCenter,
  UniqueIdentifier,
  SensorDescriptor,
  SensorOptions
} from '@dnd-kit/core'
import { buildTree, flattenTree, getChildrenIds, getProjection } from '@/utils'
import { arrayMove } from '@dnd-kit/sortable'

const DEFAULT_INDENTATION_WIDTH = 50

export const useSortableTree = ({
  defaultItems,
  indentationWidth = DEFAULT_INDENTATION_WIDTH,
  indicator = false
}: {
  defaultItems: TreeItem[]
  indentationWidth?: number
  indicator?: boolean
}) => {
  const [items, setItems] = useState(defaultItems)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
  const [offsetLeft, setOffsetLeft] = useState(0)

  const [expandedIds, setExpandedIds] = useState<UniqueIdentifier[]>([])

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items)
    const expandedItems = flattenedTree.filter(
      ({ parentId }) => parentId === null || expandedIds.includes(parentId)
    )

    return expandedItems
  }, [items, expandedIds])

  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
      : null

  const sensorContext: SensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft
  })

  const sortedIds = useMemo(() => {
    return flattenedItems.map(({ id }) => id)
  }, [flattenedItems])

  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft
    }
  }, [flattenedItems, offsetLeft])

  const resetState = () => {
    setOverId(null)
    setActiveId(null)
    setOffsetLeft(0)

    document.body.style.setProperty('cursor', '')
  }

  const handleDragStart = useCallback(
    ({ active: { id: activeId } }: DragStartEvent) => {
      setActiveId(activeId)
      setOverId(activeId)

      const childrenIds = getChildrenIds(flattenedItems, activeId)
      setExpandedIds((expandedIds) =>
        expandedIds.filter(
          (expandedId) => expandedId !== activeId && !childrenIds.includes(expandedId)
        )
      )

      document.body.style.setProperty('cursor', 'grabbing')
    },
    [flattenedItems]
  )

  const handleDragMove = ({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x)
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverId(over?.id ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    resetState()

    if (projected && over) {
      const { depth, parentId } = projected

      const clonedItems: FlattenedItems = JSON.parse(JSON.stringify(flattenTree(items)))
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id)
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id)

      if (activeIndex === -1 || overIndex === -1) return

      const activeItem = clonedItems[activeIndex]
      const childrenIds = getChildrenIds(clonedItems, activeItem.id)

      clonedItems[activeIndex] = { ...activeItem, depth, parentId }

      clonedItems.forEach((item) => {
        if (childrenIds.includes(item.id)) {
          item.depth = depth + 1
        }
      })

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex)
      const newItems = buildTree(sortedItems)

      setExpandedIds((expandedIds) => {
        const newExpandedIds = expandedIds.filter((id) => !childrenIds.includes(id))
        if (parentId) {
          newExpandedIds.push(parentId)
        }

        return Array.from(new Set(newExpandedIds))
      })

      setItems(newItems)
    }
  }

  const handleDragCancel = () => {
    resetState()
  }

  const handleToggleExpand = useCallback(
    (id: UniqueIdentifier) => {
      setExpandedIds((expandedIds) => {
        if (expandedIds.includes(id)) {
          const childrenIds = getChildrenIds(items, id)
          return expandedIds.filter(
            (expandedId) => expandedId !== id && !childrenIds.includes(expandedId)
          )
        } else {
          return [...new Set([...expandedIds, id])]
        }
      })
    },
    [items]
  )

  const getDndContextProps = (
    sensors: SensorDescriptor<SensorOptions>[],
    measuring: {
      droppable: {
        strategy: MeasuringStrategy
      }
    }
  ) => {
    return {
      sensors,
      measuring,
      collisionDetection: closestCenter,
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel
    }
  }

  const getSortableTreeItemProps = (
    item: FlattenedItem,
    indentationWidth = DEFAULT_INDENTATION_WIDTH
  ) => {
    return {
      item,
      depth: item.id === activeId && projected ? projected.depth : item.depth,
      onExpand: item.children.length > 0 ? () => handleToggleExpand(item.id) : undefined,
      expanded: item.children.length > 0 && expandedIds.includes(item.id),
      indentationWidth
    }
  }

  return {
    items,
    flattenedItems,
    activeId,
    overId,
    sortedIds,
    indicator,
    activeItem,
    projected,
    expandedIds,
    getDndContextProps,
    getSortableTreeItemProps,
    handleToggleExpand
  }
}
