import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

/* ===================================================================
   Services — clean single-page flip booklet.

   • 4 double-sided sheets.  Closed → single page centred.
   • Open → two-page spread, spine at viewport centre.
   • Last page → back cover with click-to-reset.
   • No 3D spin.  No auto-close.  Pure state.
   =================================================================== */

const SHEETS = [
  {
    front: (
      <div className="bk-page bk-page--cover-r">
        <div className="bk-cover-center">
          <h1 className="bk-cover-title">SEVICES</h1>
          <span className="bk-cover-sub">委托相关</span>
          <span className="bk-cover-hint">[ CLICK TO OPEN ]</span>
        </div>
      </div>
    ),
    back: (
      <div className="bk-page">
        <h2 className="bk-heading">CONTACT</h2>
        <span className="bk-heading__zh">联系方式</span>
      </div>
    ),
  },
  {
    front: (
      <div className="bk-page">
        <ul className="bk-brief">
          <li>暂不开稿，空闲时间就上快速橱窗。</li>
          <li>企业 / 非同人约稿请问询</li>
          <li>邀请可 [ 询问 / 投递橱窗升档业务 / 周边企划 / 其他特殊风格类型心水企划 ]。</li>
          <li className="bk-brief__small">* 仅接取 ddl 30 日内企划，不往后预排。</li>
          <li>除以上两种不排其余任何。无需参考排期。</li>
        </ul>
      </div>
    ),
    back: (
      <div className="bk-page">
        <h2 className="bk-heading">COOPERATION BRIEF</h2>
        <span className="bk-heading__zh">合作须知</span>
      </div>
    ),
  },
  {
    front: (
      <div className="bk-page">
        <ul className="bk-brief">
          <li>设计类稿件一般为一键出图，如需中途查看提前说明即可不加价（例如 set 先查看一个制品确认风格）。</li>
          <li>如需提供多个设计草图供选择会有价格浮动。</li>
          <li>默认薄码展示（如例图），如需其他特殊水印请您提前提供；可能会录制设计过程发布至平台，介意请提前说明。</li>
        </ul>
      </div>
    ),
    back: (
      <div className="bk-page">
        <h2 className="bk-heading">WHAT I MIGHT DO</h2>
        <span className="bk-heading__zh">我或许可以做</span>
      </div>
    ),
  },
  {
    front: (
      <div className="bk-page">
        <ul className="bk-brief">
          <li>衍生品设计<span className="bk-brief__sub">徽章、亚克力、纸制品等</span></li>
          <li>刊本设计<span className="bk-brief__sub">封面设计以及内页排版</span></li>
          <li>宣图 / KV / 大屏 / 海报等</li>
          <li>字体设计</li>
          <li>UI 设计</li>
          <li className="bk-brief__faded">以及其他我可能可以完成的一切（？）</li>
        </ul>
      </div>
    ),
    back: (
      <div className="bk-page bk-page--end" />
    ),
  },
];

const TOTAL = SHEETS.length;
const FLIP  = { duration: 0.55, ease: [0.4, 0, 0.2, 1] };
const SHIFT = { duration: 0.5,  ease: [0.33, 0, 0.2, 1] };

// =========================================================================

