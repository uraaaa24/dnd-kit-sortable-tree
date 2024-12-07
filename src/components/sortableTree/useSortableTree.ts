'use client'

import { FlattenedItem, FlattenedItems, SensorContext, TreeItem } from '@/type/treeItem'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Announcements,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  Modifier,
  UniqueIdentifier
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
  const [currentPosition, setCurrentPosition] = useState<{
    parentId: UniqueIdentifier | null
    overId: UniqueIdentifier | null
  } | null>(null)
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

  // const [coordinteGetter] = useState(() =>
  //   sortableTreeKeyboardCoordinates(sensorContext, indicator, indentationWidth)
  // )
  // const sensors = useSensors(
  //   useSensor(PointerSensor),
  //   useSensor(KeyboardSensor, {
  //     coordinateGetter,
  //   })
  // );

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
    setCurrentPosition(null)

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

      // Update depth and parentId
      clonedItems[activeIndex] = { ...activeItem, depth, parentId }

      // Move children with parent
      clonedItems.forEach((item) => {
        if (childrenIds.includes(item.id)) {
          item.depth = depth + 1
        }
      })

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex)
      const newItems = buildTree(sortedItems)

      // Remove moved items from expandedIds if they are nested under another item
      setExpandedIds((expandedIds) => expandedIds.filter((id) => !childrenIds.includes(id)))

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

  // TODO: しっかり実装を見る
  function getMovementAnnouncement(
    eventName: string,
    activeId: UniqueIdentifier,
    overId?: UniqueIdentifier
  ) {
    if (overId && projected) {
      if (eventName !== 'onDragEnd') {
        if (
          currentPosition &&
          projected.parentId === currentPosition.parentId &&
          overId === currentPosition.overId
        ) {
          return
        } else {
          setCurrentPosition({
            parentId: projected.parentId,
            overId
          })
        }
      }

      const clonedItems: FlattenedItems = JSON.parse(JSON.stringify(flattenTree(items)))
      const overIndex = clonedItems.findIndex(({ id }) => id === overId)
      const activeIndex = clonedItems.findIndex(({ id }) => id === activeId)
      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex)

      const previousItem = sortedItems[overIndex - 1]

      let announcement
      const movedVerb = eventName === 'onDragEnd' ? 'dropped' : 'moved'
      const nestedVerb = eventName === 'onDragEnd' ? 'dropped' : 'nested'

      if (!previousItem) {
        const nextItem = sortedItems[overIndex + 1]
        announcement = `${activeId} was ${movedVerb} before ${nextItem.id}.`
      } else {
        if (projected.depth > previousItem.depth) {
          announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`
        } else {
          let previousSibling: FlattenedItem | undefined = previousItem
          while (previousSibling && projected.depth < previousSibling.depth) {
            const parentId: UniqueIdentifier | null = previousSibling.parentId
            previousSibling = sortedItems.find(({ id }) => id === parentId)
          }

          if (previousSibling) {
            announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`
          }
        }
      }

      return announcement
    }

    return
  }

  // TODO: しっかり実装を見る
  const adjustTranslate: Modifier = ({ transform }) => {
    return {
      ...transform,
      y: transform.y - 25
    }
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`
    },
    onDragMove({ active, over }) {
      return getMovementAnnouncement('onDragMove', active.id, over?.id)
    },
    onDragOver({ active, over }) {
      return getMovementAnnouncement('onDragOver', active.id, over?.id)
    },
    onDragEnd({ active, over }) {
      return getMovementAnnouncement('onDragEnd', active.id, over?.id)
    },
    onDragCancel({ active }) {
      return `Moving was cancelled. ${active.id} was dropped in its original position.`
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
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleToggleExpand,
    announcements,
    adjustTranslate
  }
}
