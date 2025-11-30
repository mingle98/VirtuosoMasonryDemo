import { VirtuosoMasonry } from '@virtuoso.dev/masonry'
import { useCallback, useEffect, useRef, useState } from 'react'
import { galleryItems, type GalleryItem } from '../data/gallery'
import './App2.css'

type MasonryItem = GalleryItem & { virtualId: string }

type TabId = 'discover' | 'shorts' | 'activity'


const getColumnsFromWidth = (width: number) => {
  if (width >= 1440) return 5
  if (width >= 1200) return 4
  if (width >= 768) return 3
  return 2
}

const useResponsiveColumns = () => {
  const getColumns = () =>
    typeof window === 'undefined' ? 3 : getColumnsFromWidth(window.innerWidth)

  const [columns, setColumns] = useState(getColumns)

  useEffect(() => {
    const handleResize = () => setColumns(getColumns())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return columns
}

const MasonryCard = ({ item }: { item: GalleryItem }) => (
  <article className="masonry-card">
    <div className="masonry-card__media" style={{
      width: '100%',
      aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : 'unknown',
    }}>
      <img
        src={item.src}
        alt={item.title}
        loading="lazy"
      />
    </div>
    <div className="masonry-card__body">
      <h3>{item.title}</h3>
    </div>
  </article>
)

const MasonryItemContent = ({ data }: { index: number; data: MasonryItem; context?: unknown }) => {
  if (!data) {
    return <div className="masonry-item" />
  }

  return (
    <div className="masonry-item">
      <MasonryCard item={data} />
    </div>
  )
}

const createBatch = (pageIndex: number): MasonryItem[] =>
  galleryItems.map((item, itemIndex) => ({
    ...item,
    // 给不同批次引入轻微高度扰动，让布局更自然
    height: item.height + ((pageIndex + itemIndex) % 3) * 12 - 8,
    virtualId: `${pageIndex}-${item.id}-${itemIndex}`,
  }))

function App() {
  const columnCount = useResponsiveColumns()
  const [activeTab, setActiveTab] = useState<TabId>('discover')
  
  // 为每个tab维护独立的数据和状态
  const [tabsData, setTabsData] = useState<Record<TabId, {
    items: MasonryItem[],
    page: number,
    isLoading: boolean,
  }>>({
    discover: { items: [], page: 0, isLoading: false },
    shorts: { items: [], page: 0, isLoading: false },
    activity: { items: [], page: 0, isLoading: false }
  })
  
  const loadingSentinelRef = useRef<HTMLDivElement>(null)

  // tab-navigation吸顶前距离页面顶部的固定距离（Agent横幅 + 标题区域的高度）
  const STICKY_OFFSET = 350

  const fetchMore = useCallback((tabId: TabId) => {
    const currentTab = tabsData[tabId]
    if (currentTab.isLoading) return
    
    setTabsData(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], isLoading: true }
    }))

    const nextPage = currentTab.page
    window.setTimeout(() => {
      const batch = createBatch(nextPage)
      setTabsData(prev => ({
        ...prev,
        [tabId]: {
          items: [...prev[tabId].items, ...batch],
          page: prev[tabId].page + 1,
          isLoading: false
        }
      }))
    }, 600)
  }, [tabsData])

  // 切换tab时恢复到合适的滚动位置
  const handleTabChange = (newTab: TabId) => {
    setActiveTab(newTab)
    // 切换后保持当前滚动位置，如果超过吸顶距离则保持吸顶，否则保持原位置
    const currentScroll = window.scrollY
    const targetScroll = currentScroll > STICKY_OFFSET ? STICKY_OFFSET : currentScroll
    setTimeout(() => {
      window.scrollTo(0, targetScroll)
    }, 0)
  }

  // 初始加载当前tab的数据
  useEffect(() => {
    if (tabsData[activeTab].items.length === 0) {
      fetchMore(activeTab)
    }
  }, [activeTab, fetchMore])

  // 页面加载时重置滚动位置
  useEffect(() => {
    // 确保页面刷新后从顶部开始
    window.scrollTo(0, 0)
    // 重置所有tab的滚动位置记录（如果未来添加了滚动位置保存功能）
  }, [])

  // 使用IntersectionObserver监听加载哨兵
  useEffect(() => {
    const sentinel = loadingSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !tabsData[activeTab].isLoading) {
          fetchMore(activeTab)
        }
      },
      {
        rootMargin: '300px'
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [activeTab, tabsData, fetchMore])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  const currentTabData = tabsData[activeTab]

  return (
    <div className="app-shell">
      {/* Agent 模式横幅 */}
      <header className="agent-banner">
        <div className="agent-banner__content">
          <div className="agent-banner__left">
            <h2>Agent 模式</h2>
            <p>灵感来了？一句话帮你开启创作</p>
          </div>
          <div className="agent-banner__categories">
            <div className="category-card">图片生成 ›</div>
            <div className="category-card">视频生成 ›</div>
            <div className="category-card">数字人 ›</div>
            <div className="category-card">动作模仿 ›</div>
          </div>
        </div>
      </header>

      {/* 标题区域 */}
      <section className="title-section">
        <div className="title-section__avatar">
          <div className="avatar-placeholder">+</div>
          <span className="user-id">2222222</span>
        </div>
        <h1 className="main-title">头部区域固定高度</h1>
        <div className="title-section__controls">
          <button className="mode-selector" type="button">
            <span className="icon-agent">✨</span> Agent 模式 ▼
          </button>
          <button className="auto-switch" type="button">
            ≡ 自动
          </button>
          <button className="back-to-top" type="button" onClick={scrollToTop}>
            ↑
          </button>
        </div>
      </section>

      {/* Tab 导航 */}
      <nav className="tab-navigation">
        <div className="tab-list">
          <button 
            className={`tab-item ${activeTab === 'discover' ? 'tab-item--active' : ''}`}
            onClick={() => handleTabChange('discover')}
            type="button"
          >
            发现
          </button>
          <button 
            className={`tab-item ${activeTab === 'shorts' ? 'tab-item--active' : ''}`}
            onClick={() => handleTabChange('shorts')}
            type="button"
          >
            短片
          </button>
          <button 
            className={`tab-item ${activeTab === 'activity' ? 'tab-item--active' : ''}`}
            onClick={() => handleTabChange('activity')}
            type="button"
          >
            活动
          </button>
        </div>
        <div className="tab-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="印章制作" />
        </div>
      </nav>

      {/* 瀑布流区域 - 单一VirtuosoMasonry实例 */}
      <section className="masonry-section">
        <div className="masonry-viewport">
          <VirtuosoMasonry
            key={activeTab}
            data={tabsData[activeTab].items}
            columnCount={columnCount}
            initialItemCount={24}
            useWindowScroll={true}
            ItemContent={MasonryItemContent}
          />
          {/* 加载哨兵 */}
          <div 
            ref={loadingSentinelRef}
            className="loading-sentinel" 
          />
          {tabsData[activeTab].isLoading && (
            <div className="masonry-loading" role="status">
              正在加载更多作品...
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default App
