import { VirtuosoMasonry } from '@virtuoso.dev/masonry'
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
    <div className="masonry-card__media">
      <img
        src={item.src}
        alt={item.title}
        loading="lazy"
        // 如果有真实宽高，使用真实值；否则用 3:4 的默认比例预估一个
        width={item.width || 300}
        height={item.height || Math.round((300 * 4) / 3)}/>
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
  const [items, setItems] = useState<MasonryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const pageRef = useRef(0)
  const isRequestingRef = useRef(false)
  const scrollerRef = useRef<HTMLElement | null>(null)
  const lastLoadTimeRef = useRef(0)

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

  // 初始加载
  useEffect(() => {
    fetchMore()
  }, [])

  // 找到滚动容器并监听滚动
  useEffect(() => {
    const findAndListenScroller = () => {
      const scroller = document.querySelector('[data-testid="virtuoso-scroller"]') as HTMLElement
      
      if (!scroller) {
        console.log('⏳ 等待 virtuoso-scroller...')
        requestAnimationFrame(findAndListenScroller)
        return
      }

      console.log('✅ 找到 virtuoso-scroller，开始监听滚动')
      scrollerRef.current = scroller

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = scroller
        const distanceToBottom = scrollHeight - scrollTop - clientHeight

        // 当距底部小于 300px 时触发
        if (distanceToBottom < 300 && !isRequestingRef.current) {
          const now = Date.now()
          
          // 防抖：避免在 1 秒内多次触发
          if (now - lastLoadTimeRef.current > 1000) {
            console.log('🔄 滚动到底部，触发加载，距离:', distanceToBottom)
            lastLoadTimeRef.current = now
            fetchMore()
          }
        }
      }

      scroller.addEventListener('scroll', handleScroll, { passive: true })
      
      console.log('✅ 滚动监听已设置')

      return () => {
        scroller.removeEventListener('scroll', handleScroll)
        console.log('🧹 滚动监听已移除')
      }
    }

    // 延迟以确保 VirtuosoMasonry 渲染完成
    const timer = setTimeout(findAndListenScroller, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [fetchMore])


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
