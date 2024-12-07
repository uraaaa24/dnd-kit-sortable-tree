import { TreeItem } from '@/type/treeItem'

export const initialItems: TreeItem[] = [
  {
    id: 'root',
    name: 'root',
    children: [
      {
        id: '1',
        name: '1',
        children: [
          {
            id: '1-1',
            name: '1-1',
            children: [],
            collapsed: false
          }
        ],
        collapsed: false
      },
      {
        id: '2',
        name: '2',
        children: [],
        collapsed: false
      }
    ],
    collapsed: false
  },
  {
    id: '3',
    name: '3',
    children: [],
    collapsed: false
  },
  {
    id: '4',
    name: '4',
    children: [],
    collapsed: false
  },
  {
    id: '5',
    name: '5',
    children: [
      {
        id: '5-1',
        name: '5-1',
        children: [],
        collapsed: false
      },
      {
        id: '5-2',
        name: '5-2',
        children: [],
        collapsed: false
      }
    ],
    collapsed: false
  }
]