export default function Contact() {
  const [sheet, setSheet] = useState(0);
  const [flipping, setFlipping] = useState(null);

  // ---- derived ----
  const leftIdx  = sheet - 1;
  const rightIdx = sheet;
  const closed   = sheet === 0;
  const finished = sheet >= TOTAL;
  const idle     = !flipping;

  // three-stage centring:
  //   cover (page on right)  → shift left   → x: -25%
  //   open   (two pages)     → spine centre  → x:   0%
  //   back   (page on left)  → shift right   → x: +25%
  const bookletX = closed ? '-25%' : finished ? '25%' : '0%';

  // interaction gating
  const leftActive  = (leftIdx >= 0 || finished) && idle;
  const rightActive = rightIdx < TOTAL && idle;

  // ---- actions ----
  const goNext = useCallback(() => {
    if (!idle || finished) return;
    setFlipping({ idx: sheet, dir: 1 });
  }, [sheet, idle, finished]);

  const goPrev = useCallback(() => {
    if (!idle || sheet <= 0) return;
    setFlipping({ idx: sheet - 1, dir: -1 });
  }, [sheet, idle]);

  const resetToCover = useCallback(() => {
    if (!idle || !finished) return;
    setSheet(0);
  }, [idle, finished]);

  const onFlipDone = useCallback(() => {
    setFlipping((f) => {
      if (!f) return null;
      setSheet((s) => Math.max(0, Math.min(TOTAL, s + f.dir)));
      return null;
    });
  }, []);

  return (
    <div className="bk-stage">
      {/* ---- SVG rough filter ---- */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="bk-rough" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* ---- booklet — no entrance animation, only animate on state change ---- */}
      <motion.div
        className={`bk-booklet${!idle ? ' is-locked' : ''}`}
        initial={{ x: '-25%' }}
        animate={{ x: bookletX }}
        transition={{ x: SHIFT }}
      >
        {/* ---- left half ---- */}
        <div
          className="bk-half bk-half--left"
          onClick={finished ? resetToCover : goPrev}
          style={{ pointerEvents: leftActive ? 'auto' : 'none' }}
        >
          {/* idle + forward flip: show current left page as stable base */}
          {leftIdx >= 0 && flipping?.dir !== -1 && (
            <PageWithFrame>{SHEETS[leftIdx].back}</PageWithFrame>
          )}

          {/* backward flip: show the PREVIOUS left page (uncovered as card returns right) */}
          {flipping && flipping.dir === -1 && leftIdx >= 1 && (
            <PageWithFrame>{SHEETS[leftIdx - 1].back}</PageWithFrame>
          )}

          {/* back cover hint */}
          {finished && flipping?.dir !== -1 && (
            <div className="bk-backcover-hint">
              <span className="bk-backcover-text">BACK TO COVER<br />// 返回封面</span>
            </div>
          )}
        </div>

        {/* ---- spine ---- */}
        <div className="bk-spine">
          <svg className="bk-spine__svg" viewBox="0 0 1 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0.5" y1="0" x2="0.5" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="3 5" filter="url(#bk-rough)" />
          </svg>
        </div>

        {/* ---- right half ---- */}
        <div
          className="bk-half bk-half--right"
          onClick={goNext}
          style={{ pointerEvents: rightActive ? 'auto' : 'none' }}
        >
          {/* idle: show current right page */}
          {rightIdx < TOTAL && !flipping && (
            <PageWithFrame>{SHEETS[rightIdx].front}</PageWithFrame>
          )}

          {/* forward flip: base = next right page; card sweeps RIGHT → LEFT */}
          {flipping && flipping.dir === 1 && flipping.idx < TOTAL && (
            <>
              {rightIdx + 1 < TOTAL && (
                <PageWithFrame>{SHEETS[rightIdx + 1].front}</PageWithFrame>
              )}
              <FlipCard
                front={<PageWithFrame>{SHEETS[flipping.idx].front}</PageWithFrame>}
                back={<PageWithFrame>{SHEETS[flipping.idx].back}</PageWithFrame>}
                origin="left center" from={0} to={180}
                onDone={onFlipDone}
              />
            </>
          )}

          {/* backward flip: base = returning page front; card sweeps LEFT → RIGHT */}
          {flipping && flipping.dir === -1 && (
            <>
              <PageWithFrame>{SHEETS[flipping.idx].front}</PageWithFrame>
              <FlipCard
                front={<PageWithFrame>{SHEETS[flipping.idx].front}</PageWithFrame>}
                back={<PageWithFrame>{SHEETS[flipping.idx].back}</PageWithFrame>}
                origin="left center" from={180} to={0}
                onDone={onFlipDone}
              />
            </>
          )}
        </div>

        {/* ---- page indicator ---- */}
        <span className="bk-page-num">
          {finished
            ? '[ END ]'
            : `[ ${String(sheet + 1).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')} ]`}
        </span>
      </motion.div>

      {/* ---- nav ---- */}
      <div className="bk-nav">
        <button className={`bk-nav__btn${closed || !idle ? ' is-disabled' : ''}`} onClick={goPrev} disabled={closed || !idle} data-cursor="pointer">
          PREV //
        </button>
        <span className="bk-nav__page">
          {finished ? '[ END ]' : `[ ${String(sheet + 1).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')} ]`}
        </span>
        <button className={`bk-nav__btn${!idle || finished ? ' is-disabled' : ''}`} onClick={goNext} disabled={!idle || finished} data-cursor="pointer">
          {finished ? '// END' : '// NEXT'}
        </button>
      </div>

      <style>{`
        .bk-stage {
          width: 100%;
          display: flex; flex-direction: column; align-items: center; gap: var(--space-6);
        }

        .bk-booklet {
          position: relative;
          width: 100%; max-width: 680px;
          aspect-ratio: 1.6 / 1; min-height: 380px;
          display: flex;
          background: transparent;
          perspective: 2000px;
          transform-style: preserve-3d;
          user-select: none;
          -webkit-user-select: none;
        }

        /* ---- lock ---- */
        .bk-booklet.is-locked,
        .bk-booklet.is-locked * {
          pointer-events: none !important;
        }

        .bk-booklet * {
          user-select: none;
          -webkit-user-select: none;
        }

        .bk-half {
          flex: 1; position: relative; cursor: pointer;
          background: transparent;
        }
        .bk-half:hover { background: rgba(255,255,255,0.015); }

        .bk-spine {
          width: 1px; flex-shrink: 0; position: relative; z-index: 20;
        }
        .bk-spine__svg {
          position: absolute; inset: 0; width: 100%; height: 100%;
        }

        .bk-page-num {
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          font-family: var(--font-mono); font-size: 0.52rem;
          letter-spacing: 0.12em; color: #444; pointer-events: none; z-index: 30;
        }

        /* ---- page frame ---- */
        .page-frame {
          position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
        }

        /* ---- page ---- */
        .bk-page {
          position: relative; z-index: 2;
          height: 100%; padding: var(--space-8) var(--space-6);
          display: flex; flex-direction: column; justify-content: center;
        }

        .bk-page--cover-r { align-items: center; justify-content: center; text-align: center; }
        .bk-cover-center { display: flex; flex-direction: column; align-items: center; gap: var(--space-6); }
        .bk-cover-title {
          font-family: var(--font-mono);
          font-size: clamp(1.2rem, 3vw, 1.8rem);
          font-weight: 400; letter-spacing: 0.06em; line-height: 1.5; color: #fff;
        }
        .bk-cover-sub {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: #aaa;
        }
        .bk-cover-hint {
          font-family: var(--font-mono); font-size: 0.55rem; letter-spacing: 0.14em; color: #555;
        }

        .bk-page--end { align-items: center; justify-content: center; }
        .bk-end-text {
          font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.2em; color: #444;
        }

        /* ---- back cover reset hint ---- */
        .bk-backcover-hint {
          position: absolute; inset: 0; z-index: 25;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .bk-backcover-text {
          font-family: var(--font-mono);
          font-size: 0.62rem; letter-spacing: 0.1em; line-height: 1.8;
          color: #888; text-align: center;
        }

        .bk-heading {
          font-family: var(--font-mono);
          font-size: clamp(0.85rem, 1.8vw, 1rem);
          font-weight: 400; letter-spacing: 0.06em; line-height: 1.3; color: #fff;
          margin-bottom: 0;
        }
        .bk-heading__zh {
          display: block;
          font-family: var(--font-sans);
          font-size: 0.68rem;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: #999;
          margin-top: 4px;
        }

        .bk-brief { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
        .bk-brief li {
          font-family: var(--font-sans); font-size: 0.72rem; font-weight: 300;
          line-height: 1.7; color: #ccc; padding-left: var(--space-4); position: relative;
        }
        .bk-brief li::before { content: '—'; position: absolute; left: 0; color: #444; }
        .bk-brief li strong { font-weight: 500; color: #fff; }
        .bk-brief__sub {
          display: block;
          font-family: var(--font-sans);
          font-size: 0.62rem; color: #666;
          margin-top: 2px;
        }
        .bk-brief__small {
          font-size: 0.62rem !important;
          color: #888 !important;
          padding-left: 0 !important;
          margin-top: -6px;
        }
        .bk-brief__small::before {
          content: none !important;
        }
        .bk-brief__faded {
          color: #666 !important;
        }

        .bk-pricing { width: 100%; border-collapse: collapse; }
        .bk-pricing tr { border-bottom: 1px solid #333; }
        .bk-pricing__item {
          font-family: var(--font-sans); font-size: 0.72rem; font-weight: 300;
          color: #ccc; padding: var(--space-2) 0;
        }
        .bk-pricing__price {
          font-family: var(--font-mono); font-size: 0.72rem; font-weight: 300;
          color: #fff; text-align: right; padding: var(--space-2) 0; white-space: nowrap;
        }
        .bk-pricing__note {
          font-family: var(--font-mono); font-size: 0.55rem; color: #555;
          margin-top: var(--space-4); text-align: right;
        }

        .bk-contact-list { display: flex; flex-direction: column; gap: var(--space-4); }
        .bk-contact-link {
          font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.04em;
          color: #aaa; text-decoration: none; border-bottom: 1px solid transparent;
          width: fit-content;
          transition: color var(--dur-normal) var(--ease-out), border-color var(--dur-normal) var(--ease-out);
        }
        .bk-contact-link:hover { color: #fff; border-bottom-color: #fff; }

        .bk-nav { display: flex; align-items: center; gap: var(--space-6); }
        .bk-nav__btn {
          font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em;
          color: #666; background: none; border: none; cursor: pointer;
          padding: var(--space-2) var(--space-1); border-bottom: 1px solid transparent;
          transition: color var(--dur-normal) var(--ease-out), border-color var(--dur-normal) var(--ease-out);
        }
        .bk-nav__btn:hover:not(.is-disabled) { color: #fff; border-bottom-color: #fff; }
        .bk-nav__btn.is-disabled { color: #2a2a2a; cursor: default; }
        .bk-nav__page {
          font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.12em; color: #555;
        }
      `}</style>
    </div>
  );
}

// =========================================================================
//  PageWithFrame
// =========================================================================

function PageWithFrame({ children }) {
  return (
    <>
      <svg className="page-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0.3" y="0.3" width="99.4" height="99.4"
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.55"
              filter="url(#bk-rough)" />
      </svg>
      {children}
    </>
  );
}

// =========================================================================
//  FlipCard
// =========================================================================

function FlipCard({ front, back, origin, from, to, onDone }) {
  return (
    <motion.div
      initial={{ rotateY: from }}
      animate={{ rotateY: to }}
      transition={FLIP}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: origin,
        transformStyle: 'preserve-3d',
        zIndex: 15,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden',
        background: '#000',
      }}>
        {front}
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: '#000',
      }}>
        {back}
      </div>
    </motion.div>
  );
}
