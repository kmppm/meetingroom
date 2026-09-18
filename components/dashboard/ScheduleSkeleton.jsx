"use client";

const SKELETON_ROWS = 10;

export function ScheduleSkeleton() {
  return (
    <div className="schedule-card schedule-skeleton">
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div className="schedule-row" key={i}>
          <div className="skeleton-block skeleton-time" />
          <div className="skeleton-block skeleton-slot" />
        </div>
      ))}

      <style jsx global>{`
        .skeleton-block {
          position: relative;
          overflow: hidden;
          background: var(--color-panel);
          border-radius: 8px;
        }

        .skeleton-block::after {
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
          animation: skeleton-shimmer 1.4s ease-in-out infinite;
        }

        .skeleton-time {
          margin: 10px 10px;
          height: 22px;
          border-radius: 999px;
        }

        .skeleton-slot {
          margin: 10px 16px 10px 0;
          height: 24px;
          width: 40%;
        }

        @keyframes skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-block::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}