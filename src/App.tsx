import { VirtuosoMasonry, type VirtuosoMasonryProps } from '@virtuoso.dev/masonry'
import { useCallback, useEffect, useRef, useState } from 'react'
import { galleryItems, type GalleryItem } from './data/gallery'
import './App.css'

type MasonryItem = GalleryItem & { virtualId: string }


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
    <div className="masonry-card__media" style={{ height: item.height }}>
      <img src={item.src} alt={item.title} loading="lazy" />
      <button className="icon-button" type="button" aria-label="收藏">
        ❤
      </button>
    </div>
    <div className="masonry-card__body">
      <span className="pill pill--small">{item.tag}</span>
      <h3>{item.title}</h3>
      <p>by {item.author}</p>
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
  const [items, setItems] = useState<MasonryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const pageRef = useRef(0)
  const isRequestingRef = useRef(false)

  const fetchMore = useCallback(() => {
    if (isRequestingRef.current) return
    isRequestingRef.current = true
    setIsLoading(true)

    const nextPage = pageRef.current
    window.setTimeout(() => {
      const batch = createBatch(nextPage)
      pageRef.current += 1
      setItems((prev) => [...prev, ...batch])
      isRequestingRef.current = false
      setIsLoading(false)
    }, 600)
  }, [])

  useEffect(() => {
    fetchMore()
  }, [fetchMore])

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('[data-testid="virtuoso-scroller"]')
    if (!scroller) return

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = scroller
      const distanceToBottom = scrollHeight - (scrollTop + clientHeight)
      if (distanceToBottom < 200) {
        fetchMore()
      }
    }

    scroller.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [fetchMore, items.length])

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <div className="hero-banner__content">
          <span className="pill">招募中</span>
          <h1>AI 片头狂想曲</h1>
          <p>
            迷你剧场第 18 期正式上线，欢迎创作者用你想象中的光与影，打造令人惊叹的片头宇宙。
          </p>
          <div className="hero-banner__meta">
            <div>
              <strong>6697</strong>
              <span>人参与</span>
            </div>
            <div>
              <strong>3 天</strong>
              <span>投稿倒计时</span>
            </div>
            <div>
              <strong>¥50K</strong>
              <span>激励池</span>
            </div>
          </div>
          <div className="hero-banner__actions">
            <button className="btn btn--primary" type="button">
              立即参赛
            </button>
            <button className="btn btn--ghost" type="button">
              了解详情
            </button>
          </div>
        </div>
        <div className="hero-banner__visual">
          <img src="https://images.unsplash.com/photo-1482192597420-4817fdd7e8b0?auto=format&fit=crop&w=900&q=80" alt="Hero preview" />
        </div>
        <div className="hero-banner__controls" aria-hidden>
          <button type="button">‹</button>
          <button type="button">›</button>
        </div>
      </header>

      <section className="toolbar">
        <div className="toolbar__filters">
          {['热门推荐', '星际幻想', '国风潮玩', '逐梦冒险'].map((label) => (
            <button key={label} className={`chip ${label === '热门推荐' ? 'chip--active' : ''}`} type="button">
              {label}
            </button>
          ))}
        </div>
        <div className="toolbar__actions">
          <button className="btn btn--ghost" type="button">
            刷新流 · Ctrl+R
          </button>
          <button className="icon-button" type="button" aria-label="回到顶部">
            ↑
          </button>
        </div>
      </section>

      <section className="masonry-section">
        <div className="masonry-viewport">
          <VirtuosoMasonry
            data={items}
            columnCount={columnCount}
            initialItemCount={24}
            style={{ height: '100%' }}
            useWindowScroll={false}
            ItemContent={MasonryItemContent}
          />
          {isLoading && (
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
