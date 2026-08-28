import { useCallback, useEffect, useState } from 'react'
import { FiBookmark, FiFolder, FiTag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getCategoryTree } from '../api/categories'
import { getAllTags } from '../api/tags'
import type { CategoryResponse, TagResponse } from '../types'
import BookmarksTab from '../manage/BookmarksTab'
import CategoriesTab from '../manage/CategoriesTab'
import TagsTab from '../manage/TagsTab'

type TabKey = 'bookmarks' | 'categories' | 'tags'

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'bookmarks', label: '书签', icon: FiBookmark },
  { key: 'categories', label: '分类', icon: FiFolder },
  { key: 'tags', label: '标签', icon: FiTag },
]

export default function Manage() {
  const [tab, setTab] = useState<TabKey>('bookmarks')
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [allTags, setAllTags] = useState<TagResponse[]>([])

  const loadMeta = useCallback(async () => {
    const [catRes, tagRes] = await Promise.all([getCategoryTree(), getAllTags()])
    setCategories(catRes.data)
    setAllTags(tagRes.data)
  }, [])

  useEffect(() => {
    loadMeta().catch(() => toast.error('加载基础数据失败'))
  }, [loadMeta])

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">书签管理</h1>
        <p className="text-xs text-gray-500 mt-0.5">编辑书签、批量调整分类与标签，管理分类树和标签</p>
      </div>

      <div className="flex items-center gap-1 mb-5 border-b border-black/5 dark:border-white/5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-accent-500 text-accent-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="glass rounded-xl p-4 sm:p-6">
        {tab === 'bookmarks' && <BookmarksTab categories={categories} allTags={allTags} reloadMeta={loadMeta} />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'tags' && <TagsTab />}
      </div>
    </div>
  )
}
