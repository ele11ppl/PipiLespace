export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          font-family: var(--font-mono), 'Courier New', monospace;
        }

        .loading-dots {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .loading-dot {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #111;
          animation: ld-breathe 1.8s ease-in-out infinite;
        }

        .loading-dot:nth-child(1) { animation-delay: 0.0s; }
        .loading-dot:nth-child(2) { animation-delay: 0.3s; }
        .loading-dot:nth-child(3) { animation-delay: 0.6s; }

        @keyframes ld-breathe {
          0%, 100%   { opacity: 0.15; transform: scale(0.7); }
          50%        { opacity: 1;    transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
