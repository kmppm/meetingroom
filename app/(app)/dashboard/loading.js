"use client";

const SKELETON_ROWS = 10;

export default function DashboardLoading() {
  return (
    <div className="dash-skel-fill">
      <div className="dash-skel-card">
        <div className="dash-skel-header">
          <div className="dash-skel-block dash-skel-title" />
          <div className="dash-skel-block dash-skel-subtitle" />
          <div className="dash-skel-datenav">
            <div className="dash-skel-block dash-skel-nav-btn" />
            <div className="dash-skel-block dash-skel-nav-btn" />
            <div className="dash-skel-block dash-skel-today" />
            <div className="dash-skel-block dash-skel-date-label" />
            <div className="dash-skel-block dash-skel-date-input" />
          </div>
        </div>

        <div className="dash-skel-body">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <div className="dash-skel-row" key={i}>
              <div className="dash-skel-block dash-skel-time" />
              <div className="dash-skel-block dash-skel-slot" />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .dash-skel-fill {
          position: absolute;
          top: 0;
          left: 0;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
        }

        .dash-skel-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .dash-skel-header {
          flex-shrink: 0;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-line);
        }

        .dash-skel-datenav {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dash-skel-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .dash-skel-row {
          display: grid;
          grid-template-columns: 108px 1fr;
          padding: 10px 0;
        }

        .dash-skel-block {
          position: relative;
          overflow: hidden;
          background: var(--color-panel);
          border-radius: 8px;
        }

        .dash-skel-block::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          animation: dash-skel-shimmer 1.4s ease-in-out infinite;
        }

        .dash-skel-title {
          width: 160px;
          height: 26px;
          border-radius: 6px;
        }

        .dash-skel-subtitle {
          margin-top: 10px;
          width: 320px;
          height: 16px;
          border-radius: 6px;
        }

        .dash-skel-nav-btn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
        }

        .dash-skel-today {
          width: 72px;
          height: 36px;
          border-radius: 999px;
        }

        .dash-skel-date-label {
          width: 180px;
          height: 20px;
          border-radius: 6px;
        }

        .dash-skel-date-input {
          margin-left: auto;
          width: 140px;
          height: 36px;
          border-radius: 8px;
        }

        .dash-skel-time {
          margin: 10px 10px;
          height: 22px;
          border-radius: 999px;
        }

        .dash-skel-slot {
          margin: 10px 16px 10px 0;
          height: 24px;
          width: 40%;
        }

        @keyframes dash-skel-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dash-skel-block::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}