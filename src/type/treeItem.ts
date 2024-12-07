import { UniqueIdentifier } from '@dnd-kit/core'
import type { MutableRefObject } from 'react'

export type TreeItem = {
  id: string
  name: string
  children: TreeItem[]
  expanded: boolean
}

export type TreeItems = TreeItem[]

export type FlattenedItem = TreeItem & {
  depth: number
  parentId: UniqueIdentifier | null
  index: number
}

export type FlattenedItems = FlattenedItem[]

export type SensorContext = MutableRefObject<{
  items: FlattenedItems
  offset: number
}>
