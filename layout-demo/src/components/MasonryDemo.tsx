import React, { useEffect, useRef, useState } from "react";
import Masonry from "masonry-layout";
import imagesLoaded from "imagesloaded";
import "./index.less";

/*
  Purpose:
  - Demonstrate using desandro/masonry-layout in a React app.
  - Show grid-sizer, normal items and a cross-column (span-2) item.
  - Use imagesLoaded to wait for image sizes and then layout Masonry.

  How it works:
  - The container has a .grid-sizer element used by Masonry as columnWidth.
  - Each .grid-item normally uses 1 column width; .grid-item--w2 spans two columns via CSS width.
  - After React mounts items, we initialize Masonry and call layout after imagesLoaded.
  - When items change or window resizes, we trigger masonry.layout().
*/

const SAMPLE_COUNT = 18;

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
    };
  });
}

export default function App() {
  const items = useRef(makeItems(SAMPLE_COUNT));
  const gridRef = useRef(null);
  const msnryRef = useRef(null);
  const [count, setCount] = useState(items.current.length);

  // initialize Masonry once the component mounts
  useEffect(() => {
    if (!gridRef.current) return;

    // initialize Masonry: use .grid-sizer as columnWidth and set gutter
    const msnry = new Masonry(gridRef.current, {
      itemSelector: ".grid-item",
      columnWidth: ".grid-sizer",
      gutter: 16,
      percentPosition: true,
      horizontalOrder: false,
    });
    msnryRef.current = msnry;

    // layout after images have loaded
    const imgLoad = imagesLoaded(gridRef.current);
    imgLoad.on("progress", () => {
      msnry.layout();
    });
    imgLoad.on("done", () => {
      msnry.layout();
    });

    // relayout on window resize (debounced-ish)
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
      msnry.destroy();
    };
  }, []);

  // helper to add more items (demonstrate dynamic changes)
  function addItems() {
    const start = items.current.length;
    const more = makeItems(6).map((it, idx) => ({ ...it, id: start + idx }));
    items.current = items.current.concat(more);
    setCount(items.current.length);
    // wait a tick for React to render items, then tell Masonry to append & layout
    setTimeout(() => {
      const msnry = msnryRef.current;
      if (!msnry) return;
      msnry.reloadItems();
      imagesLoaded(gridRef.current, () => {
        msnry.layout();
      });
    }, 0);
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Masonry Layout (masonry-layout + imagesLoaded)</h1>
        <div className="controls">
          <button onClick={addItems}>Load more items</button>
        </div>
      </header>

      <main className="main">
        <div className="grid" ref={gridRef}>
          {/* grid-sizer defines the column width basis (1 column) */}
          <div className="grid-sizer" />

          {/* Example: a featured block that spans two columns */}
          <div className="grid-item grid-item--w2 featured">
            <div className="featured-inner">
              <h3>Featured (spans 2 columns)</h3>
              <img
                src={`https://picsum.photos/seed/featured/900/380`}
                alt="featured"
                loading="lazy"
              />
            </div>
          </div>

          {/* Render all items */}
          {items.current.map((it, idx) => (
            // make one item width-2 inside the flow to demonstrate spanning in the stream:
            <div
              key={it.id}
              className={`grid-item`}
            >
              <div className="card">
                <img src={it.src} alt={it.title} loading="lazy" />
                <div className="card-body">
                  <div className="card-title">{it.title}</div>
                </div>
              </div>
            </div>
          ))}

        </div>
      </main>
      <footer className="footer">Rendered items: {count}</footer>
    </div>
  );
}