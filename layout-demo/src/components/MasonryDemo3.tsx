import React, { useEffect, useRef, useState } from "react";
import Masonry from "masonry-layout";
import imagesLoaded from "imagesloaded";
import "./index3.less";

const SAMPLE_COUNT = 12;
const TABS = ['发现', '短片', '活动', '印章制作'];

// generate sample image urls with stable seeds and varying heights
function makeItems(n) {
  return Array.from({ length: n }).map((_, i) => {
    // choose a seed and height variant
    const seed = 1000 + i;
    const width = 500;
    // random-ish height
    const heights = [350, 420, 300, 480, 260, 360];
    const h = heights[i % heights.length];
    return {
      id: i,
      src: `https://picsum.photos/seed/${seed}/${width}/${h}`,
      title: `Item ${i + 1}`,
      width,
      height: h,
    };
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [, forceUpdate] = useState(0); // 用于强制更新
  const sentinelRef = useRef(null); // 哨兵元素引用
  
  // 为每个tab维护独立的数据和状态
  const tabDataRef = useRef(
    TABS.map(() => ({
      items: makeItems(SAMPLE_COUNT),
      count: SAMPLE_COUNT,
      hasMore: true,
      isLoading: false,
      gridRef: React.createRef(),
      msnryRef: { current: null },
      scrollPosition: 0 // 保存滚动位置
    }))
  );

  // 切换tab时保存和恢复滚动位置
  useEffect(() => {
    // 保存之前tab的滚动位置
    const allTabs = tabDataRef.current;
    allTabs.forEach((tabData, index) => {
      if (index !== activeTab) {
        tabData.scrollPosition = window.scrollY;
      }
    });
    
    // 恢复当前tab的滚动位置
    const currentScrollPosition = tabDataRef.current[activeTab].scrollPosition;
    // 使用 requestAnimationFrame 确保 DOM 已更新
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScrollPosition);
    });
  }, [activeTab]);

  // 使用IntersectionObserver监听哨兵元素
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          console.log('Sentinel is visible, loading more...');
          addItems();
        }
      },
      {
        rootMargin: '200px', // 提前200px触发加载
        threshold: 0.1
      }
    );
    
    observer.observe(sentinelRef.current);
    
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [activeTab]); // 当切换tab时重新监听

  // 为当前激活的tab初始化Masonry
  useEffect(() => {
    const currentTabData = tabDataRef.current[activeTab];
    const gridRef = currentTabData.gridRef;
    
    if (!gridRef.current) return;

    // 如果已经初始化过，直接layout
    if (currentTabData.msnryRef.current) {
      currentTabData.msnryRef.current.layout();
      return;
    }

    // 初始化Masonry
    const msnry = new Masonry(gridRef.current, {
      itemSelector: ".grid-item",
      columnWidth: ".grid-sizer",
      gutter: 6,
      percentPosition: true,
      horizontalOrder: false,
      transitionDuration: 0,
    });
    currentTabData.msnryRef.current = msnry;

    // layout after images have loaded
    const imgLoad = imagesLoaded(gridRef.current);
    imgLoad.on("progress", () => {
      msnry.layout();
    });
    imgLoad.on("done", () => {
      msnry.layout();
    });

    // relayout on window resize
    let rafId = null;
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        msnry.layout();
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      imgLoad.off("progress");
      imgLoad.off("done");
      window.removeEventListener("resize", onResize);
    };
  }, [activeTab]);

  // 为当前tab加载更多数据
  const addItems = () => {
    const currentTabData = tabDataRef.current[activeTab];
    if (currentTabData.isLoading || !currentTabData.hasMore) {
      console.log('Skip loading:', { isLoading: currentTabData.isLoading, hasMore: currentTabData.hasMore });
      return;
    }
    
    console.log('Loading more items for tab:', activeTab, 'current count:', currentTabData.count);
    currentTabData.isLoading = true;
    const start = currentTabData.items.length;
    const more = makeItems(6).map((it, idx) => ({ ...it, id: start + idx }));
    currentTabData.items = currentTabData.items.concat(more);
    const newLength = currentTabData.items.length;
    currentTabData.count = newLength;

    if (newLength >= 60) {
      currentTabData.hasMore = false;
    }
    
    // 强制更新UI
    forceUpdate(prev => prev + 1);
    
    setTimeout(() => {
      const msnry = currentTabData.msnryRef.current;
      if (!msnry) {
        currentTabData.isLoading = false;
        console.log('Masonry not initialized');
        return;
      }
      msnry.reloadItems();
      imagesLoaded(currentTabData.gridRef.current, () => {
        msnry.layout();
        currentTabData.isLoading = false;
        console.log('Layout updated, new count:', currentTabData.count);
      });
    }, 100);
  };

  const currentTabData = tabDataRef.current[activeTab];
  
  return (
    <div className="page">
      {/* 固定高度的头部区域 */}
      <header className="header-area">
        {/* Banner区域 - 用色块占位 */}
        <div className="banner-section">
          <div className="banner-gradient">
            <div className="banner-content">
              <h2>Agent 模式</h2>
              <p>灵感来了？一句话帮你打造创作</p>
            </div>
            <div className="banner-tabs">
              <div className="banner-tab">图片生成 ›</div>
              <div className="banner-tab">视频生成 ›</div>
              <div className="banner-tab">数字人 ›</div>
              <div className="banner-tab">动作模仿 ›</div>
            </div>
          </div>
        </div>
        
        {/* 搜索和模式切换区域 */}
        <div className="control-section">
          <div className="add-button">+</div>
          <div className="search-input">2222222</div>
          <div className="mode-controls">
            <button className="mode-btn active">🎨 Agent 模式</button>
            <button className="mode-btn">自动</button>
          </div>
        </div>
      </header>

      {/* Tab栏 - 使用CSS sticky吸顶 */}
      <div className="tab-bar">
        {TABS.map((tab, index) => (
          <div
            key={tab}
            className={`tab-item ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
            {index === TABS.length - 1 && <span className="search-icon">🔍</span>}
          </div>
        ))}
      </div>

      {/* 主内容区域 - 各个tab的瀑布流 */}
      <main className="main-content">
        {TABS.map((tab, tabIndex) => {
          const isActive = activeTab === tabIndex;
          const tabData = tabDataRef.current[tabIndex];
          
          return (
            <div
              key={tab}
              className="tab-panel"
              style={{ display: isActive ? 'block' : 'none' }}
            >
              <div className="grid" ref={tabData.gridRef}>
                <div className="grid-sizer" />

                {/* 第一个tab显示featured块 */}
                {tabIndex === 0 && (
                  <div className="grid-item grid-item--w2 featured">
                    <div className="featured-inner">
                      <img
                        src={`https://picsum.photos/seed/featured/900/380`}
                        alt="featured"
                        loading="lazy"
                        width={900}
                        height={380}
                      />
                    </div>
                  </div>
                )}

                {tabData.items.map((it) => (
                  <div key={it.id} className="grid-item">
                    <div className="card" style={{
                      width: '100%',
                      aspectRatio: it.height && it.width ? `${it.width} / ${it.height}` : 'unknown',
                    }}>
                      <img
                        src={it.src}
                        alt={it.title}
                        loading="lazy"
                      />
                      <div className="card-body">
                        <div className="card-title">{it.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 哨兵元素 - 用于触发无限加载 */}
              {isActive && (
                <div 
                  ref={sentinelRef}
                  className="load-more-sentinel"
                  style={{ height: '20px', margin: '20px 0' }}
                >
                  {tabData.isLoading && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      加载中... (已加载: {tabData.count})
                    </div>
                  )}
                  {!tabData.hasMore && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      已经到底啦 (共 {tabData.count} 项)
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>
      
      {/* 回到顶部按钮 */}
      <button 
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </div>
  );
}