import { useState, useCallback } from 'react';

export default function Tutorials() {
  const [selected, setSelected] = useState(null);
  const select = useCallback((i) => setSelected(i === selected ? null : i), [selected]);

  return (
    <section className="page">
      <h1 className="page__title">Save Slot</h1>
      <p className="page__text">
        这里会存档一些我日常设计的过程、可分享的资源以及小技巧。希望能帮助到你！
      </p>
      <p className="page__text page__text--en">
        An archive of my daily design process, shareable resources, and small tips.
        Hope you find something useful here!
      </p>

      <ul className="page__list">
        {[
          { en: 'VIDEO', zh: '视频' },
          { en: 'RESOURCES', zh: '资源' },
          { en: 'TIPS', zh: '技巧' },
        ].map((item, i) => (
          <li key={i}>
            <div
              className={`page__list-item${selected === i ? ' is-active' : ''}`}
              data-cursor="pointer"
              onClick={() => select(i)}
            >
              <span className="page__list-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="page__list-en">{item.en}</span>
              <span className="page__list-zh">{item.zh}</span>
            </div>

            {selected === i && (
              <div className="page__slot-placeholder">待上传</div>
            )}
          </li>
        ))}
      </ul>

      <style>{`
        .page__text { font-size: 0.82rem; }
        .page__text--en {
          font-family: var(--font-mono); font-size: 0.72rem; color: #999;
        }
        .page__list {
          margin-top: var(--space-8);
          display: flex; flex-direction: column; gap: var(--space-3);
        }
        .page__list-item {
          display: flex; align-items: center; gap: var(--space-4);
          padding: var(--space-3) 0;
          border-bottom: 1px solid var(--color-faint);
          font-size: 0.95rem; cursor: pointer;
          transition: color var(--dur-normal);
        }
        .page__list-item:hover { color: var(--color-fg); }
        .page__list-item.is-active {
          color: var(--color-fg);
          border-bottom-color: var(--color-fg);
        }
        .page__list-num {
          font-family: var(--font-mono); font-size: 0.7rem;
          color: var(--color-faint); min-width: 24px;
        }
        .page__list-en {
          font-family: var(--font-mono); font-size: 0.85rem; font-weight: 400;
          letter-spacing: 0.08em; color: var(--color-muted);
          transition: color var(--dur-normal);
        }
        .page__list-item:hover .page__list-en,
        .page__list-item.is-active .page__list-en { color: var(--color-fg); }
        .page__list-zh {
          font-family: var(--font-sans); font-size: 0.85rem; font-weight: 300;
          letter-spacing: 0.04em; color: var(--color-muted);
          margin-left: var(--space-2); transition: color var(--dur-normal);
        }
        .page__list-item:hover .page__list-zh,
        .page__list-item.is-active .page__list-zh { color: var(--color-fg); }

        .page__slot-placeholder {
          font-family: var(--font-mono); font-size: 0.7rem;
          color: #555; padding: var(--space-6) 0 var(--space-4) var(--space-8);
          letter-spacing: 0.08em;
        }
      `}</style>
    </section>
  );
}
