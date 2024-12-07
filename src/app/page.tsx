import SortableTree from '@/components/sortableTree'
import { initialItems } from '@/dummy/treeItems'

export default function Home() {
  return (
    <div className="min-h-screen  bg-gray-50 flex items-center justify-center p-4">
      <main className="w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="bg-gray-100 border-b border-gray-200 p-4 text-gray-700 font-semibold">
          ドラッグ可能な階層ツリーのサンプル
        </div>
        <div className="p-6">
          <SortableTree defaultItems={initialItems} />
        </div>
        <div className=" bg-gray-50  border-t  border-gray-200 p-4  text-xs  text-gray-500  text-center">
          ツリーアイテムをドラッグ＆ドロップで並び替えできます
        </div>
      </main>
    </div>
  )
}
